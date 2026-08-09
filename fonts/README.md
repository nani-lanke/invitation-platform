# fonts/

This folder is empty by default. InviteHub loads its typefaces from Google Fonts:

| Family | Used for | Weights |
| --- | --- | --- |
| **DM Sans** | All body text, UI, buttons | 400, 500, 700 |
| **Playfair Display** | Headings and invitation names | 600, 700 |
| **Great Vibes** | Script accents (hero, ampersands) | 400 |
| **Cormorant Garamond** | Optional invitation heading font | 600, 700 |

The stylesheet link is loaded non-render-blocking (`media="print"` swapped to `all`
on load) with a `<noscript>` fallback, so a slow font server never delays first paint.

## Why you might want to self-host instead

Requesting a font from `fonts.gstatic.com` sends the visitor's IP address to Google.
If you would rather avoid that — for GDPR reasons, or simply to make the site work
fully offline — put the font files here and swap the CSS.

## How to self-host

1. Download the families from <https://fonts.google.com> (or use
   <https://gwfh.mranftl.com> to get a ready-made `woff2` bundle).
2. Copy the `.woff2` files into this folder, e.g.:

   ```
   fonts/dm-sans-400.woff2
   fonts/dm-sans-500.woff2
   fonts/dm-sans-700.woff2
   fonts/playfair-display-600.woff2
   fonts/playfair-display-700.woff2
   fonts/great-vibes-400.woff2
   ```

3. Delete the two Google Fonts `<link>` tags from the `<head>` of **every** HTML page.
4. Add this block at the very top of `css/style.css`, above `:root`:

   ```css
   @font-face {
     font-family: "DM Sans";
     src: url("../fonts/dm-sans-400.woff2") format("woff2");
     font-weight: 400;
     font-display: swap;
   }
   @font-face {
     font-family: "DM Sans";
     src: url("../fonts/dm-sans-700.woff2") format("woff2");
     font-weight: 700;
     font-display: swap;
   }
   @font-face {
     font-family: "Playfair Display";
     src: url("../fonts/playfair-display-700.woff2") format("woff2");
     font-weight: 700;
     font-display: swap;
   }
   @font-face {
     font-family: "Great Vibes";
     src: url("../fonts/great-vibes-400.woff2") format("woff2");
     font-weight: 400;
     font-display: swap;
   }
   ```

   Note the `../fonts/` prefix — paths in a stylesheet resolve relative to the
   stylesheet, not the page.

5. Optionally preload the two fonts used above the fold, in each page's `<head>`:

   ```html
   <link rel="preload" href="fonts/dm-sans-400.woff2" as="font" type="font/woff2" crossorigin>
   <link rel="preload" href="fonts/playfair-display-700.woff2" as="font" type="font/woff2" crossorigin>
   ```

Nothing else needs to change: `--font-sans`, `--font-display` and `--font-script` in
`css/style.css` already reference the families by name, and every one of them has a
system fallback, so the site stays readable even if a font fails to load entirely.

## Licensing

DM Sans, Playfair Display, Great Vibes and Cormorant Garamond are all released under
the SIL Open Font License, which permits self-hosting and commercial use. Keep the
`OFL.txt` file that ships with each download alongside the font files here.
