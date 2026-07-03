# MIMI 21 route fix

Date: 2026-07-04

## Problem

NFC tags opened the public root page and landed on the default Font Juice composer state: default text, seed 21, no Mimi fish route card.

Root relying on service-worker injection was too fragile on iOS Safari because the first uncontrolled navigation can load the old root before the worker controls the page.

## Fix

- Preserved the old embedded glyph-data page as `legacy-index.html`.
- Replaced root `index.html` with a tiny deterministic router that preserves query string and forwards to `working.html`.
- Updated `working.js` so handwriting data loads from `legacy-index.html`, not root `index.html`.
- Updated `working.html` so the route helper runs after the composer has started.
- Simplified `sw.js` to only redirect root navigations to `working.html`, preserving query/hash.
- Updated `data/nfc-tags-21-v2.csv` so future tag writes point directly at `working.html?fish=<id>&set=21_v2`.

## Expected behaviour

Existing NFC URLs like:

```text
https://jujubeans85.github.io/FONT_JUICE/?fish=love-fish&set=21_v2
```

should forward to:

```text
https://jujubeans85.github.io/FONT_JUICE/working.html?fish=love-fish&set=21_v2
```

and load the matching fish card/text/seed.

## Test links

```text
https://jujubeans85.github.io/FONT_JUICE/?fish=the-original&set=21_v2
https://jujubeans85.github.io/FONT_JUICE/?fish=love-fish&set=21_v2
https://jujubeans85.github.io/FONT_JUICE/?fish=proud-win-fish&set=21_v2
https://jujubeans85.github.io/FONT_JUICE/working.html?fish=love-fish&set=21_v2
https://jujubeans85.github.io/FONT_JUICE/birthday-countdown/
```

## Notes

If iOS Safari still shows the old root once, close the tab and reopen the tag once GitHub Pages has deployed the latest commit. The root file itself is now a router, so this should no longer depend on service-worker timing.
