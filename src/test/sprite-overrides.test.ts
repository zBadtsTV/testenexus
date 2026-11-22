import { describe, expect, it } from 'vitest';
import { OVERRIDE_ANCHOR, SPRITE_OVERRIDES, shouldMirrorMovement } from '../game/spriteOverrides';

describe('Uploaded sprite animation selection', () => {
  it('uses identical frame ordering for both walking directions without the duplicate closing pose', () => {
    const walk = SPRITE_OVERRIDES.find((sheet) => sheet.texture === 'movement_walk');
    expect(walk?.keys).toEqual(['normal:walk-right', 'normal:walk-left']);
    expect(walk?.frames).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
  it('plays complete transformations once and keeps Kaioken idle looping', () => {
    expect(SPRITE_OVERRIDES.find((sheet) => sheet.texture === 'kaioken_transform')?.frames).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(SPRITE_OVERRIDES.filter((sheet) => sheet.texture.endsWith('_transform')).map((sheet) => sheet.repeat)).toEqual([0, 0]);
    expect(SPRITE_OVERRIDES.find((sheet) => sheet.texture === 'kaioken_idle')?.repeat).toBe(-1);
  });
  it('keeps anchors inside a stable cell and leaves shots and reversions untouched', () => {
    expect(OVERRIDE_ANCHOR).toEqual({ w: 256, h: 300, feetY: 280, ax: 128 });
    expect(SPRITE_OVERRIDES.flatMap((sheet) => sheet.keys).some((key) => /shot|revert/.test(key))).toBe(false);
  });
  it('mirrors uploaded walking and running for Kaioken and Sayajin only when facing left', () => {
    for (const form of ['kaioken', 'ssj']) {
      for (const action of ['walk', 'run']) {
        expect(shouldMirrorMovement(`${form}:${action}-left`, -1)).toBe(true);
        expect(shouldMirrorMovement(`${form}:${action}-right`, 1)).toBe(false);
      }
    }
    expect(shouldMirrorMovement('ssj:shot-small', -1)).toBe(false);
  });
  it('uses the new Kaioken jump, fall and landing poses in order', () => {
    for (const [key, frames] of [['kaioken:jump', [0, 1, 2]], ['kaioken:fall', [2, 3]], ['kaioken:land', [3, 4]]] as const) {
      const sheet = SPRITE_OVERRIDES.find((entry) => entry.keys.includes(key));
      expect(sheet?.texture).toBe('kaioken_air');
      expect(sheet?.frames).toEqual(frames);
      expect(sheet?.repeat).toBe(0);
    }
  });
  it('plays the Kaioken charge introduction once and loops both powered forms while charging', () => {
    expect(SPRITE_OVERRIDES.find((sheet) => sheet.keys.includes('kaioken:charge-start'))?.repeat).toBe(0);
    expect(SPRITE_OVERRIDES.find((sheet) => sheet.keys.includes('kaioken:charge-start'))?.frames).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    for (const form of ['kaioken', 'ssj']) {
      expect(SPRITE_OVERRIDES.find((sheet) => sheet.keys.includes(`${form}:charge-loop`))?.repeat).toBe(-1);
    }
  });
});