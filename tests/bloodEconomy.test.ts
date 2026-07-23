import { describe, expect, it } from 'vitest';
import {
  bloodFromDamage,
  BloodTracker,
  perfectMultiplier,
  victoryBloodBonus,
} from '../src/systems/bloodEconomy.ts';

describe('bloodEconomy', () => {
  it('bloodFromDamage aplica multiplicadores e arredonda para baixo', () => {
    expect(bloodFromDamage(100, 1, 1)).toBe(100);
    expect(bloodFromDamage(100, 2.5, 1)).toBe(250);
    expect(bloodFromDamage(100, 1, 1.3)).toBe(130);
    expect(bloodFromDamage(33, 1, 1.1)).toBe(36); // floor(36.3)
  });

  it('perfectMultiplier cresce 0.1 por dodge com teto 0.5', () => {
    expect(perfectMultiplier(0)).toBe(1);
    expect(perfectMultiplier(3)).toBeCloseTo(1.3);
    expect(perfectMultiplier(10)).toBe(1.5);
  });

  it('victoryBloodBonus é 15% do HP máximo do boss', () => {
    expect(victoryBloodBonus(1500, 1)).toBe(225);
    expect(victoryBloodBonus(1000, 2)).toBe(300);
  });

  it('BloodTracker acumula dano e aplica bônus de vitória', () => {
    const t = new BloodTracker();
    t.addDamage(200, 1);
    expect(t.blood).toBe(200);
    t.registerPerfectDodge();
    t.addDamage(100, 1); // total 300 * 1.1
    expect(t.blood).toBe(330);
    t.applyVictoryBonus(1500, 1);
    expect(t.blood).toBe(330 + 225);
  });
});
