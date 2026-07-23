import { describe, expect, it } from 'vitest';
import {
  calcBossHpBarFills,
  enterBossPhase2,
  getBossPhaseModifiers,
  shouldEnterBossPhase2,
  type BossPhaseEnemy,
} from '../src/systems/bossPhase.ts';
import { CAPITAO_DRAKMAR } from '../src/data/bosses.ts';
import { Boss, CUTLASS_RANGE } from '../src/systems/bossMechanics.ts';
import { PERFECT_DODGE_WINDOW } from '../src/engine/constants.ts';

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

  it('limita perfect dodge melee a um golpe que realmente alcançará o jogador', () => {
    const boss = new Boss(CAPITAO_DRAKMAR);
    boss.reset(100, 100);
    boss.attack = {
      kind: 'cutlass',
      windup: PERFECT_DODGE_WINDOW,
      windupMax: 0.55,
      active: 0,
      recover: 0,
      parryable: true,
      angle: 0,
      didHit: false,
    };
    expect(boss.isAttackImminent(100 + CUTLASS_RANGE, 100)).toBe(true);
    expect(boss.isAttackImminent(100 - CUTLASS_RANGE, 100)).toBe(false);
    expect(boss.isAttackImminent(300, 100)).toBe(false);
  });

  it('takeDamage retorna somente o dano efetivamente aplicado', () => {
    const boss = new Boss(CAPITAO_DRAKMAR);
    boss.hp = 5;
    expect(boss.takeDamage(40)).toBe(5);
    expect(boss.hp).toBe(0);
    expect(boss.takeDamage(40)).toBe(0);
  });
});
