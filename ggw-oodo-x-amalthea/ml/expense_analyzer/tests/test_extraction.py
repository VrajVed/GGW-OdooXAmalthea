#!/usr/bin/env python3
"""Test the improved extraction logic with properly formatted text"""

from analyzer import ReceiptAnalyzer
import re

# Test with perfect OCR text (what should ideally be extracted)
perfect_text = """SWIGGY

Food Delivery Service

Invoice No: SW123456
Date: 08-11-2025
Time: 14:30 PM

Order Details:

1x Paneer Tikka ₹280
2x Naan ₹120
1x Dal Makhani ₹180

Subtotal: ₹580
GST (5%): ₹29
Delivery Fee: ₹40

TOTAL: ₹649

Thank You!
GST No: 29AABCS1234F1Z5
"""

analyzer = ReceiptAnalyzer()
result = analyzer.extract_amount(perfect_text)

print("=== TESTING WITH PERFECT OCR TEXT ===\n")
print("Extracted:")
print(f"  Amount: {result['amount']}")
print(f"  Line: {result['chosen_line']}")
print(f"  Method: {result['extraction_method']}")
print(f"\n✅ Expected: 649, Got: {result['amount']}")
print(f"Result: {'PASS ✓' if result['amount'] == 649.0 else 'FAIL ✗'}")
