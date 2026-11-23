import * as Phaser from 'phaser';
import type { CharacterId } from '../net';

/** Interior das barras no painel original (px): [topo esq, topo dir, base esq, base dir], y topo/base. */
type Bar = { y0: number; y1: number; tl: number; tr: number; bl: number; br: number };
const GEOMETRY: Record<CharacterId, { hp: Bar; en: Bar }> = {
  naruto: {
    hp: { y0: 167, y1: 217, tl: 410, tr: 1940, bl: 380, br: 1893 },
    en: { y0: 254, y1: 305, tl: 366, tr: 1846, bl: 336, br: 1800 },
  },
  goku: {
    hp: { y0: 159, y1: 207, tl: 427, tr: 1958, bl: 388, br: 1910 },
    en: { y0: 242, y1: 290, tl: 370, tr: 1862, bl: 337, br: 1815 },
  },
};
const PANEL_W = 2010;

/** Painel de vida + ki/chakra desenhado em cima da arte enviada. */
export class Hud {
  private g: Phaser.GameObjects.Graphics;
  private s: number;
  private hpText: Phaser.GameObjects.Text;
  private enText: Phaser.GameObjects.Text;
  flash = 0;

  constructor(scene: Phaser.Scene, private ch: CharacterId, private x: number, private y: number, width: number) {
    this.s = width / PANEL_W;
    this.g = scene.add.graphics().setDepth(31).setScrollFactor(0);
    scene.add.image(x, y, `hud_${ch}`).setOrigin(0).setScale(this.s).setDepth(32).setScrollFactor(0);
    const geo = GEOMETRY[ch];
    const style = { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', fontStyle: 'bold' };
    const label = (b: Bar) =>
      scene.add
        .text(x + ((b.tl + b.tr) / 2) * this.s, y + ((b.y0 + b.y1) / 2) * this.s, '', style)
        .setOrigin(0.5)
        .setShadow(1, 1, '#000', 2)
        .setDepth(33)
        .setScrollFactor(0);
    this.hpText = label(geo.hp);
    this.enText = label(geo.en);
  }

  private fill(b: Bar, pct: number, color: number): void {
    const { x, y, s } = this;
    const p = Phaser.Math.Clamp(pct, 0, 1);
    if (p <= 0) return;
    this.g.fillStyle(color, 1);
    this.g.fillPoints(
      [
        new Phaser.Math.Vector2(x + b.tl * s, y + b.y0 * s),
        new Phaser.Math.Vector2(x + (b.tl + (b.tr - b.tl) * p) * s, y + b.y0 * s),
        new Phaser.Math.Vector2(x + (b.bl + (b.br - b.bl) * p) * s, y + b.y1 * s),
        new Phaser.Math.Vector2(x + b.bl * s, y + b.y1 * s),
      ],
      true,
    );
    this.g.fillStyle(0xffffff, 0.25);
    this.g.fillRect(x + (b.tl + 4) * s, y + (b.y0 + 4) * s, (b.tr - b.tl) * p * s * 0.97, (b.y1 - b.y0) * 0.25 * s);
  }

  update(hp: number, energy: number, form: string, delta: number): void {
    const geo = GEOMETRY[this.ch];
    this.g.clear();
    const hpColor = form === 'kaioken' ? 0xff3b3b : hp <= 20 ? 0xff4444 : 0xffa024;
    this.fill(geo.hp, hp / 100, hpColor);
    let enColor = this.ch === 'naruto' ? 0x25d6ff : energy >= 100 ? 0xffd54a : 0x39a0ff;
    if (this.flash > 0) {
      this.flash -= delta;
      enColor = 0xff4444;
    }
    this.fill(geo.en, energy / 100, enColor);
    this.hpText.setText(`VIDA ${Math.ceil(hp)}`);
    this.enText.setText(`${this.ch === 'naruto' ? 'CHAKRA' : 'KI'} ${Math.floor(energy)}%`);
  }
}
