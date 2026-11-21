import * as Phaser from 'phaser';
import { PLAYER_FRAME_HEIGHT, PLAYER_FRAME_WIDTH } from '../playerSheet';
import { KI_FRAME_HEIGHT, KI_FRAME_WIDTH } from '../kiSheet';
import { KI_MAX, KI_SHOT_COST, KI_TEXTURE, PLAYER_TEXTURE, Player, SCALE } from '../entities/Player';

const GROUND_HEIGHT = 90;
const KI_BALL_TEXTURE = 'ki_ball';
const KI_BALL_SPEED = 720;

// barra de ki
const BAR_X = 16;
const BAR_Y = 44;
const BAR_W = 260;
const BAR_H = 22;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private kiBalls!: Phaser.Physics.Arcade.Group;
  private kiFill!: Phaser.GameObjects.Rectangle;
  private kiText!: Phaser.GameObjects.Text;
  private kiFlash = 0; // ms restantes do aviso "sem ki"

  constructor() {
    super('GameScene');
  }

  preload(): void {
    this.load.spritesheet(PLAYER_TEXTURE, '/assets/player.png', {
      frameWidth: PLAYER_FRAME_WIDTH,
      frameHeight: PLAYER_FRAME_HEIGHT,
    });
    this.load.spritesheet(KI_TEXTURE, '/assets/ki.png', {
      frameWidth: KI_FRAME_WIDTH,
      frameHeight: KI_FRAME_HEIGHT,
    });
    this.load.image(KI_BALL_TEXTURE, '/assets/ki_ball.png');
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
    this.player.on('fire', (x: number, y: number, dir: 1 | -1) => this.spawnKiBall(x, y, dir));
    this.player.on('no-ki', () => (this.kiFlash = 350));

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

    this.updateKiBar(delta);
  }

  private spawnKiBall(x: number, y: number, dir: 1 | -1): void {
    const ball = this.kiBalls.create(x, y, KI_BALL_TEXTURE) as Phaser.Physics.Arcade.Sprite;
    ball.setScale(SCALE);
    ball.setFlipX(dir === -1); // a imagem aponta para a direita
    ball.setVelocityX(dir * KI_BALL_SPEED);
    ball.setDepth(5);
  }

  // ---------- HUD ----------
  private createHud(): void {
    this.add
      .text(
        16,
        12,
        '← → / A D: andar   Shift: correr   Espaço / ↑ / W: pular\nC (segurar): carregar ki   Q: atirar ki',
        { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' },
      )
      .setShadow(1, 1, '#000000', 2)
      .setDepth(10);

    this.add.rectangle(BAR_X - 3, BAR_Y - 3 + 22, BAR_W + 6, BAR_H + 6, 0x000000, 0.6).setOrigin(0, 0.5).setDepth(10);
    this.kiFill = this.add.rectangle(BAR_X, BAR_Y + 22, 0, BAR_H, 0x39a0ff).setOrigin(0, 0.5).setDepth(11);
    this.kiText = this.add
      .text(BAR_X + BAR_W / 2, BAR_Y + 22, '', { fontFamily: 'monospace', fontSize: '15px', color: '#ffffff' })
      .setOrigin(0.5)
      .setShadow(1, 1, '#000000', 2)
      .setDepth(12);

    // marca do custo de um tiro (a cada 10%)
    const g = this.add.graphics().setDepth(12);
    g.lineStyle(1, 0x000000, 0.35);
    for (let i = 1; i < KI_MAX / KI_SHOT_COST; i++) {
      const x = BAR_X + (BAR_W * i * KI_SHOT_COST) / KI_MAX;
      g.lineBetween(x, BAR_Y + 22 - BAR_H / 2, x, BAR_Y + 22 + BAR_H / 2);
    }
  }

  private updateKiBar(delta: number): void {
    const pct = Phaser.Math.Clamp(this.player.ki / KI_MAX, 0, 1);
    this.kiFill.setSize(BAR_W * pct, BAR_H);
    this.kiText.setText(`KI ${Math.floor(pct * 100)}%`);

    if (this.kiFlash > 0) {
      this.kiFlash -= delta;
      this.kiFill.setFillStyle(0xff4444); // sem ki: barra pisca vermelha
    } else {
      this.kiFill.setFillStyle(pct >= 1 ? 0xffd54a : 0x39a0ff); // cheia = dourada
    }
  }
}
