import type { BossCombatPhase } from '../types.ts';

export interface BossPhaseEnemy {
  isBoss: boolean;
  hp: number;
  maxHp: number;
  bossCombatPhase: BossCombatPhase;
  enraged: boolean;
}

export interface BossPhaseModifiers {
  attackCooldownMult: number;
  speedMult: number;
  summonCount: number;
  crossWave: boolean;
  stormVision: boolean;
}

const DEFAULT_MODIFIERS: BossPhaseModifiers = {
  attackCooldownMult: 1,
  speedMult: 1,
  summonCount: 0,
  crossWave: false,
  stormVision: false,
};

/** Fase 2 dispara em 50% de HP. */
export function shouldEnterBossPhase2(hp: number, maxHp: number): boolean {
  if (maxHp <= 0) return false;
  return hp / maxHp <= 0.5;
}

export function enterBossPhase2(enemy: BossPhaseEnemy): boolean {
  if (!enemy.isBoss || enemy.bossCombatPhase === 2) return false;
  enemy.bossCombatPhase = 2;
  enemy.enraged = true;
  return true;
}

export function getBossPhaseModifiers(enemy: BossPhaseEnemy): BossPhaseModifiers {
  if (!enemy.isBoss || enemy.bossCombatPhase < 2) {
    return { ...DEFAULT_MODIFIERS };
  }
  // Drakmar enfurecido: mais rápido, invoca 2 adds, onda em cruz e tempestade.
  return {
    attackCooldownMult: 0.7,
    speedMult: 1.2,
    summonCount: 2,
    crossWave: true,
    stormVision: true,
  };
}

/** Preenchimento das duas barras de HP (fase 1 acima de 50%, fase 2 abaixo). */
export function calcBossHpBarFills(hp: number, maxHp: number): { phase1: number; phase2: number } {
  if (maxHp <= 0) return { phase1: 0, phase2: 0 };
  const ratio = Math.max(0, Math.min(1, hp / maxHp));
  if (ratio > 0.5) {
    return { phase1: (ratio - 0.5) / 0.5, phase2: 1 };
  }
  return { phase1: 0, phase2: ratio / 0.5 };
}
