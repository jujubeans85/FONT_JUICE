# CODEX BUILD BRIEF — MIMI 21 V2 CURATED / BRACE-STANDARD

## Mission

Refactor the previous 104-code Mimi fish system into a smaller birthday-ready V2.

The full 104-code set stays archived. The 21st birthday build uses only the strongest 20–30 fish codes, with a recommended starting set of 30. The goal is traction: codes Mimi and family might actually use.

This supersedes the earlier all-104 build brief. Do not keep forcing all 104 into the birthday PDF.

## Current build context

Repository:

```text
jujubeans85/FONT_JUICE
```

Current working renderer route:

```text
working.html
working.js
working.css
```

Keep the current direct working renderer stable before adding this build. Do not reintroduce the old service-worker illusion.

---

## Hard design call: keep braces, avoid parentheses

Earlier exploration considered changing fish bodies from `}` to `)` for easier scrawl. That decision is now reversed.

V2 standard:

```text
USE:   { and }
AVOID: ( and )
KEEP:  } in the fish body
```

Examples:

```text
GOOD: ><}}}0>
GOOD: *><}}}21>*
GOOD: {><}}}0>}

BAD:  ><)))0>
BAD:  (><}}}0>)
```

Rules:

- Do not convert `}}}` into `)))`.
- Do not output active V2 codes containing `(` or `)`.
- If an archived fish uses parentheses, convert wrapper parentheses to braces only if it remains unique and clear.
- If conversion creates a duplicate meaning, remove that fish from 21_v2.
- Preserve old/archived forms as `legacy_code`.

Specific recommendation:

```text
CUT from V2: (><}}}0>) HUG / WHISPER FISH
REPLACE with: ><}}}0>♡✓ OKAY-AND-LOVED FISH
```

Reason: converting `(><}}}0>)` to `{><}}}0>}` collides with the protected/braced fish idea. Avoid the duplicate.

---

## Source of truth

Keep the full archive as:

```text
data/fish-codes.full.json
```

Generate the curated set as:

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
2. select the curated 21_v2 IDs
3. preserve each old form as `legacy_code`
4. apply brace-standard validation
5. write `data/fish-codes.21_v2.json`
6. write `data/nfc-tags-21-v2.csv`
7. write `data/stencil-glyphs-21-v2.csv`
8. fail if V2 count is under 20 or over 30

Validator must fail if:

- V2 count is under 20 or over 30
- any active code contains `(` or `)`
- any active code contains the body pattern `)))`
- any `legacy_code` is missing
- any active code or ID is duplicated
- any NFC route lacks `set=21_v2`
- any stencil label is duplicated
- any record lacks name, meaning or use

Expected pass report:

```text
PASS: 21_v2 curated count = <n>
PASS: no active parentheses
PASS: no parenthesis-body fish
PASS: all legacy codes preserved
PASS: NFC routes stable
PASS: stencil labels unique
```

---

## Recommended 21_v2 shortlist

Use this as the first curated set. It is intentionally about 30 fish, not 104.

### Core / identity

```text
01 THE ORIGINAL              ><}}}0>
02 QUIET FISH                ><}}}•>
03 THE TWENTY-ONE            ><}}}21>
04 BIRTHDAY-ONLY FISH        *><}}}21>*
```

### Everyday conversation

```text
05 CONFIRMED                 ><}}}✓>
06 QUESTION FISH             ><}}}?>
07 PROCESSING FISH           ><}}}…>
08 SIDE-EYE FISH             ><}}}¬>
09 MORE FISH                 ><}}}+>
```

### Cooked / funny / useful

```text
10 REDUCED-CAPACITY FISH     ><}}}%>
11 INTERNET FISH             ><}}}@>
12 DEAD / FULLY-DONE FISH    ><}}}×>
13 WOBBLE FISH               ><}}}0>~
14 WHAT-IS-HAPPENING FISH    ><}}}0>???
15 EVERYTHING FISH           ><}}}0>!!!
16 REBOOT FISH               ><}}}0>↺
```

### Love / care / home

```text
17 LOVE FISH                 ><}}}♡>
18 THINKING-OF-YOU FISH      ><}}}0>⋯♡
19 PROUD / WIN FISH          ><}}}0>✦
20 GOT-YOU FISH              ><}}}0>☂
21 HOME FISH                 ><}}}0>⌂
22 OKAY-AND-LOVED FISH       ><}}}0>♡✓
23 NO-WORDS FISH             ><}}}0>—♡
24 NOT-GOING-ANYWHERE FISH   ><}}}0>∞
```

### Music / creative

```text
25 GOOD-TRACK FISH           ><}}}0>♪
26 RE-ROOM FISH              ><}}}0>≈
27 GROOVE FISH               ><}}}0>∿
28 STRANGE-GOOD FISH         ><}}}0>※
```

### Birthday / special

```text
29 TWENTY-ONE ACTIVATED      ><}}}21>!
30 MIMI CODE                 ><}}}0>/21
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

## Required outputs

### Data / CSV

```text
data/fish-codes.full.json
data/fish-codes.21_v2.json
data/nfc-tags-21-v2.csv
data/stencil-glyphs-21-v2.csv
```

CSV columns:

```csv
slot,id,legacy_code,code,name,category,url,write_status,physical_label,notes
```

Use `write_status=do-not-write-yet` unless part of pilot.

Pilot candidates:

```text
M21-01 THE ORIGINAL
M21-17 LOVE FISH
M21-25 GOOD-TRACK FISH
```

### PDF

```text
dist/MIMI_21_CODEBOOK_21_V2_A5.pdf
dist/MIMI_21_CODEBOOK_21_V2_PRINT.html
dist/MIMI_21_CODEBOOK_21_V2_PREVIEW.png
```

Lean book structure:

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

Print rules:

- A5 portrait
- exact fish code remains readable
- active codes keep braces
- no active parentheses
- enough white space for Adam to write over it
- keep “First Edition / One of One”
- include the emergency safety rule once
- do not include all 104

### Countdown app

```text
birthday-countdown/index.html
birthday-countdown/app.js
birthday-countdown/styles.css
```

Dead-simple Mac/Safari-friendly countdown to 21 July. No settings, no account, no backend, no analytics, no service worker.

Rotate only short fragments:

```text
MIMI 21
><}}}21>
*><}}}21>*
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

### Stencil / die-cut sheet

```text
dist/MIMI_21_V2_STENCIL_GLYPHS_2x3IN.pdf
dist/MIMI_21_V2_STENCIL_GLYPHS_2x3IN.png
dist/MIMI_21_V2_STENCIL_GLYPHS_2x3IN.svg
```

Each glyph cell is 3 inches wide × 2 inches high. For 24–30 glyphs, use A3 or multiple A4 sheets. Do not cram true 3×2 inch glyphs onto one A4 page.

Label honestly:

```text
VINYL_SOLID
STENCIL_BRIDGED
```

If bridges are not added, do not call it paint-stencil-ready.

---

## Fish picker / routing

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
- use active parentheses in V2 codes
- call stencil output “stencil ready” if islands will fall out

---

## Codex execution order

```text
1. Read README.md and FONT_JUICE_HANDOFF.md
2. Confirm current working renderer route
3. Preserve full 104 archive as fish-codes.full.json
4. Build curated 21_v2 JSON with 20–30 selected fish
5. Enforce brace standard and remove active parentheses
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
