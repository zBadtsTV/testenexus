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
export const KI_SHOT_COST = 10; // cada bolinha gasta 10% de ki

export const KAIOKEN_HP_DRAIN_PER_SEC = 1.5; // % da vida por segundo enquanto o Kaioken está ativo
export const SSJ_KI_DRAIN_PER_SEC = 4; // % de ki por segundo enquanto Super Sayajin está ativo

export const FORM_LABEL: Record<FormId, string> = {
  normal: 'Normal',
  ssj: 'Super Sayajin',
  kaioken: 'Kaioken',
};

/**
 * Quais frames da linha de "ar" de cada forma viram pulo / queda / aterrissagem.
 * A folha normal tem 11 frames de ar, as de SSJ e Kaioken têm 6.
 */
export const AIR_FRAMES: Record<FormId, { jump: number[]; fall: number[]; land: number[] }> = {
  normal: { jump: [1, 2, 3, 4], fall: [5, 6], land: [7, 8] },
  ssj: { jump: [1, 2, 3], fall: [4], land: [5] },
  kaioken: { jump: [1, 2, 3], fall: [4], land: [5] },
};

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

  restore(): void {
    this.hp = HP_MAX;
    this.ki = KI_MAX;
  }
}
