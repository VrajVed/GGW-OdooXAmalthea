from analyzer import ReceiptAnalyzer
from pathlib import Path
ra = ReceiptAnalyzer()
text = ra.extract_text(ra.load_image('sample_receipt.jpg'))
print('--- TEXT ---')
print(text)

# replicate internal logic to show candidates
import re
lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
num_re = re.compile(r"(\d{1,3}(?:[,\d]{0,})?(?:\.\d+)?|\d+(?:\.\d+)?)")
candidates = []
for idx, line in enumerate(lines):
    for m in num_re.finditer(line):
        amt_str = m.group(0).replace(',', '')
        try:
            amt = float(amt_str)
        except ValueError:
            continue
        score = 0
        l = line.lower()
        if re.search(r"\b(total|grand total|amount due|amount payable|net amount|balance due|amount to be paid)\b", l):
            score += 100
        if line.strip().upper().startswith('TOTAL') or line.strip().upper().endswith('TOTAL') or 'total:' in l:
            score += 80
        if re.search(r"\b(subtotal|gst|tax|vat|service charge|delivery fee|delivery)\b", l):
            score -= 40
        if re.search(r"\b\d+\s*x\b", l) or re.search(r"^\d+\s*x", l):
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
        candidates.append((amt, idx, line, score))

candidates.sort(key=lambda x: (x[3], x[1]), reverse=True)
print('\n--- CANDIDATES (amt, index, score, line) ---')
for c in candidates:
    print(c[0], c[1], c[3], c[2])

print('\nBest ->', candidates[0])
