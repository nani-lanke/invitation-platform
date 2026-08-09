# icons/

InviteHub does **not** use an icon font or an external icon library. Every icon is an
inline `<svg>` generated at runtime, which means:

- zero extra network requests,
- icons inherit `currentColor`, so they recolour correctly in dark mode,
- no flash of missing glyphs before a font loads.

## Where the icons actually live

The full set is defined as a path map in [`../js/main.js`](../js/main.js), in the
`ICON_PATHS` object (search for `var ICON_PATHS`). Paths are drawn on a 24×24 grid
with `fill="none"`, `stroke="currentColor"`, `stroke-width="1.8"` and round caps —
the same conventions as Lucide, so Lucide paths can be pasted in directly.

## Using an icon in HTML

Write a placeholder element and `main.js` swaps it for a real SVG on load:

```html
<i data-icon="heart" data-icon-size="18"></i>
```

## Using an icon from JavaScript

`IH.icon(name, size, extraClass)` returns an SVG string:

```js
button.innerHTML = IH.icon('share', 18) + '<span>Share</span>';
```

Unknown names fall back to the `sparkles` icon rather than rendering nothing.

## Adding a new icon

1. Open `js/main.js` and find `ICON_PATHS`.
2. Add an entry whose value is the **inner** markup of a 24×24 SVG (no `<svg>` wrapper):

   ```js
   'calendar-heart': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
   ```

3. Use it anywhere as `data-icon="calendar-heart"` or `IH.icon('calendar-heart')`.

## Other icon-like assets

Decorative ornaments used *inside* invitation cards (floral rosettes, rings, lotus,
laurel and so on) are a separate set, defined as `ORNAMENTS` in
[`../js/preview.js`](../js/preview.js). They are drawn on an 80×80 grid because they
carry much more detail than a UI icon.

Brand marks and favicons live in [`../images/logo/`](../images/logo/).
