import { PARRY_COOLDOWN, PARRY_STAGGER, PARRY_WINDOW, RIPOSTE_DAMAGE } from '../engine/constants.ts';

export type ParryResult = 'none' | 'started' | 'blocked';

/** Estado do parry: janela ativa curta seguida de cooldown. */
export class ParryState {
  window = 0; // tempo restante da janela de parry
  cooldown = 0; // tempo até poder aparar de novo

  get active(): boolean {
    return this.window > 0;
  }

  reset(): void {
    this.window = 0;
    this.cooldown = 0;
  }

  /** Tenta iniciar um parry. Falha se em cooldown ou já ativo. */
  tryStart(): boolean {
    if (this.cooldown > 0 || this.window > 0) return false;
    this.window = PARRY_WINDOW;
    return true;
  }

  update(dt: number): void {
    if (this.window > 0) {
      this.window = Math.max(0, this.window - dt);
      if (this.window === 0) this.cooldown = PARRY_COOLDOWN;
    } else if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - dt);
    }
  }
}

export interface ParrySuccess {
  staggerDuration: number;
  riposteDamage: number;
}

/**
 * Resolve um golpe aparável do boss enquanto a janela está ativa.
 * Retorna os efeitos do parry (stagger + riposte) ou null se não aparou.
 */
export function resolveParry(state: ParryState, attackParryable: boolean): ParrySuccess | null {
  if (!state.active || !attackParryable) return null;
  // Consome a janela imediatamente (parry gasta o timing).
  state.window = 0;
  state.cooldown = PARRY_COOLDOWN;
  return { staggerDuration: PARRY_STAGGER, riposteDamage: RIPOSTE_DAMAGE };
}
