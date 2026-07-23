import {
  INVESTIDA_COOLDOWN,
  INVESTIDA_COST,
  INVESTIDA_DAMAGE,
  INVESTIDA_DISTANCE,
  INVESTIDA_DURATION,
} from '../engine/constants.ts';
import type { Player } from './player.ts';

export interface InvestidaCast {
  damage: number;
  aimAngle: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
}

/** Habilidade Investida: dash ofensivo com i-frames e dano no trajeto. */
export class Ability {
  cooldown = 0;

  reset(): void {
    this.cooldown = 0;
  }

  get ready(): boolean {
    return this.cooldown <= 0;
  }

  update(dt: number): void {
    if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);
  }

  /**
   * Executa a Investida se pronta e com energia. Move o jogador no dash,
   * concede i-frames e retorna os dados do golpe (ou null).
   */
  cast(player: Player, aimAngle: number): InvestidaCast | null {
    if (!this.ready || player.energy < INVESTIDA_COST) return null;
    if (!player.spendEnergy(INVESTIDA_COST)) return null;

    const dx = Math.cos(aimAngle);
    const dy = Math.sin(aimAngle);
    const originX = player.x;
    const originY = player.y;
    const targetX = originX + dx * INVESTIDA_DISTANCE;
    const targetY = originY + dy * INVESTIDA_DISTANCE;

    // Dash instantâneo com i-frames curtos.
    player.x = targetX;
    player.y = targetY;
    player.setInvincible(INVESTIDA_DURATION);
    player.aimAngle = aimAngle;
    this.cooldown = INVESTIDA_COOLDOWN;

    return {
      damage: INVESTIDA_DAMAGE,
      aimAngle,
      originX,
      originY,
      targetX,
      targetY,
    };
  }
}
