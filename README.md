# FONT_JUICE

A mobile-first handwriting compositor built from Adam's real glyph captures.

## Architecture

- `index.html` — accessible, responsive front end
- `assets/app.js` — rendering, variation, export and persistence engine
- `assets/glyph-data.js` — four captured variants per supported character
- `sw.js` + `manifest.webmanifest` — installable offline PWA
- `.github/workflows/pages.yml` — GitHub Pages deployment

There is deliberately **no application server**. Rendering happens entirely in the browser, so the handwriting and typed text do not leave the device. GitHub Pages provides hosting; the service worker provides offline use after the first successful load.

## Deploy

1. Put these files at the repository root.
2. Commit to `main`.
3. In **Settings → Pages**, choose **GitHub Actions** as the source if it is not already selected.
4. The site will be available at `https://jujubeans85.github.io/FONT_JUICE/` after the Pages workflow succeeds.

## iPhone / iPad

Open the hosted URL in Safari. Use **Save / Share PNG** for the share sheet. If iOS declines the file download, use **Show PNG for long-press**, then save the image from the preview. Use Safari Share → **Add to Home Screen** to install it.

## Local development

A local web server is required because iOS and desktop browsers place restrictions on JavaScript opened directly from Files or `file://` URLs.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.
