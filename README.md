# FONT_JUICE

A mobile-first handwriting composer made from Adam's real captured glyphs. Type a message, render it locally, and export a PNG.

## Open

The canonical app is the repository root (`index.html`), including existing `?mask=7` links. `working.html` redirects to it while preserving the query and hash. Explicit birthday/NFC queries (`fish`, `id`, `slot`, `tag`, `nfc`) still open `mimi21/`. Other existing sub-apps are unchanged.

The footer identifies `Build 2026-09-10-composer-1`. New users start in Neat mode; existing saved settings and text are retained.

## Single source of truth

- `index.html`: composer interface and explicit birthday-route forwarding.
- `working.js`: mask conversion, layout, controls and PNG export.
- `working.css`: shared composer styling.
- `data/adam-hand-v1.b9cc17b0a0b3.js`: unchanged original 268 captured PNG variants, separated from legacy HTML and named by content hash.
- `templates/FONT_JUICE_Handwriting_Template.pdf`: printable/annotatable A4 capture sheet (67 characters x 4 variants, plus an optional natural-writing page).
- `templates/capture-03-manifest.json`: exact cell identities, glyph mapping and crop coordinates for future extraction. Coordinates are millimetres from the page's top-left.
- `scripts/create-handwriting-template.py`: reproducible PDF generator; requires ReportLab and DejaVu Sans/Mono fonts.

Keep new completed handwriting sheets as a new raw batch. Extract and validate a separate versioned glyph bundle; do not overwrite the original capture set. The template does not automatically upload or import handwriting. No backend or external font service is used. This is a raster composer, not an installable TTF/OTF font.

`legacy-index.html` and earlier handoff documents are historical references, not runtime dependencies. The canonical app does not register a service worker. `sw.js` is a retirement worker for previously installed copies, and the composer also unregisters old Font Juice workers and removes only their named caches.

## Deploy

GitHub Pages publishes the repository root from `main`. `.nojekyll` is required: this is plain HTML/JS, and Liquid parsing previously failed on literal fish-code examples in documentation, preventing updates from publishing.

## iPhone / iPad

Open the root URL in Safari. Type into **Type your text**. Use **Save / Share PNG**, or **Show PNG** and long-press the image. Use **Handwriting template** to print or mark up the capture sheet. Add the root page to the Home Screen through Safari's Share menu. Network access is needed to open/load the app; text rendering and export stay on the device.

## Verification

The regression suite runs the actual JavaScript renderer with a native canvas (no browser needed). It covers all 268 real variants, transparent black/white ink, opaque light/dark scans, deterministic seeds, three styles, colours, multiline and word wrapping, PNG encoding/decoding, stale-export prevention, oversized input, asset references and composer/NFC routing.

With `@napi-rs/canvas` installed in the test environment:

```sh
node tests/composer.cjs
```

The PDF is rendered and visually checked after generation. Native Safari sharing and installed Home Screen behavior still require a device check; native-canvas checks do not certify those OS interactions.
