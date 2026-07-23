import { describe, expect, it } from 'vitest';
import { comboDamageFor, isPerfectDodgeTiming, Player } from '../src/systems/player.ts';
import {
  COMBO_DAMAGE,
  COMBO_WINDUP,
  DODGE_STAMINA_COST,
  PERFECT_DODGE_WINDOW,
  PLAYER_MAX_STAMINA,
} from '../src/engine/constants.ts';

function newPlayer(): Player {
  const p = new Player();
  p.reset(100, 100, 'Teste');
  return p;
}

describe('comboDamageFor', () => {
  it('retorna o dano por índice e satura no último', () => {
    expect(comboDamageFor(0)).toBe(COMBO_DAMAGE[0]);
    expect(comboDamageFor(2)).toBe(COMBO_DAMAGE[2]);
    expect(comboDamageFor(9)).toBe(COMBO_DAMAGE[2]);
  });
});

describe('isPerfectDodgeTiming', () => {
  it('true dentro da janela, false fora', () => {
    expect(isPerfectDodgeTiming(PERFECT_DODGE_WINDOW - 0.01)).toBe(true);
    expect(isPerfectDodgeTiming(PERFECT_DODGE_WINDOW + 0.1)).toBe(false);
    expect(isPerfectDodgeTiming(0)).toBe(false);
  });
});

describe('Player combo', () => {
  it('primeiro golpe registra dano após o windup', () => {
    const p = newPlayer();
    expect(p.tryAttack(0)).toBe(true);
    // antes do windup terminar não há golpe
    let swing = p.update(COMBO_WINDUP[0]! / 2, 0, 0);
    expect(swing).toBeNull();
    swing = p.update(COMBO_WINDUP[0]! / 2 + 0.001, 0, 0);
    expect(swing?.hitIndex).toBe(0);
    expect(swing?.damage).toBe(COMBO_DAMAGE[0]);
    expect(swing?.isFinisher).toBe(false);
  });

  it('encadeia até o finisher no terceiro golpe', () => {
    const p = newPlayer();
    const land = (): ReturnType<Player['update']> => {
      p.tryAttack(0);
      return p.update(0.3, 0, 0);
    };
    expect(land()?.hitIndex).toBe(0);
    expect(land()?.hitIndex).toBe(1);
    const finisher = land();
    expect(finisher?.hitIndex).toBe(2);
    expect(finisher?.isFinisher).toBe(true);
  });
});

describe('Player esquiva e recursos', () => {
  it('esquiva consome stamina e concede i-frames', () => {
    const p = newPlayer();
    expect(p.tryDodge(1, 0)).toBe(true);
    expect(p.stamina).toBe(PLAYER_MAX_STAMINA - DODGE_STAMINA_COST);
    expect(p.invincible).toBeGreaterThan(0);
    expect(p.isDodging).toBe(true);
  });

  it('sem stamina não esquiva', () => {
    const p = newPlayer();
    p.stamina = 0;
    expect(p.tryDodge(1, 0)).toBe(false);
  });

  it('i-frames evitam dano', () => {
    const p = newPlayer();
    p.tryDodge(1, 0);
    expect(p.takeDamage(50)).toBe(0);
    expect(p.hp).toBe(p.maxHp);
  });

  it('energia regenera e ganha por hit de melee', () => {
    const p = newPlayer();
    p.energy = 0;
    p.update(1, 0, 0); // +3/s
    expect(p.energy).toBeGreaterThan(2.9);
    const before = p.energy;
    p.tryAttack(0);
    p.update(0.3, 0, 0); // golpe registra -> +5
    expect(p.energy).toBeGreaterThan(before + 4);
  });

  it('poção cura e consome carga', () => {
    const p = newPlayer();
    p.hp = 100;
    const charges = p.potionCharges;
    expect(p.usePotion()).toBe(true);
    expect(p.hp).toBeGreaterThan(100);
    expect(p.potionCharges).toBe(charges - 1);
  });
});
