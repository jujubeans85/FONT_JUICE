# FONT_JUICE

A mobile-first handwriting compositor built from Adam's real captured glyphs.

## Working build

Use `working.html`.

It loads the provisional glyph data from the original self-contained `index.html`, performs the mask conversion directly in `working.js`, renders the handwriting, then removes legacy Font Juice service workers and caches.

This avoids the split behaviour where Safari showed corrected glyphs through a service-worker patch while a newly added Home Screen copy opened the unchanged rectangle-rendering `index.html`.

## Files in use

- `working.html` — current direct working interface
- `working.js` — renderer, glyph-mask correction, controls and PNG export
- `working.css` — interface styling
- `index.html` — provisional embedded glyph dataset source; not the preferred launch page
- `FONT_JUICE_HANDOFF.md` — repair history and later cleanup brief

There is no backend. Rendering stays in the browser, so typed text is not sent to an application server.

## Deploy

GitHub Pages publishes the repository root from `main`.

## iPhone and iPad

Open `working.html` in Safari. Confirm the footer shows `Build 2026-06-21-direct-1`, then use Share → Add to Home Screen.

For PNG output, use **Save / Share PNG** first. If iOS refuses the native save action, use **Show PNG for long-press** and save the preview image.

## Next cleanup

After the working build is visually confirmed, use Codex to make the same direct renderer the root `index.html`, move the glyph data into a versioned replaceable dataset, and remove the temporary source indirection. Do not reintroduce a service worker during that cleanup.
