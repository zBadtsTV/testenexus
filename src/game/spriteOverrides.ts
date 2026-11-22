import walk from './assets/movement_walk.png.asset.json';
import run from './assets/movement_run.png.asset.json';
import kaiokenTransform from './assets/kaioken_transform.png.asset.json';
import kaiokenIdle from './assets/kaioken_idle.png.asset.json';
import ssjTransform from './assets/ssj_transform.png.asset.json';
import kaiokenWalk from './assets/kaioken_walk.png.asset.json';
import kaiokenRun from './assets/kaioken_run.png.asset.json';
import kaiokenAir from './assets/kaioken_air.png.asset.json';
import kaiokenChargeLoop from './assets/kaioken_charge_loop.png.asset.json';
import kaiokenChargeStart from './assets/kaioken_charge_start.png.asset.json';
import ssjChargeLoop from './assets/ssj_charge_loop.png.asset.json';
import ssjWalk from './assets/ssj_walk.png.asset.json';
import ssjRun from './assets/ssj_run.png.asset.json';

// Uploaded strips face right. Left movement mirrors the same complete cycle.
// Terminal movement poses duplicate the first pose: omit them at the loop seam.
export const SPRITE_OVERRIDES = [
  { texture: 'movement_walk', url: walk.url, keys: ['normal:walk-right', 'normal:walk-left'], frames: [0, 1, 2, 3, 4, 5, 6], fps: 8, repeat: -1 },
  { texture: 'movement_run', url: run.url, keys: ['normal:run-right', 'normal:run-left'], frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 12, repeat: -1 },
  { texture: 'kaioken_transform', url: kaiokenTransform.url, keys: ['kaioken:transform'], frames: [0, 1, 2, 3, 4, 5, 6], fps: 9, repeat: 0 },
  { texture: 'kaioken_idle', url: kaiokenIdle.url, keys: ['kaioken:idle'], frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 8, repeat: -1 },
  { texture: 'ssj_transform', url: ssjTransform.url, keys: ['ssj:transform'], frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 9, repeat: 0 },
  { texture: 'kaioken_walk', url: kaiokenWalk.url, keys: ['kaioken:walk-right', 'kaioken:walk-left'], frames: [0, 1, 2, 3, 4, 5, 6], fps: 8, repeat: -1 },
  { texture: 'kaioken_run', url: kaiokenRun.url, keys: ['kaioken:run-right', 'kaioken:run-left'], frames: [0, 1, 2, 3, 4], fps: 12, repeat: -1 },
  { texture: 'kaioken_air', url: kaiokenAir.url, keys: ['kaioken:jump'], frames: [0, 1, 2], fps: 12, repeat: 0 },
  { texture: 'kaioken_air', url: kaiokenAir.url, keys: ['kaioken:fall'], frames: [2, 3], fps: 6, repeat: 0 },
  { texture: 'kaioken_air', url: kaiokenAir.url, keys: ['kaioken:land'], frames: [3, 4], fps: 14, repeat: 0 },
  { texture: 'kaioken_charge_start', url: kaiokenChargeStart.url, keys: ['kaioken:charge-start'], frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 10, repeat: 0 },
  { texture: 'kaioken_charge_loop', url: kaiokenChargeLoop.url, keys: ['kaioken:charge-loop'], frames: [0, 1, 2, 3, 4, 5, 6], fps: 10, repeat: -1 },
  { texture: 'ssj_charge_loop', url: ssjChargeLoop.url, keys: ['ssj:charge-loop'], frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 10, repeat: -1 },
  { texture: 'ssj_walk', url: ssjWalk.url, keys: ['ssj:walk-right', 'ssj:walk-left'], frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 8, repeat: -1 },
  { texture: 'ssj_run', url: ssjRun.url, keys: ['ssj:run-right', 'ssj:run-left'], frames: [0, 1, 2, 3, 4, 5, 6], fps: 12, repeat: -1 },
];

export const OVERRIDE_ANCHOR = { w: 256, h: 300, feetY: 280, ax: 128 };

/** Uploaded movement strips face right; generated directional rows do not. */
export function shouldMirrorMovement(key: string, facing: -1 | 1): boolean {
  return facing === -1 && SPRITE_OVERRIDES.some((sheet) => sheet.keys.includes(key));
}