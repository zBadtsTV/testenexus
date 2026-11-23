import * as Phaser from 'phaser';
import type { Controls } from '../input';
import { OVERRIDE_ANCHOR } from '../spriteOverrides';
import { PowerState, PUNCH_DAMAGE, RASENGAN_COST, RASENGAN_DAMAGE } from '../forms';
import { SCALE } from './Player';

const WALK_SPEED = 160;
const RUN_SPEED = 320;
const JUMP_SPEED = 660;
const DASH_SPEED = 520;
const BODY_W = 55;
const BODY_H = 180;
const HITSTUN_MS = 260;
const ALL = [0, 1, 2, 3, 4, 5, 6, 7];

type Action = 'none' | 'punch' | 'ras-charge' | 'ras-dash' | 'ras-hit';

/** Naruto: chakra no lugar do ki, soco (E) e Rasengan (Q). Todas as tiras olham para a direita. */
export class Naruto extends Phaser.Physics.Arcade.Sprite {
  readonly character = 'naruto' as const;
  readonly power = new PowerState();
  facing: -1 | 1 = 1;
  private action: Action = 'none';
  private hitDone = false;
  private stun = 0;
  private chargeIntroDone = false;
  private wasOnGround = false;
  private landTimer = 0;

  get hp(): number {
    return this.power.hp;
  }
  get energy(): number {
    return this.power.ki;
  }
  get form(): 'normal' {
    return 'normal';
  }

  static createAnimations(scene: Phaser.Scene): void {
    const make = (key: string, tex: string, frames: number[], frameRate: number, repeat: number) => {
      if (!scene.anims.exists(key))
        scene.anims.create({ key, frames: frames.map((frame) => ({ key: tex, frame })), frameRate, repeat });
    };
    make('naruto:idle', 'naruto_idle', ALL, 7, -1);
    make('naruto:walk', 'naruto_walk', ALL, 10, -1);
    make('naruto:run', 'naruto_run', ALL, 14, -1);
    make('naruto:jump', 'naruto_air', [2, 3], 10, 0);
    make('naruto:fall', 'naruto_air', [4, 5], 8, 0);
    make('naruto:land', 'naruto_air', [6, 7], 14, 0);
    make('naruto:punch', 'naruto_punch', ALL, 18, 0);
    make('naruto:ras-charge', 'naruto_rasengan_a', ALL, 14, 0);
    make('naruto:ras-dash', 'naruto_rasengan_b', ALL, 18, 0);
    make('naruto:ras-hit', 'naruto_rasengan_c', ALL, 16, 0);
    make('naruto:charge-start', 'naruto_charge_a', ALL, 12, 0);
    make('naruto:charge-loop', 'naruto_charge_b', ALL, 12, -1);
  }

  constructor(scene: Phaser.Scene, x: number, y: number, private controls: Controls) {
    super(scene, x, y, 'naruto_idle', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(SCALE);
    (this.body as Phaser.Physics.Arcade.Body).setSize(BODY_W, BODY_H);
    this.setCollideWorldBounds(true);
    this.syncAnchor();

    this.on(Phaser.Animations.Events.ANIMATION_UPDATE, (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      if (this.action === 'punch' && anim.key === 'naruto:punch' && frame.index === 5) this.melee(95, PUNCH_DAMAGE);
      if (this.action === 'ras-hit' && !this.hitDone && frame.index >= 5) {
        this.hitDone = true;
        this.melee(130, RASENGAN_DAMAGE);
        this.scene.cameras.main.shake(140, 0.006);
      }
    });
    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim: Phaser.Animations.Animation) => {
      if (anim.key === 'naruto:charge-start') this.chargeIntroDone = true;
      if (anim.key === 'naruto:punch' || anim.key === 'naruto:ras-hit') this.action = 'none';
      if (anim.key === 'naruto:ras-charge') this.setAction('ras-dash');
      if (anim.key === 'naruto:ras-dash') this.setAction('ras-hit');
    });
  }

  private melee(reach: number, dmg: number): void {
    const rect = new Phaser.Geom.Rectangle(this.facing === 1 ? this.x : this.x - reach, this.y - 95, reach, 70);
    this.emit('melee', rect, dmg, this.facing);
  }

  private setAction(a: Exclude<Action, 'none'>): void {
    this.action = a;
    this.hitDone = false;
    this.setFlipX(this.facing === -1);
    this.anims.play(`naruto:${a}`);
  }

  takeHit(dmg: number, dir: number): boolean {
    const ko = this.power.damage(dmg);
    this.stun = HITSTUN_MS;
    this.action = 'none';
    this.setVelocity(dir * 260, -220);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => this.clearTint());
    return ko;
  }

  respawn(x: number, y: number, hp: number): void {
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.power.hp = hp;
    this.action = 'none';
  }

  private playAnim(key: string): void {
    if (this.anims.currentAnim?.key !== key) this.anims.play(key);
  }

  override update(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    const c = this.controls;
    if (c.pressed('restore')) this.power.restore();
    if (!c.down('charge')) this.chargeIntroDone = false;
    if (onGround && !this.wasOnGround) this.landTimer = 140;
    this.wasOnGround = onGround;
    if (this.landTimer > 0) this.landTimer -= delta;

    if (this.stun > 0) {
      this.stun -= delta;
      this.syncAnchor();
      return;
    }

    if (this.action === 'none') {
      if (c.pressed('punch')) this.setAction('punch');
      else if (c.pressed('shoot') && onGround) {
        if (this.power.ki >= RASENGAN_COST) {
          this.power.spendKi(RASENGAN_COST);
          this.setAction('ras-charge');
        } else {
          this.emit('no-ki');
          this.emit('hint', `Rasengan precisa de ${RASENGAN_COST}% de chakra: segure C`);
        }
      }
    }

    if (this.action !== 'none') {
      const dashing = this.action === 'ras-dash' || (this.action === 'ras-hit' && !this.hitDone);
      if (dashing) this.setVelocityX(this.facing * DASH_SPEED);
      else if (onGround) this.setVelocityX(0);
      this.syncAnchor();
      return;
    }

    const charging = c.down('charge') && onGround;
    if (charging) {
      this.power.charge(delta);
      this.setVelocityX(0);
      this.setFlipX(this.facing === -1);
      this.playAnim(this.chargeIntroDone ? 'naruto:charge-loop' : 'naruto:charge-start');
      this.syncAnchor();
      return;
    }

    const dir = (Number(c.down('right')) - Number(c.down('left'))) as -1 | 0 | 1;
    const running = c.down('run');
    this.setVelocityX(dir * (running ? RUN_SPEED : WALK_SPEED));
    if (dir !== 0) this.facing = dir;
    if (c.down('jump') && onGround) this.setVelocityY(-JUMP_SPEED);
    this.setFlipX(this.facing === -1);
    if (!onGround) this.playAnim(body.velocity.y < 0 ? 'naruto:jump' : 'naruto:fall');
    else if (dir !== 0) this.playAnim(running ? 'naruto:run' : 'naruto:walk');
    else if (this.landTimer > 0) this.playAnim('naruto:land');
    else this.playAnim('naruto:idle');
    this.syncAnchor();
  }

  private syncAnchor(): void {
    const a = OVERRIDE_ANCHOR;
    const ox = this.flipX ? 1 - a.ax / a.w : a.ax / a.w;
    this.setOrigin(ox, a.feetY / a.h);
    (this.body as Phaser.Physics.Arcade.Body).setOffset(ox * a.w - BODY_W / 2, a.feetY - BODY_H);
  }
}
