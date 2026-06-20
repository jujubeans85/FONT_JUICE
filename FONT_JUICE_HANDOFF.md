# Font Juice handoff

## Purpose

Font Juice composes PNG lettering from Adam's real captured handwriting. It should preserve uneven widths, angles, baselines, spacing and multiple genuine variants. It is a raster composer, not yet an OpenType font or a trained handwriting model.

## What the screenshots proved

Safari showed real letters because `sw.js` was hot-patching the old `index.html` at runtime.

A newly added Home Screen copy still showed rectangles because the repository's actual `index.html` had never been changed. The repo timestamp confirmed that. Treating the worker patch as a finished root repair was wrong.

## Current working build

Use `working.html`.

It is a direct page, not a service-worker illusion:

- `working.html` provides the interface
- `working.js` fetches the embedded provisional glyph data from `index.html`
- `working.js` performs the mask conversion itself
- transparent PNGs keep their alpha
- opaque dark-background captures convert luminance to alpha
- opaque light-background captures convert inverse luminance to alpha
- empty and near-solid masks fail clearly
- after successful rendering, legacy Font Juice workers and caches are removed

The footer must show `Build 2026-06-21-direct-1` before this build is added to the Home Screen.

## Later handwriting replacement

The current captures are provisional. New batches should be preserved separately and converted into versioned datasets such as:

- `adam-hand-v1`
- `adam-hand-v2`
- `adam-hand-v3`

Do not overwrite earlier batches. The later clean architecture should separate:

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
- further service-worker feature work
- silently drawing rectangles when a glyph fails
- calling the root repair complete before `index.html` is genuinely replaced

## Acceptance test

Real handwriting must render from `working.html` in Safari and after adding that exact page to the Home Screen. A-Z, 0-9 and punctuation must work; seeds must repeat; all three modes must differ; PNG export must work; and failures must be visible rather than hidden.

## Later Codex review

After the direct build is visually confirmed, make it the single root application:

1. move the provisional glyph data into a versioned replaceable dataset
2. make the direct renderer the real `index.html`
3. remove the temporary fetch-back to the old `index.html`
4. remove `sw.js`
5. test Safari and a fresh Home Screen install

Do not change the handwriting, add a framework, add a backend or reintroduce offline support during that cleanup.
