# Redesign 100

Redesigned copies of 100 wedding invitations. The original project files are not touched.

- `output/png/NNN-<slug>.png`: 100 cards rendered at 3x (1260 px wide)
- `output/redesigned-invitations-100.pdf`: 100 pages, one card per page
- `output/contact-sheet-100.png`: all 100 cards with labels
- `output/manifest.json`: all 150 invitations with status, original and new asset paths, hashes and validation checks
- `output/failure-report.json`: render failures, regenerated assets and visual-review notes
- `output/before/<slug>.png`: each card's original render, for comparison
- `cards/<slug>/`: each card's working copy (`design.json`/`design.js`, `venue.jpg`, `crest.png`, `corner-tl.png`/`corner-tr.png`, `footer.jpg`, and `images/wedding-motifs/<slug>.svg`)

**How a card renders.** `render.html?slug=<slug>&rd=1` loads the project's own unmodified `../js/preview.js`, `../js/wedding-designs.js` and `../css/style.css`. `redesign-hook.js` adds the image mappings (`venueImage`, `assetPrefix`, corner and footer layers) to the original sample data. `redesign.css` positions the layers, scoped to `.rd-card`. Without `&rd=1` the page renders the original card.

**How to rebuild.** Run these from the project root, in order:

1. `node redesign-100/work/gen.js` generates artwork with local FLUX.2 Klein 4B through ComfyUI. Pass `--redo=slug:kind` to regenerate one asset.
2. `node redesign-100/work/build.js`
3. `node redesign-100/work/render.js`
4. `python redesign-100/work/compile.py`
5. `node redesign-100/work/finalize.js`

## Live integration: optional "Redesigned Collection"

The 100 cards are available on the site as a separate collection. The original catalogue is unchanged.

**Ids and names.** Each card has the id `rd-<original-slug>` and the name `<Original Name> (Redesigned)`. The cards are not added to `IH.data.templates`, so original gallery listings, counts, search and the default selection are untouched. They are resolved through `IH.data.getTemplate`.

**Where the cards appear:**
- **Gallery:** an open section with all 100 cards below the main grid on `templates.html`, with a "New: Redesigned Collection" jump link above the grid. `templates.html?collection=redesign-100` scrolls straight to it.
- **Categories:** a "Redesigned Collection (100)" card on `categories.html` that links to the collection.
- **Editor:** each redesigned card sits right after its original in the wedding template grid (Design step and step 1), and the "N designs made for wedding" count includes them. `create.html?template=rd-<slug>` opens a card directly.
- **Rendering:** the existing renderer and hosted page are used. `js/redesign-collection.js` swaps the new artwork into their output: crest, default venue photo, corner florals and footer landscape. A venue photo the host uploads always wins over the default.

**Files.**
- Runtime: `js/redesign-collection.js` and `js/redesign-collection-data.js` (generated).
- Assets: `images/redesign-100/<slug>/`.
- Rebuild with `python scripts/build-redesign-collection.py`.
- Existing files touched: `templates.html`, `categories.html`, `create.html`, `preview.html`, `host.html` and `i.html`. Each gained the same two `<script>` lines and nothing else.

**Rollback.** Either option leaves the original gallery unaffected:
- Set `var ENABLED = false;` in `js/redesign-collection.js`. The collection disappears from the gallery and editor, and saved `rd-*` drafts and links fall back to their original design.
- Remove the two script lines from the six pages, plus the new files.

**Tests.** With the site served at :8099:
- `node redesign-100/integration/test-integration.js` runs the live-site tests. Results go to `integration/results.json` and screenshots to `integration/shots/`.
- `node redesign-100/integration/sample-content-audit.js` writes `integration/sample-content-report.json`.
