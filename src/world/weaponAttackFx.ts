import { Container, Graphics } from 'pixi.js';
import { drawKnifeSlashArc, drawKnifeSlashLine } from './graphicsPaths.ts';

export type AttackFxStyle = 'knife' | 'sword_heavy';

export interface WeaponAttackFxState {
  root: Container;
  life: number;
  duration: number;
  style: AttackFxStyle;
  angle: number;
  range: number;
  color: number;
  blades?: Graphics[];
  slash?: Graphics;
}

const FX_DURATIONS: Record<AttackFxStyle, number> = {
  knife: 0.11,
  sword_heavy: 0.18,
};

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function getAttackFxDuration(style: AttackFxStyle): number {
  return FX_DURATIONS[style];
}

function buildKnifeFx(root: Container, range: number, color: number): {
  blades: Graphics[];
  slash: Graphics;
} {
  const bladeLen = range * 0.9;
  const blades: Graphics[] = [];
  const trailAlphas = [0.95, 0.16, 0.1];
  for (let i = 0; i < 3; i++) {
    const blade = new Graphics();
    drawKnifeSlashArc(blade, bladeLen - i * 3, color, trailAlphas[i]!);
    root.addChild(blade);
    blades.push(blade);
  }
  const slash = new Graphics();
  drawKnifeSlashLine(slash, bladeLen * 0.72, 0.55);
  root.addChild(slash);
  return { blades, slash };
}

export function createWeaponAttackFx(
  style: AttackFxStyle,
  angle: number,
  range: number,
  color: number,
): WeaponAttackFxState {
  const duration = FX_DURATIONS[style];
  const root = new Container();
  const state: WeaponAttackFxState = {
    root,
    life: duration,
    duration,
    style,
    angle,
    range,
    color,
  };
  const parts = buildKnifeFx(root, range, color);
  state.blades = parts.blades;
  state.slash = parts.slash;
  root.rotation = angle;
  return state;
}

function updateKnifeFx(fx: WeaponAttackFxState, t: number): void {
  const sweep = easeOutCubic(t);
  const relStart = -0.48;
  const relEnd = 0;
  const curRel = relStart + (relEnd - relStart) * sweep;
  const trailDelays = [0, 0.14, 0.28];
  const trailAlphas = [0.95, 0.18, 0.1];
  fx.blades?.forEach((blade, i) => {
    const trailT = Math.max(0, sweep - trailDelays[i]!);
    blade.rotation = relStart + (relEnd - relStart) * trailT;
    blade.alpha = trailAlphas[i]!;
  });
  if (fx.slash) {
    fx.slash.rotation = curRel;
    fx.slash.alpha = 0.55 - t * 0.35;
  }
}

export function tickWeaponAttackFx(
  fx: WeaponAttackFxState,
  dt: number,
  x: number,
  y: number,
): boolean {
  fx.life -= dt;
  if (fx.life <= 0) return false;
  const t = 1 - fx.life / fx.duration;
  fx.root.x = x;
  fx.root.y = y - 4;
  updateKnifeFx(fx, t);
  return true;
}
