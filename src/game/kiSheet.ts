// GERADO por tools/slice_ki.py - não edite à mão.
export const KI_FRAME_WIDTH = 390;
export const KI_FRAME_HEIGHT = 335;
/** Distância (em px do frame) do topo da célula até os pés do personagem. */
export const KI_FEET_Y = 313;

/** Índices de frame dentro de public/assets/ki.png (grade 5 colunas). */
export const KI_FRAMES = {
  charge_start: [0, 1, 2, 3, 4],
  charge_loop: [5, 6, 7, 8, 9],
  shoot: [10, 11, 12, 13, 14],
} as const;

/** Onde a bolinha nasce, relativo aos pés (px do frame, sem escala): à frente (+x) e acima (+y). */
export const KI_BALL_SPAWN = { dx: 180.0, dy: 108.2 };
export const KI_BALL_WIDTH = 117;
export const KI_BALL_HEIGHT = 64;
