# Font Juice handoff

## Purpose

Font Juice composes PNG lettering from Adam's real captured handwriting. It should preserve uneven widths, angles, baselines, spacing and multiple genuine variants. It is a raster composer, not yet an OpenType font or a trained handwriting model.

## Current repair

The stored glyph PNGs are opaque grayscale images. The original renderer used their full alpha channel, so the complete rectangular image area was coloured instead of only the pen stroke.

Build V07 fixes that at load time:

- transparent PNGs keep their original alpha
- opaque dark-background captures convert luminance to alpha
- opaque light-background captures convert inverse luminance to alpha
- empty masks fail clearly
- near-solid rectangular masks fail clearly

The patch is applied by `sw.js` to the existing self-contained `index.html`. The worker removes old Font Juice caches, activates immediately and reloads open pages with `?mask=7`.

## Later handwriting replacement

The current captures are provisional. New batches should be preserved separately and converted into versioned datasets such as:

- `adam-hand-v1`
- `adam-hand-v2`
- `adam-hand-v3`

Do not overwrite earlier batches. A later clean architecture should separate:

- renderer and controls
- active dataset manifest
- versioned glyph bundles
- raw source batches
- validation tools

Preferred runtime glyph format: transparent PNG background with the handwriting stroke represented by alpha.

Switching to a later valid dataset should not require rewriting the composer.

## Keep

- Chisel readable, Neat and Loose modes
- deterministic seed
- multiple variants per character
- colour and background controls
- multiline layout
- PNG share and iOS long-press fallback
- local-only rendering

## Avoid

- standard replacement fonts
- regenerated fake handwriting
- frameworks or backends
- service-worker feature work until rendering is stable
- duplicate final/fixed/version files
- silently drawing rectangles when a glyph fails

## Acceptance test

Real handwriting must render in Safari and the Home Screen version; A-Z, 0-9 and punctuation must work; seeds must repeat; all three modes must differ; PNG export must work; and failures must be visible rather than hidden.

## Later Codex review

Review the repository after V07 is visually confirmed. Verify the mask polarity detection, transparent-alpha handling, solid-box guard, PNG export and Home Screen update path. Then separate the provisional glyph data from renderer code without changing the product or regenerating the handwriting.
