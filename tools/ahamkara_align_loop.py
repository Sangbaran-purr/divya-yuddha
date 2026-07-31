#!/usr/bin/env python3
"""T96 closed-loop aligner (T93 law: measure the COMPOSITED output, not sprites). Renders the ring layer and
the aligned-pillar layer ALONE at f10 via the real compositor, measures the ring's lit centroid and the
pillar POOL's centroid (bottom 12% of lit content), and iterates make_ahamkara_pillar_aligned.build()'s shift
until |dx|,|dy| <= 2% of the cell. Prints the converged shift to bake into the script."""
import importlib.util, sys, os, numpy as np, glob
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def load(p):
    s=importlib.util.spec_from_file_location(os.path.basename(p)[:-3],p); m=importlib.util.module_from_spec(s); sys.argv=[p]; s.loader.exec_module(m); return m
av=load(os.path.join(ROOT,'scripts/animate_vfx.py'))
aln=load(os.path.join(ROOT,'scripts/make_ahamkara_pillar_aligned.py'))
CELL=1254; TOL=0.02*CELL
ah=av.BRIEFS['ahamkara']
ring_L=[L for L in ah['layers'] if L['src']=='ahamkara_halo'][0]
pill_L=[L for L in ah['layers'] if 'pillar' in L['src']][0]
def one(name,layer):
    av.BRIEFS[name]={**{k:v for k,v in ah.items() if k!='layers'},'layers':[layer]}
    av.render(name)
    return np.asarray(Image.open(os.path.join(ROOT,f'assets/vfx/seq/{name}/frame_010.png')).convert('RGB')).max(2).astype(float)
def centroid(m,thr=25):
    w=np.where(m<thr,0,m); ys,xs=np.mgrid[0:m.shape[0],0:m.shape[1]]; return (xs*w).sum()/w.sum(),(ys*w).sum()/w.sum()
def pool_centroid(m,thr=25):
    lit=m>thr; ys=np.where(lit.any(1))[0]; yt,yb=ys.min(),ys.max(); band=int(yb-(yb-yt)*0.12)
    mm=m.copy(); mm[:band]=0; return centroid(mm,thr)
dx,dy=aln.SHIFT_DX,aln.SHIFT_DY
ring=one('_ahk_ring',ring_L); rcx,rcy=centroid(ring)
for it in range(12):
    aln.build(dx,dy)                                  # writes ahamkara_pillar_aligned.png
    p=one('_ahk_pill',pill_L); pcx,pcy=pool_centroid(p)
    ex,ey=rcx-pcx,rcy-pcy
    print(f"  it{it}: shift=({dx},{dy})  ring=({rcx:.0f},{rcy:.0f}) pool=({pcx:.0f},{pcy:.0f})  err=({ex:+.1f},{ey:+.1f})px  ({abs(ex)/CELL*100:.1f}%,{abs(ey)/CELL*100:.1f}%)")
    if abs(ex)<=TOL and abs(ey)<=TOL:
        print(f"  ✓ CONVERGED at shift dx={dx} dy={dy}  (|err|<=2% = {TOL:.0f}px)"); break
    # sprite shift ≈ rendered error / f10 scale (~0.884); iterate
    dx+=round(ex/0.884); dy+=round(ey/0.884)
# cleanup temp seq
import shutil
for n in ['_ahk_ring','_ahk_pill']:
    d=os.path.join(ROOT,f'assets/vfx/seq/{n}');  shutil.rmtree(d,ignore_errors=True)
print(f"FINAL: SHIFT_DX={dx} SHIFT_DY={dy}")
