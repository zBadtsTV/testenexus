import * as Phaser from 'phaser';
import { PLAYER_FRAME_HEIGHT, PLAYER_FRAME_WIDTH, PLAYER_FRAMES } from '../playerSheet';

export const PLAYER_TEXTURE = 'player';

const SCALE = 0.75;
const WALK_SPEED = 170;
const RUN_SPEED = 340;
const JUMP_SPEED = 640;

// Caixa de colisão em pixels do FRAME (o Phaser aplica a escala sozinho).
// Pés ficam na base do frame, então ela é ancorada embaixo e centralizada.
const BODY_W = 40;
const BODY_H = 140;

type Facing = -1 | 1;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private keys!: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    shift: Phaser.Input.Keyboard.Key;
  };
  private facing: Facing = 1;

  /** Cria as animações a partir dos frames recortados (chamar uma vez, no create da cena). */
  static createAnimations(scene: Phaser.Scene): void {
    const make = (
      key: string,
      frames: readonly number[],
      frameRate: number,
      repeat: number,
    ) => {
      scene.anims.create({
        key,
        frames: frames.map((frame) => ({ key: PLAYER_TEXTURE, frame })),
        frameRate,
        repeat,
      });
    };

    make('idle', PLAYER_FRAMES.idle, 1, -1);
    make('walk-right', PLAYER_FRAMES.walk_right, 9, -1);
    make('walk-left', PLAYER_FRAMES.walk_left, 9, -1);
    make('run-right', PLAYER_FRAMES.run_right, 14, -1);
    make('run-left', PLAYER_FRAMES.run_left, 14, -1);
    make('jump', PLAYER_FRAMES.jump, 10, 0); // toca uma vez e segura o último frame
    make('fall', PLAYER_FRAMES.fall, 1, -1);
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PLAYER_TEXTURE, PLAYER_FRAMES.idle[0]);
    scene.add.existing(this);
    this.setScale(SCALE);
    scene.physics.add.existing(this);

    // origem nos pés: (x, y) é o ponto onde o personagem pisa
    this.setOrigin(0.5, 1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(BODY_W, BODY_H);
    body.setOffset((PLAYER_FRAME_WIDTH - BODY_W) / 2, PLAYER_FRAME_HEIGHT - BODY_H);
    this.setCollideWorldBounds(true);

    const kb = scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: kb.addKey(K.LEFT),
      right: kb.addKey(K.RIGHT),
      a: kb.addKey(K.A),
      d: kb.addKey(K.D),
      up: kb.addKey(K.UP),
      w: kb.addKey(K.W),
      space: kb.addKey(K.SPACE),
      shift: kb.addKey(K.SHIFT),
    };
  }

  override update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    const left = this.keys.left.isDown || this.keys.a.isDown;
    const right = this.keys.right.isDown || this.keys.d.isDown;
    const dir = (Number(right) - Number(left)) as -1 | 0 | 1;
    const running = this.keys.shift.isDown;
    const wantsJump = this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown;

    // --- movimento ---
    this.setVelocityX(dir * (running ? RUN_SPEED : WALK_SPEED));
    if (dir !== 0) this.facing = dir;
    if (wantsJump && onGround) this.setVelocityY(-JUMP_SPEED);

    // --- animação ---
    // andar/correr têm frames próprios para cada lado; idle/pulo/queda só existem
    // virados para a direita, então espelhamos (flipX) quando olha para a esquerda.
    const side = this.facing === 1 ? 'right' : 'left';
    if (!onGround) {
      this.setFlipX(this.facing === -1);
      this.anims.play(body.velocity.y < 0 ? 'jump' : 'fall', true);
    } else if (dir !== 0) {
      this.setFlipX(false);
      this.anims.play(`${running ? 'run' : 'walk'}-${side}`, true);
    } else {
      this.setFlipX(this.facing === -1);
      this.anims.play('idle', true);
    }
  }
}
