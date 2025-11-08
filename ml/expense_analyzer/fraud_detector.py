"""
Fraud Detection Module
Detects duplicate receipts and potential fraud indicators
"""

from typing import Dict, Any, List, Tuple
from receipt_storage import ReceiptStorage


class FraudDetector:
    """
    Detects potential fraud in receipt data.
    - Duplicate detection (image + content)
    - Anomaly detection (future: statistical analysis)
    """
    
    def __init__(self, storage: ReceiptStorage):
        """
        Initialize fraud detector.
        
        Args:
            storage: ReceiptStorage instance
        """
        self.storage = storage
    
    def check_duplicates(self, image_path: str, receipt_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check for duplicate receipts.
        
        Args:
            image_path: Path to receipt image
            receipt_data: Analyzed receipt data
            
        Returns:
            Dictionary with duplicate detection results
        """
        # Generate hashes
        image_hash = self.storage.generate_image_hash(image_path)
        content_hash = self.storage.generate_content_hash(receipt_data)
        
        # Find duplicates
        duplicates = self.storage.find_duplicates(image_hash, content_hash)
        
        # Analyze results
        exact_duplicates = [d for d in duplicates if d['match_type'] == 'exact_image']
        content_duplicates = [d for d in duplicates if d['match_type'] == 'same_content']
        
        duplicate_detected = len(duplicates) > 0
        
        result = {
            "duplicate_detected": duplicate_detected,
            "image_hash": image_hash,
            "content_hash": content_hash,
            "exact_duplicates": len(exact_duplicates),
            "content_duplicates": len(content_duplicates),
            "similar_receipts": []
        }
        
        # Add details of similar receipts
        for dup in duplicates[:3]:  # Show up to 3 matches
            result["similar_receipts"].append({
                "receipt_id": dup['receipt_id'],
                "stored_at": dup['stored_at'],
                "vendor": dup['vendor'],
                "amount": dup['amount'],
                "date": dup['date'],
                "match_type": dup['match_type']
            })
        
        return result
    
    def check_anomalies(self, receipt_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check for anomalies in receipt data.
        
        Args:
            receipt_data: Analyzed receipt data
            
        Returns:
            Dictionary with anomaly detection results
        """
        data = receipt_data.get('extracted_data', {})
        flags = []
        
        amount = data.get('amount', 0) or 0
        vendor = data.get('vendor', '')
        category = data.get('category', 'other')
        line_items = receipt_data.get('metadata', {}).get('line_items', [])
        
        # Flag 1: Round numbers (suspicious for large amounts)
        if amount > 1000 and amount % 100 == 0:
            flags.append({
                "type": "round_number",
                "severity": "warning",
                "message": f"Large round amount: {amount}"
            })
        
        # Flag 2: Missing line items for large amounts
        if amount > 1000 and not line_items:
            flags.append({
                "type": "missing_details",
                "severity": "warning",
                "message": "Large amount without itemized details"
            })
        
        # Flag 3: Very large amount (potential data entry error)
        if amount > 50000:
            flags.append({
                "type": "unusually_high",
                "severity": "critical",
                "message": f"Extremely high amount: {amount}"
            })
        
        # Calculate risk score (0-100)
        risk_score = 0
        for flag in flags:
            if flag['severity'] == 'warning':
                risk_score += 20
            elif flag['severity'] == 'critical':
                risk_score += 50
        
        risk_score = min(risk_score, 100)
        
        # Determine risk level
        if risk_score == 0:
            risk_level = "low"
        elif risk_score < 40:
            risk_level = "medium"
        else:
            risk_level = "high"
        
        return {
            "anomaly_score": risk_score / 100.0,  # Normalize to 0-1
            "flags": flags,
            "risk_level": risk_level
        }
    
    def perform_fraud_checks(self, image_path: str, receipt_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform all fraud checks.
        
        Args:
            image_path: Path to receipt image
            receipt_data: Analyzed receipt data
            
        Returns:
            Complete fraud check results
        """
        # Check duplicates
        duplicate_check = self.check_duplicates(image_path, receipt_data)
        
        # Check anomalies
        anomaly_check = self.check_anomalies(receipt_data)
        
        # Combine results
        return {
            **duplicate_check,
            **anomaly_check,
            "checks_performed": ["duplicate_detection", "anomaly_detection"],
            "timestamp": receipt_data.get('timestamp')
        }


def test_fraud_detector():
    """Test the fraud detection system"""
    from datetime import datetime
    
    storage = ReceiptStorage("test_receipt_history")
    detector = FraudDetector(storage)
    
    print("Fraud Detection System Test\n")
    
    # Mock receipt data
    test_receipt = {
        "file": "test_receipt.jpg",
        "timestamp": datetime.now().isoformat(),
        "extracted_data": {
            "amount": 1200.0,  # Round number
            "currency": "INR",
            "date": "2025-11-08",
            "vendor": "TEST STORE",
            "category": "supplies"
        },
        "metadata": {
            "extraction_method": "llm",
            "line_items": []  # Missing items
        }
    }
    
    # Perform fraud checks
    print("Performing fraud checks...")
    fraud_result = detector.perform_fraud_checks("samples/sample_receipt.jpg", test_receipt)
    
    print(f"\n📊 Fraud Check Results:")
    print(f"   Duplicate detected: {fraud_result['duplicate_detected']}")
    print(f"   Risk level: {fraud_result['risk_level']}")
    print(f"   Anomaly score: {fraud_result['anomaly_score']:.2f}")
    
    if fraud_result['flags']:
        print(f"\n⚠️  Flags detected:")
        for flag in fraud_result['flags']:
            print(f"   [{flag['severity'].upper()}] {flag['type']}: {flag['message']}")
    
    print("\n✅ Fraud detection working!")


if __name__ == '__main__':
    test_fraud_detector()
