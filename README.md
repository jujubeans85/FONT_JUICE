# juice fonts

A mobile-first handwriting composer made from Adam's real captured glyphs. Type a message, render it locally, and export a PNG.

## Open

The canonical app is the repository root (`index.html`), including existing `?mask=7` links. `working.html` redirects to it while preserving the query and hash. Explicit birthday/NFC queries (`fish`, `id`, `slot`, `tag`, `nfc`) still open `mimi21/`. Other existing sub-apps are unchanged.

The footer identifies `Build 2026-09-12-voice-transparent`. New users start with the orange chisel capture and Slightly untucked preset. Existing text and settings are retained; the Handwriting selector can switch between capture sets.

## Speech and transparent export

**Speak to add text** appends finalized dictation to the message and renders automatically. Stop listening ends the session; typing or Clear cancels it and ignores late results. Browser SpeechRecognition (including the WebKit prefix) is optional. Unsupported browsers show keyboard-microphone guidance. Recognition may use the browser provider's online speech service and microphone permission; handwriting rendering and PNG export remain local. Native microphone behavior still needs a device check.

**Clear background** exports a PNG with actual alpha transparency, shown over a checkerboard in the app. Turn it off to use the Background colour. The choice is saved with existing settings. The app is named **juice fonts**; existing repository URLs and saved messages are preserved.

## Orange chisel capture (10 September 2026)

The completed Capture 03 sheets supply 266 real glyphs across 67 characters. The fourth `9` and fourth backslash cells were empty; those characters use their three real samples. No synthetic replacements or duplicated samples are counted as additional variants.

- `data/adam-hand-capture03.b28f4d48280e.js`: transparent glyph masks and per-sample baseline metrics.
- `data/capture-03-extraction.json`: source hashes, cell mapping, pixel crops, and explicit blank-cell record.
- `scripts/extract-capture-03.py`: deterministic orange-channel extraction from the supplied screenshots (Pillow, NumPy and SciPy).

The source pages and handwritten signatures remain in the user's original private uploads. The published bundle contains only the 266 character crops. The natural-writing page informs the intended style but is not published or converted into inferred glyphs.

The new capture uses measured letter heights and punctuation baselines rather than making every crop the same height. Its native stroke weight is retained in all modes. The original set remains unchanged and selectable. Screenshot resolution limits enlargement quality; a marked-up original PDF would be a better future source for larger print work.

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

The regression suite checks both the 268 original masks and 266 new masks, dataset switching, retained blank cells, and measured punctuation. It runs the actual JavaScript renderer with a native canvas (no browser needed). It covers all 268 real variants, transparent black/white ink, opaque light/dark scans, deterministic seeds, three styles, colours, multiline and word wrapping, PNG encoding/decoding, stale-export prevention, oversized input, asset references and composer/NFC routing.

With `@napi-rs/canvas` installed in the test environment:

```sh
node tests/composer.cjs
```

The PDF is rendered and visually checked after generation. Native Safari sharing and installed Home Screen behavior still require a device check; native-canvas checks do not certify those OS interactions.
