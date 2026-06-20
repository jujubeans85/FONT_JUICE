# FONT_JUICE

A mobile-first handwriting compositor built from Adam's real captured glyphs.

## Current architecture

- `index.html` — the complete app: interface, glyph data, renderer and PNG export
- `404.html` — redirects mistyped GitHub Pages paths back to the app
- `README.md` — this project note

There is deliberately no backend and no external asset dependency. Rendering stays in the browser, so typed text and handwriting data are not sent to an application server.

## Deploy

GitHub Pages should publish the repository root from `main`.

## iPhone and iPad

Open the hosted page in Safari. Use **Save / Share PNG** first. If iOS refuses the native save action, use **Show PNG for long-press** and save the preview image.

## Rule

Keep `index.html` lowercase. Do not add a second `Index.html`, stale service worker, orphan manifest, or split asset files unless the architecture is intentionally migrated as one complete change.
