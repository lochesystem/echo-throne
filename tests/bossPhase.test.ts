import { describe, expect, it } from 'vitest';
import {
  calcBossHpBarFills,
  enterBossPhase2,
  getBossPhaseModifiers,
  shouldEnterBossPhase2,
  type BossPhaseEnemy,
} from '../src/systems/bossPhase.ts';

function enemy(hp: number, maxHp = 100): BossPhaseEnemy {
  return { isBoss: true, hp, maxHp, bossCombatPhase: 1, enraged: false };
}

describe('bossPhase', () => {
  it('fase 2 dispara em <= 50% HP', () => {
    expect(shouldEnterBossPhase2(51, 100)).toBe(false);
    expect(shouldEnterBossPhase2(50, 100)).toBe(true);
    expect(shouldEnterBossPhase2(10, 100)).toBe(true);
  });

  it('enterBossPhase2 muda estado uma vez', () => {
    const e = enemy(40);
    expect(enterBossPhase2(e)).toBe(true);
    expect(e.bossCombatPhase).toBe(2);
    expect(e.enraged).toBe(true);
    expect(enterBossPhase2(e)).toBe(false);
  });

  it('modificadores mudam na fase 2', () => {
    const e = enemy(40);
    expect(getBossPhaseModifiers(e).summonCount).toBe(0);
    enterBossPhase2(e);
    const mods = getBossPhaseModifiers(e);
    expect(mods.summonCount).toBe(2);
    expect(mods.crossWave).toBe(true);
    expect(mods.attackCooldownMult).toBeLessThan(1);
  });

  it('barras de HP dividem em 50%', () => {
    expect(calcBossHpBarFills(100, 100)).toEqual({ phase1: 1, phase2: 1 });
    expect(calcBossHpBarFills(75, 100)).toEqual({ phase1: 0.5, phase2: 1 });
    expect(calcBossHpBarFills(25, 100)).toEqual({ phase1: 0, phase2: 0.5 });
  });
});
