"""Moves this project's FLUX images out of the ComfyUI output folder into the project.

For each project image in ComfyUI-master/output (prefixes below):
  - if an identical file (same sha256) already exists in the project, nothing is copied;
  - otherwise it is copied to ai-generated/comfyui-raw/<prefix>/<original name> and verified.
Then the original is sent to the Windows Recycle Bin (restorable, never hard-deleted).
Writes ai-generated/comfyui-move-log.json.
Usage: python scripts/collect-comfyui-images.py [--prefixes=RD100,TP,...] [--dry-run]
"""
import hashlib, json, os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = r'C:\Users\nanil\OneDrive\Desktop\Matey\personal_ai\ComfyUI-master\output'
DEST = os.path.join(ROOT, 'ai-generated', 'comfyui-raw')
PREFIXES = ['RD100', 'WLA', 'InviteAura', 'TP', 'TPR', 'TTR', 'Tamil', 'Telugu']
IMG = ('.png', '.jpg', '.jpeg', '.webp')
SKIP_DIRS = {'node_modules', '.git', '.vercel'}

args = dict(a[2:].split('=', 1) if '=' in a else (a[2:], True) for a in sys.argv[1:] if a.startswith('--'))
prefixes = args['prefixes'].split(',') if 'prefixes' in args else PREFIXES
dry = 'dry-run' in args
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()

# Every image already inside the project, by content.
have = {}
for dp, dns, fns in os.walk(ROOT):
    dns[:] = [d for d in dns if d not in SKIP_DIRS]
    for f in fns:
        if f.lower().endswith(IMG):
            p = os.path.join(dp, f)
            have.setdefault(os.path.getsize(p), []).append(p)

def in_project(p):
    for q in have.get(os.path.getsize(p), []):
        if sha(q) == sha(p):
            return q
    return None

log, to_recycle = [], []
for f in sorted(os.listdir(SRC)):
    p = os.path.join(SRC, f)
    if not (os.path.isfile(p) and f.lower().endswith(IMG)):
        continue
    pre = f.split('_', 1)[0]
    if pre not in prefixes:
        continue
    match = in_project(p)
    if match:
        rec = {'file': f, 'action': 'already-in-project', 'projectCopy': os.path.relpath(match, ROOT).replace(os.sep, '/')}
    else:
        d = os.path.join(DEST, pre, f)
        if not dry:
            os.makedirs(os.path.dirname(d), exist_ok=True)
            shutil.copy2(p, d)
            if sha(d) != sha(p):
                log.append({'file': f, 'action': 'copy-failed'}); continue
        rec = {'file': f, 'action': 'copied', 'projectCopy': os.path.relpath(d, ROOT).replace(os.sep, '/')}
    rec['bytes'] = os.path.getsize(p)
    log.append(rec)
    to_recycle.append(p)

if not dry and to_recycle:
    lst = os.path.join(ROOT, 'ai-generated', '.recycle-list.txt')
    os.makedirs(os.path.dirname(lst), exist_ok=True)
    open(lst, 'w', encoding='utf8').write('\n'.join(to_recycle))
    ps = ("Add-Type -AssemblyName Microsoft.VisualBasic; $n=0; Get-Content -LiteralPath '" + lst + "' -Encoding UTF8 | "
          "ForEach-Object { if (Test-Path -LiteralPath $_) { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($_, "
          "'OnlyErrorDialogs', 'SendToRecycleBin'); $n++ } }; Write-Output $n")
    out = subprocess.run(['powershell', '-NoProfile', '-Command', ps], capture_output=True, text=True)
    recycled = out.stdout.strip()
    os.remove(lst)
else:
    recycled = '0 (dry run)' if dry else '0'

logf = os.path.join(ROOT, 'ai-generated', 'comfyui-move-log.json')
prev = json.load(open(logf, encoding='utf8')) if os.path.exists(logf) else []
if not dry:
    json.dump(prev + log, open(logf, 'w', encoding='utf8'), indent=1)
summary = {}
for r in log:
    k = r['file'].split('_', 1)[0] + ':' + r['action']; summary[k] = summary.get(k, 0) + 1
print(json.dumps(summary, indent=1)); print('sent to Recycle Bin:', recycled)
