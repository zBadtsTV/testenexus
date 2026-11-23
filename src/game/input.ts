import * as Phaser from 'phaser';

export type Action = 'left' | 'right' | 'jump' | 'run' | 'charge' | 'shoot' | 'punch' | 'ssj' | 'kaioken' | 'restore';

/** Botões da tela de toque (celular). Escritos pela interface React, lidos pelo jogo. */
export const touchState: Record<Action, boolean> = {
  left: false, right: false, jump: false, run: false, charge: false,
  shoot: false, punch: false, ssj: false, kaioken: false, restore: false,
};

const KEYMAP: Record<Action, string[]> = {
  left: ['LEFT', 'A'],
  right: ['RIGHT', 'D'],
  jump: ['SPACE', 'UP', 'W'],
  run: ['SHIFT'],
  charge: ['C'],
  shoot: ['Q'],
  punch: ['E'],
  ssj: ['G'],
  kaioken: ['K'],
  restore: ['H'],
};

/** Teclado + toque juntos; `pressed` = apertou neste frame. */
export class Controls {
  private keys: Record<Action, Phaser.Input.Keyboard.Key[]>;
  private prev: Partial<Record<Action, boolean>> = {};
  private now: Partial<Record<Action, boolean>> = {};

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) throw new Error('Keyboard input is unavailable');
    const K = Phaser.Input.Keyboard.KeyCodes as unknown as Record<string, number>;
    this.keys = Object.fromEntries(
      (Object.keys(KEYMAP) as Action[]).map((a) => [a, KEYMAP[a].map((k) => kb.addKey(K[k] ?? 0))]),
    ) as Record<Action, Phaser.Input.Keyboard.Key[]>;
  }

  update(): void {
    this.prev = this.now;
    this.now = {};
    for (const a of Object.keys(KEYMAP) as Action[]) {
      this.now[a] = touchState[a] || this.keys[a].some((k) => k.isDown);
    }
  }

  down(a: Action): boolean {
    return !!this.now[a];
  }
  pressed(a: Action): boolean {
    return !!this.now[a] && !this.prev[a];
  }
}
