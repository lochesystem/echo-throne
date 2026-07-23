export type Vec2 = { x: number; y: number };

export type Screen = 'name' | 'arena' | 'result';

export type ArenaPhase = 'intro' | 'active' | 'victory' | 'defeat';

export type BossCombatPhase = 1 | 2;

/** Ataque telegrafado do boss que o jogador pode esquivar/aparar. */
export interface BossAttackState {
  kind: string;
  windup: number; // tempo restante de telegraph antes do golpe
  windupMax: number;
  active: number; // tempo restante da fase que causa dano
  recover: number; // janela de punição após o golpe
  parryable: boolean; // se um parry bem-sucedido causa stagger
  angle: number; // direção mirada quando o windup começou
  didHit: boolean; // evita múltiplos acertos no mesmo golpe
}
