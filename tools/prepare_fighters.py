"""Slice the Naruto/Goku combat uploads into foot-aligned 256x300 strips.

Usage: python3 tools/prepare_fighters.py INPUT_DIR OUTPUT_DIR
Each sheet is split into rows (alpha gaps) and equal grid columns; every connected
blob is assigned to the column holding its centre, so effects stay with their pose.
Frames share OVERRIDE_ANCHOR (cell 256x300, feet at y=280, body centre x=128).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

CELL_W, CELL_H, FEET, AX = 256, 300, 280, 128
TARGET_H = {'goku': 188, 'naruto': 178}

# (output, file, row index, columns in that row, character, rows in sheet)
SPECS = [
    ('naruto_idle', 'Sprite de Naruto em Pixel Art.png', 0, 8, 'naruto'),
    ('naruto_walk', 'Folha de sprites do ninja laranja.png', 0, 8, 'naruto'),
    ('naruto_run', 'Folha de sprites do ninja laranja.png', 1, 8, 'naruto'),
    ('naruto_air', 'Folha de sprites do ninja laranja.png', 2, 8, 'naruto'),
    ('naruto_rasengan_a', 'Sequência Rasengan em Pixel Art.png', 0, 8, 'naruto'),
    ('naruto_rasengan_b', 'Sequência Rasengan em Pixel Art.png', 1, 8, 'naruto'),
    ('naruto_rasengan_c', 'Sequência Rasengan em Pixel Art.png', 2, 8, 'naruto'),
    ('naruto_punch', 'sprites_socos_naruto_base_e_1_cauda_1672x941.png', 0, 8, 'naruto'),
    ('naruto_charge_a', 'Animação de Carga de Chakra do Naruto.png', 0, 8, 'naruto'),
    ('naruto_charge_b', 'Animação de Carga de Chakra do Naruto.png', 1, 8, 'naruto'),
    ('goku_punch_normal', 'Spritesheet de Ataque do Goku em Pixel Art.png', 0, 8, 'goku'),
    ('goku_punch_ssj', 'Spritesheet de Ataque do Goku em Pixel Art.png', 1, 8, 'goku'),
    ('goku_punch_kaioken', 'Spritesheet de Ataque do Goku em Pixel Art.png', 2, 8, 'goku'),
]


def bands(alpha):
    rows = (alpha > 20).sum(1) > 2
    out, start = [], None
    for y, on in enumerate(rows):
        if on and start is None:
            start = y
        if not on and start is not None:
            if y - start > 40:
                out.append((start, y))
            start = None
    if start is not None:
        out.append((start, len(rows)))
    return out


def slice_row(img, row, cols):
    data = np.array(img)
    alpha = data[:, :, 3]
    top, bottom = bands(alpha)[row]
    band = data[top:bottom].copy()
    band[band[:, :, 3] < 20] = 0
    labels, count = ndimage.label(band[:, :, 3] > 20)
    objs = [(i, sl) for i, sl in enumerate(ndimage.find_objects(labels), start=1)]
    sizes = np.bincount(labels.ravel())
    xs_any = np.where(band[:, :, 3].any(0))[0]
    cw = (xs_any.max() - xs_any.min()) / cols
    centers = []
    for i, sl in sorted(objs, key=lambda o: -sizes[o[0]]):
        cx = (sl[1].start + sl[1].stop) / 2
        if all(abs(cx - c) > cw * .55 for c in centers):
            centers.append(cx)
        if len(centers) == cols:
            break
    centers.sort()
    frames = [np.zeros_like(band) for _ in range(cols)]
    for i, sl in objs:
        if sizes[i] < 30:
            continue
        cx = (sl[1].start + sl[1].stop) / 2
        k = int(np.argmin([abs(cx - c) for c in centers]))
        mask = labels == i
        frames[k][mask] = band[mask]
    return frames, cw


def main(src, out):
    out.mkdir(parents=True, exist_ok=True)
    scales = {}
    for name, file, row, cols, who in SPECS:
        img = Image.open(src / file).convert('RGBA')
        frames, cw = slice_row(img, row, cols)
        # one scale per sheet, from the tallest frame body in the row's first pose
        key = (file, who)
        if key not in scales:
            ys = np.where(frames[0][:, :, 3].any(1))[0]
            scales[key] = TARGET_H[who] / (ys.max() - ys.min() + 1)
        s = scales[key]
        strip = Image.new('RGBA', (CELL_W * cols, CELL_H))
        for i, fr in enumerate(frames):
            ys, xs = np.where(fr[:, :, 3] > 0)
            if not len(ys):
                continue
            feet = ys.max()
            # anchor on the torso: median x of opaque pixels in the middle height band
            mid = (ys > ys.min() + (feet - ys.min()) * .35) & (ys < ys.min() + (feet - ys.min()) * .75)
            ax = np.median(xs[mid]) if mid.any() else (i + .5) * cw
            im = Image.fromarray(fr).resize((round(fr.shape[1] * s), round(fr.shape[0] * s)), Image.NEAREST)
            strip.alpha_composite(im, (round(i * CELL_W + AX - ax * s), round(FEET - feet * s)))
        strip.save(out / f'{name}.png')
        print(name, strip.size, round(s, 3))


main(Path(sys.argv[1]), Path(sys.argv[2]))
