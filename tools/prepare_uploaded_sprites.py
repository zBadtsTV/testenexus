"""Normalize the five uploaded strips without changing generated form metadata.

Usage: python3 tools/prepare_uploaded_sprites.py INPUT_DIR OUTPUT_DIR
Requires Pillow and numpy. Output stays outside the source tree until CDN upload.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SPECS = [
    ('movement_walk', 'Ciclo_de_caminhada_do_guerreiro_pixel-art.png', [0, 270, 510, 750, 990, 1230, 1470, 1700, 1920], 190 / 350),
    ('movement_run', 'Sprite_de_caminhada_de_lutador_em_pixel_art_2.png', [0, 225, 430, 630, 845, 1060, 1270, 1490, 1700, 1920], 190 / 350),
    ('kaioken_transform', 'Goku_despertando_el_aura_Kaioken_em_pixel_art.png', [0, 248, 495, 774, 1054, 1364, 1644, 1920], 190 / 345),
    ('kaioken_idle', 'Sequência_Pixelada_de_Aura_Kaioken.png', [0, 246, 489, 730, 967, 1206, 1450, 1689, 1920], 190 / 330),
    ('ssj_transform', 'Transformação_Dourada_Goku_Super_Saiyajin.png', [0, 195, 405, 662, 907, 1150, 1417, 1677, 1920], 190 / 315),
]


def prepare(source: Path, output: Path):
    output.mkdir(parents=True, exist_ok=True)
    for name, filename, edges, scale in SPECS:
        image = Image.open(source / filename).convert('RGBA')
        sheet = Image.new('RGBA', (256 * (len(edges) - 1), 300))
        previews = []
        for i, (left, right) in enumerate(zip(edges, edges[1:])):
            crop = image.crop((left, 0, right, 640))
            data = np.array(crop)
            # Remove near-transparent matte debris; retain soft aura edges.
            data[data[:, :, 3] < 12] = 0
            r, g, b, alpha = [data[:, :, j].astype(float) for j in range(4)]
            yy, xx = np.indices(alpha.shape)
            boots = (b > r * 1.15) & (b > g * 1.05) & (alpha > 150) & (yy > 380)
            ys, xs = np.where(boots)
            if len(xs) == 0:
                raise ValueError(f'No boot anchor: {name}:{i}')
            feet = int(ys.max()) + 1
            # Belt/torso center does not move with the extended stepping foot.
            torso = (r > 150) & (g > 65) & (g < r * .85) & (b < g * .75) & (alpha > 180) & (yy > 290) & (yy < 370)
            _, torso_x = np.where(torso)
            center = float(np.median(torso_x)) if len(torso_x) else float(np.median(xs))
            crop = Image.fromarray(data)
            resized = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.NEAREST)
            frame = Image.new('RGBA', (256, 300))
            frame.alpha_composite(resized, (round(128 - center * scale), round(280 - feet * scale)))
            sheet.alpha_composite(frame, (i * 256, 0))
            previews.append(frame)
        sheet.save(output / f'{name}.png')
        print(f'{name}: {len(previews)} frames, feet=280, center=128, cell=256x300')


if __name__ == '__main__':
    prepare(Path(sys.argv[1]), Path(sys.argv[2]))