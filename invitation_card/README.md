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
https://USERNAME.github.io/REPO/invitation_card/Rahul_Priya_15-08-2026_1830.html
```

The cost is a `git push` per invitation. See [`js/publish.js`](../js/publish.js).

## Publishing a page

In the editor's last step, under **Or give it a short address of its own**,
press **Download page folder (.zip)**. Unpack it at the root of the repository
— the archive already carries the full path, so nothing needs moving:

```
invitation_card/
├── Rahul_Priya_15-08-2026_1830.html
├── main_image/
│   └── Rahul_Priya_15-08-2026_1830_image.jpg
├── background_image/
│   └── Rahul_Priya_15-08-2026_1830_background.jpg
├── sample_images/
│   ├── Rahul_Priya_15-08-2026_1830_image1.jpg
│   └── Rahul_Priya_15-08-2026_1830_image2.jpg
└── background_music/
    └── Rahul_Priya_15-08-2026_1830_music.mp3
```

Then commit and push. GitHub Pages serves it within a minute.

### Why a .zip and not the folder itself

A browser is not allowed to create folders in your downloads — it can only save
single files. The .zip is how the folder structure survives the trip, and it is
built by hand in `js/publish.js`, so the site still needs nothing installed.

## How the filename is chosen

Every invitation has one canonical filename, generated in one place
(`buildInvitationFilename` in [`js/export.js`](../js/export.js)) and used by
Download .html, the .zip and the server commit alike:

    <who>_<DD-MM-YYYY>_<HHMM>.html

The `<who>` component follows the occasion — the couple for a wedding or
engagement, the birthday person for a birthday, the parents for a naming
ceremony, the company for a corporate event, the school for a school event,
and so on; a festival or a generic event falls back to its title. The date is
always day-first (`15-08-2026`), and the time is 24-hour (`1830` for 6:30 PM).
All-day invitations leave the time off, so a Diwali card ends at the date:
`Diwali_Celebration_15-08-2026.html`.

Spaces and unsafe characters (`/ \ : * ? " < > |`, `&`, stray punctuation) are
removed and `José O'Brien` becomes `Jose_OBrien`. Two invitations for the same
names on the same date and time resolve to the same filename, so re-publishing
an edited invitation updates the same page; the second of two *different*
invitations that collide will overwrite the first, so rename one before
committing if that is not what you want.

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
