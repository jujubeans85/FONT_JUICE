# CODEX BUILD BRIEF — MIMI 21 CODEBOOK V2 + FISH PICKER + NFC ROUTING

## Mission

Turn the existing **Font Juice handwriting compositor** and the **104-code canonical Mimi fish dictionary** into one reusable system with a single source of truth.

The required build order is:

1. stabilise the current direct Font Juice renderer
2. install the canonical fish data
3. generate **Mimi Codebook V2** as an A5 print-ready gift
4. add a searchable **Fish Picker** to Font Juice
5. support stable per-fish URLs for the NFC stickers
6. leave editing and “living codebook” features for a later phase

The immediate priority is the finished physical gift. Do not let the app become a shiny distraction.

---

## Repository

```text
jujubeans85/FONT_JUICE
```

### Current verified working state

The current preferred launch page is:

```text
working.html
```

Related working files:

```text
working.html
working.js
working.css
```

The footer of the confirmed direct build should show:

```text
Build 2026-06-21-direct-1
```

Current `index.html` remains a provisional embedded glyph-data source. The direct renderer currently fetches that data, performs the glyph-mask conversion itself and clears legacy service workers/caches.

### Hard rule before modifying architecture

First prove that `working.html` renders real handwriting in:

- Safari
- a fresh Home Screen installation
- all three modes
- PNG export

Do not replace the current working route until those tests pass.

---

# Core architecture rule

## One source of truth

The canonical fish dictionary must live in:

```text
data/fish-codes.json
```

Everything else must read from it:

- A5 codebook
- Fish Picker
- per-fish NFC pages
- search
- category lists
- sticker manifest
- future editing/export tools

Do not duplicate meanings inside HTML, JavaScript, Markdown or PDF templates.

That becomes SPLIT-BRAIN CLOWN GARBAGE immediately.

---

# Input package

Copy these files from the Phase 1 foundation pack into the repository:

```text
data/fish-codes.json
data/nfc-tags-001-100.csv
data/hero-reserved-4.csv
docs/NFC_PILOT_WRITE_PLAN.md
```

Source package name:

```text
FONT_JUICE_PHASE1_FOUNDATION.zip
```

## Canonical data facts

```text
104 total canonical fish codes
100 general fish mapped to NFC sticker slots 001–100
4 Mimi 21st hero codes reserved outside the general sticker roll
```

Reserved hero codes:

```text
><}}}21>
><}}}21>!
*><}}}21>*
><}}}0>/21
```

These belong on physical hero objects such as:

- inside front cover
- birthday card or envelope
- cover object or magnet
- evolving blank-code card

Do not silently remap them into the 100-tag general roll.

---

# Canonical JSON contract

The existing JSON schema is the contract. Preserve every field unless a migration is deliberate and documented.

Example:

```json
{
  "id": "the-original",
  "code": "><}}}0>",
  "name": "THE ORIGINAL",
  "category_id": "core-fish",
  "category": "CORE FISH",
  "aliases": ["THE ORIGINAL"],
  "primary_meaning": "I'm here. It's me. Message received.",
  "primary_use": "Use when one fish can do the work of a paragraph.",
  "interpretations": [
    {
      "name": "THE ORIGINAL",
      "meaning": "I'm here. It's me. Message received.",
      "use": "Use when one fish can do the work of a paragraph.",
      "source_page": 5
    }
  ],
  "status": "canonical",
  "font_juice_input": "><}}}0>",
  "nfc": {
    "designation": "primary-roll",
    "sticker_slot": 1,
    "url": "https://jujubeans85.github.io/FONT_JUICE/?fish=the-original",
    "write_status": "do-not-write-yet"
  }
}
```

## Validation requirements

Create:

```text
scripts/validate-fish-data.mjs
```

The validator must fail clearly when:

- total code count is not 104
- canonical `id` values are duplicated
- exact `code` strings are duplicated
- a code has no name, category, meaning or use
- a primary-roll sticker slot is missing or duplicated
- general sticker slots are not exactly 1–100
- hero-reserved count is not exactly 4
- NFC URL does not end in `?fish=<id>`
- status is not `canonical`
- Unicode has been silently normalised into a different symbol

Print a concise pass report:

```text
PASS: 104 canonical codes
PASS: 100 primary NFC slots
PASS: 4 hero-reserved codes
PASS: no duplicate ids or code strings
```

---

# Phase 0 — Freeze the confirmed handwriting machine

Before the new features:

1. create a restore point branch or tag for the confirmed direct build
2. do not change glyph appearance
3. do not change layout randomness
4. do not change the three existing modes
5. do not introduce a framework
6. do not introduce a backend
7. do not reintroduce a service worker

Keep:

- Chisel readable
- Neat
- Loose
- deterministic seed
- multiple real variants per character
- ink/background controls
- multiline layout
- PNG share
- iOS long-press fallback
- local-only rendering

---

# Phase 1 — Clean root application architecture

Only after `working.html` is visually confirmed:

## Target structure

```text
/
├── index.html
├── 404.html
├── README.md
├── app/
│   ├── composer.js
│   ├── fish-picker.js
│   ├── fish-route.js
│   └── styles.css
├── data/
│   ├── fish-codes.json
│   ├── nfc-tags-001-100.csv
│   ├── hero-reserved-4.csv
│   └── glyphs/
│       └── adam-hand-v1/
│           ├── manifest.json
│           └── glyph-data.js
├── codebook/
│   ├── index.html
│   ├── print.css
│   └── codebook.js
├── scripts/
│   ├── validate-fish-data.mjs
│   └── build-codebook.mjs
└── docs/
    ├── FONT_JUICE_HANDOFF.md
    ├── CODEX_MIMI_V2_BUILD.md
    └── NFC_PILOT_WRITE_PLAN.md
```

This is a target, not permission to rewrite everything at once.

## Migration sequence

1. move the direct renderer from `working.html` to the real root `index.html`
2. move provisional glyph data out of the legacy `index.html`
3. preserve it as versioned dataset `adam-hand-v1`
4. make the composer consume a dataset manifest
5. remove the fetch-back to the old embedded source
6. confirm rendering is unchanged
7. delete temporary `working.*` files only after parity is proven
8. keep older raw batches outside the active runtime bundle

## Dataset principle

The renderer must not care which handwriting batch is active.

Future datasets should be switchable without rewriting the composer:

```text
adam-hand-v1
adam-hand-v2
adam-hand-v3
```

Preferred runtime glyph format:

```text
transparent PNG
handwriting stroke represented by alpha
```

Fail visibly when a glyph is missing. Never draw a rectangle and pretend that is success.

---

# Phase 2 — Mimi Codebook V2

## Required result

Generate an A5 portrait, print-ready codebook based entirely on `fish-codes.json`.

Primary outputs:

```text
dist/MIMI_21_CODEBOOK_V2_A5.pdf
dist/MIMI_21_CODEBOOK_V2_PRINT.html
dist/MIMI_21_CODEBOOK_V2_PREVIEW.png
```

## Design intent

The result should feel:

- handmade
- clear
- personal
- witty
- one-of-one
- imperfect on purpose
- legible enough to actually use

It must not look like:

- a corporate manual
- a generic handwriting font sample
- a stock emoji dictionary
- an over-designed Etsy template

## Typography split

### Exact code strings

Fish code strings must remain exact and mechanically reliable.

Render them using a robust Unicode-capable text face or exact SVG/text layer:

```text
><}}}0>
><}}}0>♪
*><}}}21>*
```

Do not pass unsupported Unicode symbols through a handwriting renderer and hope.

### Human text

Use Font Juice for selected:

- section headings
- fish names
- meaning lines
- notes
- Dad annotations
- hero phrases

Do not rasterise every tiny paragraph into unreadable chaos. Hybridity over purity.

Recommended hierarchy:

```text
CODE          exact Unicode text
NAME          Font Juice / strong handwriting
MEANING       readable typeset text or controlled neat handwriting
USE           smaller readable text
DAD NOTE      loose handwriting, sparingly
```

## Page content

Preserve the original book’s core structure:

1. cover
2. dedication
3. how to use
4. fish grammar
5. core fish
6. conversation moves
7. dry / witty
8. cooked / malfunctioning
9. love
10. care / home
11. secret / private
12. music / creative
13. celebration
14. exits
15. two-fish compounds
16. number channel
17. build a new species
18. our codes volume one
19. our codes volume two
20. back page statement

The data may drive page groupings, but the visual order should remain emotionally coherent rather than alphabetic.

## Print requirements

- A5 portrait
- duplex-safe inner margin
- no clipped fish codes
- no code split across lines
- page numbers
- print-safe black/white base
- optional restrained gold accent
- enough white space for Adam to write over the print
- preserve four blank/live-code pages or equivalent writing room
- no dependency on internet during print
- test with browser print and generated PDF

## Codebook build method

Prefer a deterministic build script:

```text
node scripts/build-codebook.mjs
```

The script should:

1. load and validate `data/fish-codes.json`
2. group by category
3. render the print HTML
4. create a stable build manifest
5. optionally call a local Chromium/Playwright PDF export when available
6. otherwise leave a print-perfect HTML fallback

Do not block the project on a heavyweight PDF stack.

## Codebook acceptance tests

- all 104 canonical codes appear exactly once in the master index
- named repeated interpretations are shown intentionally, not accidentally duplicated
- no code string mutates during render
- the four 21st hero codes are visually prominent
- every page survives A5 print preview
- text remains readable at actual size
- blank pages remain genuinely writable
- the PDF opens offline
- the output is suitable to hand to a printer

---

# Phase 3 — Fish Picker inside Font Juice

## User job

A person should be able to find a fish without reading a 20-page PDF.

## UI

Add a collapsible or tabbed Fish Picker beside the composer.

Required controls:

- search by fish name
- search by meaning
- search by use
- filter by category
- favourites
- recent fish
- clear filters

Each result card shows:

```text
exact code
name
short meaning
category
```

Actions:

```text
Insert into composer
Copy exact code
Open fish page
Favourite
```

## Behaviour

- inserting a fish adds its `font_juice_input` at the cursor position
- copying copies the exact canonical `code`
- picker state does not overwrite composer text
- search works offline from local JSON
- category filters are generated from data, not hard-coded
- unsupported glyphs fall back to exact text rather than disappearing

## Fish Picker acceptance tests

- all 104 fish searchable
- searching “music” returns relevant music fish
- searching “no words” returns every applicable interpretation
- inserting preserves cursor position
- exact code copied is byte-for-byte equal to JSON
- favourites and recent fish survive reload via local storage
- no account or backend required

---

# Phase 4 — Stable fish routes for NFC

## Required route format

```text
https://jujubeans85.github.io/FONT_JUICE/?fish=<id>
```

Example:

```text
https://jujubeans85.github.io/FONT_JUICE/?fish=the-original
```

## Route behaviour

When `fish` is present:

1. load `fish-codes.json`
2. find the exact `id`
3. open a focused fish card
4. show:
   - exact code
   - name
   - meaning
   - use
   - category
5. provide:
   - insert into composer
   - copy code
   - return to picker
6. keep the URL stable

Unknown IDs must show a useful error and link back to the picker.

Do not redirect an unknown ID to a random fish.

## NFC pilot rule

Do not mark the full 100-tag CSV as ready until the three-tag pilot passes.

Pilot categories:

```text
THE ORIGINAL
LOVE FISH
GOOD-TRACK FISH
```

Test:

- locked phone
- unlocked phone
- Safari open
- Safari closed
- intended physical material
- Adam device
- Mimi’s likely device type

Ordinary NFC stickers may fail directly on metal. Use anti-metal tags or a ferrite barrier on:

- fridge
- tin
- magnetic frame
- metal-backed art

## NFC data status workflow

Allowed values:

```text
do-not-write-yet
pilot
tested
ready
written
failed
retired
```

Do not automatically change all 100 records from `do-not-write-yet`.

---

# Phase 5 — Gift object finishing layer

Only after the PDF and stable URLs work:

- NFC inside the front cover
- hero code on card/envelope
- one tag linking to a private Dad message
- one tag linking to a playlist or musical memory
- optional physical fish sticker sheet
- handwritten overwriting by Adam
- “First Edition / One of One” language retained

The technology should disappear into the present.

The NFC tag is not the present. The relationship is the present.

---

# Non-goals for this build

Do not add:

- user accounts
- cloud database
- analytics
- authentication
- social sharing system
- React/Vue/Svelte
- remote API
- AI-generated replacement handwriting
- automatic mutation of fish meanings
- full in-browser PDF editor
- collaborative sync
- service worker/offline architecture
- NFC-writing code inside the browser

The site only provides stable URLs and manifests. A normal NFC-writing app writes the stickers.

---

# Safety and privacy

Keep this exact safety rule visible where relevant:

> For genuine emergencies, use plain words and call. Never make safety depend on somebody decoding punctuation.

Privacy rule:

- typed composer text remains on device
- no application server
- no third-party analytics
- no logging of fish selections
- local storage only for preferences, favourites and recent fish

---

# Testing checklist

## Data

- [ ] validator passes 104 / 100 / 4
- [ ] duplicate IDs rejected
- [ ] duplicate exact code strings rejected
- [ ] all NFC URLs match record IDs
- [ ] Unicode round-trip test passes

## Composer regression

- [ ] A–Z render
- [ ] 0–9 render
- [ ] punctuation renders
- [ ] fish code text does not create rectangles
- [ ] seeds repeat deterministically
- [ ] Chisel / Neat / Loose differ
- [ ] colour controls work
- [ ] multiline wrapping works
- [ ] PNG share works
- [ ] long-press fallback works

## Codebook

- [ ] A5 print preview clean
- [ ] no clipped codes
- [ ] no orphan headings
- [ ] page order correct
- [ ] 104-code index complete
- [ ] blank writing space preserved
- [ ] hero codes prominent
- [ ] PDF works offline

## Picker and NFC

- [ ] 104 results available
- [ ] search and filters work
- [ ] insertion at cursor works
- [ ] copy exact code works
- [ ] `?fish=the-original` opens correct card
- [ ] unknown ID has explicit error
- [ ] three-tag pilot recorded before mass rollout

## Devices

- [ ] desktop Safari/Chrome
- [ ] iPhone Safari
- [ ] iPad Safari
- [ ] fresh Home Screen installation
- [ ] no old service worker controlling the page

---

# Deliverables

Codex should finish with:

```text
data/fish-codes.json
data/nfc-tags-001-100.csv
data/hero-reserved-4.csv
scripts/validate-fish-data.mjs
scripts/build-codebook.mjs
dist/MIMI_21_CODEBOOK_V2_A5.pdf
dist/MIMI_21_CODEBOOK_V2_PRINT.html
app/fish-picker.js
app/fish-route.js
docs/NFC_PILOT_WRITE_PLAN.md
README.md
```

And a short build report:

```text
docs/BUILD_REPORT_MIMI_V2.md
```

The report must state:

- files changed
- commands run
- tests passed
- known failures
- Safari/iOS checks still requiring Adam
- whether the old `working.*` files are still required
- whether the 100-tag rollout remains blocked by pilot testing

---

# Codex execution order

Use this exact order:

```text
1. Read README.md and FONT_JUICE_HANDOFF.md
2. Run the current working build without changing it
3. Add and validate fish-codes.json
4. Build the A5 codebook output
5. Add the Fish Picker
6. Add stable ?fish=<id> routing
7. Run regression tests
8. Prepare NFC pilot files
9. Write BUILD_REPORT_MIMI_V2.md
10. Stop
```

Do not mass-encode NFC stickers.

Do not invent new fish meanings.

Do not “improve” Adam’s handwriting.

Do not rebuild the working renderer and the codebook simultaneously.

Patch, test, ship, explain after.

---

# Definition of done

This build is done when:

1. the current real handwriting still renders correctly
2. `fish-codes.json` is the only canonical dictionary source
3. an A5 Mimi Codebook V2 can be printed
4. all 104 fish can be searched and inserted
5. every fish has a stable NFC-safe URL
6. the three-tag pilot can begin
7. no backend, framework or service-worker detour has been introduced
8. the physical present remains the centre of the project
