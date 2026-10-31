import glob, re, os
from PIL import Image
order = re.findall(r"^  '([a-z0-9-]+)':", open('work/briefs.js', encoding='utf8').read(), re.M)
for s in order:
    p = os.path.join('cards', s, 'corner-tl.png')
    if not os.path.exists(p): continue
    im = Image.open(p); a = im.split()[3]; w, h = im.size
    dens = sum(a.histogram()[128:]) / (w * h)
    col = max(sum(1 for y in range(h) if a.getpixel((x, y)) > 60) / h for x in range(w - 6, w))
    row = max(sum(1 for x in range(w) if a.getpixel((x, y)) > 60) / w for y in range(h - 6, h))
    if dens < 0.3 or col > 0.55 or row > 0.55:
        print(order.index(s) + 1, s, round(dens, 2), round(col, 2), round(row, 2))
