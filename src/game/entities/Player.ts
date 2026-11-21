import * as Phaser from 'phaser';
import { FORM_SHEETS } from '../formSheets';
import { KI_BALL_SPAWN, KI_FEET_Y, KI_FRAMES, KI_FRAME_HEIGHT, KI_FRAME_WIDTH } from '../kiSheet';
import {
  AIR_FRAMES,
  FORM_IDS,
  FORM_LABEL,
  KI_SHOT_COST,
  PowerState,
  type FormId,
} from '../forms';

export const KI_TEXTURE = 'ki';

export const SCALE = 0.55;
const WALK_SPEED = 150;
const RUN_SPEED = 300;
const JUMP_SPEED = 640;

// Velocidade das animações (quadros por segundo). Mais baixo = a troca dos pés fica mais visível.
const IDLE_FPS = 5;
const WALK_FPS = 8; // 8 frames -> um ciclo completo (dois passos) a cada 1s
const RUN_FPS = 12; // 8-10 frames -> ciclo de ~0,7-0,85s
const TRANSFORM_FPS = 7; // 6 frames -> ~0,85s
const REVERT_FPS = 14;
const LAND_MS = 140; // quanto tempo mostra o frame de aterrissagem

// Caixa de colisão em pixels do FRAME (o Phaser aplica a escala sozinho).
const BODY_W = 55;
const BODY_H = 190;

type Facing = -1 | 1;

/** Tamanho da célula e altura dos pés de cada textura (para reancorar o sprite a cada frame). */
const ANCHORS: Record<string, { w: number; h: number; feetY: number }> = {
  [KI_TEXTURE]: { w: KI_FRAME_WIDTH, h: KI_FRAME_HEIGHT, feetY: KI_FEET_Y },
};
for (const id of FORM_IDS) {
  const { body, aura } = FORM_SHEETS[id];
  ANCHORS[body.texture] = { w: body.w, h: body.h, feetY: body.feetY };
  if (aura) ANCHORS[aura.texture] = { w: aura.w, h: aura.h, feetY: aura.feetY };
}

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

  private shooting = false;
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

  /** Cria todas as animações (chamar uma vez, no create da cena). */
  static createAnimations(scene: Phaser.Scene): void {
    const make = (key: string, texture: string, frames: readonly (number | undefined)[], frameRate: number, repeat: number) => {
      if (scene.anims.exists(key)) return;
      scene.anims.create({
        key,
        frames: frames.filter((f): f is number => f !== undefined).map((frame) => ({ key: texture, frame })),
        frameRate,
        repeat,
      });
    };

    for (const id of FORM_IDS) {
      const { body, aura } = FORM_SHEETS[id];
      const f = body.frames;
      const air = AIR_FRAMES[id];
      const pick = (idx: number[]) => idx.map((i) => f.air[i]);

      make(`${id}:idle`, body.texture, f.idle, IDLE_FPS, -1);
      make(`${id}:walk-right`, body.texture, f.walk_right, WALK_FPS, -1);
      make(`${id}:walk-left`, body.texture, f.walk_left, WALK_FPS, -1);
      make(`${id}:run-right`, body.texture, f.run_right, RUN_FPS, -1);
      make(`${id}:run-left`, body.texture, f.run_left, RUN_FPS, -1);
      make(`${id}:jump`, body.texture, pick(air.jump), 12, 0); // toca uma vez e segura o último frame
      make(`${id}:fall`, body.texture, pick(air.fall), 6, 0);
      make(`${id}:land`, body.texture, pick(air.land), 14, 0);

      if (aura) {
        const a = aura.frames.aura;
        const t = aura.frames.transform;
        make(`${id}:charge-start`, aura.texture, a.slice(0, 3), 10, 0); // aura começa a crescer
        make(`${id}:charge-loop`, aura.texture, a.slice(3), 8, -1); // aura cheia mexendo
        make(`${id}:transform`, aura.texture, t, TRANSFORM_FPS, 0); // cabelo muda + aura explode
        make(`${id}:revert`, aura.texture, [...t].reverse(), REVERT_FPS, 0); // o inverso, mais rápido
      }
    }

    // forma normal: carregar ki e atirar usam a planilha de ki
    make('normal:charge-start', KI_TEXTURE, KI_FRAMES.charge_start, 10, 0);
    make('normal:charge-loop', KI_TEXTURE, KI_FRAMES.charge_loop, 12, -1);
    make('normal:shoot', KI_TEXTURE, KI_FRAMES.shoot, 14, 0); // o último frame é o disparo
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
      g: kb.addKey(K.G),
      k: kb.addKey(K.K),
      h: kb.addKey(K.H),
    };

    // A bolinha sai no último frame da animação de tiro.
    this.on(
      Phaser.Animations.Events.ANIMATION_UPDATE,
      (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
        if (anim.key.endsWith(':shoot') && frame.isLast) this.fireKiBall();
      },
    );
    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim: Phaser.Animations.Animation) => {
      if (anim.key.endsWith(':shoot')) this.shooting = false;
      if (anim.key.endsWith(':charge-start')) this.chargeIntroDone = true;
      if (anim.key.endsWith(':transform')) this.finishTransform();
      if (anim.key.endsWith(':revert')) this.finishRevert();
    });
  }

  /** A cena escuta 'fire' (x, y, direção) para criar o projétil. */
  private fireKiBall(): void {
    const x = this.x + this.facing * KI_BALL_SPAWN.dx * SCALE;
    const y = this.y - KI_BALL_SPAWN.dy * SCALE;
    this.emit('fire', x, y, this.facing);
  }

  /** Avisos para a HUD. */
  private denyShot(): void {
    this.emit('no-ki');
  }
  private hint(text: string): void {
    this.emit('hint', text);
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
    this.shooting = false;
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
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) {
      this.locked = true;
      this.shooting = false;
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

    // --- G / K: transformar (só no chão) ---
    if (onGround) {
      if (pressedG) this.toggleForm('ssj');
      else if (pressedK) this.toggleForm('kaioken');
      if (this.locked) {
        this.syncFrameAnchor();
        return;
      }
    }

    const form = this.visualForm;
    const k = (name: string) => `${form}:${name}`;

    // --- atirar (Q): só existe sprite de tiro na forma normal ---
    if (pressedQ && onGround && !this.shooting) {
      if (form !== 'normal') {
        this.hint('Ainda não há sprite de tiro para essa forma');
      } else if (this.power.ki >= KI_SHOT_COST) {
        this.power.ki -= KI_SHOT_COST;
        this.shooting = true;
        this.setFlipX(this.facing === -1);
        this.anims.play('normal:shoot');
      } else {
        this.denyShot();
      }
    }

    // --- gasto da forma ativa (Kaioken = vida, Super Sayajin = ki) ---
    if (this.power.form !== 'normal') {
      if (holdingC && onGround && !this.shooting) this.power.charge(delta); // carregar compensa parte do gasto
      if (this.power.drain(delta)) {
        this.beginRevert();
        if (this.locked) {
          this.syncFrameAnchor();
          return;
        }
      }
    } else if (holdingC && onGround && !this.shooting) {
      this.power.charge(delta);
    }

    if (this.shooting) {
      this.setVelocityX(0);
    } else if (holdingC && onGround) {
      // --- carregando ki (segurando C) ---
      this.setVelocityX(0);
      this.setFlipX(this.facing === -1);
      this.playAnim(this.chargeIntroDone ? k('charge-loop') : k('charge-start'));
    } else {
      // --- movimento normal ---
      this.setVelocityX(dir * (running ? RUN_SPEED : WALK_SPEED));
      if (dir !== 0) this.facing = dir;
      if (wantsJump && onGround) this.setVelocityY(-JUMP_SPEED);

      // andar/correr têm frames próprios para cada lado; o resto só existe virado para a
      // direita, então espelhamos (flipX) quando olha para a esquerda.
      const side = this.facing === 1 ? 'right' : 'left';
      if (!onGround) {
        this.setFlipX(this.facing === -1);
        this.playAnim(body.velocity.y < 0 ? k('jump') : k('fall'));
      } else if (dir !== 0) {
        this.landTimer = 0;
        this.setFlipX(false);
        this.playAnim(k(`${running ? 'run' : 'walk'}-${side}`));
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
   * Os frames vêm de planilhas com tamanhos de célula diferentes (corpo, aura, ki).
   * Ajusta a origem (pés) e o offset da caixa de colisão para o frame atual, para o
   * personagem não "pular" de posição quando a animação troca de planilha.
   */
  private syncFrameAnchor(): void {
    const a = ANCHORS[this.frame.texture.key];
    if (!a) return;
    this.setOrigin(0.5, a.feetY / a.h);
    (this.body as Phaser.Physics.Arcade.Body).setOffset((a.w - BODY_W) / 2, a.feetY - BODY_H);
  }
}
