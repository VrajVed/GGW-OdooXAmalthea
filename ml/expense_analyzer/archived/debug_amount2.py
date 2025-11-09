from analyzer import ReceiptAnalyzer
from pathlib import Path
ra = ReceiptAnalyzer()
text = ra.extract_text(ra.load_image('sample_receipt.jpg'))
lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
import re
num_re = re.compile(r"(\d{1,3}(?:[,\d]{0,})?(?:\.\d+)?|\d+(?:\.\d+)?)")
for idx, line in enumerate(lines):
    for m in num_re.finditer(line):
        amt_str = m.group(0).replace(',', '')
        try:
            amt = float(amt_str)
        except:
            continue
        score = 0
        l = line.lower()
        matched_total = bool(re.search(r"\b(total|grand total|amount due|amount payable|net amount|balance due|amount to be paid)\b", l))
        starts_total = line.strip().upper().startswith('TOTAL') or line.strip().upper().endswith('TOTAL') or 'total:' in l
        matched_sub = bool(re.search(r"\b(subtotal|gst|tax|vat|service charge|delivery fee|delivery)\b", l))
        matched_item = bool(re.search(r"\b\d+\s*x\b", l) or re.search(r"^\d+\s*x", l))
        if matched_total:
            score += 100
        if starts_total:
            score += 80
        if matched_sub:
            score -= 40
        if matched_item:
            score -= 60
        if idx >= max(0, len(lines) - 10):
            score += 15
        if amt < 1:
            score -= 50
        if 1900 <= amt <= 2100:
            score -= 30
        if len(m.group(0)) >= 6:
            score -= 30
        score += min(amt/10.0,20)
        print(f'LINE {idx}: "{line}" -> amt={amt}, matched_total={matched_total}, starts_total={starts_total}, matched_sub={matched_sub}, matched_item={matched_item}, score={score}')
