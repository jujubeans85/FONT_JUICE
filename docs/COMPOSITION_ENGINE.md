# J-Fonts composition foundation

Six replaceable device-local background slots are available in the composer. Pick a slot and Add / replace image, or use Previous / Next to cycle occupied slots. Plain colour and transparent exports remain available. Fill crops centrally; Fit preserves the whole image. The softening slider overlays the chosen background colour for legibility.

## Shared boundary

`composition.js` exposes `JuiceComposition.drawBackground(context, {image, color, transparent, fit, wash})`. It takes a decoded image and any destination canvas dimensions. It has no handwriting or UI dependency. Render order is background → existing handwriting → existing PNG export. Future postcards, gifts and object art can call the same layer with their own dimensions and foreground renderer. This change does not claim those other apps have been integrated.

`backgrounds.js` owns the six-slot picker and IndexedDB Blob persistence, independently of text/settings. Original image blobs remain unmodified. Selection, fit and wash use a separate localStorage key. Uploads never go to a server. Storage failure is surfaced; a failed replacement retains the previous image. When IndexedDB is unavailable, images are session-only. Browser data clearing removes saved slots; retain source images separately. No cross-device sync is implied.

The existing text/glyph rendering stays in `working.js`. This is a reusable background composition seam, not a rewrite of the complete typography engine. Fixed print dimensions, bleed, movable text boxes and editable project packages remain future extensions.

## Validation

`npm test` runs glyph, speech, routing, export and shared-layer checks.
`npm run test:backgrounds` requires Playwright plus Chromium and a static server on port 8765 (override with FONT_JUICE_TEST_URL). Checks six uploads, both cycle directions, reload persistence, transparency, PNG export, failed replacement, removal persistence and narrow viewport layout. Physical Safari/iPhone/iPad acceptance remains separate.

Rollback baseline: c9dc860e5fb57aa4182ed8ddf7e07ef69400f846.
