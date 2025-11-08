#!/usr/bin/env python3
"""
Expense Analyzer - Phase 1: Basic Extraction
Extracts amount, vendor, date from receipt images/PDFs
"""

import re
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

try:
    import pytesseract
    from PIL import Image
    from pdf2image import convert_from_path
except ImportError as e:
    print(f"Error: Missing required library - {e}")
    print("Install with: pip install pytesseract pillow pdf2image")
    sys.exit(1)

# Import keyword classifier for fallback categorization
try:
    from keyword_classifier import KeywordClassifier
    CLASSIFIER_AVAILABLE = True
except ImportError:
    CLASSIFIER_AVAILABLE = False


class ReceiptAnalyzer:
    """Analyzes receipt images and extracts key information"""
    
    def __init__(self):
        self.currency_symbols = ['₹', 'Rs.', 'Rs', 'INR', 'USD', '$', '€', '£']
        # Initialize keyword classifier if available
        self.classifier = KeywordClassifier() if CLASSIFIER_AVAILABLE else None
        
    def load_image(self, file_path: str) -> Image.Image:
        """Load image from file path (supports jpg, png, pdf)"""
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Handle PDF
        if path.suffix.lower() == '.pdf':
            print("📄 Converting PDF to image...")
            images = convert_from_path(file_path, first_page=1, last_page=1)
            return images[0]
        
        # Handle images
        elif path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
            return Image.open(file_path)
        
        else:
            raise ValueError(f"Unsupported file format: {path.suffix}")
    
    def extract_text(self, image: Image.Image) -> str:
        """Extract text from image using OCR"""
        print("🔍 Running OCR extraction...")
        text = pytesseract.image_to_string(image)
        return text
    
    def extract_amount(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract monetary amount using a two-stage hybrid approach.
        
        Stage 1: Look for explicit TOTAL/GRAND TOTAL/AMOUNT DUE labels
        Stage 2: If stage 1 fails, use smart heuristics to find the final amount
        
        This approach handles receipts where:
        - TOTAL is clearly labeled (most common)
        - Final amount appears after subtotal/tax/fees without explicit TOTAL label
        - Multiple amounts exist (items, subtotal, tax, delivery, total)
        """
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        
        # Stage 1: Explicit total patterns (highest confidence)
        total_patterns = [
            # Match "TOTAL: 649" or "Total: ₹649" or "Grand Total: 649.00"
            (r'(?:^|\b)(?:grand\s+)?total\s*[:=]\s*(?:[₹$€£]\s*)?(\d+[,\d]*\.?\d*)', 100),
            # Match "Amount Due: 649" or "Net Amount: 649"
            (r'(?:amount\s+due|net\s+amount|amount\s+payable|balance\s+due)\s*[:=]\s*(?:[₹$€£]\s*)?(\d+[,\d]*\.?\d*)', 100),
            # Match "649 TOTAL" or "₹649 (Total)"
            (r'(?:[₹$€£]\s*)?(\d+[,\d]*\.?\d*)\s*(?:\()?(?:total|grand\s+total)(?:\))?', 90),
        ]
        
        for pattern, confidence in total_patterns:
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            if matches:
                # Prefer the last match (usually the final total)
                match = matches[-1]
                amt_str = match.group(1).replace(',', '')
                try:
                    amount = float(amt_str)
                    # Get the line containing this match
                    for idx, line in enumerate(lines):
                        if match.group(0) in line:
                            return {
                                "amount": amount,
                                "currency": self._detect_currency(text),
                                "raw_amounts_found": self._get_all_amounts(text),
                                "chosen_line": line,
                                "chosen_line_index": idx,
                                "extraction_method": "explicit_total_pattern"
                            }
                except ValueError:
                    continue
        
        # Stage 2: Smart heuristics (when no explicit TOTAL label exists)
        # Build candidates with contextual scoring
        candidates = []
        num_re = re.compile(r'(\d{1,3}(?:[,\d]*)?(?:\.\d{1,2})?)')
        
        for idx, line in enumerate(lines):
            line_lower = line.lower()
            
            # Skip lines that are clearly not totals
            if any(skip in line_lower for skip in ['invoice no', 'order no', 'bill no', 'receipt no', 'gst no', 'date:', 'time:']):
                continue
            
            for m in num_re.finditer(line):
                amt_str = m.group(0).replace(',', '')
                try:
                    amt = float(amt_str)
                except ValueError:
                    continue
                
                # Skip very small amounts (<10) or very large (likely IDs)
                if amt < 10 or amt > 1000000:
                    continue
                
                # Skip obvious years
                if 1900 <= amt <= 2100:
                    continue
                
                # Skip long numeric strings (likely invoice/order numbers)
                if len(m.group(0).replace(',', '').replace('.', '')) >= 6:
                    continue
                
                score = 0
                
                # Positive signals
                # Bottom 20% of receipt (totals usually at bottom)
                if idx >= len(lines) * 0.8:
                    score += 50
                
                # Amount is larger (totals are usually the largest amount)
                score += min(amt / 20.0, 30)
                
                # Line contains total-related keywords (even if not explicit pattern)
                if any(kw in line_lower for kw in ['total', 'amount due', 'balance', 'payable']):
                    score += 40
                
                # Negative signals
                # Item lines (1x, 2x, etc.)
                if re.search(r'\b\d+\s*x\b', line_lower):
                    score -= 80
                
                # Subtotal, tax, delivery, discount lines (not the final total)
                if any(kw in line_lower for kw in ['subtotal', 'sub total', 'sub-total']):
                    score -= 60
                if any(kw in line_lower for kw in ['tax', 'gst', 'vat', 'cgst', 'sgst']):
                    score -= 50
                if any(kw in line_lower for kw in ['delivery', 'shipping', 'service charge', 'tip']):
                    score -= 50
                if any(kw in line_lower for kw in ['discount', 'coupon', 'promo']):
                    score -= 50
                
                candidates.append((amt, idx, line, score))
        
        if not candidates:
            return None
        
        # Sort by score (desc), then by line index (desc - prefer later lines)
        candidates.sort(key=lambda x: (x[3], x[1]), reverse=True)
        best = candidates[0]
        
        return {
            "amount": best[0],
            "currency": self._detect_currency(text),
            "raw_amounts_found": self._get_all_amounts(text),
            "chosen_line": best[2],
            "chosen_line_index": best[1],
            "extraction_method": "smart_heuristics"
        }
    
    def _get_all_amounts(self, text: str) -> list:
        """Extract all numeric amounts from text for metadata"""
        num_re = re.compile(r'(\d{1,3}(?:[,\d]*)?(?:\.\d{1,2})?)')
        amounts = set()
        for m in num_re.finditer(text):
            amt_str = m.group(0).replace(',', '')
            try:
                amt = float(amt_str)
                if amt >= 1 and amt < 1000000:  # Reasonable amount range
                    amounts.add(amt)
            except ValueError:
                continue
        return sorted(amounts)
    
    def _detect_currency(self, text: str) -> str:
        """Detect currency from text"""
        if '₹' in text or 'INR' in text or 'Rs' in text:
            return 'INR'
        elif '$' in text or 'USD' in text:
            return 'USD'
        elif '€' in text or 'EUR' in text:
            return 'EUR'
        elif '£' in text or 'GBP' in text:
            return 'GBP'
        return 'INR'  # Default to INR
    
    def extract_date(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract date from text"""
        date_patterns = [
            r'\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b',  # DD-MM-YYYY or DD/MM/YYYY
            r'\b(\d{2,4}[-/]\d{1,2}[-/]\d{1,2})\b',  # YYYY-MM-DD
            r'\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b',  # DD Month YYYY
            r'\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\b',  # Month DD, YYYY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                parsed_date = self._parse_date(date_str)
                if parsed_date:
                    return {
                        "date": parsed_date.strftime("%Y-%m-%d"),
                        "raw_date": date_str
                    }
        
        return None
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string to datetime object"""
        date_formats = [
            "%d-%m-%Y", "%d/%m/%Y", "%d-%m-%y", "%d/%m/%y",
            "%Y-%m-%d", "%Y/%m/%d",
            "%d %b %Y", "%d %B %Y",
            "%b %d, %Y", "%B %d, %Y",
            "%b %d %Y", "%B %d %Y",
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        return None
    
    def extract_vendor(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract vendor/merchant name from text"""
        lines = text.strip().split('\n')
        
        # Usually vendor name is in the first few lines
        vendor_candidates = []
        for i, line in enumerate(lines[:5]):  # Check first 5 lines
            line = line.strip()
            # Skip empty lines and lines with only numbers/symbols
            if line and len(line) > 3 and not line.replace(' ', '').isdigit():
                # Skip common receipt keywords
                skip_keywords = ['tax', 'invoice', 'bill', 'receipt', 'gst', 'date', 'time']
                if not any(keyword in line.lower() for keyword in skip_keywords):
                    vendor_candidates.append(line)
        
        if vendor_candidates:
            # Return the first substantial line as vendor name
            vendor_name = vendor_candidates[0]
            return {
                "vendor": vendor_name,
                "confidence": "high" if len(vendor_name) > 5 else "low"
            }
        
        return None
    
    def analyze(self, file_path: str) -> Dict[str, Any]:
        """Main analysis function"""
        print(f"\n{'='*50}")
        print(f"🧾 Analyzing Receipt: {Path(file_path).name}")
        print(f"{'='*50}\n")
        
        # Load image
        image = self.load_image(file_path)
        print(f"✅ Image loaded: {image.size[0]}x{image.size[1]} pixels")
        
        # Extract text
        extracted_text = self.extract_text(image)
        print(f"✅ Text extracted: {len(extracted_text)} characters\n")
        
        # Parse information
        amount_data = self.extract_amount(extracted_text)
        date_data = self.extract_date(extracted_text)
        vendor_data = self.extract_vendor(extracted_text)
        
        # Classify using keywords (fallback method)
        category_data = {'category': 'other', 'confidence': 0.0}
        if self.classifier:
            category_data = self.classifier.classify(
                vendor=vendor_data.get("vendor") if vendor_data else None,
                description=extracted_text[:500]  # Use first 500 chars
            )
        
        # Build result
        result = {
            "file": str(Path(file_path).name),
            "timestamp": datetime.now().isoformat(),
            "extracted_data": {
                "amount": amount_data.get("amount") if amount_data else None,
                "currency": amount_data.get("currency") if amount_data else None,
                "date": date_data.get("date") if date_data else None,
                "vendor": vendor_data.get("vendor") if vendor_data else None,
                "category": category_data.get("category", "other"),  # NEW: Add category
            },
            "raw_text": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
            "metadata": {
                "amounts_found": amount_data.get("raw_amounts_found") if amount_data else [],
                "date_raw": date_data.get("raw_date") if date_data else None,
                "vendor_confidence": vendor_data.get("confidence") if vendor_data else None,
                "extraction_method": amount_data.get("extraction_method") if amount_data else None,
                "chosen_line": amount_data.get("chosen_line") if amount_data else None,
                "chosen_line_index": amount_data.get("chosen_line_index") if amount_data else None,
                "classification_method": category_data.get("method", "none"),  # NEW
                "classification_confidence": category_data.get("confidence", 0.0),  # NEW
                "matched_keywords": category_data.get("matched_keywords", []),  # NEW
            }
        }
        
        return result
    
    def print_result(self, result: Dict[str, Any]):
        """Pretty print the analysis result"""
        print("\n" + "="*50)
        print("📊 EXTRACTION RESULTS")
        print("="*50 + "\n")
        
        data = result["extracted_data"]
        meta = result.get("metadata", {})
        
        print(f"💰 Amount:  {data['currency']} {data['amount']:.2f}" if data['amount'] else "❌ Amount: Not found")
        print(f"📅 Date:    {data['date']}" if data['date'] else "❌ Date: Not found")
        print(f"🏪 Vendor:  {data['vendor']}" if data['vendor'] else "❌ Vendor: Not found")
        print(f"🏷️  Category: {data['category'].title()}" if data.get('category') else "❌ Category: Not found")
        
        # Show extraction method if available
        if 'extraction_method' in meta:
            method_name = meta['extraction_method'].replace('_', ' ').title()
            print(f"🔍 Method:  {method_name}")
        
        if 'chosen_line' in meta:
            print(f"📍 Source:  \"{meta['chosen_line']}\"")
        
        print(f"\n{'='*50}\n")


def main():
    """CLI entry point"""
    if len(sys.argv) < 2:
        print("Usage: python analyzer.py <receipt_image_or_pdf>")
        print("Example: python analyzer.py receipt.jpg")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    try:
        analyzer = ReceiptAnalyzer()
        result = analyzer.analyze(file_path)
        
        # Print results
        analyzer.print_result(result)
        
        # Save to JSON
        output_file = Path(file_path).stem + "_analysis.json"
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"💾 Full analysis saved to: {output_file}")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
