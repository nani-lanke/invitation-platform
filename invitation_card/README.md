# invitation_card/

Somewhere to keep finished invitation pages you want to publish as their own
URL. Nothing writes here automatically.

## Why nothing writes here automatically

This site is built for **GitHub Pages**, which is static hosting: it serves
files, it never runs code. There is no process on the server that could
receive a finished invitation and save it, and a browser is not allowed to
write into a folder on your computer. So automatic file creation is not
possible in production, and the editor no longer attempts it.

## What happens instead

A finished invitation becomes **a link, not a file**. Every detail is packed
into the part of the URL after the `#`:

```
https://USERNAME.github.io/InviteHub/i.html#eyJlIjoid2VkZGluZyIsImIiOi...
```

`i.html` reads that fragment and renders the card. The fragment is never sent
to a server, so nothing has to be stored — the link works the moment your site
is deployed. See [`js/link.js`](../js/link.js).

## If you do want a real page at its own URL

Two manual routes, both fine on GitHub Pages:

1. **Download and commit.** In the editor's last step press **Download .html**,
   drop the file in this folder, and push. It is then live at
   `https://USERNAME.github.io/InviteHub/invitation_card/Their_Names.html`.
   Photos are embedded in that file, so it needs nothing else.

2. **Hand-write one.** Copy [`Mohan_and_Sandhya.html`](Mohan_and_Sandhya.html)
   and edit it. It links back to `../css/` and `../js/`, so keep it in this
   folder.

Images referenced by a committed page can live in
[`image_cards/`](image_cards/) beside it.

## Running the site locally

Any static server works — there is no build step and nothing to install:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.
