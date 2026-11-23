import { describe, expect, it } from 'vitest';
import { PowerState, attackDamage, PUNCH_DAMAGE, RASENGAN_COST } from '../game/forms';

describe('combate', () => {
  it('Kaioken drena só 5 de vida em 10 segundos', () => {
    const p = new PowerState();
    p.form = 'kaioken';
    p.drain(10_000);
    expect(p.hp).toBeCloseTo(95);
  });
  it('soco: 6 normal, 9 no Kaioken, 11 no Super Sayajin', () => {
    expect(attackDamage(PUNCH_DAMAGE, 'normal')).toBe(6);
    expect(attackDamage(PUNCH_DAMAGE, 'kaioken')).toBe(9);
    expect(attackDamage(PUNCH_DAMAGE, 'ssj')).toBe(11);
  });
  it('Rasengan custa 30 de chakra', () => expect(RASENGAN_COST).toBe(30));
  it('dano zera a vida e avisa nocaute', () => {
    const p = new PowerState();
    expect(p.damage(40)).toBe(false);
    expect(p.damage(70)).toBe(true);
    expect(p.hp).toBe(0);
  });
});
