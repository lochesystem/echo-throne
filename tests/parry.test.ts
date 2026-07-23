import { describe, expect, it } from 'vitest';
import { ParryState, resolveParry } from '../src/systems/parry.ts';
import { PARRY_STAGGER, PARRY_WINDOW, RIPOSTE_DAMAGE } from '../src/engine/constants.ts';

describe('ParryState', () => {
  it('abre janela ao iniciar', () => {
    const p = new ParryState();
    expect(p.tryStart()).toBe(true);
    expect(p.active).toBe(true);
    expect(p.window).toBeCloseTo(PARRY_WINDOW);
  });

  it('entra em cooldown após a janela fechar', () => {
    const p = new ParryState();
    p.tryStart();
    p.update(PARRY_WINDOW + 0.01);
    expect(p.active).toBe(false);
    expect(p.cooldown).toBeGreaterThan(0);
    expect(p.tryStart()).toBe(false);
  });

  it('resolveParry retorna stagger + riposte na janela ativa', () => {
    const p = new ParryState();
    p.tryStart();
    const res = resolveParry(p, true);
    expect(res).not.toBeNull();
    expect(res?.staggerDuration).toBe(PARRY_STAGGER);
    expect(res?.riposteDamage).toBe(RIPOSTE_DAMAGE);
  });

  it('resolveParry falha se golpe não é aparável ou fora da janela', () => {
    const p = new ParryState();
    p.tryStart();
    expect(resolveParry(p, false)).toBeNull();
    const q = new ParryState();
    expect(resolveParry(q, true)).toBeNull();
  });
});
