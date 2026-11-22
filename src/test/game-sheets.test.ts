import { describe, expect, it } from 'vitest';
import { FORM_SHEETS } from '../game/sheets';
import { FORM_IDS } from '../game/forms';

describe('Updated animation data', () => {
  for (const id of FORM_IDS) {
    it(`${id} has eight hold frames and releases at frame 9`, () => {
      expect(FORM_SHEETS[id].shot.frames.hold).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      expect(FORM_SHEETS[id].shot.frames.small).toEqual([8, 9, 10]);
    });
    it(`${id} has a three-frame charge introduction`, () => {
      expect(FORM_SHEETS[id].aura?.frames.charge_start.length).toBe(3);
    });
  }
});