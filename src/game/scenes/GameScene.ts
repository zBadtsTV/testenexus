import Phaser from 'phaser';
import { PLAYER_FRAME_HEIGHT, PLAYER_FRAME_WIDTH } from '../playerSheet';
import { Player, PLAYER_TEXTURE } from '../entities/Player';

const GROUND_HEIGHT = 90;

export class GameScene extends Phaser.Scene {
  private player!: Player;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    this.load.spritesheet(PLAYER_TEXTURE, '/assets/player.png', {
      frameWidth: PLAYER_FRAME_WIDTH,
      frameHeight: PLAYER_FRAME_HEIGHT,
    });
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

    this.add
      .text(16, 12, '← → / A D: andar   Shift: correr   Espaço / ↑ / W: pular', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setShadow(1, 1, '#000000', 2);
  }

  update(): void {
    this.player.update();
  }
}
