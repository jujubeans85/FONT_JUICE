# FONT_JUICE

A mobile-first handwriting compositor built from Adam's real captured glyphs.

## Current architecture

- `index.html` — the complete app: interface, glyph data, renderer and PNG export
- `sw.js` — active runtime mask correction for the captured white-on-black glyph images
- `404.html` — redirects mistyped GitHub Pages paths back to the app
- `README.md` — this project note

There is deliberately no backend. Rendering stays in the browser, so typed text and handwriting data are not sent to an application server.

## Deploy

GitHub Pages publishes the repository root from `main`.

## iPhone and iPad

Open the hosted page in Safari. Use **Save / Share PNG** first. If iOS refuses the native save action, use **Show PNG for long-press** and save the preview image.

## Rule

Keep `index.html` lowercase. Do not add a second `Index.html`, orphan files, duplicate glyph data, or an unrelated service worker. The current `sw.js` is intentional and fixes the opaque glyph-background bug until that conversion is folded directly into `index.html`.
