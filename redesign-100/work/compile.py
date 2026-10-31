"""Builds the PDF compilation and the contact sheet from output/png.
Usage: python redesign-100/work/compile.py"""
import glob, os, re
from PIL import Image, ImageDraw, ImageFont

RD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(RD, 'output')
pngs = sorted(glob.glob(os.path.join(OUT, 'png', '[0-9][0-9][0-9]-*.png')))

# PDF: one card per page, downscaled to 1000px wide (JPEG inside the PDF).
pages = []
for f in pngs:
    im = Image.open(f).convert('RGB')
    w = 1000
    pages.append(im.resize((w, round(im.height * w / im.width)), Image.LANCZOS))
pdf = os.path.join(OUT, 'redesigned-invitations-100.pdf')
pages[0].save(pdf, save_all=True, append_images=pages[1:], resolution=150, quality=88)
with open(pdf, 'rb') as fh:
    n_pages = len(re.findall(rb'/Type\s*/Page(?!s)', fh.read()))
print('pdf pages', n_pages)

# Contact sheet: 10 x 10 grid of the card top (3:4 cover crop) with labels.
COLS, TW, TH, LH = 10, 260, 347, 46
rows = (len(pngs) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * TW + (COLS + 1) * 12, rows * (TH + LH) + (rows + 1) * 12 + 70), (246, 242, 235))
d = ImageDraw.Draw(sheet)
def font(sz):
    for name in ('arialbd.ttf', 'arial.ttf', 'DejaVuSans.ttf'):
        try: return ImageFont.truetype(name, sz)
        except OSError: pass
    return ImageFont.load_default()
f1, f2, f3 = font(15), font(12), font(30)
d.text((12, 18), 'Redesigned wedding invitations — %d cards (excl. Telugu Pelli & Tamil Thirumanam)' % len(pngs), fill=(60, 30, 30), font=f3)
for i, f in enumerate(pngs):
    im = Image.open(f).convert('RGB')
    crop = im.crop((0, 0, im.width, round(im.width * 4 / 3)))
    crop.thumbnail((TW, TH), Image.LANCZOS)
    x = 12 + (i % COLS) * (TW + 12); y = 70 + 12 + (i // COLS) * (TH + LH + 12)
    sheet.paste(crop, (x, y))
    num, slug = os.path.basename(f)[:-4].split('-', 1)
    d.text((x, y + TH + 4), num, fill=(140, 90, 40), font=f1)
    d.text((x + 36, y + TH + 4), slug[:30], fill=(40, 30, 30), font=f2)
    d.text((x + 36, y + TH + 22), slug[30:60], fill=(40, 30, 30), font=f2)
sheet.save(os.path.join(OUT, 'contact-sheet-100.png'))
print('contact sheet', sheet.size, 'cards', len(pngs))
