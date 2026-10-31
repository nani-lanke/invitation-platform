import os, sys, json
from PIL import Image, ImageDraw, ImageFont
RD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SP = sys.argv[1]
slugs = list(json.load(open(os.path.join(RD,'work','gen-log.json'))).keys())
import re
order = re.findall(r"^  '([a-z0-9-]+)':", open(os.path.join(RD,'work','briefs.js'),encoding='utf8').read(), re.M)
f = ImageFont.truetype('arial.ttf', 13)
kinds = [('venue.jpg',(230,172)),('footer.jpg',(300,110)),('crest.png',(120,120)),('corner-tl.png',(120,156))]
CH = 10
for c in range(0, len(order), CH):
    part = order[c:c+CH]
    W = 10 + sum(k[1][0]+10 for k in kinds) + 200
    H = 10 + len(part)*180
    s = Image.new('RGB',(W,H),(120,40,50)); d = ImageDraw.Draw(s)
    for r, slug in enumerate(part):
        y = 10 + r*180; x = 10
        d.text((x,y+70), '%03d %s' % (order.index(slug)+1, slug), fill=(255,255,255), font=f); x += 200
        for k,(tw,th) in kinds:
            p = os.path.join(RD,'cards',slug,k)
            if os.path.exists(p):
                im = Image.open(p).convert('RGBA'); im.thumbnail((tw,th))
                bg = Image.new('RGBA', im.size, (245,238,225,255)) if r%2 else Image.new('RGBA', im.size, (60,20,30,255))
                s.paste(Image.alpha_composite(bg, im).convert('RGB'), (x,y))
            x += tw+10
    s.save(os.path.join(SP,'assets-%d.png' % (c//CH+1)))
print('ok')
