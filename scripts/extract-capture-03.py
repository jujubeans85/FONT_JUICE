"""Extract the supplied orange calligraphy as alpha masks; no invented strokes.
Run with --source-dir pointing at the seven original uploaded JPEGs.
The original sheets remain private; only cropped character masks enter the bundle.
"""
from pathlib import Path
import argparse, json, hashlib, base64, io
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
PAGES=[
 ('8D3F54CB-D697-4EC0-9962-13A2AD057686.jpeg',295.5),
 ('FC0F027B-0A36-48BD-8919-E2A6390E24DF.jpeg',367.5),
 ('CF541AAC-5726-4974-A74B-2D64F6FA5463.jpeg',454.5),
 ('495735B8-AD31-40A2-9D02-D9903ECBF45E.jpeg',474.5),
 ('C6C3993C-DD6A-4200-941D-511818B3B98E.jpeg',457.5),
 ('EF9843BE-2886-4887-BD5B-2789C6A8E6D0.jpeg',290.5)]
parser=argparse.ArgumentParser();parser.add_argument('--source-dir',type=Path,required=True);parser.add_argument('--qa-dir',type=Path,required=True);args=parser.parse_args()
args.qa_dir.mkdir(parents=True,exist_ok=True)
manifest=json.loads((ROOT/'templates/capture-03-manifest.json').read_text())
glyphs={};metrics={};records=[];blanks=[];sources=[];thumbs=[];cap_heights=[]
for pidx,(filename,table_top) in enumerate(PAGES,1):
 source=args.source_dir/filename
 a=np.array(Image.open(source).convert('RGB')).astype(float)
 r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
 # Neutral paper, printed labels and blue guides have no orange chroma.
 alpha=np.clip((r-b)/234,0,1)
 alpha[(r-g<12)|(g-b<8)|(r-b<14)]=0
 labels,n=ndimage.label(alpha>.18)
 sizes=np.bincount(labels.ravel());sizes[0]=0
 components=ndimage.find_objects(labels)
 centers={}
 for k,sl in enumerate(components,1):
  if sl is None or sizes[k]<3:continue
  ys,xs=sl;centers[k]=((xs.start+xs.stop-1)/2,(ys.start+ys.stop-1)/2)
 sources.append({'page':pidx,'file':filename,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'table_top_px':table_top})
 page=manifest['pages'][pidx-1]
 for cell in page['cells']:
  ch=cell['character'];v=cell['variant'];row=int(cell['id'].split('-R')[1][:2])-1
  left=185.5+(v-1)*215.9;top=table_top+row*82.05
  chosen=[]
  for k,(cx,cy) in centers.items():
   assigned_row=int(np.floor((cy-table_top+1)/82.05))
   # Last-row descenders can extend beyond their printed box.
   if row==len(page['cells'])//4-1 and cy>=top and cy<top+94:assigned_row=row
   if left-3<=cx<left+210 and assigned_row==row and cy>=table_top-1:chosen.append(k)
  if not chosen:
   blanks.append({'cell':cell['id'],'character':ch,'variant':v});continue
  region=np.isin(labels,chosen)
  # Retain soft antialias pixels around each observed connected stroke.
  support=ndimage.binary_dilation(region,iterations=2)
  mask=(alpha*support*255).round().astype('uint8')
  yy,xx=np.nonzero(mask)
  x0=max(0,int(xx.min())-2);y0=max(0,int(yy.min())-2);x1=min(a.shape[1],int(xx.max())+3);y1=min(a.shape[0],int(yy.max())+3)
  cropped=mask[y0:y1,x0:x1]
  rgba=np.full((*cropped.shape,4),255,dtype='uint8');rgba[:,:,3]=cropped
  image=Image.fromarray(rgba)
  stream=io.BytesIO();image.save(stream,format='PNG',optimize=True)
  data_url='data:image/png;base64,'+base64.b64encode(stream.getvalue()).decode()
  baseline=top+11.5*(82.05/15.2)-y0
  glyphs.setdefault(ch,[]).append(data_url)
  metrics.setdefault(ch,[]).append({'baseline':round(baseline,3),'cell':cell['id']})
  records.append({'cell':cell['id'],'character':ch,'sample':v,'crop_px':[x0,y0,x1,y1],'baseline':round(baseline,3),'source_page':pidx,'ink_pixels':int((cropped>64).sum())})
  if 'A'<=ch<='Z':cap_heights.append(baseline-2)
  thumbs.append((ch,v,image))
# One common cap scale preserves the actual relative heights of the captured glyphs.
em=round(float(np.median(cap_heights)),3)
assert set(glyphs)==set(c['character'] for p in manifest['pages'][:6] for c in p['cells'])
assert len(blanks)==2,blanks
assert {(c['character'],c['variant']) for c in blanks}=={('9',4),('\\',4)}
assert sum(map(len,glyphs.values()))==266
bundle={'id':'capture-03','name':'Orange chisel · slightly untucked','emHeight':em,'nativeStroke':True,'glyphs':glyphs,'metrics':metrics}
body='/* Adam\'s original orange digital calligraphy. 266 real samples; two cells left blank. */\nglobalThis.FONT_JUICE_CAPTURE03='+json.dumps(bundle,separators=(',',':'),ensure_ascii=False)+';\n'
name='adam-hand-capture03.'+hashlib.sha256(body.encode()).hexdigest()[:12]+'.js'
(ROOT/'data'/name).write_text(body)
report={'capture_id':'capture-03','count':266,'em_height_px':em,'sources':sources,'blank_cells':blanks,'cells':records,'natural_writing_page':'Private reference only; signatures and personal annotations are not published.'}
(ROOT/'data/capture-03-extraction.json').write_text(json.dumps(report,indent=2)+'\n')
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
for p in range(6):
 rows=[t for t in thumbs if t[0] in {c['character'] for c in manifest['pages'][p]['cells']}]
 sheet=Image.new('RGB',(800,((len(rows)+3)//4)*110),'#f3f3f3');draw=ImageDraw.Draw(sheet)
 for i,(ch,v,im) in enumerate(rows):
  x=(i%4)*200;y=(i//4)*110
  draw.text((x+8,y+4),f'{ch} / {v}',font=font,fill='#405060')
  # At original extraction size: inspect clipped strokes and accidental extra ink.
  tinted=Image.new('RGBA',im.size,(255,151,20));tinted.putalpha(im.getchannel('A'))
  sheet.paste(tinted,(x+45,y+28),tinted)
 sheet.save(args.qa_dir/f'glyphs-{p+1}.png')
print(json.dumps({'bundle':name,'samples':266,'em':em,'blanks':blanks,'bytes':len(body.encode())}))
