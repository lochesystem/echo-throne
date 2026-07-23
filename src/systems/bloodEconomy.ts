import { PERFECT_DODGE_ENERGY } from '../engine/constants.ts';

/**
 * Sangue ganho durante o combate, proporcional ao dano causado ao boss.
 * mult_boss escala por arena (arena 1 = 1.0); mult_perfect cresce com perfect dodges.
 */
export function bloodFromDamage(
  totalDamage: number,
  bossMult: number,
  perfectMult: number,
): number {
  return Math.floor(totalDamage * bossMult * perfectMult);
}

/** Multiplicador por perfect dodges: base 1.0, +0.1 cada, teto +0.5. */
export function perfectMultiplier(perfectDodges: number): number {
  return 1 + Math.min(0.5, perfectDodges * 0.1);
}

/** Bônus de sangue por vitória (parte do HP máximo do boss). */
export function victoryBloodBonus(bossMaxHp: number, bossMult: number): number {
  return Math.floor(bossMaxHp * 0.15 * bossMult);
}

/** Rastreia sangue e estatísticas da run de combate. */
export class BloodTracker {
  totalDamage = 0;
  perfectDodges = 0;
  parries = 0;
  blood = 0;

  reset(): void {
    this.totalDamage = 0;
    this.perfectDodges = 0;
    this.parries = 0;
    this.blood = 0;
  }

  addDamage(dmg: number, bossMult: number): void {
    this.totalDamage += dmg;
    this.blood = bloodFromDamage(this.totalDamage, bossMult, perfectMultiplier(this.perfectDodges));
  }

  registerPerfectDodge(): number {
    this.perfectDodges += 1;
    return PERFECT_DODGE_ENERGY;
  }

  registerParry(): void {
    this.parries += 1;
  }

  applyVictoryBonus(bossMaxHp: number, bossMult: number): void {
    this.blood += victoryBloodBonus(bossMaxHp, bossMult);
  }
}
