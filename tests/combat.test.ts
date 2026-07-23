import { describe, expect, it } from 'vitest';
import { calcDamage, circlesOverlap, clamp, distance, isInAttackArc } from '../src/systems/combat.ts';

describe('combat math', () => {
  it('calcDamage aplica defesa e mínimo de 1', () => {
    expect(calcDamage(20, 0)).toBe(20);
    expect(calcDamage(20, 10)).toBe(15);
    expect(calcDamage(1, 100)).toBe(1);
  });

  it('distance mede euclidiana', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });

  it('clamp limita ao intervalo', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it('isInAttackArc acerta alvo à frente e ignora fora do arco', () => {
    // alvo à direita, mira à direita
    expect(isInAttackArc(0, 0, 0, 30, 0, 40, Math.PI / 4)).toBe(true);
    // alvo atrás
    expect(isInAttackArc(0, 0, 0, -30, 0, 40, Math.PI / 4)).toBe(false);
    // fora de alcance
    expect(isInAttackArc(0, 0, 0, 80, 0, 40, Math.PI / 4)).toBe(false);
  });

  it('circlesOverlap detecta sobreposição', () => {
    expect(circlesOverlap(0, 0, 5, 6, 0, 5)).toBe(true);
    expect(circlesOverlap(0, 0, 5, 20, 0, 5)).toBe(false);
  });
});
