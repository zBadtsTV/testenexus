import { describe, expect, it } from 'vitest';
import { OVERRIDE_ANCHOR, SPRITE_OVERRIDES } from '../game/spriteOverrides';

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
  it('keeps anchors inside a stable cell and leaves shots, jumps and charging untouched', () => {
    expect(OVERRIDE_ANCHOR).toEqual({ w: 256, h: 300, feetY: 280, ax: 128 });
    expect(SPRITE_OVERRIDES.flatMap((sheet) => sheet.keys).some((key) => /shot|jump|charge|revert/.test(key))).toBe(false);
  });
});