# InviteHub

> Beautiful digital invitations for every special moment.

A premium, fully responsive **static** invitation platform built with plain HTML5,
CSS3 and vanilla JavaScript — no framework, no build step, no backend. Drop the
folder into a GitHub repository, switch on Pages, and it is live.

---

## Table of contents

- [What this is](#what-this-is)
- [Features](#features)
- [Technologies](#technologies)
- [Folder structure](#folder-structure)
- [How to run locally](#how-to-run-locally)
- [Shareable invitation links](#shareable-invitation-links)
- [How to upload to GitHub](#how-to-upload-to-github)
- [How to enable GitHub Pages](#how-to-enable-github-pages)
- [Configure it for your own domain](#configure-it-for-your-own-domain)
- [How to update the website](#how-to-update-the-website)
- [Architecture notes](#architecture-notes)
- [Upgrading to a full backend](#upgrading-to-a-full-backend)
- [Browser support](#browser-support)
- [Licence](#licence)

---

## What this is

InviteHub replaces the printed invitation card with a living web page. A host picks a
template, fills in the event details, adds photos, and gets a single link to send on
WhatsApp. Guests open it in any browser — no app, no account, no download.

**This build is the complete front end.** Every visual and interactive feature works:
all 47 templates, search and filtering, the five-step editor with live preview, the
countdown, the QR encoder, share targets, dark mode and the full responsive layout.

**What is deliberately absent** is the server half — accounts, a database, image
storage and payments. Drafts are kept in your browser's `localStorage` and photos are
read locally with `FileReader` and never transmitted. The code is structured so those
pieces can be added without redesigning the UI (see
[Upgrading to a full backend](#upgrading-to-a-full-backend)).

---

## Features

### Catalogue
- **47 invitation templates** across **18 categories**, each generated as a scalable SVG
- Live search, category filter and four sort orders — every template is free
- Favourites saved to `localStorage`, with a favourites-only view
- Filter state is written to the URL, so any filtered view is linkable and bookmarkable
- "Load more" pagination that moves keyboard focus to the first new card

### Preview
- Full preview page **and** an in-page modal, both driven by the same renderer
- Zoom in / out / reset, plus <kbd>Ctrl</kbd>+scroll to zoom
- Mobile and desktop device switch
- Native full-screen support
- Related-template suggestions

### Invitation editor (`create.html`)
- Six steps: **Event → Details → Media → Design → Payment → Done**
- Conditional fields — a wedding asks for bride and groom, a birthday asks for the
  birthday person, a festival asks for neither
- Live preview beside the form, updating as you type
- Photo, background and gallery upload, downscaled on-device to 1400px before storage
- Eight colour presets plus four custom colour pickers, with automatic text-contrast
  correction against your chosen background
- Four heading fonts, entrance animation options and per-section toggles
- Draft auto-saved to `localStorage`, restored on your next visit
- Finishing produces **a shareable link that carries the whole invitation
  inside its own URL** — no server, no stored file
  (see [Shareable invitation links](#shareable-invitation-links))

### Invitation rendering
- **Distinct designs per event type** — birthday cards are rounded and dashed,
  baby showers use an arch, corporate invites are left-aligned and structured,
  festivals get a radial glow. A birthday never looks like a wedding.
- Ornamental SVG headers drawn per motif (floral, rings, cloud, lotus, laurel, …)
- Live countdown, photo gallery, Google Maps directions, RSVP, call and share actions

### Sharing
- Copy link, WhatsApp, Facebook, Telegram, Email, SMS and the native Web Share API
- **A complete QR encoder written from scratch** (`js/share.js`) — byte mode,
  error-correction level M, versions 1–10, all eight masks scored by the ISO penalty
  rules. No CDN, no library, works offline. Renders to SVG or downloadable PNG.

### Craft
- Light and dark themes, persisted, following the OS preference until you choose
- Responsive from **320px** to ultrawide, with a hamburger drawer below 1100px
- Full keyboard navigation, focus trapping in modals, ARIA states throughout
- `prefers-reduced-motion` respected everywhere, plus a forced-colors mode
- A print stylesheet so guests can put the invitation on paper
- SEO: per-page titles, descriptions, keywords, Open Graph, Twitter cards, canonical
  URLs, JSON-LD (`WebSite` and `FAQPage`), `robots.txt` and `sitemap.xml`

---

## Technologies

| Layer | Choice | Why |
| --- | --- | --- |
| Markup | HTML5, semantic | Works without JS wherever possible |
| Styling | CSS3 custom properties, Grid, Flexbox | One token set drives both themes |
| Scripting | Vanilla ES5+ (no transpiler) | Runs as-is in every modern browser |
| Icons | Inline SVG generated in JS | No icon font, recolours with `currentColor` |
| Imagery | Hand-generated SVG | Sharp at any size, tiny, no image pipeline |
| Fonts | Google Fonts (self-hostable) | See [`fonts/README.md`](fonts/README.md) |

**Zero runtime dependencies.** No npm, no bundler, no CSS framework, no jQuery.

---

## Folder structure

```
InviteHub/
├── index.html              Landing page
├── templates.html          Searchable gallery of all 47 templates
├── categories.html         The 18 occasion categories
├── create.html             Six-step invitation editor
├── i.html                  Guest-facing page: renders an invitation from its link
├── pricing.html            All seven duration plans
├── preview.html            Full-page template preview
├── about.html              What InviteHub is and why
├── faq.html                16 questions, searchable
├── privacy.html            Privacy Policy
├── terms.html              Terms & Conditions
│
├── css/
│   ├── style.css           Tokens, base, components, page sections
│   ├── animations.css      Keyframes, scroll reveal, reduced-motion
│   └── responsive.css      Breakpoints, print, forced-colors
│
├── js/
│   ├── main.js             Theme, nav, icons, toasts, modals, validation
│   ├── templates.js        Catalogue data + gallery controller
│   ├── preview.js          Invitation renderer + preview page/modal
│   ├── create.js           Five-step editor
│   ├── countdown.js        Shared countdown ticker
│   ├── export.js           Builds a downloadable standalone page
│   ├── link.js             Packs an invitation into a URL fragment / reads it back
│   └── share.js            Share targets + QR encoder
│
├── invitations/               Hosted pages at their own URL + index.json registry
│
├── images/
│   ├── logo/               Mark, wordmarks, favicon
│   ├── hero/               Phone mockup, floating cards, OG image
│   ├── templates/          47 template artworks
│   ├── categories/         18 category banners
│   └── backgrounds/        Decorative patterns and aurora wash
│
├── icons/                  Notes on the inline icon system
├── fonts/                  Empty by default; self-hosting instructions
│
├── robots.txt
├── sitemap.xml
└── README.md
```

**Load order matters** for the scripts: `main.js` defines the shared namespace, so it
must come first. Every page loads them with `defer`, which preserves order and keeps
them off the critical rendering path.

---

## How to run locally

Pure static files — no build step, nothing to install.

### Option 1 — just open it

Double-click `index.html`. Almost everything works.

> Two caveats under `file://`: the clipboard API is unavailable (the code falls
> back to a hidden textarea automatically), and some browsers restrict `fetch`.
> For a faithful test, use a local server.

### Option 2 — any static server

```bash
python -m http.server 8000     # Python 3
npx serve .                    # Node
php -S localhost:8000          # PHP
```

Or VS Code's **Live Server** extension. Then visit <http://localhost:8000>.

**Edit a file, refresh the browser, done.**

---

## Shareable invitation links

The site is designed for **GitHub Pages**, which is static hosting: it serves
files and never runs code. So a finished invitation is not written as a file
anywhere — it becomes **a link that carries its own contents**:

`
https://USERNAME.github.io/InviteHub/i.html#eyJlIjoid2VkZGluZyIsImIiOiJTYW5k...
`

Everything the card needs is packed into the fragment after the #.
[i.html](i.html) unpacks it and renders the invitation. The fragment is never
sent to a server, so there is nothing to store and nothing to expire — the link
works the moment the site is deployed.

| Piece | Job |
| --- | --- |
| js/link.js | Packs a draft into a fragment and reads one back out |
| i.html | The guest-facing page that renders from the fragment |

### What does not travel in a link

Uploaded photos. They are held in the browser as data URLs, and embedding one
would make the URL far too long to send. A link therefore carries the text,
dates, venue, template and colours. For an invitation with photos, use
**Download .html** in the last step — that single file has the photos inside it
and can be sent as an attachment, or committed to
[invitations/](invitations/) to publish it at its own URL.

## Architecture notes

Everything lives on one global, `window.IH`:

| Namespace | Responsibility |
| --- | --- |
| `IH.dom` | `qs`, `qsa`, `on`, `el`, `escapeHtml`, `debounce`, `throttle`, `slugify` |
| `IH.store` | `localStorage` wrapper with an in-memory fallback for private mode |
| `IH.icon` | Returns an inline SVG string for a named icon |
| `IH.theme` | Light/dark switching and persistence |
| `IH.toast` | Notifications (`success`, `info`, `warning`, `error`) |
| `IH.modal` | Open/close with focus trapping and scroll lock |
| `IH.validate` | Field and scope validation with inline error rendering |
| `IH.data` | **The backend seam** — promise-based catalogue access |
| `IH.favorites` | Favourite templates |
| `IH.invitation` | Renders an invitation from a data object |
| `IH.countdown` | One shared ticker driving every countdown on the page |
| `IH.share` | Share targets, clipboard, native share |
| `IH.qr` | QR encoder (`encode`, `toSvg`, `toCanvas`) |
| `IH.exportPage` | Builds a downloadable standalone page |
| `IH.link` | Packs an invitation into a URL fragment and reads it back |

Two deliberate decisions worth knowing about:

- **One interval for all countdowns.** Ten invitations on a page still cost a single
  `setInterval`, and it pauses when the tab is hidden.
- **Escaping at the boundary.** Every value interpolated into markup goes through
  `escapeHtml`, so user-typed names cannot inject HTML into the preview.

---

## Upgrading to a full backend

The intended path is **GitHub → Vercel → Supabase → Razorpay**, and the front end was
written to make it a swap rather than a rewrite.

### The one seam that matters

`IH.data` in `js/templates.js` is already promise-based:

```js
IH.data = {
  fetchTemplates: function () { return Promise.resolve(TEMPLATES.slice()); },
  fetchTemplate:  function (slug) { /* … */ }
};
```

Replacing the local array with a live query touches this object and nothing else —
the gallery, filters, preview and editor all consume promises already:

```js
IH.data.fetchTemplates = function () {
  return supabase.from('templates').select('*').then(function (r) { return r.data; });
};
```

Likewise `IH.store` is the only thing that touches `localStorage`. Point it at a
`user_drafts` table and every draft becomes an account-bound record.

### Suggested schema

```sql
create table profiles (
  id uuid primary key references auth.users,
  full_name text,
  created_at timestamptz default now()
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  slug text unique not null,          -- the /i/<slug> public URL
  event_type text not null,
  template_slug text not null,
  content jsonb not null,             -- the editor's state object, as-is
  plan_days int not null,
  published_at timestamptz,
  expires_at timestamptz,             -- drives automatic expiry
  created_at timestamptz default now()
);

create table rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  guest_name text not null,
  attending boolean,
  guests_count int default 1,
  message text,
  created_at timestamptz default now()
);
```

Because the editor already serialises its whole state to one object, `content jsonb`
can store it verbatim — no field-by-field mapping required.

### The remaining work

| Feature | Where it goes |
| --- | --- |
| Accounts | Supabase Auth; add a login page and a session check |
| Unique URLs | A Vercel dynamic route `/i/[slug]` rendering `IH.invitation.render()` |
| Image storage | Supabase Storage; replace the `FileReader` result with an upload URL |
| Automatic expiry | A scheduled function deleting rows and objects past `expires_at` |
| Payments | Razorpay Checkout plus a webhook that sets `published_at` and `expires_at` |
| RSVP | Insert into `rsvps`; the button already exists in the rendered card |
| Admin dashboard | A new page listing the current user's `invitations` rows |

**Nothing in `css/`, and nothing in the rendering code, needs to change.**

---

## Browser support

Tested against Chrome, Edge, Firefox and Safari (desktop and iOS), plus Samsung
Internet. Requires a browser with CSS custom properties and `IntersectionObserver` —
roughly 2019 onward.

Graceful degradation is built in: without JavaScript the pages still render, read and
navigate correctly, and the gallery and editor show a clear `<noscript>` explanation.
`color-mix()` is used for subtle tints only, and older browsers simply render the
untinted colour.

---

## Licence

Code is provided for you to use and adapt for your own project. The template artwork
and the InviteHub name are part of this project — if you ship something publicly,
please use your own brand name and generate your own card designs.

---

**Built with plain HTML, CSS and JavaScript. No frameworks were harmed.**
