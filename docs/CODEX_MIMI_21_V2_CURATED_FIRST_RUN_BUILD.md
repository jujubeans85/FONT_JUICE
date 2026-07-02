# CODEX BUILD BRIEF — MIMI 21 V2 CURATED / FIRST-RUN PARENTHESIS STANDARD

## Correction

This file supersedes:

```text
docs/CODEX_MIMI_21_V2_CURATED_BRACE_BUILD.md
```

The earlier brace-standard note was backwards for this first run.

For the **first handwritten / typed / scrawled / stencil test**, use the easier parenthesis form:

```text
><)))0>
<0(((><
```

Do not treat this as a permanent language decision. Keep the original brace-based 104 archive for future reference.

---

## Mission

Refactor the previous 104-code Mimi fish system into a smaller birthday-ready V2.

The full 104-code set stays archived. The birthday build uses only the strongest 20–30 fish codes, with a recommended starting set of about 30.

Goals:

1. Keep the full 104-code source as archive/reference.
2. Create a curated `21_v2` set.
3. For active first-run V2 codes, convert fish-body braces to parentheses for ease of writing.
4. Use `><)))0>` for forward fish.
5. Use `<0(((><` for reverse / other-person fish.
6. Update the V2 PDF from the curated set.
7. Update the V2 CSV/NFC list from the curated set.
8. Create a dead-simple Mac-friendly birthday countdown app.
9. Create 2 × 3 inch stencil/die-cut glyph sheets for the curated fish.

The physical gift is the priority. Do not build a giant app first.

---

## First-run glyph standard

Use this for active 21_v2 outputs:

```text
OLD ARCHIVE: ><}}}0>
FIRST RUN:  ><)))0>

OLD ARCHIVE: <0{{{><
FIRST RUN:  <0(((><
```

Rules:

- Preserve old forms as `legacy_code`.
- Active `code` uses parenthesis-body fish for this V2 run.
- Do not delete or rewrite the full archive.
- Future builds may revisit `{` and `}` after real use.
- Do not mix brace-body and parenthesis-body versions inside the V2 PDF.
- Do not silently change meanings.

Reason:

```text
) and ( are faster to handwrite, easier to type, easier to scrawl, and easier for the first family-use version.
```

This is a practical first-run choice, not a permanent treaty.

---

## Source of truth

Keep the full archive as:

```text
data/fish-codes.full.json
```

Generate the curated birthday data as:

```text
data/fish-codes.21_v2.json
```

Create:

```text
scripts/build-21-v2-data.mjs
scripts/validate-21-v2-data.mjs
```

The build script must:

1. load the full 104-code JSON
2. select the curated V2 IDs
3. preserve original forms as `legacy_code`
4. create active first-run `code` by converting:
   - `}` to `)`
   - `{` to `(`
5. write `data/fish-codes.21_v2.json`
6. write `data/nfc-tags-21-v2.csv`
7. write `data/stencil-glyphs-21-v2.csv`
8. validate that the V2 code count is between 20 and 30

Do not mutate the archive file.

---

## Recommended 21_v2 shortlist

Use this as the first curated set. It is intentionally about 30 fish, not 104.

### Core / identity

```text
01 THE ORIGINAL              ><)))0>
02 QUIET FISH                ><)))•>
03 THE TWENTY-ONE            ><)))21>
04 BIRTHDAY-ONLY FISH        *><)))21>*
```

### Everyday conversation

```text
05 CONFIRMED                 ><)))✓>
06 QUESTION FISH             ><)))?>
07 PROCESSING FISH           ><)))…>
08 SIDE-EYE FISH             ><)))¬>
09 MORE FISH                 ><)))+>
```

### Cooked / funny / useful

```text
10 REDUCED-CAPACITY FISH     ><)))%>
11 INTERNET FISH             ><)))@>
12 DEAD / FULLY-DONE FISH    ><)))×>
13 WOBBLE FISH               ><)))0>~
14 WHAT-IS-HAPPENING FISH    ><)))0>???
15 EVERYTHING FISH           ><)))0>!!!
16 REBOOT FISH               ><)))0>↺
```

### Love / care / home

```text
17 LOVE FISH                 ><)))♡>
18 THINKING-OF-YOU FISH      ><)))0>⋯♡
19 PROUD / WIN FISH          ><)))0>✦
20 GOT-YOU FISH              ><)))0>☂
21 HOME FISH                 ><)))0>⌂
22 HUG / WHISPER FISH        (><)))0>)
23 NO-WORDS FISH             ><)))0>—♡
24 NOT-GOING-ANYWHERE FISH   ><)))0>∞
```

### Music / creative

```text
25 GOOD-TRACK FISH           ><)))0>♪
26 RE-ROOM FISH              ><)))0>≈
27 GROOVE FISH               ><)))0>∿
28 STRANGE-GOOD FISH         ><)))0>※
```

### Birthday / special

```text
29 TWENTY-ONE ACTIVATED      ><)))21>!
30 MIMI CODE                 ><)))0>/21
```

Optional cuts if layout is too busy:

```text
INTERNET FISH
WOBBLE FISH
REBOOT FISH
MORE FISH
STRANGE-GOOD FISH
MIMI CODE
```

Do not cut unless necessary:

```text
THE ORIGINAL
THE TWENTY-ONE
BIRTHDAY-ONLY FISH
LOVE FISH
PROUD / WIN FISH
GOOD-TRACK FISH
NO-WORDS FISH
NOT-GOING-ANYWHERE FISH
```

---

## Data schema

Each V2 record should include both source and first-run forms:

```json
{
  "id": "the-original",
  "legacy_code": "><}}}0>",
  "code": "><)))0>",
  "name": "THE ORIGINAL",
  "category": "CORE / IDENTITY",
  "meaning": "I'm here. It's me. Message received.",
  "use": "Use when one fish can do the work of a paragraph.",
  "birthday_v2": true,
  "stencil": {
    "include": true,
    "label": "01",
    "width_in": 3,
    "height_in": 2
  },
  "nfc": {
    "slot": "M21-01",
    "url": "https://jujubeans85.github.io/FONT_JUICE/?fish=the-original&set=21_v2",
    "write_status": "pilot"
  }
}
```

Validation must fail if:

- V2 count is under 20 or over 30
- any active forward fish still contains `}}}`
- any active reverse fish still contains `{{{`
- any `legacy_code` is missing
- any active code is duplicated
- any ID is duplicated
- any NFC route lacks `set=21_v2`
- any stencil label is duplicated
- any record lacks name, meaning or use

Expected pass report:

```text
PASS: 21_v2 curated count = <n>
PASS: active first-run parenthesis fish applied
PASS: all legacy codes preserved
PASS: NFC routes stable
PASS: stencil labels unique
```

---

## V2 PDF

Create:

```text
dist/MIMI_21_CODEBOOK_21_V2_A5.pdf
dist/MIMI_21_CODEBOOK_21_V2_PRINT.html
dist/MIMI_21_CODEBOOK_21_V2_PREVIEW.png
```

Lean structure:

```text
1. Cover
2. For Mimi
3. How this works
4. Fish grammar, simplified
5. The 21_v2 core list
6. Conversation fish
7. Cooked / funny fish
8. Love / care fish
9. Music / creative fish
10. Birthday / 21 fish
11. Make your own fish
12. Blank family-code page
13. Blank family-code page
14. Back page
```

PDF rules:

- A5 portrait
- exact fish code remains readable
- active V2 uses parenthesis-body codes
- enough white space for Adam to write over it
- keep “First Edition / One of One”
- include the emergency safety rule once
- no full 104-code overload

---

## CSV / NFC

Create:

```text
data/nfc-tags-21-v2.csv
```

Columns:

```csv
slot,id,legacy_code,code,name,category,url,write_status,physical_label,notes
```

Pilot candidates:

```text
M21-01 THE ORIGINAL
M21-17 LOVE FISH
M21-25 GOOD-TRACK FISH
```

Do not mass encode stickers. Do not mark all as ready.

---

## Birthday countdown app

Create:

```text
birthday-countdown/index.html
birthday-countdown/app.js
birthday-countdown/styles.css
```

Dead-simple Mac/Safari-friendly countdown to 21 July.

No settings, no account, no backend, no analytics, no service worker.

Rotate short fragments only:

```text
MIMI 21
><)))21>
*><)))21>*
ONE STRANGE FISH
TWO PEOPLE USING IT
FIRST EDITION
ONE OF ONE
```

After birthday:

```text
MIMI 21 IS LIVE
FIRST EDITION / ONE OF ONE
```

---

## Stencil / die-cut sheet

Create:

```text
dist/MIMI_21_V2_STENCIL_GLYPHS_2x3IN.pdf
dist/MIMI_21_V2_STENCIL_GLYPHS_2x3IN.png
dist/MIMI_21_V2_STENCIL_GLYPHS_2x3IN.svg
```

Each glyph cell is 3 inches wide × 2 inches high. For 24–30 glyphs, use A3 or multiple A4 sheets. Do not cram true 3×2 inch glyphs onto one A4 page.

Label output honestly:

```text
VINYL_SOLID
STENCIL_BRIDGED
```

If bridges are not added, do not call it paint-stencil-ready.

---

## Fish picker / routes

Default picker set:

```text
21_v2
```

Optional later toggle:

```text
21_v2
Archive 104
```

Routes:

```text
?fish=<id>&set=21_v2
```

Unknown route gives a useful error. Do not overload picker with all 104 by default.

---

## Non-goals

Do not:

- keep 104 active in the birthday PDF
- make a giant app before the gift exists
- add accounts, backend, analytics or a framework
- generate fake handwriting
- mass encode NFC stickers
- silently change meanings
- silently drop Unicode symbols
- pretend this parenthesis standard is permanent

---

## Codex execution order

```text
1. Read README.md and FONT_JUICE_HANDOFF.md
2. Confirm current working renderer route
3. Preserve full 104 archive as fish-codes.full.json
4. Build curated 21_v2 JSON with 20–30 selected fish
5. Apply first-run parenthesis standard: } to ) and { to (
6. Generate V2 CSV
7. Generate V2 A5 PDF/HTML
8. Generate birthday countdown app
9. Generate stencil/die-cut sheets
10. Add 21_v2 Fish Picker/routing if time allows
11. Run validation
12. Write BUILD_REPORT_MIMI_21_V2.md
13. Stop
```

Patch, ship, keep the present alive.
