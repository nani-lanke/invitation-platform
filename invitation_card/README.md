# invitation_card/

Finished invitation pages that are published as their own URL. Nothing writes
here automatically — you commit what you want to publish.

## The two ways to share an invitation

**As a link.** The default. Every detail is packed into the part of the URL
after the `#`, and `i.html` unpacks it:

```
https://USERNAME.github.io/REPO/i.html#eyJlIjoid2VkZGluZyIsImIiOi...
```

Nothing is stored, so the link works the moment your site is deployed — but it
is long, unreadable, and social apps cannot show a preview of it, because the
fragment never reaches their scrapers. See [`js/link.js`](../js/link.js).

**As a page.** A folder committed here, which gives a short address anyone can
read aloud, and a real HTTP 200 that WhatsApp and Facebook will preview:

```
https://USERNAME.github.io/REPO/invitation_card/Nani-Lovely/2026-08-10/
```

The cost is a `git push` per invitation. See [`js/publish.js`](../js/publish.js).

## Publishing a page

In the editor's last step, under **Or give it a short address of its own**,
press **Download page folder (.zip)**. Unpack it at the root of the repository
— the archive already carries the full path, so nothing needs moving:

```
invitation_card/
├── Groom_Bride_2026-08-10_1830.html
├── main_image/
│   └── Groom_Bride_2026-08-10_1830_image.jpg
├── background_image/
│   └── Groom_Bride_2026-08-10_1830_background.jpg
├── sample_images/
│   ├── Groom_Bride_2026-08-10_1830_image1.jpg
│   └── Groom_Bride_2026-08-10_1830_image2.jpg
└── background_music/
    └── Groom_Bride_2026-08-10_1830_music.mp3
```

Then commit and push. GitHub Pages serves it within a minute.

### Why a .zip and not the folder itself

A browser is not allowed to create folders in your downloads — it can only save
single files. The .zip is how the folder structure survives the trip, and it is
built by hand in `js/publish.js`, so the site still needs nothing installed.

## How the folder name is chosen

`<Groom>-<Bride>/<YYYY-MM-DD>`, falling back to the person's name, the host's
name, then the title. Accents, apostrophes and anything else a URL would have
to escape are removed, so `José O'Brien` becomes `Jose-OBrien`. An invitation
saved before its date is filled in lands under `undated/`.

Two invitations for the same names on the same date resolve to the same folder
and the second will overwrite the first. Rename one before committing if that
is not what you want.

## Older, flat pages

`Name.html` sitting directly in this folder still works and is still served at
`…/invitation_card/Name.html` — [`Mohan_and_Sandhya.html`](Mohan_and_Sandhya.html)
is one, hand-written, and a fine thing to copy and edit. The editor's
**Download .html** button produces this flat shape, with photos embedded, for
when you want one file to send as an attachment rather than a page to publish.

Both shapes link back to `../css/` and `../js/` at the right depth, so keep each
page where it was written to live.

## Running the site locally

Any static server works — there is no build step and nothing to install:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. The address shown in the editor follows
whatever host you are on, so locally it will read `http://localhost:8000/…`.
