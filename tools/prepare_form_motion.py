"""Crop the uploaded form movement/charge sheets into foot-aligned strips.

Usage: python3 tools/prepare_form_motion.py INPUT_DIR OUTPUT_DIR
All coordinates are from the original uploads; generated form metadata is untouched.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def row(edges, top, bottom):
    return [(left, top, right, bottom) for left, right in zip(edges, edges[1:])]


SPECS = [
    ('kaioken_walk', 'Spritesheet_Pixel_Art_de_Goku_com_Aura_Rosa.png',
     row([240, 417, 594, 782, 960, 1143, 1324, 1503, 1680], 218, 440), 1.10),
    ('kaioken_run', 'Spritesheet_Pixel_Art_de_Goku_com_Aura_Rosa.png',
     row([10, 230, 432, 638, 829, 1035], 442, 640), 1.10),
    ('kaioken_air', 'Spritesheet_Pixel_Art_de_Goku_com_Aura_Rosa.png',
     [(1035, 442, 1220, 640), (1210, 422, 1378, 640), (1370, 414, 1534, 640),
      (1512, 442, 1704, 640), (1694, 442, 1882, 640)], 1.10),
    ('kaioken_charge_loop', 'Spritesheet_Pixel_Art_de_Goku_com_Aura_Kaioken.png',
     row([0, 289, 557, 833, 1104, 1377, 1647, 1920], 130, 510), .65),
    ('kaioken_charge_start', 'kaioken_inicio_carregamento_1672x941.png',
     row([0, 203, 390, 604, 813, 1014, 1221, 1433, 1672], 275, 650), .62),
    ('ssj_charge_loop', 'Spritesheet_de_Aura_Dourada_em_Pixel_Art.png',
     row([0, 248, 485, 731, 972, 1211, 1446, 1684, 1920], 75, 495), .65),
    ('ssj_walk', 'Sprite_Sheet_de_Goku_Super_Saiyajin_em_Ação.png',
     row([205, 395, 588, 780, 976, 1170, 1365, 1560, 1757], 0, 240), 1.0),
    ('ssj_run', 'Sprite_Sheet_de_Goku_Super_Saiyajin_em_Ação.png',
     row([187, 390, 588, 783, 976, 1170, 1365, 1560, 1766], 244, 438), 1.0),
]


def prepare(source, output):
    output.mkdir(parents=True, exist_ok=True)
    previews = []
    for name, filename, boxes, scale in SPECS:
        image = Image.open(source / filename).convert('RGBA')
        sheet = Image.new('RGBA', (256 * len(boxes), 300))
        for index, box in enumerate(boxes):
            crop = image.crop(box)
            data = np.array(crop)
            data[data[:, :, 3] < 12] = 0
            # Discard disconnected fragments from neighboring poses at crop edges.
            labels, count = ndimage.label(data[:, :, 3] > 12)
            if count:
                sizes = np.bincount(labels.ravel())
                sizes[0] = 0
                main = labels == sizes.argmax()
                keep = ndimage.binary_dilation(main, iterations=2)
                data[~keep] = 0
            r, g, b, alpha = [data[:, :, j].astype(float) for j in range(4)]
            yy, xx = np.indices(alpha.shape)
            boots = (b > r * 1.15) & (b > g * 1.05) & (alpha > 150) & (yy > crop.height * .40)
            ys, xs = np.where(boots)
            if not len(xs):
                raise ValueError(f'No boot anchor: {name}:{index}')
            feet = int(ys.max()) + 1
            # Center on the torso, never on the foot that extends during a step.
            orange = (r > 150) & (g > 65) & (g < r * .85) & (b < g * .75) & (alpha > 180)
            torso = orange & (yy > feet - 140 / scale) & (yy < feet - 65 / scale)
            _, torso_x = np.where(torso)
            center = float(np.median(torso_x)) if len(torso_x) else float(np.median(xs))
            resized = Image.fromarray(data).resize(
                (round(crop.width * scale), round(crop.height * scale)), Image.Resampling.NEAREST)
            frame = Image.new('RGBA', (256, 300))
            frame.alpha_composite(resized, (round(128 - center * scale), round(280 - feet * scale)))
            sheet.alpha_composite(frame, (index * 256, 0))
        sheet.save(output / f'{name}.png')
        preview = sheet.copy()
        preview.thumbnail((1024, 150))
        previews.append((name, preview))
        print(f'{name}: {len(boxes)} frames, cell=256x300, feet=280, center=128')
    contact = Image.new('RGBA', (1024, len(previews) * 165), (70, 90, 105, 255))
    from PIL import ImageDraw
    draw = ImageDraw.Draw(contact)
    for i, (name, preview) in enumerate(previews):
        draw.text((0, i * 165), name, fill='white')
        contact.alpha_composite(preview, (0, i * 165 + 15))
    contact.save(output / 'contact.png')


if __name__ == '__main__':
    prepare(Path(sys.argv[1]), Path(sys.argv[2]))