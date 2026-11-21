// GERADO por tools/slice_sprites.py - não edite à mão.
export const PLAYER_FRAME_WIDTH = 246;
export const PLAYER_FRAME_HEIGHT = 232;

/** Índices de frame dentro de public/assets/player.png (grade 5 colunas). */
export const PLAYER_FRAMES = {
  idle: [0],
  walk_right: [5, 6, 7, 8, 9],
  walk_left: [10, 11, 12, 13, 14],
  run_right: [15, 16, 17, 18, 19],
  run_left: [20, 21, 22, 23, 24],
  jump: [25, 26, 27],
  fall: [30],
} as const;
