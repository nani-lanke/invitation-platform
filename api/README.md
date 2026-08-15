# api/ — publishing on Vercel

GitHub Pages serves files and never runs code, so an invitation could only
ever become a link or a download. Vercel runs code, which is the one thing
needed to turn "Create Your Invitation" into a real page in your repository.

```
browser ──POST fields──▶ /api/publish ──commit──▶ GitHub repo
                                                      │
guest  ──GET the URL──▶ /api/invite ──read back──────┘
```

Both halves matter. **Vercel serves the files that existed when a deployment
was built**, so a freshly committed invitation would 404 until the next build,
and a build per invitation would exhaust the daily deployment allowance. So
`api/invite.js` reads the file back out of the repository on request. The
address works the moment the commit lands, with no redeploy.

## Setting it up

**1. Import the repository into Vercel.** Framework preset: **Other**. No build
command, no output directory — the site is static files plus this folder.

**2. Make a GitHub token.** Settings → Developer settings → *Fine-grained
personal access tokens*. Scope it to this one repository, and give it exactly
one permission: **Contents: Read and write**. Nothing else.

**3. Add the environment variables** in Vercel → Project → Settings →
Environment Variables:

| Variable | Example | Required |
|---|---|---|
| `GITHUB_TOKEN` | `github_pat_…` | yes |
| `GITHUB_REPO` | `yourname/invitation-platform` | yes |
| `GITHUB_BRANCH` | `main` | no, defaults to `main` |
| `SITE_URL` | `https://invites.example.com/` | no — defaults to the request's own host |
| `RAZORPAY_KEY_ID` | `rzp_live_…` | yes, for payments |
| `RAZORPAY_KEY_SECRET` | `…` | yes, for payments |
| `PUBLISH_LIMIT_IP` | `5` per hour per address | no |
| `PUBLISH_LIMIT_DAY` | `200` per day for everyone | no |
| `ALLOW_CHECK` | `1` to turn on `/api/check` while setting up | no |

## When publishing fails

`/api/publish` returns a deliberately vague error — its real ones name your
repository and your token's permissions, and it is open to the internet. To see
the real reason, set `ALLOW_CHECK=1`, redeploy, and open **`/api/check`**. It
walks the same path in order and names the first thing that fails: missing
environment variables, a renderer that could not load, a rejected token, a
repository the token cannot see, or a token without write access. Remove
`ALLOW_CHECK` once publishing works.

**`js/` must be bundled into the function.** `_browser.js` reads the site's own
renderer at runtime, from paths Vercel's file tracer cannot follow. That is what
`functions.includeFiles` in [`../vercel.json`](../vercel.json) is for — without
it the folder is absent from the deployment and every publish fails.

The token is read only inside `api/_github.js`, which only ever runs on the
server. It must never reach the browser — anything that can read it can write
to your repository.

**4. Attach Vercel KV** (Storage → KV → Connect). Optional but recommended
while the site is public: it sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` by
itself, and the rate limiter picks them up with no other change. Without it the
counters are per function instance, which limits an attacker partially rather
than exactly. See [`_limit.js`](_limit.js).

## What a stranger is allowed to publish

The endpoint is open to the internet and it writes to your repository, so:

- **Fields travel, never markup.** The browser sends `{ title, date, venue, … }`
  and the server renders. If it accepted finished HTML, anyone could publish any
  page they liked on your domain.
- **Only the fields in the table in [`_validate.js`](_validate.js)**, each capped
  in length. Everything else is dropped.
- **`mapsUrl` must be http or https.** It becomes an `href`, and HTML-escaping
  does nothing to `javascript:` — no quotes or angle brackets are involved.
- **Uploaded photos are refused.** They arrive as data: URLs, are megabytes
  each, and are the easiest way to fill a repository with junk. An invitation
  with photos goes out through **Download page folder** instead.
- **Published pages carry `noindex`**, so an invitation with a name, an address
  and a phone number does not turn up in search results. Link previews still
  work — the scrapers read og: tags regardless.

None of this makes the endpoint free to abuse; it makes abuse bounded. If the
site attracts real attention, put Cloudflare Turnstile in front of it.

## One renderer, not two

`api/_browser.js` loads `js/main.js`, `js/templates.js`, `js/preview.js` and
`js/export.js` into a sandbox with a stub `window` and `document`, and uses the
site's own renderer. A second server-side renderer would drift from the first
the moment anyone edited a template.

It works because every module ends with the same line:

```js
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
```

The stub document reports `'loading'` and never fires `DOMContentLoaded`, so
the definitions run and the page controllers never do. **If you add a module
that boots unconditionally, or that touches the DOM while it is loading, this
breaks** — keep the guard.

## Testing locally

```bash
npm i -g vercel
vercel dev
```

`vercel dev` reads `.env.local`, so put `GITHUB_TOKEN`, `GITHUB_REPO`, `RAZORPAY_KEY_ID`
and `RAZORPAY_KEY_SECRET` there — and keep that file out of git. Publishing from a
local run commits to the real repository, so use a scratch repo or a branch while
you are trying it.

## Payments

Hosting an invitation online costs a fixed ₹99, charged through Razorpay:

- `POST api/order` — creates a Razorpay order for ₹99 (9900 paise). The price is
  decided here, never on the client. Returns `{ orderId, keyId, amount, currency }`.
- `POST api/verify` — re-signs `order_id|payment_id` with the secret and compares,
  so only a genuine Razorpay payment passes. Returns `{ ok: true }`.

The client never sees `RAZORPAY_KEY_SECRET`; only the public `keyId` reaches it.
When `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are missing, `api/order` returns 503
so the payment step degrades gracefully instead of charging against nothing.

**`api/publish` checks the payment itself too.** The browser sends the Razorpay
order id, payment id and signature along with the invitation fields, and the
server re-signs `order_id|payment_id` with the secret and compares before it
commits anything. When the secret is set, an invitation is never hosted without
a verified ₹99 payment — the client's `hostingPaid` flag alone is not trusted.

## Where hosted invitations live

Every published invitation is committed to the repository under `invitations/`
and served from there by `api/invite` (via the `vercel.json` rewrites):

```
invitations/
├── index.json                  the hosted-invitation registry
├── rahul-priya-a8f42c.html     the page — <slug>-<unique-id>.html
├── main_image/…_image.jpg      media sits beside the page
├── background_image/…_background.jpg
├── sample_images/…
└── background_music/…_music.mp3
```

The public URL is generated once, in `api/publish.js`, and returned to the
browser as `publicUrl`:

```
https://<domain>/invitations/rahul-priya-a8f42c.html
```

The domain is the request's own host on Vercel (a custom domain if one is
attached); set `SITE_URL` to pin it explicitly. The page's commit is verified
by reading it straight back from GitHub before the address is returned, and the
browser confirms the address serves HTTP 200 before it shows "Your invitation
is live!". `index.json` is the registry written in the same commit as the page —
it is never served to guests, and is the one place the site's own storage (the
repository) records hosted invitations.

## The three ways to share, side by side

| | Where it lives | Works on | Photos | Link preview |
|---|---|---|---|---|
| Link (`i.html#…`) | the URL itself | anywhere | no | no |
| **Publish it now** | `invitations/<name>-<id>.html` | Vercel only | yes | yes |
| Download page folder | `invitations/<Names>/<Date>/` | anywhere, after you push | yes | yes |
