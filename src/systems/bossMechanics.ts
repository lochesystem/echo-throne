import {
  PERFECT_DODGE_SLOW_MULT,
  PERFECT_DODGE_WINDOW,
  PLAYER_RADIUS,
} from '../engine/constants.ts';
import type { BossDef } from '../data/bosses.ts';
import type { BossAttackState, BossCombatPhase } from '../types.ts';
import { distance, isInAttackArc } from './combat.ts';
import {
  enterBossPhase2,
  getBossPhaseModifiers,
  shouldEnterBossPhase2,
  type BossPhaseModifiers,
} from './bossPhase.ts';

export type AttackKind = 'cutlass' | 'gancho' | 'onda' | 'cross';

interface AttackParams {
  windup: number;
  active: number;
  recover: number;
  parryable: boolean;
}

const ATTACK_PARAMS: Record<AttackKind, AttackParams> = {
  cutlass: { windup: 0.55, active: 0.18, recover: 1.6, parryable: true },
  gancho: { windup: 0.7, active: 0.15, recover: 1.4, parryable: false },
  onda: { windup: 0.65, active: 0.2, recover: 1.5, parryable: false },
  cross: { windup: 0.75, active: 0.2, recover: 1.7, parryable: false },
};

export const CUTLASS_RANGE = 68;
export const CUTLASS_ARC = Math.PI * 0.55;
export const GANCHO_RANGE = 150;
export const GANCHO_DAMAGE = 16;
export const CUTLASS_DAMAGE = 22;
export const WAVE_DAMAGE = 20;
export const ADD_DAMAGE = 8;

export interface SpectralAdd {
  x: number;
  y: number;
  hp: number;
  hitCooldown: number;
}

export interface BossEvent {
  type: 'attackActivate' | 'summon' | 'pull';
  kind?: AttackKind;
  angle?: number;
  count?: number;
}

/** Boss da arena com máquina de estados de golpes, fases, stagger e adds. */
export class Boss {
  readonly def: BossDef;
  readonly isBoss = true;
  x = 0;
  y = 0;
  hp: number;
  readonly maxHp: number;
  bossCombatPhase: BossCombatPhase = 1;
  enraged = false;

  attack: BossAttackState | null = null;
  private cooldown = 1.2;
  staggerTimer = 0;
  slowTimer = 0;
  adds: SpectralAdd[] = [];

  private phase2Summoned = false;

  constructor(def: BossDef) {
    this.def = def;
    this.hp = def.hp;
    this.maxHp = def.hp;
  }

  get alive(): boolean {
    return this.hp > 0;
  }

  get phase2(): boolean {
    return this.bossCombatPhase === 2;
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.hp = this.maxHp;
    this.bossCombatPhase = 1;
    this.enraged = false;
    this.attack = null;
    this.cooldown = 1.2;
    this.staggerTimer = 0;
    this.slowTimer = 0;
    this.adds = [];
    this.phase2Summoned = false;
  }

  applyStagger(seconds: number): void {
    this.staggerTimer = Math.max(this.staggerTimer, seconds);
    this.attack = null; // interrompe o golpe atual
  }

  applySlow(seconds: number): void {
    this.slowTimer = Math.max(this.slowTimer, seconds);
  }

  takeDamage(amount: number): number {
    const previousHp = this.hp;
    this.hp = Math.max(0, this.hp - Math.max(1, Math.round(amount)));
    return previousHp - this.hp;
  }

  /** True se um golpe corpo a corpo atingirá o jogador dentro da janela perfeita. */
  isAttackImminent(px: number, py: number): boolean {
    if (!this.attack) return false;
    if (this.attack.windup <= 0 || this.attack.windup > PERFECT_DODGE_WINDOW) return false;

    if (this.attack.kind === 'cutlass') {
      return isInAttackArc(
        this.x,
        this.y,
        this.attack.angle,
        px,
        py,
        CUTLASS_RANGE + PLAYER_RADIUS,
        CUTLASS_ARC / 2,
      );
    }
    if (this.attack.kind === 'gancho') {
      return distance(this.x, this.y, px, py) <= GANCHO_RANGE + PLAYER_RADIUS;
    }
    // Ondas só contam quando o projétil realmente se aproxima do jogador.
    return false;
  }

  update(dt: number, px: number, py: number): BossEvent[] {
    const events: BossEvent[] = [];
    if (!this.alive) return events;

    // Transição de fase
    if (!this.phase2 && shouldEnterBossPhase2(this.hp, this.maxHp)) {
      enterBossPhase2(this);
    }
    const mods = getBossPhaseModifiers(this);

    // Timers globais
    if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
    if (this.staggerTimer > 0) {
      this.staggerTimer = Math.max(0, this.staggerTimer - dt);
      this.updateAdds(dt, px, py, mods);
      return events; // atordoado: não age
    }

    const slowMult = this.slowTimer > 0 ? PERFECT_DODGE_SLOW_MULT : 1;

    // Invocação ao entrar na fase 2
    if (this.phase2 && !this.phase2Summoned && mods.summonCount > 0) {
      this.phase2Summoned = true;
      for (let i = 0; i < mods.summonCount; i++) {
        this.adds.push({
          x: this.x + (i === 0 ? -40 : 40),
          y: this.y + 30,
          hp: 30,
          hitCooldown: 0,
        });
      }
      events.push({ type: 'summon', count: mods.summonCount });
    }

    // Golpe em andamento
    if (this.attack) {
      this.tickAttack(dt * slowMult, events);
    } else {
      // Reposicionamento em direção ao alcance ideal
      this.reposition(dt, px, py, slowMult, mods);
      this.cooldown -= dt * slowMult * (1 / mods.attackCooldownMult);
      if (this.cooldown <= 0) {
        this.startAttack(px, py, mods);
      }
    }

    this.updateAdds(dt, px, py, mods);
    return events;
  }

  private reposition(
    dt: number,
    px: number,
    py: number,
    slowMult: number,
    mods: BossPhaseModifiers,
  ): void {
    const dist = distance(this.x, this.y, px, py);
    const ideal = 90;
    if (Math.abs(dist - ideal) < 12) return;
    const dir = dist > ideal ? 1 : -1;
    const nx = (px - this.x) / (dist || 1);
    const ny = (py - this.y) / (dist || 1);
    const speed = this.def.speed * mods.speedMult * slowMult;
    this.x += nx * dir * speed * dt;
    this.y += ny * dir * speed * dt;
  }

  private startAttack(px: number, py: number, mods: BossPhaseModifiers): void {
    const dist = distance(this.x, this.y, px, py);
    const angle = Math.atan2(py - this.y, px - this.x);
    let kind: AttackKind;
    if (this.phase2 && mods.crossWave && Math.random() < 0.4) {
      kind = 'cross';
    } else if (dist <= CUTLASS_RANGE + 10) {
      kind = 'cutlass';
    } else if (Math.random() < 0.5) {
      kind = 'onda';
    } else {
      kind = 'gancho';
    }
    const p = ATTACK_PARAMS[kind];
    this.attack = {
      kind,
      windup: p.windup,
      windupMax: p.windup,
      active: 0,
      recover: 0,
      parryable: p.parryable,
      angle,
      didHit: false,
    };
  }

  private tickAttack(dt: number, events: BossEvent[]): void {
    const atk = this.attack!;
    const p = ATTACK_PARAMS[atk.kind as AttackKind];
    if (atk.windup > 0) {
      atk.windup -= dt;
      if (atk.windup <= 0) {
        atk.active = p.active;
        events.push({ type: 'attackActivate', kind: atk.kind as AttackKind, angle: atk.angle });
        if (atk.kind === 'gancho') {
          events.push({ type: 'pull', angle: atk.angle });
        }
      }
    } else if (atk.active > 0) {
      atk.active -= dt;
      if (atk.active <= 0) atk.recover = p.recover;
    } else if (atk.recover > 0) {
      atk.recover -= dt;
      if (atk.recover <= 0) {
        this.attack = null;
        this.cooldown = 0.9;
      }
    }
  }

  private updateAdds(dt: number, px: number, py: number, mods: BossPhaseModifiers): void {
    for (const add of this.adds) {
      if (add.hitCooldown > 0) add.hitCooldown = Math.max(0, add.hitCooldown - dt);
      const d = distance(add.x, add.y, px, py) || 1;
      const speed = 55 * mods.speedMult;
      add.x += ((px - add.x) / d) * speed * dt;
      add.y += ((py - add.y) / d) * speed * dt;
    }
    this.adds = this.adds.filter((a) => a.hp > 0);
  }
}
