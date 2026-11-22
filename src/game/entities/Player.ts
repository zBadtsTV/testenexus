import * as Phaser from 'phaser';
import { FORM_SHEETS } from '../sheets';
import { OVERRIDE_ANCHOR, SPRITE_OVERRIDES, shouldMirrorMovement } from '../spriteOverrides';
import {
  AIR_FRAMES,
  FORM_IDS,
  FORM_LABEL,
  KI_SHOT_COST,
  PowerState,
  SHOT_BIG_FROM,
  SHOT_CHARGE_PER_SEC,
  SHOT_MAX_COST,
  TRANSFORM_FRAMES,
  shotSize,
  type FormId,
} from '../forms';

export const SCALE = 0.55;
const WALK_SPEED = 150;
const RUN_SPEED = 300;
const JUMP_SPEED = 640;

// Velocidade das animações (quadros por segundo). Mais baixo = a troca dos pés fica mais visível.
const IDLE_FPS = 5;
const WALK_FPS = 8; // 8 frames -> um ciclo completo (dois passos) a cada 1s
const RUN_FPS = 12; // 7-8 frames -> ciclo de ~0,6-0,7s
const CHARGE_FPS = 10;
const TRANSFORM_FPS = 9; // 8 frames -> ~0,9s
const REVERT_FPS = 10; // 4 frames -> ~0,4s
const LAND_MS = 140; // quanto tempo mostra o frame de aterrissagem

// Tiro: frames de cada animação (índices dentro das linhas "small"/"big" da planilha de tiro).
const SHOT_FPS = 12;
const FIRE_AT = 1; // frame da linha small em que a bola sai da mão

// Caixa de colisão em pixels do FRAME (o Phaser aplica a escala sozinho).
const BODY_W = 55;
const BODY_H = 190;

type Facing = -1 | 1;
type ShotState = 'idle' | 'charging' | 'releasing';

/** Tamanho da célula, pés e centro de cada textura (para reancorar o sprite a cada frame). */
const ANCHORS: Record<string, { w: number; h: number; feetY: number; ax: number }> = {};
for (const id of FORM_IDS) {
  const { body, aura, shot } = FORM_SHEETS[id];
  for (const s of [body, aura, shot]) {
    if (s) ANCHORS[s.texture] = { w: s.w, h: s.h, feetY: s.feetY, ax: s.anchorX };
  }
}
for (const sheet of SPRITE_OVERRIDES) ANCHORS[sheet.texture] = OVERRIDE_ANCHOR;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private keys!: Record<
    'left' | 'right' | 'a' | 'd' | 'up' | 'w' | 'space' | 'shift' | 'c' | 'q' | 'g' | 'k' | 'h',
    Phaser.Input.Keyboard.Key
  >;
  private facing: Facing = 1;

  /** Vida, ki e forma (lógica pura, sem Phaser). */
  readonly power = new PowerState();
  /** Forma que está sendo DESENHADA (só muda quando a animação de transformação termina). */
  private visualForm: FormId = 'normal';
  /** Travado numa animação de transformação / destransformação. */
  private locked = false;
  private pendingForm: FormId | null = null;

  // tiro (Q): toque = bolinha; segurar = gasta mais ki, solta uma bola grande
  private shotState: ShotState = 'idle';
  private shotSpent = 0;
  private shotBig = false;
  private shotPower = 1;
  private shotRow: 'small' | 'big' = 'small';
  private fireFrame = -1;

  private chargeIntroDone = false;
  private wasOnGround = false;
  private landTimer = 0;

  get form(): FormId {
    return this.power.form;
  }
  get ki(): number {
    return this.power.ki;
  }
  get hp(): number {
    return this.power.hp;
  }
  /** Quanto de ki o tiro segurado já gastou (0 se não está carregando). */
  get shotCharge(): number {
    return this.shotState === 'charging' ? this.shotSpent : 0;
  }

  /** Cria todas as animações (chamar uma vez, no create da cena). */
  static createAnimations(scene: Phaser.Scene): void {
    const make = (key: string, texture: string, frames: readonly (number | undefined)[], frameRate: number, repeat: number) => {
      if (scene.anims.exists(key)) return;
      scene.anims.create({
        key,
        frames: frames.filter((fr): fr is number => fr !== undefined).map((frame) => ({ key: texture, frame })),
        frameRate,
        repeat,
      });
    };

    for (const id of FORM_IDS) {
      const { body, aura, shot } = FORM_SHEETS[id];
      const f = body.frames;
      const pick = (idx: number[]) => idx.map((i) => f.air[i]);

      make(`${id}:idle`, body.texture, f.idle, IDLE_FPS, -1);
      make(`${id}:walk-right`, body.texture, f.walk_right, WALK_FPS, -1);
      make(`${id}:walk-left`, body.texture, f.walk_left, WALK_FPS, -1);
      make(`${id}:run-right`, body.texture, f.run_right, RUN_FPS, -1);
      make(`${id}:run-left`, body.texture, f.run_left, RUN_FPS, -1);
      make(`${id}:jump`, body.texture, pick(AIR_FRAMES.jump), 12, 0); // toca uma vez e segura o último frame
      make(`${id}:fall`, body.texture, pick(AIR_FRAMES.fall), 6, 0);
      make(`${id}:land`, body.texture, pick(AIR_FRAMES.land), 14, 0);

      if (aura) {
        make(`${id}:charge-start`, aura.texture, aura.frames.charge_start, 10, 0);
        make(`${id}:charge-loop`, aura.texture, aura.frames.charge, CHARGE_FPS, -1); // carregando ki (aura)
        const t = aura.frames.transform;
        if (t) {
          make(`${id}:transform`, aura.texture, TRANSFORM_FRAMES.to.map((i) => t[i]), TRANSFORM_FPS, 0);
          make(`${id}:revert`, aura.texture, TRANSFORM_FRAMES.back.map((i) => t[i]), REVERT_FPS, 0);
        }
      }

      // tiro: segurar Q (mão com a bola crescendo) e soltar (bola pequena ou grande)
      const sm = shot.frames.small;
      const hold = shot.frames.hold;
      make(`${id}:shot-charge`, shot.texture, hold.slice(0, 4), 9, 0);
      make(`${id}:shot-charge-big`, shot.texture, hold.slice(4), 8, 0);
      make(`${id}:shot-small`, shot.texture, sm, SHOT_FPS, 0);
      make(`${id}:shot-big`, shot.texture, [hold.at(-1), sm[1], sm[2]], SHOT_FPS, 0);
    }
    for (const sheet of SPRITE_OVERRIDES) {
      for (const key of sheet.keys) {
        scene.anims.remove(key);
        make(key, sheet.texture, sheet.frames, sheet.fps, sheet.repeat);
      }
    }
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, FORM_SHEETS.normal.body.texture, FORM_SHEETS.normal.body.frames.idle[0]);
    scene.add.existing(this);
    this.setScale(SCALE);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(BODY_W, BODY_H);
    this.setCollideWorldBounds(true);
    this.syncFrameAnchor();

    const kb = scene.input.keyboard;
    if (!kb) throw new Error('Keyboard input is unavailable');
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
      g: kb.addKey(K.G),
      k: kb.addKey(K.K),
      h: kb.addKey(K.H),
    };

    // A bola sai da mão no frame FIRE_AT da animação de tiro.
    this.on(
      Phaser.Animations.Events.ANIMATION_UPDATE,
      (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
        if (this.shotState === 'releasing' && anim.key.includes(':shot-') && frame.textureFrame === this.fireFrame) {
          this.fireKiBall();
        }
      },
    );
    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim: Phaser.Animations.Animation) => {
      if (anim.key.endsWith(':shot-small') || anim.key.endsWith(':shot-big')) this.shotState = 'idle';
      if (anim.key.endsWith(':charge-start')) this.chargeIntroDone = true;
      if (anim.key.endsWith(':transform')) this.finishTransform();
      if (anim.key.endsWith(':revert')) this.finishRevert();
    });
  }

  /** A cena escuta 'fire' (x, y, direção, tamanho, forma) para criar o projétil. */
  private fireKiBall(): void {
    const ball = FORM_SHEETS[this.visualForm].shot.ball?.[this.shotRow];
    if (!ball) return;
    const x = this.x + this.facing * ball.dx * SCALE;
    const y = this.y - ball.dy * SCALE;
    this.emit('fire', x, y, this.facing, this.shotPower, this.visualForm);
    this.fireFrame = -1; // só uma bola por tiro
  }

  /** Avisos para a HUD. */
  private denyShot(): void {
    this.emit('no-ki');
  }
  private hint(text: string): void {
    this.emit('hint', text);
  }

  // ---------------------------------------------------------------- tiro (Q)
  private startShot(): void {
    this.power.spendKi(KI_SHOT_COST);
    this.shotSpent = KI_SHOT_COST;
    this.shotBig = false;
    this.shotState = 'charging';
    this.setFlipX(this.facing === -1);
    this.anims.play(`${this.visualForm}:shot-charge`);
  }

  /** Segurando Q: vai gastando mais ki; passou de SHOT_BIG_FROM, a bola da mão vira a grande. */
  private chargeShot(delta: number): void {
    if (this.shotSpent < SHOT_MAX_COST && this.power.ki > 0) {
      const want = Math.min((SHOT_CHARGE_PER_SEC * delta) / 1000, SHOT_MAX_COST - this.shotSpent);
      this.shotSpent += this.power.spendKi(want);
    }
    if (!this.shotBig && this.shotSpent >= SHOT_BIG_FROM) {
      this.shotBig = true;
      this.anims.play(`${this.visualForm}:shot-charge-big`);
    }
  }

  private releaseShot(): void {
    const form = this.visualForm;
    this.shotRow = this.shotBig ? 'big' : 'small';
    this.shotPower = shotSize(this.shotSpent);
    this.fireFrame = FORM_SHEETS[form].shot.frames.small[FIRE_AT] ?? -1;
    this.shotState = 'releasing';
    this.anims.play(`${form}:shot-${this.shotRow}`);
  }

  // ---------------------------------------------------------------- transformações
  private toggleForm(target: Exclude<FormId, 'normal'>): void {
    const p = this.power;
    if (p.form === target) {
      this.beginRevert(); // apertar G/K de novo volta ao normal
      return;
    }
    if (p.form !== 'normal') {
      this.hint(`Volte à forma normal antes (${target === 'ssj' ? 'G' : 'K'} não funciona agora)`);
      return;
    }
    if (target === 'ssj' && !p.canGoSuperSaiyan()) {
      this.hint('Super Sayajin precisa de 100% de ki: segure C até a barra ficar amarela');
      this.denyShot();
      return;
    }
    if (target === 'kaioken' && !p.canGoKaioken()) {
      this.hint('Vida baixa demais para o Kaioken');
      return;
    }
    this.locked = true;
    this.pendingForm = target;
    this.shotState = 'idle';
    this.setVelocityX(0);
    this.setFlipX(this.facing === -1);
    this.anims.play(`${target}:transform`);
  }

  private finishTransform(): void {
    if (!this.pendingForm) return;
    this.power.form = this.pendingForm;
    this.visualForm = this.pendingForm;
    this.pendingForm = null;
    this.locked = false;
    this.chargeIntroDone = false;
    this.scene.cameras.main.shake(160, 0.004);
    this.hint(`${FORM_LABEL[this.power.form]}!`);
  }

  /** Volta ao normal (manual ou porque a vida/o ki acabou). */
  private beginRevert(): void {
    const from = this.power.form;
    if (from === 'normal') return;
    this.power.form = 'normal'; // o gasto de vida/ki para na hora
    this.shotState = 'idle';
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) {
      this.locked = true;
      this.setVelocityX(0);
      this.setFlipX(this.facing === -1);
      this.anims.play(`${from}:revert`);
    } else {
      this.visualForm = 'normal'; // no ar não trava: troca direto
    }
  }

  private finishRevert(): void {
    this.visualForm = 'normal';
    this.locked = false;
    this.chargeIntroDone = false;
  }

  /**
   * Toca a animação sem reiniciar. O `play(key, true)` do Phaser reinicia animações que
   * já TERMINARAM (pulo, queda...), então aqui comparamos a chave: se é a mesma, não faz nada
   * (animação em loop continua; animação de uma vez só segura o último frame).
   */
  private playAnim(key: string): void {
    if (this.anims.currentAnim?.key === key) return;
    this.anims.play(key);
  }

  // ---------------------------------------------------------------- loop
  override update(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    const left = this.keys.left.isDown || this.keys.a.isDown;
    const right = this.keys.right.isDown || this.keys.d.isDown;
    const dir = (Number(right) - Number(left)) as -1 | 0 | 1;
    const running = this.keys.shift.isDown;
    const wantsJump = this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown;
    const holdingC = this.keys.c.isDown;
    const holdingQ = this.keys.q.isDown;
    const pressedQ = Phaser.Input.Keyboard.JustDown(this.keys.q);
    const pressedG = Phaser.Input.Keyboard.JustDown(this.keys.g);
    const pressedK = Phaser.Input.Keyboard.JustDown(this.keys.k);
    const pressedH = Phaser.Input.Keyboard.JustDown(this.keys.h);

    if (pressedH) this.power.restore(); // atalho de teste: vida e ki cheios
    if (!holdingC) this.chargeIntroDone = false; // soltou o C: próxima vez toca a intro de novo

    if (onGround && !this.wasOnGround) this.landTimer = LAND_MS;
    this.wasOnGround = onGround;
    if (this.landTimer > 0) this.landTimer -= delta;

    // --- transformando / destransformando: só espera a animação acabar ---
    if (this.locked) {
      this.setVelocityX(0);
      this.syncFrameAnchor();
      return;
    }

    // --- G / K: transformar (só no chão, sem estar atirando) ---
    if (onGround && this.shotState === 'idle') {
      if (pressedG) this.toggleForm('ssj');
      else if (pressedK) this.toggleForm('kaioken');
      if (this.locked) {
        this.syncFrameAnchor();
        return;
      }
    }

    // --- Q: começa a carregar o tiro ---
    if (pressedQ && onGround && this.shotState === 'idle' && !holdingC) {
      if (this.power.ki >= KI_SHOT_COST) this.startShot();
      else this.denyShot();
    }

    // --- recarregar ki com C (também dentro das formas) ---
    const chargingKi = holdingC && onGround && this.shotState === 'idle';
    if (chargingKi) this.power.charge(delta);

    // --- segurando Q: gasta mais ki; soltou (ou acabou o ki): lança ---
    if (this.shotState === 'charging') {
      if (holdingQ) this.chargeShot(delta);
      if (!holdingQ || (this.power.ki <= 0 && this.shotSpent < SHOT_MAX_COST)) this.releaseShot();
    }

    // --- gasto da forma ativa (Kaioken = vida, Super Sayajin = ki) ---
    if (this.power.form !== 'normal' && this.power.drain(delta)) {
      this.beginRevert();
      if (this.locked) {
        this.syncFrameAnchor();
        return;
      }
    }

    const form = this.visualForm;
    const k = (name: string) => `${form}:${name}`;

    if (this.shotState !== 'idle') {
      // --- atirando: parado, virado para onde olhava ---
      this.setVelocityX(0);
    } else if (chargingKi) {
      // --- carregando ki (segurando C) ---
      this.setVelocityX(0);
      this.setFlipX(this.facing === -1);
      const hasIntro = this.scene.anims.exists(k('charge-start'));
      this.playAnim(hasIntro && !this.chargeIntroDone ? k('charge-start') : k('charge-loop'));
    } else {
      // --- movimento normal ---
      this.setVelocityX(dir * (running ? RUN_SPEED : WALK_SPEED));
      if (dir !== 0) this.facing = dir;
      if (wantsJump && onGround) this.setVelocityY(-JUMP_SPEED);

      // Andar/correr têm frames próprios para cada lado; o resto só existe virado para a
      // direita, então espelhamos (flipX) quando olha para a esquerda.
      const side = this.facing === 1 ? 'right' : 'left';
      if (!onGround) {
        this.setFlipX(this.facing === -1);
        this.playAnim(body.velocity.y < 0 ? k('jump') : k('fall'));
      } else if (dir !== 0) {
        this.landTimer = 0;
        const movement = k(`${running ? 'run' : 'walk'}-${side}`);
        this.setFlipX(shouldMirrorMovement(movement, this.facing));
        this.playAnim(movement);
      } else if (this.landTimer > 0) {
        this.setFlipX(this.facing === -1);
        this.playAnim(k('land'));
      } else {
        this.setFlipX(this.facing === -1);
        this.playAnim(k('idle'));
      }
    }

    this.syncFrameAnchor();
  }

  /**
   * Os frames vêm de planilhas com células de tamanhos diferentes (corpo, aura, tiro, ki).
   * Ajusta a origem (pés / centro do personagem) e o offset da caixa de colisão para o frame
   * atual, para o personagem não "pular" de posição quando a animação troca de planilha.
   * Com flipX o Phaser espelha a imagem dentro da célula, então o centro também espelha.
   */
  private syncFrameAnchor(): void {
    const a = ANCHORS[this.frame.texture.key];
    if (!a) return;
    const ox = this.flipX ? 1 - a.ax / a.w : a.ax / a.w;
    this.setOrigin(ox, a.feetY / a.h);
    (this.body as Phaser.Physics.Arcade.Body).setOffset(ox * a.w - BODY_W / 2, a.feetY - BODY_H);
  }
}
