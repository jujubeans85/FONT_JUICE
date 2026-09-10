"""Generate the repeatable A4 capture sheet and cell-coordinate manifest."""
from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT_DIR=Path('/usr/share/fonts/truetype/dejavu')
for alias,filename in [('FJText','DejaVuSans.ttf'),('FJBold','DejaVuSans-Bold.ttf'),('FJMono','DejaVuSansMono-Bold.ttf')]:
 pdfmetrics.registerFont(TTFont(alias,str(FONT_DIR/filename)))
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'templates'
OUT.mkdir(exist_ok=True)
PDF=OUT/'FONT_JUICE_Handwriting_Template.pdf'
W,H=A4
ink=HexColor('#172333');muted=HexColor('#536173');blue=HexColor('#1854a0')
guide=HexColor('#c3d8ef');border=HexColor('#d9dfe7')
# Exact characters in the current composer; labels are outside the capture cells.
groups=[('Letters A-M',list('ABCDEFGHIJKLM')),('Letters N-Z',list('NOPQRSTUVWXYZ')),
        ('Numbers',list('0123456789')),
        ('Punctuation',list('.,:;!?\'"-_@')),
        ('Symbols 1',list('#$%&*+=/\\(')),
        ('Symbols 2',list(')[]{}<>~^|'))]
assert sum(len(items) for _,items in groups)==67
c=canvas.Canvas(str(PDF),pagesize=A4,pageCompression=1,invariant=1)
c.setTitle('FONT JUICE - Handwriting capture template')
c.setAuthor('FONT JUICE')
c.setSubject('A4 handwriting capture: four variants of 67 characters plus optional natural writing')
manifest={'template_id':'FJ-CAPTURE-03','page_size_mm':[210,297],'coordinate_origin':'top-left','pages':[]}

def text(x,y,value,size=10,font='Helvetica',color=ink):
 c.setFont({'Helvetica':'FJText','Helvetica-Bold':'FJBold','Courier-Bold':'FJMono'}[font],size);c.setFillColor(color);c.drawString(x*mm,y*mm,value)

def rules(x,y,w):
 c.setStrokeColor(guide);c.setLineWidth(.35)
 c.setDash(2,2);c.line(x*mm,(y-4)*mm,(x+w)*mm,(y-4)*mm)
 c.setDash();c.setLineWidth(.6);c.line(x*mm,(y-11.5)*mm,(x+w)*mm,(y-11.5)*mm)

def header(page,title,optional=False):
 for x,y in [(8,8),(201,8),(8,288),(201,288)]:
  c.setFillColor(ink);c.rect(x*mm,y*mm,1*mm,1*mm,fill=1,stroke=0)
 text(14,282,'FONT_JUICE / CAPTURE 03',10,'Helvetica-Bold',blue)
 text(173,282,f'{page:02d} / 07',9,'Helvetica-Bold',muted)
 text(14,270,title,23,'Helvetica-Bold')
 if not optional:
  text(14,260,'Write the character at left once in each box. Four fresh versions; no tracing.',10)
  text(14,254,'Use one black pen or stylus. Keep your usual shapes. Slow down just enough to read them.',9.5)
  text(14,248.5,'Letters sit on the solid line; tall strokes reach the dotted line. Keep every stroke inside its box.',9)
 else:
  text(14,260,'Optional. Write these in your usual hand, with natural spacing and joins.',10)
  text(14,254,'This page is for rhythm and spacing references; the composer currently uses separate capitals.',9)
 text(14,243,'Date: __________________    Pen / tip: __________________    Batch: ____________',9,color=muted)

def footer(page):
 text(14,24,'A4 portrait at 100%. On iPad: open in a PDF markup app and write in black.',9,color=muted)
 text(14,18,'Return full pages with all four corner marks. Flat, bright, no shadows. Keep the original PDF.',8.7,color=muted)
 text(14,11,f'FJ-CAPTURE-03 / P{page:02d}    |    Samples stay separate from the existing capture set.',8,color=muted)

for page,(title,characters) in enumerate(groups,1):
 header(page,title)
 for n in range(4):text(33+n*40,234,f'SAMPLE {n+1}',8.5,'Helvetica-Bold',muted)
 cells=[]
 for row,ch in enumerate(characters,1):
  top=229-(row-1)*15.2
  text(16,top-9,ch,20,'Courier-Bold')
  text(15,top-13.2,f'R{row:02d}',6.8,color=muted)
  for variant in range(1,5):
   x=33+(variant-1)*40;bottom=top-14.2;cw=38.4
   c.setStrokeColor(border);c.setLineWidth(.5);c.rect(x*mm,bottom*mm,cw*mm,14.2*mm,fill=0,stroke=1)
   rules(x+1.5,top,cw-3)
   cells.append({'id':f'FJ3-P{page:02d}-R{row:02d}-V{variant}','character':ch,'variant':variant,
                 'box_mm':[round(x,2),round(297-top,2),cw,14.2],
                 'baseline_y_mm':round(297-top+11.5,2),'cap_y_mm':round(297-top+4,2)})
 if len(characters)<13:
  text(33,229-len(characters)*15.2-12,'DONT squeeze wide letters. Keep every stroke inside its box.',9,color=muted)
 footer(page);c.showPage()
 manifest['pages'].append({'page':page,'title':title,'cells':cells})
header(7,'Natural writing / optional',True)
phrases=['MADE WITH LOVE.','A LITTLE WONKY. ALL ME.','THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG.',
         'THANK YOU. SEE YOU SOON!','0123456789  /  21.07.2026  /  $25.00',
         'Your own short message - write it the way you actually would.']
for i,phrase in enumerate(phrases):
 top=229-i*29
 text(14,top,phrase,9,'Helvetica-Bold',muted)
 c.setStrokeColor(border);c.setLineWidth(.5);c.rect(14*mm,(top-23)*mm,182*mm,19*mm,fill=0,stroke=1)
 rules(16,top-5,178)
footer(7);c.showPage();c.save()
manifest['pages'].append({'page':7,'title':'Natural writing','optional':True})
(OUT/'capture-03-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(PDF)
print('7 pages; 67 characters; 268 independent sample cells; optional phrase page')
