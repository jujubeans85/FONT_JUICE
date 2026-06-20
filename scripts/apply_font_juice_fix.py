from __future__ import annotations

import json
import re
import sys
from pathlib import Path

BUILD_ID = "2026-06-21.1"
DATASET_ID = "adam-hand-v1"


def fail(message: str) -> None:
    raise RuntimeError(message)


root = Path(__file__).resolve().parents[1]
index_path = root / "index.html"
if not index_path.exists():
    index_path = root / "Index.html"
if not index_path.exists():
    fail("Could not find index.html or Index.html")

text = index_path.read_text(encoding="utf-8")
marker = f"FONT JUICE BUILD {BUILD_ID}"
if marker in text:
    print(f"{marker} already applied")
    sys.exit(0)

# Extract the provisional embedded glyph bundle without changing its contents.
block_pattern = re.compile(
    r"<script>\s*/\*\s*Generated from Adam Hand V2 glyph captures\..*?\*/\s*"
    r"globalThis\.FONT_JUICE_GLYPHS=(\{.*?\});\s*</script>\s*",
    re.DOTALL,
)
match = block_pattern.search(text)
if not match:
    fail("Could not locate the embedded FONT_JUICE_GLYPHS block")

glyph_json = match.group(1)
glyphs = json.loads(glyph_json)
if not isinstance(glyphs, dict) or len(glyphs) < 36:
    fail("Embedded glyph bundle is missing or unexpectedly small")

# Move the current captures behind a replaceable, versioned dataset boundary.
dataset_dir = root / "datasets" / DATASET_ID
dataset_dir.mkdir(parents=True, exist_ok=True)
compact_glyphs = json.dumps(glyphs, ensure_ascii=False, separators=(",", ":"))
(dataset_dir / "glyphs.js").write_text(
    "/* Provisional Adam Hand dataset. Replace with a later validated version; do not edit app logic. */\n"
    "globalThis.FONT_JUICE_DATASET=Object.freeze({\n"
    f"  id:{json.dumps(DATASET_ID)},\n"
    "  version:1,\n"
    "  format:'opaque-or-alpha-mask-v1',\n"
    f"  glyphs:{compact_glyphs}\n"
    "});\n"
    "globalThis.FONT_JUICE_GLYPHS=globalThis.FONT_JUICE_DATASET.glyphs;\n",
    encoding="utf-8",
)

active_manifest = {
    "id": DATASET_ID,
    "bundle": f"./datasets/{DATASET_ID}/glyphs.js?v={BUILD_ID}",
    "format": "opaque-or-alpha-mask-v1",
}
(root / "datasets").mkdir(exist_ok=True)
(root / "datasets" / "active-dataset.json").write_text(
    json.dumps(active_manifest, indent=2) + "\n",
    encoding="utf-8",
)

# Remove the giant inline data block. The app now loads the active dataset manifest.
text = block_pattern.sub("", text, count=1)

old_data = "const DATA=globalThis.FONT_JUICE_GLYPHS||{};"
new_data = (
    f"/* {marker} */\n"
    f"const BUILD_ID={json.dumps(BUILD_ID)};\n"
    "let DATA={};\n"
    "let DATASET_ID='unloaded';"
)
if old_data not in text:
    fail("Could not locate DATA initialisation")
text = text.replace(old_data, new_data, 1)

old_loader = (
    "function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();"
    "image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('A handwriting glyph could not load'));"
    "image.src=src})}"
)
new_loader = r"""function prepareGlyphMask(image){
  const mask=document.createElement('canvas');
  mask.width=image.naturalWidth||image.width;
  mask.height=image.naturalHeight||image.height;
  const context=mask.getContext('2d',{willReadFrequently:true});
  if(!context)throw new Error('2D canvas is unavailable');
  context.clearRect(0,0,mask.width,mask.height);
  context.drawImage(image,0,0);
  const pixels=context.getImageData(0,0,mask.width,mask.height);
  const data=pixels.data;
  const pixelCount=mask.width*mask.height;
  if(!pixelCount)throw new Error('A handwriting glyph has zero dimensions');
  const luminanceAt=i=>.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
  let transparentCount=0;
  let borderLuminance=0;
  let borderCount=0;
  for(let y=0;y<mask.height;y++){
    for(let x=0;x<mask.width;x++){
      const i=(y*mask.width+x)*4;
      if(data[i+3]<250)transparentCount++;
      const border=x===0||y===0||x===mask.width-1||y===mask.height-1;
      if(border){borderLuminance+=luminanceAt(i);borderCount++}
    }
  }
  const hasTransparency=transparentCount/pixelCount>.005;
  const darkBackground=(borderCount?borderLuminance/borderCount:0)<128;
  let occupied=0;
  let borderOccupied=0;
  for(let y=0;y<mask.height;y++){
    for(let x=0;x<mask.width;x++){
      const i=(y*mask.width+x)*4;
      const sourceAlpha=data[i+3];
      const luminance=luminanceAt(i);
      const alpha=hasTransparency?sourceAlpha:Math.round(darkBackground?luminance:255-luminance);
      data[i]=255;data[i+1]=255;data[i+2]=255;data[i+3]=alpha;
      if(alpha>12){
        occupied++;
        if(x===0||y===0||x===mask.width-1||y===mask.height-1)borderOccupied++;
      }
    }
  }
  const coverage=occupied/pixelCount;
  const borderCoverage=borderCount?borderOccupied/borderCount:0;
  if(coverage<.001)throw new Error('A handwriting glyph mask is empty');
  if(coverage>.85&&borderCoverage>.75)throw new Error('A handwriting glyph became a solid rectangle');
  context.clearRect(0,0,mask.width,mask.height);
  context.putImageData(pixels,0,0);
  return mask;
}
function loadImage(src){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>{try{resolve(prepareGlyphMask(image))}catch(error){reject(error)}};
    image.onerror=()=>reject(new Error('A handwriting glyph could not load'));
    image.src=src;
  });
}
async function loadActiveDataset(){
  const response=await fetch(`./datasets/active-dataset.json?build=${encodeURIComponent(BUILD_ID)}`,{cache:'no-store'});
  if(!response.ok)throw new Error(`Dataset manifest failed to load (${response.status})`);
  const manifest=await response.json();
  if(!manifest||!manifest.bundle)throw new Error('Dataset manifest is invalid');
  await new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=new URL(manifest.bundle,location.href).href;
    script.async=true;
    script.onload=resolve;
    script.onerror=()=>reject(new Error('Handwriting dataset bundle failed to load'));
    document.head.appendChild(script);
  });
  const dataset=globalThis.FONT_JUICE_DATASET||null;
  DATA=(dataset&&dataset.glyphs)||globalThis.FONT_JUICE_GLYPHS||{};
  DATASET_ID=(dataset&&dataset.id)||manifest.id||'unknown';
  if(Object.keys(DATA).length<36)throw new Error('Handwriting dataset is incomplete');
  const buildInfo=document.getElementById('buildInfo');
  if(buildInfo)buildInfo.textContent=`Build ${BUILD_ID} · ${DATASET_ID}`;
}
async function clearLegacyPwa(){
  try{
    if('serviceWorker' in navigator){
      const registrations=await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.filter(registration=>registration.scope.includes('/FONT_JUICE/')).map(registration=>registration.unregister()));
    }
    if('caches' in globalThis){
      const keys=await caches.keys();
      await Promise.all(keys.filter(key=>key.startsWith('font-juice-')).map(key=>caches.delete(key)));
    }
  }catch(error){console.warn('Legacy Font Juice cleanup was incomplete',error)}
}"""
if old_loader not in text:
    fail("Could not locate the original image loader")
text = text.replace(old_loader, new_loader, 1)

old_start = """async function start(){
  restoreState();bind();controlsDisabled(false);await render();
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
}"""
new_start = """async function start(){
  restoreState();
  bind();
  controlsDisabled(true);
  setStatus('Loading handwriting dataset…');
  try{
    await clearLegacyPwa();
    await loadActiveDataset();
    controlsDisabled(false);
    await render();
  }catch(error){
    console.error(error);
    controlsDisabled(false);
    setStatus(`Start failed: ${error.message}`,'err');
  }
}"""
if old_start not in text:
    fail("Could not locate the original start function")
text = text.replace(old_start, new_start, 1)

text = text.replace(
    "<span>Private by design: rendering stays on this device.</span>",
    "<span>Private by design: rendering stays on this device. <small id=\"buildInfo\">Build loading…</small></span>",
    1,
)
text = text.replace(
    "After the first successful load, the app can reopen offline.",
    "The Home Screen version uses the same current online build as Safari.",
    1,
)

# Repair text that was previously saved with double-encoded punctuation.
for broken, repaired in {
    "â": "—",
    "â¦": "…",
    "Ã": "×",
    "Ã—": "×",
}.items():
    text = text.replace(broken, repaired)

index_path.write_text(text, encoding="utf-8")

# Retire any already-installed worker. New builds do not register one.
(root / "sw.js").write_text(
    f"""const FONT_JUICE_RETIRE_BUILD={json.dumps(BUILD_ID)};
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('font-juice-')).map(key=>caches.delete(key)));
  await self.registration.unregister();
  await self.clients.claim();
  const windows=await self.clients.matchAll({{type:'window',includeUncontrolled:true}});
  for(const client of windows){{
    const url=new URL(client.url);
    url.searchParams.set('build',FONT_JUICE_RETIRE_BUILD);
    if('navigate' in client)await client.navigate(url.href);
  }}
}})()));
self.addEventListener('fetch',()=>{{}});
""",
    encoding="utf-8",
)

# A lightweight repository-level smoke test: dataset integrity and deployment guardrails.
tests_dir = root / "tests"
tests_dir.mkdir(exist_ok=True)
(tests_dir / "dataset-smoke.mjs").write_text(
    r"""import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const manifest=JSON.parse(fs.readFileSync('datasets/active-dataset.json','utf8'));
assert.equal(manifest.id,'adam-hand-v1');
const bundlePath=manifest.bundle.replace(/^\.\//,'').replace(/\?.*$/,'');
const code=fs.readFileSync(bundlePath,'utf8');
const sandbox={};
sandbox.globalThis=sandbox;
vm.runInNewContext(code,sandbox,{filename:bundlePath});
const dataset=sandbox.FONT_JUICE_DATASET;
assert(dataset&&dataset.glyphs,'dataset did not initialise');
const glyphs=dataset.glyphs;
for(const character of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'){
  assert(Array.isArray(glyphs[character])&&glyphs[character].length>0,`missing ${character}`);
}
let variants=0;
for(const [character,items] of Object.entries(glyphs)){
  assert(Array.isArray(items)&&items.length>0,`empty variant list for ${character}`);
  for(const src of items){
    assert.match(src,/^data:image\/png;base64,/u,`invalid PNG data URL for ${character}`);
    const png=Buffer.from(src.split(',')[1],'base64');
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',`bad PNG signature for ${character}`);
    assert(png.readUInt32BE(16)>0&&png.readUInt32BE(20)>0,`zero-sized PNG for ${character}`);
    variants++;
  }
}
const html=fs.readFileSync(fs.existsSync('index.html')?'index.html':'Index.html','utf8');
assert(!html.includes("serviceWorker.register"),'index still registers a service worker');
assert(html.includes('prepareGlyphMask'),'mask conversion is missing');
assert(html.includes('active-dataset.json'),'replaceable dataset loader is missing');
console.log(`OK: ${Object.keys(glyphs).length} glyph keys, ${variants} PNG variants, dataset ${dataset.id}`);
""",
    encoding="utf-8",
)

# Keep the architecture and later handwriting replacement path explicit.
readme = root / "README.md"
readme.write_text(
    f"""# Font Juice — Adam Hand Composer

Browser-based PNG composer using Adam's real captured handwriting variants.

## Current build

- Build: `{BUILD_ID}`
- Active dataset: `{DATASET_ID}`
- Rendering and export stay in the browser.
- No service worker is registered by the current build.

## Replace the handwriting later

The renderer is separate from the handwriting data.

1. Preserve each new source batch separately.
2. Convert the chosen characters to transparent PNG masks.
3. Create a new versioned bundle such as `datasets/adam-hand-v2/glyphs.js` using the same `FONT_JUICE_DATASET` shape.
4. Point `datasets/active-dataset.json` at the new bundle.
5. Run `node tests/dataset-smoke.mjs`.
6. Deploy. `index.html` and the renderer do not need to be rewritten.

Do not overwrite old datasets. They are useful for comparison and rollback.

## Dataset contract

```js
globalThis.FONT_JUICE_DATASET = {{
  id: 'adam-hand-v2',
  version: 2,
  format: 'transparent-alpha-mask-v1',
  glyphs: {{
    A: ['data:image/png;base64,...']
  }}
}};
```

One or more variants per glyph are supported. Four is not hard-coded as a permanent limit.

## Test

```sh
node tests/dataset-smoke.mjs
```
""",
    encoding="utf-8",
)

print(f"Applied {marker}; extracted {len(glyphs)} glyph keys")
