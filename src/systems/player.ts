import {
  COMBO_DAMAGE,
  COMBO_LINK_WINDOW,
  COMBO_RESET,
  COMBO_WINDUP,
  DODGE_DISTANCE,
  DODGE_DURATION,
  DODGE_STAMINA_COST,
  ENERGY_REGEN,
  ENERGY_PER_MELEE_HIT,
  PERFECT_DODGE_WINDOW,
  PLAYER_MAX_ENERGY,
  PLAYER_MAX_HP,
  PLAYER_MAX_STAMINA,
  PLAYER_SPEED,
  POTION_CHARGES,
  POTION_HEAL,
  STAMINA_REGEN,
  STAMINA_REGEN_DELAY,
} from '../engine/constants.ts';
import { clamp } from './combat.ts';

export interface MeleeSwing {
  hitIndex: number; // 0,1,2 dentro do combo
  damage: number;
  aimAngle: number;
  isFinisher: boolean; // 3º golpe do combo
}

/** Retorna o dano do golpe pelo índice do combo. */
export function comboDamageFor(hitIndex: number): number {
  return COMBO_DAMAGE[clamp(hitIndex, 0, COMBO_DAMAGE.length - 1)]!;
}

/** True se a esquiva ocorreu dentro da janela perfeita antes do impacto. */
export function isPerfectDodgeTiming(windupRemaining: number): boolean {
  return windupRemaining > 0 && windupRemaining <= PERFECT_DODGE_WINDOW;
}

export class Player {
  name = 'Caçador';
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  facing = 1; // 1 direita, -1 esquerda
  aimAngle = 0;

  hp = PLAYER_MAX_HP;
  readonly maxHp = PLAYER_MAX_HP;
  energy = PLAYER_MAX_ENERGY;
  readonly maxEnergy = PLAYER_MAX_ENERGY;
  stamina = PLAYER_MAX_STAMINA;
  readonly maxStamina = PLAYER_MAX_STAMINA;

  // Combo
  comboIndex = 0; // quantos golpes já saíram na cadeia atual
  private attackWindup = 0; // tempo restante até o golpe registrar
  private pendingHitIndex = -1;
  private pendingAim = 0;
  private comboLinkTimer = 0; // tempo para encadear
  private comboResetTimer = 0; // trava após finisher

  // Esquiva / invencibilidade
  dodgeTimer = 0;
  invincible = 0;
  lastDodgePerfect = false;
  private staminaDelay = 0;

  potionCharges = POTION_CHARGES;

  get alive(): boolean {
    return this.hp > 0;
  }

  get isDodging(): boolean {
    return this.dodgeTimer > 0;
  }

  get isAttacking(): boolean {
    return this.attackWindup > 0;
  }

  reset(x: number, y: number, name: string): void {
    this.name = name;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.energy = this.maxEnergy;
    this.stamina = this.maxStamina;
    this.comboIndex = 0;
    this.attackWindup = 0;
    this.pendingHitIndex = -1;
    this.comboLinkTimer = 0;
    this.comboResetTimer = 0;
    this.dodgeTimer = 0;
    this.invincible = 0;
    this.lastDodgePerfect = false;
    this.staminaDelay = 0;
    this.potionCharges = POTION_CHARGES;
  }

  /** Inicia um golpe do combo, se possível. Retorna true se aceitou o input. */
  tryAttack(aimAngle: number): boolean {
    if (this.isDodging || this.isAttacking || this.comboResetTimer > 0) return false;
    const idx = this.comboLinkTimer > 0 ? this.comboIndex : 0;
    this.pendingHitIndex = idx;
    this.pendingAim = aimAngle;
    this.attackWindup = COMBO_WINDUP[idx]!;
    this.aimAngle = aimAngle;
    this.setFacingFromAngle(aimAngle);
    return true;
  }

  /**
   * Tenta esquivar na direção dada (ou na mira, se parado).
   * Retorna true se a esquiva começou.
   */
  tryDodge(dirX: number, dirY: number): boolean {
    if (this.isDodging || this.stamina < DODGE_STAMINA_COST) return false;
    let dx = dirX;
    let dy = dirY;
    if (dx === 0 && dy === 0) {
      dx = Math.cos(this.aimAngle);
      dy = Math.sin(this.aimAngle);
    }
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const speed = DODGE_DISTANCE / DODGE_DURATION;
    this.vx = dx * speed;
    this.vy = dy * speed;
    this.dodgeTimer = DODGE_DURATION;
    this.invincible = Math.max(this.invincible, DODGE_DURATION);
    this.stamina -= DODGE_STAMINA_COST;
    this.staminaDelay = STAMINA_REGEN_DELAY;
    // cancela um golpe em andamento (cancel em esquiva)
    this.attackWindup = 0;
    this.pendingHitIndex = -1;
    this.lastDodgePerfect = false;
    return true;
  }

  usePotion(): boolean {
    if (this.potionCharges <= 0 || this.hp >= this.maxHp) return false;
    this.potionCharges -= 1;
    this.hp = Math.min(this.maxHp, this.hp + POTION_HEAL);
    return true;
  }

  spendEnergy(amount: number): boolean {
    if (this.energy < amount) return false;
    this.energy -= amount;
    return true;
  }

  grantEnergy(amount: number): void {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  setInvincible(seconds: number): void {
    this.invincible = Math.max(this.invincible, seconds);
  }

  takeDamage(amount: number): number {
    if (this.invincible > 0 || !this.alive) return 0;
    const dmg = Math.max(1, Math.round(amount));
    this.hp = Math.max(0, this.hp - dmg);
    return dmg;
  }

  private setFacingFromAngle(angle: number): void {
    const cx = Math.cos(angle);
    if (cx < -0.01) this.facing = -1;
    else if (cx > 0.01) this.facing = 1;
  }

  /**
   * Avança timers e movimento. `moveVec` é a intenção de movimento normalizada.
   * Retorna o golpe que registra dano neste frame (ou null).
   */
  update(dt: number, moveX: number, moveY: number): MeleeSwing | null {
    // Timers
    this.invincible = Math.max(0, this.invincible - dt);
    if (this.comboLinkTimer > 0) this.comboLinkTimer = Math.max(0, this.comboLinkTimer - dt);
    if (this.comboResetTimer > 0) this.comboResetTimer = Math.max(0, this.comboResetTimer - dt);
    if (this.staminaDelay > 0) this.staminaDelay = Math.max(0, this.staminaDelay - dt);

    // Regeneração
    this.energy = Math.min(this.maxEnergy, this.energy + ENERGY_REGEN * dt);
    if (this.staminaDelay <= 0) {
      this.stamina = Math.min(this.maxStamina, this.stamina + STAMINA_REGEN * dt);
    }

    // Movimento
    if (this.isDodging) {
      this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
      // desaceleração leve no fim do dash
      this.vx *= 0.9;
      this.vy *= 0.9;
    } else {
      const speedMult = this.isAttacking ? 0.4 : 1;
      this.vx = moveX * PLAYER_SPEED * speedMult;
      this.vy = moveY * PLAYER_SPEED * speedMult;
      if (moveX < -0.01) this.facing = -1;
      else if (moveX > 0.01) this.facing = 1;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Resolução do golpe
    let swing: MeleeSwing | null = null;
    if (this.attackWindup > 0) {
      this.attackWindup -= dt;
      if (this.attackWindup <= 0) {
        const idx = this.pendingHitIndex;
        const isFinisher = idx >= COMBO_DAMAGE.length - 1;
        swing = {
          hitIndex: idx,
          damage: comboDamageFor(idx),
          aimAngle: this.pendingAim,
          isFinisher,
        };
        this.grantEnergy(ENERGY_PER_MELEE_HIT);
        this.attackWindup = 0;
        this.pendingHitIndex = -1;
        if (isFinisher) {
          this.comboIndex = 0;
          this.comboLinkTimer = 0;
          this.comboResetTimer = COMBO_RESET;
        } else {
          this.comboIndex = idx + 1;
          this.comboLinkTimer = COMBO_LINK_WINDOW;
        }
      }
    }
    return swing;
  }
}
