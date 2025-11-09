"""
LLM-Powered Receipt Analyzer (Primary Method)
Uses receipt-ocr library with OpenAI/Gemini for structured data extraction
"""

import os
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

try:
    from receipt_ocr.processors import ReceiptProcessor
    from receipt_ocr.providers import OpenAIProvider
    RECEIPT_OCR_AVAILABLE = True
except ImportError:
    RECEIPT_OCR_AVAILABLE = False
    print("Warning: receipt-ocr not installed. Install with: pip install receipt-ocr")


class LLMReceiptAnalyzer:
    """
    Advanced receipt analyzer using LLM (OpenAI/Gemini) for extraction.
    Provides higher accuracy than regex-based methods.
    """
    
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None):
        """
        Initialize LLM analyzer with API credentials.
        
        Args:
            api_key: OpenAI/Gemini API key (defaults to env var OPENAI_API_KEY)
            base_url: API base URL (defaults to env var OPENAI_BASE_URL)
            model: Model name (defaults to env var OPENAI_MODEL or 'gpt-4o-mini')
        """
        if not RECEIPT_OCR_AVAILABLE:
            raise ImportError("receipt-ocr package is not installed")
        
        # Load environment variables
        load_dotenv()
        
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.base_url = base_url or os.getenv('OPENAI_BASE_URL')
        self.model = model or os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
        
        if not self.api_key:
            raise ValueError(
                "API key not provided. Set OPENAI_API_KEY environment variable or pass api_key parameter"
            )
        
        # Initialize provider and processor
        self.provider = OpenAIProvider(api_key=self.api_key, base_url=self.base_url)
        self.processor = ReceiptProcessor(self.provider)
        
        # Define extraction schema
        self.json_schema = {
            "merchant_name": "string",
            "merchant_address": "string", 
            "transaction_date": "string",
            "transaction_time": "string",
            "total_amount": "number",
            "currency": "string",
            "subtotal": "number",
            "tax_amount": "number",
            "category": "string",  # NEW: food, travel, supplies, entertainment, utilities, other
            "line_items": [
                {
                    "item_name": "string",
                    "item_quantity": "number",
                    "item_price": "number",
                    "item_total": "number"
                }
            ]
        }
    
    def analyze(self, file_path: str) -> Dict[str, Any]:
        """
        Analyze receipt using LLM-based OCR.
        
        Args:
            file_path: Path to receipt image
            
        Returns:
            Dictionary with extracted receipt data
        """
        print(f"\n{'='*50}")
        print(f"🤖 Analyzing Receipt with LLM: {Path(file_path).name}")
        print(f"{'='*50}\n")
        print(f"📡 Using model: {self.model}")
        print(f"🔍 Extracting structured data...\n")
        
        try:
            # Process receipt with LLM
            result = self.processor.process_receipt(
                file_path,
                self.json_schema,
                self.model,
                response_format_type="json_object"
            )
            
            # Normalize the result to match our expected format
            normalized_result = {
                "file": str(Path(file_path).name),
                "timestamp": None,  # Will be set by orchestrator
                "extracted_data": {
                    "amount": result.get("total_amount"),
                    "currency": result.get("currency", "INR"),
                    "date": result.get("transaction_date"),
                    "vendor": result.get("merchant_name"),
                    "category": result.get("category", "other"),  # NEW: LLM-provided category
                    "subtotal": result.get("subtotal"),
                    "tax_amount": result.get("tax_amount"),
                },
                "raw_text": None,  # LLM doesn't provide raw text
                "metadata": {
                    "merchant_address": result.get("merchant_address"),
                    "transaction_time": result.get("transaction_time"),
                    "line_items": result.get("line_items", []),
                    "extraction_method": "llm_receipt_ocr",
                    "model_used": self.model,
                }
            }
            
            print("✅ LLM extraction successful!")
            return normalized_result
            
        except Exception as e:
            print(f"❌ LLM extraction failed: {str(e)}")
            raise
    
    def print_result(self, result: Dict[str, Any]):
        """Pretty print the analysis result"""
        print("\n" + "="*50)
        print("📊 LLM EXTRACTION RESULTS")
        print("="*50 + "\n")
        
        data = result["extracted_data"]
        meta = result.get("metadata", {})
        
        print(f"💰 Amount:     {data.get('currency', 'INR')} {data.get('amount', 0):.2f}")
        print(f"📅 Date:       {data.get('date', 'N/A')}")
        print(f"🏪 Vendor:     {data.get('vendor', 'N/A')}")
        print(f"🏷️  Category:   {data.get('category', 'other').title()}")  # NEW: Show category
        
        if data.get('subtotal'):
            print(f"📊 Subtotal:   {data.get('currency', 'INR')} {data.get('subtotal'):.2f}")
        if data.get('tax_amount'):
            print(f"🧾 Tax:        {data.get('currency', 'INR')} {data.get('tax_amount'):.2f}")
        
        if meta.get('merchant_address'):
            print(f"📍 Address:    {meta['merchant_address']}")
        
        if meta.get('transaction_time'):
            print(f"⏰ Time:       {meta['transaction_time']}")
        
        print(f"\n🔍 Method:     LLM Receipt OCR")
        print(f"🤖 Model:      {meta.get('model_used', 'N/A')}")
        
        # Show line items if available
        line_items = meta.get('line_items', [])
        if line_items:
            print(f"\n📝 Line Items: ({len(line_items)} items)")
            for idx, item in enumerate(line_items[:5], 1):  # Show first 5 items
                item_name = item.get('item_name', 'Unknown')
                item_qty = item.get('item_quantity', 1)
                item_total = item.get('item_total', item.get('item_price', 0))
                print(f"   {idx}. {item_name} x{item_qty} = {data.get('currency', 'INR')} {item_total}")
            if len(line_items) > 5:
                print(f"   ... and {len(line_items) - 5} more items")
        
        print(f"\n{'='*50}\n")


def is_available() -> bool:
    """Check if LLM analyzer is available (package installed and API key set)"""
    if not RECEIPT_OCR_AVAILABLE:
        return False
    
    load_dotenv()
    api_key = os.getenv('OPENAI_API_KEY')
    return bool(api_key)
