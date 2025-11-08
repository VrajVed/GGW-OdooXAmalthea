#!/usr/bin/env python3
"""Generate a sample receipt image for testing"""

from PIL import Image, ImageDraw, ImageFont

# Create a white image
width, height = 400, 600
image = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(image)

# Try to use a default font
try:
    font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
    font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
except:
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Draw receipt content
y_position = 30

# Header
draw.text((120, y_position), "SWIGGY", fill='black', font=font_large)
y_position += 40
draw.text((80, y_position), "Food Delivery Service", fill='black', font=font_small)
y_position += 30
draw.line([(30, y_position), (370, y_position)], fill='black', width=2)
y_position += 20

# Receipt details
draw.text((30, y_position), "Invoice No: SW123456", fill='black', font=font_small)
y_position += 25
draw.text((30, y_position), "Date: 08-11-2025", fill='black', font=font_small)
y_position += 25
draw.text((30, y_position), "Time: 14:30 PM", fill='black', font=font_small)
y_position += 40

# Items
draw.text((30, y_position), "Order Details:", fill='black', font=font_medium)
y_position += 30
draw.text((30, y_position), "1x Paneer Tikka          ₹280", fill='black', font=font_small)
y_position += 25
draw.text((30, y_position), "2x Naan                  ₹120", fill='black', font=font_small)
y_position += 25
draw.text((30, y_position), "1x Dal Makhani           ₹180", fill='black', font=font_small)
y_position += 40

# Subtotal
draw.line([(30, y_position), (370, y_position)], fill='black', width=1)
y_position += 15
draw.text((30, y_position), "Subtotal:                ₹580", fill='black', font=font_small)
y_position += 25
draw.text((30, y_position), "GST (5%):                ₹29", fill='black', font=font_small)
y_position += 25
draw.text((30, y_position), "Delivery Fee:            ₹40", fill='black', font=font_small)
y_position += 30

# Total
draw.line([(30, y_position), (370, y_position)], fill='black', width=2)
y_position += 20
draw.text((30, y_position), "TOTAL:                   ₹649", fill='black', font=font_large)
y_position += 50

# Footer
draw.line([(30, y_position), (370, y_position)], fill='black', width=1)
y_position += 20
draw.text((100, y_position), "Thank You!", fill='black', font=font_medium)
y_position += 30
draw.text((50, y_position), "GST No: 29AABCS1234F1Z5", fill='black', font=font_small)

# Save the image
image.save('sample_receipt.jpg', 'JPEG', quality=95)
print("✅ Sample receipt created: sample_receipt.jpg")
