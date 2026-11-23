import * as Phaser from 'phaser';
import { FORM_SHEETS } from '../sheets';
import { GAME_ASSETS } from '../assets';
import { FIGHTER_STRIPS, SCREEN_IMAGES } from '../fighterAssets';
import type { FormId } from '../forms';
import { FORM_IDS, FORM_LABEL, KI_BALL_DAMAGE, RESPAWN_FALL_DAMAGE, attackDamage } from '../forms';
import { Player, SCALE } from '../entities/Player';
import { Naruto } from '../entities/Naruto';
import { OVERRIDE_ANCHOR, SPRITE_OVERRIDES } from '../spriteOverrides';
import { Controls } from '../input';
import { Hud } from '../ui/Hud';
import type { CharacterId, NetLink, NetMsg } from '../net';

export interface GameConfig {
  mode: 'single' | 'multi';
  character: CharacterId;
  net?: NetLink;
}

type Fighter = Player | Naruto;
interface Target {
  bounds(): Phaser.Geom.Rectangle;
  hit(dmg: number, dir: number): void;
}

const GROUND_HEIGHT = 90;
const kiBallTexture = (form: string) => `ki_ball_${form}`;
const KI_BALL_SPEED = 720;
const SEND_MS = 50;

/** Boneco de treino (modo single). */
class Dummy implements Target {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp = 100;
  private bar: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene, x: number, y: number, colliders: Phaser.GameObjects.GameObject[]) {
    this.sprite = scene.physics.add.sprite(x, y, 'dummy').setOrigin(0.5, 1).setDepth(4);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setDragX(900);
    this.sprite.setCollideWorldBounds(true);
    for (const c of colliders) scene.physics.add.collider(this.sprite, c);
    this.bar = scene.add.graphics().setDepth(6);
  }
  bounds() {
    return this.sprite.getBounds();
  }
  hit(dmg: number, dir: number) {
    this.hp = Math.max(0, this.hp - dmg);
    this.sprite.setVelocity(dir * 180, -160);
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.sprite.clearTint());
    const t = this.scene.add
      .text(this.sprite.x, this.sprite.y - 120, `-${dmg}`, { fontFamily: 'monospace', fontSize: '20px', color: '#ffdd44', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000', 2)
      .setDepth(20);
    this.scene.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 700, onComplete: () => t.destroy() });
    if (this.hp <= 0) {
      this.scene.events.emit('hint', 'Boneco nocauteado! Ele volta em 1s');
      this.scene.time.delayedCall(1000, () => (this.hp = 100));
    }
  }
  draw() {
    const { x, y } = this.sprite;
    this.bar.clear().fillStyle(0x000000, 0.6).fillRect(x - 32, y - 118, 64, 8);
    this.bar.fillStyle(this.hp > 30 ? 0x4cd964 : 0xff4444).fillRect(x - 31, y - 117, 62 * (this.hp / 100), 6);
  }
  destroy() {
    this.sprite.destroy();
    this.bar.destroy();
  }
}

/** O outro jogador (multiplayer): só desenha o que chega pela rede. */
class Remote implements Target {
  sprite: Phaser.GameObjects.Sprite;
  hp = 100;
  energy = 0;
  form = 'normal';
  private tx = 0;
  private ty = 0;
  constructor(private scene: Phaser.Scene, private net: NetLink, x: number, y: number) {
    this.sprite = scene.add.sprite(x, y, net.remoteCharacter === 'naruto' ? 'naruto_idle' : 'movement_walk', 0).setScale(SCALE).setDepth(4);
    this.sprite.setOrigin(0.5, OVERRIDE_ANCHOR.feetY / OVERRIDE_ANCHOR.h);
    this.tx = x;
    this.ty = y;
  }
  apply(m: Extract<NetMsg, { t: 's' }>) {
    this.tx = m.x;
    this.ty = m.y;
    if (this.scene.textures.exists(m.tex)) this.sprite.setTexture(m.tex, m.fr);
    this.sprite.setFlipX(m.flip).setOrigin(m.ox, m.oy);
    this.hp = m.hp;
    this.energy = m.en;
    this.form = m.form;
  }
  step() {
    this.sprite.x += (this.tx - this.sprite.x) * 0.45;
    this.sprite.y += (this.ty - this.sprite.y) * 0.45;
  }
  bounds() {
    const w = 55 * SCALE, h = 180 * SCALE;
    return new Phaser.Geom.Rectangle(this.sprite.x - w / 2, this.sprite.y - h, w, h);
  }
  hit(dmg: number, dir: number) {
    this.net.send({ t: 'hit', dmg, dir });
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.sprite.clearTint());
  }
}

export class GameScene extends Phaser.Scene {
  private cfg!: GameConfig;
  private controls!: Controls;
  private player!: Fighter;
  private spawn = { x: 480, y: 300 };
  private kiBalls!: Phaser.Physics.Arcade.Group;
  private remoteBalls!: Phaser.Physics.Arcade.Group;
  private solids: Phaser.GameObjects.GameObject[] = [];
  private dummies: Dummy[] = [];
  private remote?: Remote;
  private hud!: Hud;
  private enemyHud?: Hud;
  private hintText!: Phaser.GameObjects.Text;
  private formText!: Phaser.GameObjects.Text;
  private hintTime = 0;
  private sendTimer = 0;
  private ko = false;
  private offNet?: () => void;

  constructor() {
    super('GameScene');
  }

  init(data: GameConfig): void {
    this.cfg = data;
    this.solids = [];
    this.dummies = [];
    this.remote = undefined;
    this.ko = false;
  }

  preload(): void {
    for (const id of FORM_IDS) {
      const { body, aura, shot } = FORM_SHEETS[id];
      for (const sheet of [body, aura, shot]) {
        if (sheet) this.load.spritesheet(sheet.texture, GAME_ASSETS[sheet.texture] ?? sheet.file, { frameWidth: sheet.w, frameHeight: sheet.h });
      }
      this.load.image(kiBallTexture(id), GAME_ASSETS[kiBallTexture(id)] ?? '');
    }
    for (const sheet of new Map(SPRITE_OVERRIDES.map((s) => [s.texture, s])).values()) {
      this.load.spritesheet(sheet.texture, sheet.url, { frameWidth: OVERRIDE_ANCHOR.w, frameHeight: OVERRIDE_ANCHOR.h });
    }
    for (const [tex, url] of Object.entries(FIGHTER_STRIPS)) {
      this.load.spritesheet(tex, url, { frameWidth: OVERRIDE_ANCHOR.w, frameHeight: OVERRIDE_ANCHOR.h });
    }
    this.load.image('hud_naruto', SCREEN_IMAGES.hud_naruto);
    this.load.image('hud_goku', SCREEN_IMAGES.hud_goku);
    this.load.image('arena', SCREEN_IMAGES.arena);
  }

  create(): void {
    const { width, height } = this.scale;
    this.controls = new Controls(this);
    Player.createAnimations(this);
    Naruto.createAnimations(this);
    this.makeDummyTexture();

    if (this.cfg.mode === 'multi') this.buildArena();
    else this.buildTrainingGround();

    const C = this.cfg.character === 'naruto' ? Naruto : Player;
    this.player = new C(this, this.spawn.x, this.spawn.y, this.controls);
    this.player.setDepth(5);
    for (const s of this.solids) this.physics.add.collider(this.player, s);
    if (this.cfg.mode === 'multi') this.physics.world.setBoundsCollision(true, true, true, false);

    this.kiBalls = this.physics.add.group({ allowGravity: false });
    this.remoteBalls = this.physics.add.group({ allowGravity: false });

    this.player.on('fire', (x: number, y: number, dir: 1 | -1, size: number, form: FormId) => {
      this.spawnKiBall(this.kiBalls, x, y, dir, size, form).setData('dmg', attackDamage(KI_BALL_DAMAGE * size, form));
      this.cfg.net?.send({ t: 'ball', x, y, dir, size, form });
    });
    this.player.on('melee', (rect: Phaser.Geom.Rectangle, dmg: number, dir: number) => {
      for (const t of this.targets()) if (Phaser.Geom.Rectangle.Overlaps(rect, t.bounds())) t.hit(dmg, dir);
    });
    this.player.on('no-ki', () => (this.hud.flash = 350));
    this.player.on('hint', (text: string) => this.showHint(text));
    this.events.on('hint', (text: string) => this.showHint(text));

    this.hud = new Hud(this, this.cfg.character, 8, 6, 340);
    this.formText = this.add.text(18, 72, '', { fontFamily: 'monospace', fontSize: '15px', fontStyle: 'bold', color: '#fff' }).setShadow(1, 1, '#000', 3).setDepth(33);
    this.hintText = this.add
      .text(width / 2, 150, '', { fontFamily: 'monospace', fontSize: '20px', fontStyle: 'bold', align: 'center', color: '#fff' })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000', 3)
      .setDepth(40)
      .setAlpha(0);

    if (this.cfg.mode === 'single') {
      this.add
        .text(width - 12, height - 10,
          '← → andar · Shift correr · Espaço pular · E soco · C carregar · Q ' + (this.cfg.character === 'naruto' ? 'Rasengan' : 'ki (segure) · G SSJ · K Kaioken') + ' · H restaurar',
          { fontFamily: 'monospace', fontSize: '12px', color: '#fff' })
        .setOrigin(1, 1)
        .setShadow(1, 1, '#000', 2)
        .setDepth(30);
      this.game.events.on('spawn-dummy', this.spawnDummy, this);
      this.events.once('shutdown', () => this.game.events.off('spawn-dummy', this.spawnDummy, this));
    }

    const net = this.cfg.net;
    if (net) {
      this.remote = new Remote(this, net, net.isHost ? 710 : 250, 260);
      this.enemyHud = new Hud(this, net.remoteCharacter, width - 348, 6, 340);
      this.offNet = net.onMessage((m) => this.onNet(m));
      net.onClose(() => this.showHint('O outro jogador saiu da sala'));
      this.events.once('shutdown', () => this.offNet?.());
    }
  }

  private targets(): Target[] {
    return this.remote ? [this.remote] : this.dummies;
  }

  private onNet(m: NetMsg): void {
    if (m.t === 's') this.remote?.apply(m);
    else if (m.t === 'hit') this.damagePlayer(m.dmg, m.dir);
    else if (m.t === 'ball') this.spawnKiBall(this.remoteBalls, m.x, m.y, m.dir as 1 | -1, m.size, m.form);
  }

  private damagePlayer(dmg: number, dir: number): void {
    if (this.ko) return;
    if (this.player.takeHit(dmg, dir)) this.knockOut();
  }

  private knockOut(): void {
    this.ko = true;
    this.showHint('K.O.!');
    this.cameras.main.shake(250, 0.01);
    this.time.delayedCall(1500, () => {
      this.player.respawn(this.spawn.x, this.spawn.y, 100);
      this.ko = false;
    });
  }

  private spawnDummy(): void {
    if (this.dummies.length >= 3) this.dummies.shift()?.destroy();
    const x = Phaser.Math.Clamp(this.player.x + this.player.facing * 160, 60, this.scale.width - 60);
    this.dummies.push(new Dummy(this, x, this.player.y - 40, this.solids));
    this.showHint('Boneco de treino! Bata com E, atire com Q');
  }

  private buildTrainingGround(): void {
    const { width, height } = this.scale;
    const ground = this.add.rectangle(width / 2, height - GROUND_HEIGHT / 2, width, GROUND_HEIGHT, 0x4caf50);
    this.add.rectangle(width / 2, height - GROUND_HEIGHT + 4, width, 8, 0x66d36b);
    this.physics.add.existing(ground, true);
    this.solids.push(ground);
    this.spawn = { x: width / 2, y: height - GROUND_HEIGHT };
  }

  /** Arena flutuante (só multiplayer): plataforma principal + 3 flutuantes atravessáveis por baixo. */
  private buildArena(): void {
    this.add.image(0, 0, 'arena').setOrigin(0).setDisplaySize(960, 540).setDepth(-10);
    const plat = (x0: number, x1: number, y: number, oneWay: boolean) => {
      const r = this.add.rectangle((x0 + x1) / 2, y + 10, x1 - x0, 20, 0, 0);
      this.physics.add.existing(r, true);
      const b = r.body as Phaser.Physics.Arcade.StaticBody;
      if (oneWay) {
        b.checkCollision.down = false;
        b.checkCollision.left = false;
        b.checkCollision.right = false;
      }
      this.solids.push(r);
    };
    plat(70, 892, 278, false);
    plat(182, 362, 186, true);
    plat(382, 574, 112, true);
    plat(596, 778, 186, true);
    this.spawn = this.cfg.net?.isHost === false ? { x: 710, y: 270 } : { x: 250, y: 270 };
  }

  private makeDummyTexture(): void {
    if (this.textures.exists('dummy')) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x5d3a1a).fillRect(26, 70, 8, 40);
    g.fillStyle(0x3b2410).fillRect(10, 106, 40, 6);
    g.fillStyle(0xc9a26b).fillRoundedRect(8, 12, 44, 62, 14);
    g.lineStyle(3, 0x7a5528).strokeRoundedRect(8, 12, 44, 62, 14);
    g.fillStyle(0xd94040).fillCircle(30, 40, 9);
    g.fillStyle(0xffffff).fillCircle(30, 40, 4);
    g.fillStyle(0x7a5528).fillRect(26, 0, 8, 14);
    g.generateTexture('dummy', 60, 112);
    g.destroy();
  }

  override update(_time: number, delta: number): void {
    this.controls.update();
    if (!this.ko) this.player.update(delta);
    const { width, height } = this.scale;

    // caiu da arena
    if (this.player.y > height + 120 && !this.ko) {
      const hp = this.player.hp - RESPAWN_FALL_DAMAGE;
      if (hp <= 0) this.knockOut();
      else {
        this.player.respawn(this.spawn.x, this.spawn.y - 200, hp);
        this.showHint('Caiu da arena! -20 de vida');
      }
    }

    for (const ball of [...this.kiBalls.getChildren(), ...this.remoteBalls.getChildren()] as Phaser.Physics.Arcade.Sprite[]) {
      if (ball.x < -150 || ball.x > width + 150) ball.destroy();
    }
    for (const ball of this.kiBalls.getChildren().slice() as Phaser.Physics.Arcade.Sprite[]) {
      const b = ball.getBounds();
      const t = this.targets().find((tg) => Phaser.Geom.Rectangle.Overlaps(b, tg.bounds()));
      if (t) {
        t.hit(ball.getData('dmg') as number, Math.sign(ball.body?.velocity.x ?? 1));
        ball.destroy();
      }
    }
    for (const ball of this.remoteBalls.getChildren().slice() as Phaser.Physics.Arcade.Sprite[]) {
      if (Phaser.Geom.Rectangle.Overlaps(ball.getBounds(), this.player.getBounds())) ball.destroy();
    }

    for (const d of this.dummies) d.draw();
    this.remote?.step();

    this.sendTimer -= delta;
    if (this.cfg.net && this.sendTimer <= 0) {
      this.sendTimer = SEND_MS;
      const p = this.player;
      this.cfg.net.send({
        t: 's', x: Math.round(p.x), y: Math.round(p.y), tex: p.frame.texture.key, fr: p.frame.name,
        flip: p.flipX, ox: p.originX, oy: p.originY, hp: p.hp, en: p.energy, form: p.form,
      });
    }

    this.hud.update(this.player.hp, this.player.energy, this.player.form, delta);
    if (this.remote && this.enemyHud) this.enemyHud.update(this.remote.hp, this.remote.energy, this.remote.form, delta);
    this.formText.setText(this.player.character === 'goku' ? FORM_LABEL[this.player.form as FormId] : '');
    if (this.hintTime > 0) {
      this.hintTime -= delta;
      this.hintText.setAlpha(Phaser.Math.Clamp(this.hintTime / 400, 0, 1));
    }
  }

  private spawnKiBall(group: Phaser.Physics.Arcade.Group, x: number, y: number, dir: 1 | -1, size: number, form: string) {
    const ball = group.create(x, y, kiBallTexture(form)) as Phaser.Physics.Arcade.Sprite;
    ball.setScale(SCALE * size);
    ball.setFlipX(dir === -1);
    ball.setVelocityX(dir * KI_BALL_SPEED * (size > 1 ? 0.85 : 1));
    ball.setDepth(6);
    return ball;
  }

  private showHint(text: string): void {
    this.hintText.setText(text);
    this.hintTime = 2200;
  }
}
