import * as Phaser from 'phaser';
import { PLAYER_FRAME_HEIGHT, PLAYER_FRAME_WIDTH, PLAYER_FRAMES } from '../playerSheet';
import { KI_BALL_SPAWN, KI_FEET_Y, KI_FRAMES } from '../kiSheet';

export const PLAYER_TEXTURE = 'player';
export const KI_TEXTURE = 'ki';

export const SCALE = 0.55;
const WALK_SPEED = 170;
const RUN_SPEED = 340;
const JUMP_SPEED = 640;

export const KI_MAX = 100;
const KI_CHARGE_PER_SEC = 25; // segurando C: 0% -> 100% em 4s
export const KI_SHOT_COST = 10; // cada bolinha gasta 10%

// Caixa de colisão em pixels do FRAME de movimento (o Phaser aplica a escala sozinho).
const BODY_W = 55;
const BODY_H = 190;

type Facing = -1 | 1;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private keys!: Record<
    'left' | 'right' | 'a' | 'd' | 'up' | 'w' | 'space' | 'shift' | 'c' | 'q',
    Phaser.Input.Keyboard.Key
  >;
  private facing: Facing = 1;

  /** Ki atual (0 a 100). */
  ki = 0;
  private shooting = false;
  private chargeIntroDone = false;

  /** Cria as animações a partir dos frames recortados (chamar uma vez, no create da cena). */
  static createAnimations(scene: Phaser.Scene): void {
    const make = (
      key: string,
      texture: string,
      frames: readonly number[],
      frameRate: number,
      repeat: number,
    ) => {
      scene.anims.create({
        key,
        frames: frames.map((frame) => ({ key: texture, frame })),
        frameRate,
        repeat,
      });
    };

    make('idle', PLAYER_TEXTURE, PLAYER_FRAMES.idle, 1, -1);
    make('walk-right', PLAYER_TEXTURE, PLAYER_FRAMES.walk_right, 9, -1);
    make('walk-left', PLAYER_TEXTURE, PLAYER_FRAMES.walk_left, 9, -1);
    make('run-right', PLAYER_TEXTURE, PLAYER_FRAMES.run_right, 14, -1);
    make('run-left', PLAYER_TEXTURE, PLAYER_FRAMES.run_left, 14, -1);
    make('jump', PLAYER_TEXTURE, PLAYER_FRAMES.jump, 10, 0); // toca uma vez e segura o último frame
    make('fall', PLAYER_TEXTURE, PLAYER_FRAMES.fall, 1, -1);

    make('charge-start', KI_TEXTURE, KI_FRAMES.charge_start, 10, 0); // começa a juntar energia
    make('charge-loop', KI_TEXTURE, KI_FRAMES.charge_loop, 12, -1); // aura mexendo enquanto segura C
    make('shoot', KI_TEXTURE, KI_FRAMES.shoot, 14, 0); // o último frame é o disparo
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PLAYER_TEXTURE, PLAYER_FRAMES.idle[0]);
    scene.add.existing(this);
    this.setScale(SCALE);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(BODY_W, BODY_H);
    this.setCollideWorldBounds(true);
    this.syncFrameAnchor();

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
      c: kb.addKey(K.C),
      q: kb.addKey(K.Q),
    };

    // A bolinha sai no último frame (5) da animação de tiro.
    this.on(
      Phaser.Animations.Events.ANIMATION_UPDATE,
      (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
        if (anim.key === 'shoot' && frame.isLast) this.fireKiBall();
      },
    );
    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim: Phaser.Animations.Animation) => {
      if (anim.key === 'shoot') this.shooting = false;
      if (anim.key === 'charge-start') this.chargeIntroDone = true;
    });
  }

  /** A cena escuta 'fire' (x, y, direção) para criar o projétil. */
  private fireKiBall(): void {
    const x = this.x + this.facing * KI_BALL_SPAWN.dx * SCALE;
    const y = this.y - KI_BALL_SPAWN.dy * SCALE;
    this.emit('fire', x, y, this.facing);
  }

  /** Dispara quando tenta atirar sem ki suficiente (a cena pisca a barra). */
  private denyShot(): void {
    this.emit('no-ki');
  }

  override update(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    const left = this.keys.left.isDown || this.keys.a.isDown;
    const right = this.keys.right.isDown || this.keys.d.isDown;
    const dir = (Number(right) - Number(left)) as -1 | 0 | 1;
    const running = this.keys.shift.isDown;
    const wantsJump = this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown;
    const holdingC = this.keys.c.isDown;
    const pressedQ = Phaser.Input.Keyboard.JustDown(this.keys.q);

    if (!holdingC) this.chargeIntroDone = false; // soltou o C: próxima vez toca a intro de novo

    // --- atirar (Q) ---
    if (pressedQ && onGround && !this.shooting) {
      if (this.ki >= KI_SHOT_COST) {
        this.ki -= KI_SHOT_COST;
        this.shooting = true;
        this.setFlipX(this.facing === -1);
        this.anims.play('shoot');
      } else {
        this.denyShot();
      }
    }

    if (this.shooting) {
      this.setVelocityX(0);
    } else if (holdingC && onGround) {
      // --- carregando ki (segurando C) ---
      this.setVelocityX(0);
      this.ki = Math.min(KI_MAX, this.ki + (KI_CHARGE_PER_SEC * delta) / 1000);
      this.setFlipX(this.facing === -1);
      this.anims.play(this.chargeIntroDone ? 'charge-loop' : 'charge-start', true);
    } else {
      // --- movimento normal ---
      this.setVelocityX(dir * (running ? RUN_SPEED : WALK_SPEED));
      if (dir !== 0) this.facing = dir;
      if (wantsJump && onGround) this.setVelocityY(-JUMP_SPEED);

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

    this.syncFrameAnchor();
  }

  /**
   * Os frames de movimento e de ki vêm de planilhas com tamanhos de célula diferentes.
   * Ajusta a origem (pés) e o offset da caixa de colisão para o frame atual, para o
   * personagem não "pular" de posição quando a animação troca de planilha.
   */
  private syncFrameAnchor(): void {
    const frame = this.frame;
    const isKi = frame.texture.key === KI_TEXTURE;
    const w = isKi ? frame.realWidth : PLAYER_FRAME_WIDTH;
    const h = isKi ? frame.realHeight : PLAYER_FRAME_HEIGHT;
    const feetY = isKi ? KI_FEET_Y : PLAYER_FRAME_HEIGHT - 1;

    this.setOrigin(0.5, feetY / h);
    (this.body as Phaser.Physics.Arcade.Body).setOffset((w - BODY_W) / 2, feetY - BODY_H);
  }
}
