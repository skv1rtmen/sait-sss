"""Schneidet die v6-Clips zu Kadern und Standbildern und schreibt die Kaderindizes in data.js.
Reihenfolge: C1 Küche-Drift · C2 Küche→Flur · C3 Flur→Bad · C4 Bad→Schlafzimmer · C5 Schlafzimmer→Wohnzimmer · C6 Wohnzimmer→Eingang · C7 Rohbau (Rückblende, angehängt)."""
import subprocess,glob,os,re,json,sys
from PIL import Image,ImageFilter
# Leichtes Unsharp-Mask gleicht die Weichheit durch WEBP-Kompression + Downscale/Upscale-Kette optisch aus
# (Quelle bleibt 1280x720 - kein echtes Zusatzdetail, aber sichtbar knackiger auf Screens).
SHARP=ImageFilter.UnsharpMask(radius=1.4,percent=65,threshold=2)
W='/mnt/user-data/working'; SITE=W+'/site'; CL=W+'/film/v6'; FR=SITE+'/img/film/f'; FL=SITE+'/img/film/fl'; ST=SITE+'/img/film/s'
order=['v6-c1-kueche','v6-c2-flur','v6-c3-bad','v6-c4-schlaf','v6-c5-wohnen','v6-c6-eingang']
clips=[CL+'/'+n+'.mp4' for n in order]
missing=[c for c in clips if not os.path.exists(c)]
if missing: print('MISSING',missing); sys.exit(1)
FPS=8
for d in (FR,FL,ST):
    os.makedirs(d,exist_ok=True)
    for f in glob.glob(d+'/*'): os.remove(f)
# Kader je Clip extrahieren (getrennt, damit Clip-Grenzen exakt sind)
idx=0; ends=[]
for c in clips:
    tmp=W+'/film/tmp'; os.makedirs(tmp,exist_ok=True)
    for f in glob.glob(tmp+'/*'): os.remove(f)
    subprocess.run(['ffmpeg','-v','error','-y','-i',c,'-vf',f'fps={FPS},scale=1280:720','-start_number','0',tmp+'/f%04d.png'],check=True)
    files=sorted(glob.glob(tmp+'/*.png'))
    for f in files:
        im=Image.open(f).convert('RGB').filter(SHARP); im.save(f'{FR}/f{idx:04d}.webp','WEBP',quality=78,method=6)
        im.resize((960,540),Image.LANCZOS).save(f'{FL}/f{idx:04d}.webp','WEBP',quality=72,method=6); idx+=1
    ends.append(idx-1)
total=idx
print('frames',total,'clip ends',ends)
# Szenen -> Halt-Kader: 0 Küche=end C1, 1 Flur=end C2, 2 Bad=end C3, 3 Schlaf=end C4, 4 Wohnen=end C5, 5 Rohbau=end C7, 6 Eingang=end C6
f_scene=[ends[0],ends[1],ends[2],ends[3],ends[4],ends[4],ends[5]]   # Rohbau = echtes Foto (scene.img)
# Standbilder 16:9 + 9:16 (Mittenausschnitt als Fallback; Nano-Banana-Versionen ersetzen st{i}-p.jpg später)
for i,f in enumerate(f_scene):
    im=Image.open('/mnt/user-data/working/site/img/before-demo.jpg' if i==5 else f'{FR}/f{f:04d}.webp').convert('RGB')
    if i==5: im=im.resize((1280,int(1280*im.height/im.width)),Image.LANCZOS)
    im.save(f'{ST}/st{i}.jpg',quality=90,optimize=True,progressive=True)
    w,h=im.size; cw=int(h*9/16); x0=(w-cw)//2
    im.crop((x0,0,x0+cw,h)).resize((810,1440),Image.LANCZOS).filter(SHARP).save(f'{ST}/st{i}-p.jpg',quality=88,optimize=True,progressive=True)
Image.open(f'{FR}/f0000.webp').convert('RGB').save(SITE+'/img/film/poster.jpg',quality=90,optimize=True,progressive=True)
# data.js aktualisieren
p=SITE+'/js/data.js'; s=open(p).read()
s=re.sub(r"frames:\d+,pad:4",f"frames:{total},pad:4",s)
ids=['kueche','flur','bad','schlaf','wohnen','rohbau','eingang']
for i,idn in enumerate(ids):
    s=re.sub(r"(\{id:'%s',f:)\d+"%idn,r"\g<1>%d"%f_scene[i],s)
s=re.sub(r"introEnd:\d+,","",s)
s=s.replace(" driveSec:"," introEnd:%d,   /* Eröffnung: Kader 0..introEnd spielen einmal automatisch (Clip C1) */\n driveSec:"%ends[0],1)
open(p,'w').write(s)
print('scene frames',dict(zip(ids,f_scene)))
print('size MB',round(sum(os.path.getsize(f) for f in glob.glob(FR+'/*'))/1e6,2))
