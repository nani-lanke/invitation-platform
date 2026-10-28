/* Compares the public site's HTML/JS/CSS with the local folder (read-only). */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..'), SITE = 'https://www.inviteaura.in/';
const files = [];
for (const d of ['.', 'js', 'css', 'api']) for (const f of fs.readdirSync(path.join(ROOT, d))) {
  if (/\.(html|js|css)$/.test(f) && !/^(test-|verify-|temp-|preview-test|host-test|demo-|generate-)/.test(f)) files.push(d === '.' ? f : d + '/' + f);
}
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
(async () => {
  const out = { same: [], differs: [], missingLive: [] };
  for (const f of files) {
    if (f.startsWith('api/')) continue; // serverless functions are not served as files
    const r = await fetch(SITE + f, { redirect: 'follow' });
    if (r.status === 404) { out.missingLive.push(f); continue; }
    const live = Buffer.from(await r.arrayBuffer()), local = fs.readFileSync(path.join(ROOT, f));
    (sha(live) === sha(local) ? out.same : out.differs).push(f + (sha(live) === sha(local) ? '' : ' (live ' + live.length + 'B / local ' + local.length + 'B)'));
  }
  console.log(JSON.stringify(out, null, 1));
})();
