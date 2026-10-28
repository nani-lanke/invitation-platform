"""Verifies every redesign image on disk and its FLUX.2 Klein 4B provenance.

Checks (read-only):
  - each card's artwork in redesign-100/cards/<slug>/ exists, decodes, matches the manifest sha256
  - each artwork traces to a raw ComfyUI output in redesign-100/work/raw/ whose embedded
    workflow (PNG "prompt" text chunk) loads flux-2-klein-4b.safetensors with the logged seed
  - the 100 final card PNGs, the website assets in images/redesign-100/<slug>/, and every
    path in js/redesign-collection-data.js / redesign-collection.js / design.json exist
  - no collection code points outside the project (absolute or temp paths)
Writes redesign-100/integration/asset-report.json.
Usage: python redesign-100/integration/verify-assets.py
"""
import hashlib, json, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RD = os.path.join(ROOT, 'redesign-100')
rel = lambda p: os.path.relpath(p, ROOT).replace(os.sep, '/')
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()


def info(p):
    if not os.path.isfile(p):
        return {'path': rel(p), 'exists': False}
    try:
        with Image.open(p) as im:
            im.verify()
        with Image.open(p) as im:
            w, h = im.size
        return {'path': rel(p), 'exists': True, 'decodes': True, 'w': w, 'h': h, 'bytes': os.path.getsize(p)}
    except Exception as e:
        return {'path': rel(p), 'exists': True, 'decodes': False, 'error': str(e)}


def flux_meta(p):
    """Model + seed + prompt from the ComfyUI workflow embedded in a raw PNG."""
    try:
        with Image.open(p) as im:
            wf = json.loads(im.info.get('prompt', '{}'))
    except Exception:
        return None
    unet = next((n['inputs'].get('unet_name') for n in wf.values() if n.get('class_type') == 'UNETLoader'), None)
    seed = next((n['inputs'].get('noise_seed') for n in wf.values() if n.get('class_type') == 'RandomNoise'), None)
    text = next((n['inputs'].get('text') for n in wf.values() if n.get('class_type') == 'CLIPTextEncode'), None)
    return {'unet': unet, 'seed': seed, 'text': text}


manifest = json.load(open(os.path.join(RD, 'output', 'manifest.json'), encoding='utf8'))
genlog = json.load(open(os.path.join(RD, 'work', 'gen-log.json'), encoding='utf8'))
data_js = open(os.path.join(ROOT, 'js', 'redesign-collection-data.js'), encoding='utf8').read()
registry = json.loads(re.sub(r'^[\s\S]*?REDESIGN_COLLECTION_DATA = ', '', data_js).rstrip().rstrip(';'))
selected = sorted((i for i in manifest['invitations'] if i['status'] == 'SELECTED_FOR_REDESIGN'), key=lambda i: i['index'])

KIND_FILE = {'venue': 'venue.jpg', 'crest': 'crest.png', 'footer': 'footer.jpg', 'corner': 'corner-tl.png'}
report = {'cards': [], 'problems': []}
counts = dict(artwork=0, artworkDerivedMirror=0, rawFlux=0, finalPngs=0, webAssets=0, webThumbs=0, missing=0)

for inv in selected:
    slug = inv['slug']
    card = {'slug': slug, 'index': inv['index'], 'artwork': {}, 'web': {}, 'final': None}
    cdir = os.path.join(RD, 'cards', slug)
    # FLUX artwork (working copy) + provenance
    for kind, fname in KIND_FILE.items():
        if kind not in genlog.get(slug, {}):
            continue  # botanical layouts have no corner art
        a = info(os.path.join(cdir, fname))
        g = genlog[slug][kind]
        raw = os.path.normpath(os.path.join(RD, 'cards', g['raw']))
        m = flux_meta(raw) if os.path.isfile(raw) else None
        a['raw'] = rel(raw)
        a['rawExists'] = os.path.isfile(raw)
        a['flux'] = bool(m and m['unet'] == 'flux-2-klein-4b.safetensors' and m['seed'] == g['seed'] and m['text'] == g['prompt'])
        a['seed'] = g['seed']
        card['artwork'][kind] = a
        counts['artwork'] += a.get('exists', False)
        if not (a.get('exists') and a.get('decodes') and a['rawExists'] and a['flux']):
            report['problems'].append(slug + ' ' + kind + ' artwork/provenance: ' + json.dumps({k: a.get(k) for k in ('exists', 'decodes', 'rawExists', 'flux')}))
    if 'corner' in genlog.get(slug, {}):
        tr = info(os.path.join(cdir, 'corner-tr.png'))
        card['artwork']['cornerMirror'] = tr
        counts['artworkDerivedMirror'] += tr.get('exists', False)
    # manifest sha256 of the working copy matches the file
    for key, ra in inv['redesignedAssets'].items():
        if isinstance(ra, dict) and ra.get('sha256'):
            p = os.path.join(ROOT, ra['path'])
            if not os.path.isfile(p) or sha(p) != ra['sha256']:
                report['problems'].append(slug + ' manifest ' + key + ' missing or sha256 differs: ' + ra['path'])
    for f in ('design.json', 'design.js', os.path.join('images', 'wedding-motifs', slug + '.svg')):
        if not os.path.isfile(os.path.join(cdir, f)):
            report['problems'].append(slug + ' missing ' + f)
    # final rendered card
    fp = os.path.join(ROOT, inv['render']['png'])
    card['final'] = info(fp)
    counts['finalPngs'] += card['final'].get('decodes', False)
    if not card['final'].get('decodes'):
        report['problems'].append(slug + ' final PNG missing: ' + rel(fp))
    # website assets used by js/redesign-collection.js
    entry = next((c for c in registry['cards'] if c['base'] == slug), None)
    if not entry:
        report['problems'].append(slug + ' not in js/redesign-collection-data.js')
        continue
    files = ['venue.webp', 'crest.webp', 'footer.webp', 'thumb.jpg'] + (['corner-tl.webp', 'corner-tr.webp'] if entry['corners'] else [])
    for f in files:
        w = info(os.path.join(ROOT, 'images', 'redesign-100', slug, f))
        card['web'][f] = w
        if w.get('decodes'):
            counts['webThumbs' if f == 'thumb.jpg' else 'webAssets'] += 1
        else:
            counts['missing'] += 1
            report['problems'].append(slug + ' website asset missing/unreadable: ' + w['path'])
    report['cards'].append(card)

raw_dir = os.path.join(RD, 'work', 'raw')
raws = [f for f in os.listdir(raw_dir) if f.endswith('.png')]
counts['rawFlux'] = sum(1 for f in raws if (flux_meta(os.path.join(raw_dir, f)) or {}).get('unet') == 'flux-2-klein-4b.safetensors')
counts['rawTotal'] = len(raws)

# collection code must not point outside the project
bad = []
for f in ('js/redesign-collection.js', 'js/redesign-collection-data.js'):
    src = open(os.path.join(ROOT, f), encoding='utf8').read()
    for pat in (r'[A-Za-z]:[\\/]', r'AppData', r'scratchpad', r'ComfyUI', r'127\.0\.0\.1', r'file:///'):
        if re.search(pat, src):
            bad.append(f + ' contains ' + pat)
report['problems'] += bad

report['summary'] = dict(counts, cardsChecked=len(report['cards']), registryCards=len(registry['cards']),
                         pdf=os.path.isfile(os.path.join(RD, 'output', 'redesigned-invitations-100.pdf')),
                         contactSheet=os.path.isfile(os.path.join(RD, 'output', 'contact-sheet-100.png')),
                         problems=len(report['problems']))
json.dump(report, open(os.path.join(RD, 'integration', 'asset-report.json'), 'w', encoding='utf8'), indent=1)
print(json.dumps(report['summary'], indent=1))
for p in report['problems'][:20]:
    print('PROBLEM', p)
