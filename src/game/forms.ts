import type { FormId } from './formSheets';

export type { FormId };
export const FORM_IDS: readonly FormId[] = ['normal', 'ssj', 'kaioken'];

// ---------------------------------------------------------------------------
// Balanceamento: tudo que você provavelmente vai querer ajustar fica aqui.
// ---------------------------------------------------------------------------
export const HP_MAX = 100;
export const KI_MAX = 100;
export const MIN_HP = 1; // o Kaioken nunca mata: ao chegar aqui ele desliga sozinho

export const KI_CHARGE_PER_SEC = 25; // segurando C: 0% -> 100% em 4s

// --- tiro de ki: toque = bolinha; segurar Q = gasta mais ki e sai uma bola maior ao soltar ---
export const KI_SHOT_COST = 10; // custo mínimo (toque rápido no Q)
export const SHOT_CHARGE_PER_SEC = 20; // ki extra gasto por segundo segurando Q
export const SHOT_MAX_COST = 60; // teto de ki gasto num único tiro
export const SHOT_BIG_FROM = 25; // a partir desse gasto o tiro vira o "grande"
export const SHOT_BIG_SIZE: [number, number] = [1.8, 3.6]; // tamanho da bola grande (mín, máx) x a bolinha normal

/** Tamanho da bola (múltiplo da bolinha normal) para um tiro que gastou `spent` de ki. */
export function shotSize(spent: number): number {
  if (spent < SHOT_BIG_FROM) return 1;
  const t = Math.min(1, (spent - SHOT_BIG_FROM) / (SHOT_MAX_COST - SHOT_BIG_FROM));
  return SHOT_BIG_SIZE[0] + (SHOT_BIG_SIZE[1] - SHOT_BIG_SIZE[0]) * t;
}

export const KAIOKEN_HP_DRAIN_PER_SEC = 1.5; // % da vida por segundo enquanto o Kaioken está ativo
export const SSJ_KI_DRAIN_PER_SEC = 4; // % de ki por segundo enquanto Super Sayajin está ativo

export const FORM_LABEL: Record<FormId, string> = {
  normal: 'Normal',
  ssj: 'Super Sayajin',
  kaioken: 'Kaioken',
};

/** Quais frames da linha de "ar" (8 frames em todas as formas) viram pulo / queda / aterrissagem. */
export const AIR_FRAMES = { jump: [1, 2, 3], fall: [4, 5], land: [6, 7] };

/** Frames da folha de transformação (11): ida até a forma completa e volta ao normal. */
export const TRANSFORM_FRAMES = { to: [0, 1, 2, 3, 4, 5, 6, 7], back: [7, 8, 9, 10] };

/**
 * Estado de poder do personagem: vida, ki e forma atual. Não depende do Phaser.
 *  - Kaioken gasta VIDA e desliga sozinho ao chegar em MIN_HP.
 *  - Super Sayajin gasta KI e desliga sozinho ao chegar em 0.
 */
export class PowerState {
  hp = HP_MAX;
  ki = 0;
  form: FormId = 'normal';

  charge(deltaMs: number): void {
    this.ki = Math.min(KI_MAX, this.ki + (KI_CHARGE_PER_SEC * deltaMs) / 1000);
  }

  canGoSuperSaiyan(): boolean {
    return this.form === 'normal' && this.ki >= KI_MAX;
  }

  canGoKaioken(): boolean {
    return this.form === 'normal' && this.hp > MIN_HP;
  }

  /** Consome o recurso da forma ativa. Devolve true quando a forma deve acabar. */
  drain(deltaMs: number): boolean {
    if (this.form === 'kaioken') {
      this.hp = Math.max(MIN_HP, this.hp - (KAIOKEN_HP_DRAIN_PER_SEC * deltaMs) / 1000);
      return this.hp <= MIN_HP;
    }
    if (this.form === 'ssj') {
      this.ki = Math.max(0, this.ki - (SSJ_KI_DRAIN_PER_SEC * deltaMs) / 1000);
      return this.ki <= 0;
    }
    return false;
  }

  /** Gasta até `amount` de ki; devolve quanto gastou de fato. */
  spendKi(amount: number): number {
    const spent = Math.min(this.ki, amount);
    this.ki -= spent;
    return spent;
  }

  restore(): void {
    this.hp = HP_MAX;
    this.ki = KI_MAX;
  }
}
