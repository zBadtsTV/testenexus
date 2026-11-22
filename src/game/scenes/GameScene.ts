import * as Phaser from 'phaser';
import { FORM_SHEETS } from '../formSheets';
import type { FormId } from '../forms';
import { KI_FRAME_HEIGHT, KI_FRAME_WIDTH } from '../kiSheet';
import { FORM_IDS, FORM_LABEL, HP_MAX, KI_MAX, KI_SHOT_COST } from '../forms';
import { KI_TEXTURE, Player, SCALE } from '../entities/Player';

const GROUND_HEIGHT = 90;
const KI_BALL_TEXTURE = 'ki_ball';
const KI_BALL_KAIOKEN = 'ki_ball_kaioken'; // a mesma bola com a cor trocada para rosa/vermelho
const KI_BALL_SPEED = 720;

// barras (HUD)
const BAR_X = 16;
const BAR_W = 260;
const BAR_H = 20;
const HP_Y = 96;
const KI_Y = 126;

const FORM_COLOR: Record<string, string> = {
  normal: '#ffffff',
  ssj: '#ffd54a',
  kaioken: '#ff6b6b',
};

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private kiBalls!: Phaser.Physics.Arcade.Group;
  private hpFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private kiFill!: Phaser.GameObjects.Rectangle;
  private kiText!: Phaser.GameObjects.Text;
  private formText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private kiFlash = 0; // ms restantes do aviso "sem ki"
  private hintTime = 0; // ms restantes da mensagem na tela

  constructor() {
    super('GameScene');
  }

  preload(): void {
    for (const id of FORM_IDS) {
      const { body, aura, shot } = FORM_SHEETS[id];
      for (const sheet of [body, aura, shot]) {
        if (sheet) this.load.spritesheet(sheet.texture, sheet.file, { frameWidth: sheet.w, frameHeight: sheet.h });
      }
    }
    this.load.spritesheet(KI_TEXTURE, 'assets/ki.png', {
      frameWidth: KI_FRAME_WIDTH,
      frameHeight: KI_FRAME_HEIGHT,
    });
    this.load.image(KI_BALL_TEXTURE, 'assets/ki_ball.png');
    this.load.image(KI_BALL_KAIOKEN, 'assets/ki_ball_kaioken.png');
  }

  create(): void {
    const { width, height } = this.scale;

    // céu: a cor de fundo azul já vem do config (main.ts)

    // chão verde (retângulo estático com física)
    const ground = this.add.rectangle(width / 2, height - GROUND_HEIGHT / 2, width, GROUND_HEIGHT, 0x4caf50);
    this.add.rectangle(width / 2, height - GROUND_HEIGHT + 4, width, 8, 0x66d36b); // faixa de grama
    this.physics.add.existing(ground, true);

    Player.createAnimations(this);
    this.player = new Player(this, width / 2, height - GROUND_HEIGHT);
    this.physics.add.collider(this.player, ground);

    // projéteis de ki (sem gravidade)
    this.kiBalls = this.physics.add.group({ allowGravity: false });
    this.player.on('fire', (x: number, y: number, dir: 1 | -1, size: number, form: FormId) =>
      this.spawnKiBall(x, y, dir, size, form),
    );
    this.player.on('no-ki', () => (this.kiFlash = 350));
    this.player.on('hint', (text: string) => this.showHint(text));

    this.createHud();
  }

  override update(_time: number, delta: number): void {
    this.player.update(delta);

    // projéteis que saíram da tela somem
    const { width } = this.scale;
    for (const obj of this.kiBalls.getChildren()) {
      const ball = obj as Phaser.Physics.Arcade.Sprite;
      if (ball.x < -150 || ball.x > width + 150) ball.destroy();
    }

    this.updateHud(delta);
  }

  /** `size`: 1 = bolinha normal; tiros carregados (Q segurado) saem maiores. */
  private spawnKiBall(x: number, y: number, dir: 1 | -1, size: number, form: FormId): void {
    const texture = form === 'kaioken' ? KI_BALL_KAIOKEN : KI_BALL_TEXTURE;
    const ball = this.kiBalls.create(x, y, texture) as Phaser.Physics.Arcade.Sprite;
    ball.setScale(SCALE * size);
    ball.setFlipX(dir === -1); // a imagem aponta para a direita
    ball.setVelocityX(dir * KI_BALL_SPEED * (size > 1 ? 0.85 : 1)); // bola grande é um pouco mais lenta
    ball.setDepth(5);
  }

  private showHint(text: string): void {
    this.hintText.setText(text);
    this.hintTime = 2200;
  }

  // ---------- HUD ----------
  private createHud(): void {
    const { width } = this.scale;
    const mono = { fontFamily: 'monospace', color: '#ffffff' };

    this.add
      .text(
        16,
        10,
        '← → / A D: andar   Shift: correr   Espaço / ↑ / W: pular\n' +
          'C (segurar): carregar ki   Q: atirar ki (SEGURE para uma bola maior)   H: restaurar vida e ki (teste)\n' +
          'G: Super Sayajin (precisa de 100% de ki)   K: Kaioken (gasta vida)   G / K de novo: voltar',
        { ...mono, fontSize: '15px' },
      )
      .setShadow(1, 1, '#000000', 2)
      .setDepth(10);

    // forma atual + mensagens
    this.formText = this.add
      .text(BAR_X + BAR_W + 16, (HP_Y + KI_Y) / 2, '', { ...mono, fontSize: '20px', fontStyle: 'bold' })
      .setOrigin(0, 0.5)
      .setShadow(1, 1, '#000000', 3)
      .setDepth(10);
    this.hintText = this.add
      .text(width / 2, 190, '', { ...mono, fontSize: '22px', fontStyle: 'bold', align: 'center' })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 3)
      .setDepth(20)
      .setAlpha(0);

    // vida (verde) e ki (azul)
    this.hpFill = this.makeBar(HP_Y, 0x4cd964);
    this.hpText = this.makeBarLabel(HP_Y);
    this.kiFill = this.makeBar(KI_Y, 0x39a0ff);
    this.kiText = this.makeBarLabel(KI_Y);

    // marca do custo de um tiro na barra de ki (a cada 10%)
    const g = this.add.graphics().setDepth(12);
    g.lineStyle(1, 0x000000, 0.35);
    for (let i = 1; i < KI_MAX / KI_SHOT_COST; i++) {
      const x = BAR_X + (BAR_W * i * KI_SHOT_COST) / KI_MAX;
      g.lineBetween(x, KI_Y - BAR_H / 2, x, KI_Y + BAR_H / 2);
    }
  }

  private makeBar(y: number, color: number): Phaser.GameObjects.Rectangle {
    this.add.rectangle(BAR_X - 3, y, BAR_W + 6, BAR_H + 6, 0x000000, 0.6).setOrigin(0, 0.5).setDepth(10);
    return this.add.rectangle(BAR_X, y, 0, BAR_H, color).setOrigin(0, 0.5).setDepth(11);
  }

  private makeBarLabel(y: number): Phaser.GameObjects.Text {
    return this.add
      .text(BAR_X + BAR_W / 2, y, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' })
      .setOrigin(0.5)
      .setShadow(1, 1, '#000000', 2)
      .setDepth(12);
  }

  private updateHud(delta: number): void {
    const p = this.player;

    // vida
    const hpPct = Phaser.Math.Clamp(p.hp / HP_MAX, 0, 1);
    this.hpFill.setSize(BAR_W * hpPct, BAR_H);
    this.hpText.setText(`VIDA ${Math.round(p.hp)}`);
    const hpColor = p.form === 'kaioken' ? 0xff5a36 : hpPct <= 0.2 ? 0xff4444 : 0x4cd964;
    this.hpFill.setFillStyle(hpColor);

    // ki
    const kiPct = Phaser.Math.Clamp(p.ki / KI_MAX, 0, 1);
    this.kiFill.setSize(BAR_W * kiPct, BAR_H);
    this.kiText.setText(`KI ${Math.floor(kiPct * 100)}%`);
    if (this.kiFlash > 0) {
      this.kiFlash -= delta;
      this.kiFill.setFillStyle(0xff4444); // sem ki: barra pisca vermelha
    } else {
      this.kiFill.setFillStyle(kiPct >= 1 ? 0xffd54a : 0x39a0ff); // cheia = amarela (pronto para o SSJ)
    }

    // forma
    this.formText.setText(FORM_LABEL[p.form]).setColor(FORM_COLOR[p.form] ?? '#ffffff');

    // mensagem temporária
    if (this.hintTime > 0) {
      this.hintTime -= delta;
      this.hintText.setAlpha(Phaser.Math.Clamp(this.hintTime / 400, 0, 1));
    }
  }
}
