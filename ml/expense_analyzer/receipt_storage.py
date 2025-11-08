"""
Receipt Storage System
Stores analyzed receipts in JSON format for history tracking and duplicate detection
"""

import os
import json
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
from PIL import Image


class ReceiptStorage:
    """
    Manages receipt storage and retrieval.
    Stores receipts as JSON files with unique IDs and provides query capabilities.
    """
    
    def __init__(self, storage_dir: str = "receipt_history"):
        """
        Initialize receipt storage.
        
        Args:
            storage_dir: Directory to store receipt JSON files
        """
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)
        
        # Create index file if it doesn't exist
        self.index_file = self.storage_dir / "index.json"
        if not self.index_file.exists():
            self._save_index([])
    
    def _load_index(self) -> List[Dict]:
        """Load the receipt index"""
        try:
            with open(self.index_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load index: {e}")
            return []
    
    def _save_index(self, index: List[Dict]):
        """Save the receipt index"""
        with open(self.index_file, 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2, ensure_ascii=False)
    
    def generate_image_hash(self, image_path: str) -> str:
        """
        Generate perceptual hash of image for duplicate detection.
        Uses average hash algorithm for quick comparison.
        
        Args:
            image_path: Path to receipt image
            
        Returns:
            Hash string (64 characters)
        """
        try:
            with Image.open(image_path) as img:
                # Convert to grayscale and resize to 8x8
                img = img.convert('L').resize((8, 8), Image.Resampling.LANCZOS)
                pixels = list(img.getdata())
                
                # Calculate average
                avg = sum(pixels) / len(pixels)
                
                # Generate hash bits (1 if pixel > avg, else 0)
                bits = ''.join(['1' if p > avg else '0' for p in pixels])
                
                # Convert to hex
                return hex(int(bits, 2))[2:].zfill(16)
        except Exception as e:
            print(f"Warning: Could not generate image hash: {e}")
            # Fallback to file content hash
            return self._file_hash(image_path)
    
    def _file_hash(self, file_path: str) -> str:
        """Generate SHA256 hash of file content"""
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256.update(chunk)
        return sha256.hexdigest()[:16]
    
    def generate_content_hash(self, receipt_data: Dict[str, Any]) -> str:
        """
        Generate hash based on receipt content (vendor, date, amount).
        Used to detect duplicate receipts even if re-photographed.
        
        Args:
            receipt_data: Extracted receipt data
            
        Returns:
            Content hash string
        """
        data = receipt_data.get('extracted_data', {})
        
        # Create fingerprint from key fields
        fingerprint_parts = [
            str(data.get('vendor', '')).lower().strip(),
            str(data.get('date', '')),
            str(data.get('amount', '')),
        ]
        
        # Add line items if available for more precision
        line_items = receipt_data.get('metadata', {}).get('line_items', [])
        if line_items:
            items_str = '|'.join(sorted([
                f"{item.get('item_name', '')}:{item.get('item_total', '')}"
                for item in line_items[:5]  # Use first 5 items
            ]))
            fingerprint_parts.append(items_str)
        
        fingerprint = '___'.join(fingerprint_parts)
        
        # Generate hash
        return hashlib.sha256(fingerprint.encode()).hexdigest()[:16]
    
    def save_receipt(self, receipt_data: Dict[str, Any], image_path: str) -> str:
        """
        Save receipt data to storage.
        
        Args:
            receipt_data: Analyzed receipt data
            image_path: Original image file path
            
        Returns:
            Receipt ID (timestamp-based)
        """
        # Generate hashes
        image_hash = self.generate_image_hash(image_path)
        content_hash = self.generate_content_hash(receipt_data)
        
        # Generate unique ID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        receipt_id = f"receipt_{timestamp}"
        
        # Add metadata
        storage_data = {
            "receipt_id": receipt_id,
            "stored_at": datetime.now().isoformat(),
            "original_file": str(Path(image_path).name),
            "image_hash": image_hash,
            "content_hash": content_hash,
            **receipt_data
        }
        
        # Save to file
        receipt_file = self.storage_dir / f"{receipt_id}.json"
        with open(receipt_file, 'w', encoding='utf-8') as f:
            json.dump(storage_data, f, indent=2, ensure_ascii=False)
        
        # Update index
        index = self._load_index()
        index_entry = {
            "receipt_id": receipt_id,
            "stored_at": storage_data["stored_at"],
            "vendor": receipt_data.get('extracted_data', {}).get('vendor'),
            "amount": receipt_data.get('extracted_data', {}).get('amount'),
            "date": receipt_data.get('extracted_data', {}).get('date'),
            "category": receipt_data.get('extracted_data', {}).get('category'),
            "image_hash": image_hash,
            "content_hash": content_hash,
        }
        index.append(index_entry)
        self._save_index(index)
        
        return receipt_id
    
    def find_duplicates(self, image_hash: str, content_hash: str) -> List[Dict]:
        """
        Find potential duplicate receipts.
        
        Args:
            image_hash: Hash of the image
            content_hash: Hash of the content
            
        Returns:
            List of matching receipts
        """
        index = self._load_index()
        duplicates = []
        
        for entry in index:
            match_type = None
            
            # Exact image match
            if entry['image_hash'] == image_hash:
                match_type = 'exact_image'
            # Content match (same receipt, different photo)
            elif entry['content_hash'] == content_hash:
                match_type = 'same_content'
            
            if match_type:
                duplicates.append({
                    **entry,
                    'match_type': match_type
                })
        
        return duplicates
    
    def get_receipt(self, receipt_id: str) -> Optional[Dict]:
        """Load a specific receipt by ID"""
        receipt_file = self.storage_dir / f"{receipt_id}.json"
        if receipt_file.exists():
            with open(receipt_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    
    def get_all_receipts(self) -> List[Dict]:
        """Get index of all receipts"""
        return self._load_index()
    
    def get_receipts_by_category(self, category: str) -> List[Dict]:
        """Get all receipts in a category"""
        index = self._load_index()
        return [r for r in index if r.get('category', '').lower() == category.lower()]
    
    def get_receipts_by_vendor(self, vendor: str) -> List[Dict]:
        """Get all receipts from a vendor"""
        index = self._load_index()
        vendor_lower = vendor.lower()
        return [r for r in index if vendor_lower in r.get('vendor', '').lower()]
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get storage statistics"""
        index = self._load_index()
        
        if not index:
            return {
                "total_receipts": 0,
                "categories": {},
                "total_amount": 0,
                "currency": "INR"
            }
        
        # Calculate stats
        categories = {}
        total_amount = 0
        
        for receipt in index:
            cat = receipt.get('category', 'other')
            categories[cat] = categories.get(cat, 0) + 1
            total_amount += receipt.get('amount', 0) or 0
        
        return {
            "total_receipts": len(index),
            "categories": categories,
            "total_amount": total_amount,
            "currency": "INR",  # Could be enhanced to track multiple currencies
            "oldest_receipt": index[0].get('date') if index else None,
            "newest_receipt": index[-1].get('date') if index else None,
        }


def test_storage():
    """Test the storage system"""
    storage = ReceiptStorage("test_receipt_history")
    
    print("Receipt Storage System Test\n")
    
    # Mock receipt data
    test_receipt = {
        "file": "test_receipt.jpg",
        "timestamp": datetime.now().isoformat(),
        "extracted_data": {
            "amount": 649.0,
            "currency": "INR",
            "date": "2025-11-08",
            "vendor": "SWIGGY",
            "category": "food"
        },
        "metadata": {
            "extraction_method": "llm",
            "line_items": []
        }
    }
    
    # Save receipt
    print("Saving test receipt...")
    receipt_id = storage.save_receipt(test_receipt, "samples/sample_receipt.jpg")
    print(f"✅ Saved with ID: {receipt_id}\n")
    
    # Get statistics
    stats = storage.get_statistics()
    print(f"📊 Statistics:")
    print(f"   Total receipts: {stats['total_receipts']}")
    print(f"   Total amount: {stats['currency']} {stats['total_amount']:.2f}")
    print(f"   Categories: {stats['categories']}\n")
    
    print("✅ Storage system working!")


if __name__ == '__main__':
    test_storage()
