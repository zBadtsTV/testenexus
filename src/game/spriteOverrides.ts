import walk from './assets/movement_walk.png.asset.json';
import run from './assets/movement_run.png.asset.json';
import kaiokenTransform from './assets/kaioken_transform.png.asset.json';
import kaiokenIdle from './assets/kaioken_idle.png.asset.json';
import ssjTransform from './assets/ssj_transform.png.asset.json';

// Uploaded strips face right. Left movement mirrors the same complete cycle.
// Terminal movement poses duplicate the first pose: omit them at the loop seam.
export const SPRITE_OVERRIDES = [
  { texture: 'movement_walk', url: walk.url, keys: ['normal:walk-right', 'normal:walk-left'], frames: [0, 1, 2, 3, 4, 5, 6], fps: 8, repeat: -1 },
  { texture: 'movement_run', url: run.url, keys: ['normal:run-right', 'normal:run-left'], frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 12, repeat: -1 },
  { texture: 'kaioken_transform', url: kaiokenTransform.url, keys: ['kaioken:transform'], frames: [0, 1, 2, 3, 4, 5, 6], fps: 9, repeat: 0 },
  { texture: 'kaioken_idle', url: kaiokenIdle.url, keys: ['kaioken:idle'], frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 8, repeat: -1 },
  { texture: 'ssj_transform', url: ssjTransform.url, keys: ['ssj:transform'], frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 9, repeat: 0 },
];

export const OVERRIDE_ANCHOR = { w: 256, h: 300, feetY: 280, ax: 128 };