import { Graphics } from 'pixi.js';
import { drawSwordBlade } from './graphicsPaths.ts';

const C = {
  leg: 0x2a2f3a,
  armor: 0x3b4250,
  armorHi: 0x4a5364,
  scarf: 0x2f6fb0,
  skin: 0xe8c9a8,
  hair: 0xf2f2f2,
  outline: 0x1a1e26,
  sword: 0xd8dce8,
} as const;

export interface HunterPose {
  bodyY: number;
  leftLeg: number;
  rightLeg: number;
  torsoLean: number;
  armAngle: number;
  scarfWave: number;
  hairWave: number;
  swordExtend: number;
}

export function hunterPoseIdle(frame: number): HunterPose {
  const t = frame / 4;
  const breathe = Math.sin(t * Math.PI * 2);
  return {
    bodyY: breathe * 0.8,
    leftLeg: 0,
    rightLeg: 0,
    torsoLean: breathe * 0.04,
    armAngle: -0.35 + breathe * 0.05,
    scarfWave: breathe * 1.2,
    hairWave: breathe * 0.8,
    swordExtend: 0.85,
  };
}

export function hunterPoseWalk(frame: number): HunterPose {
  const t = frame / 4;
  const swing = Math.sin(t * Math.PI * 2);
  return {
    bodyY: Math.abs(swing) * -1.5,
    leftLeg: swing * 4,
    rightLeg: -swing * 4,
    torsoLean: swing * 0.08,
    armAngle: -0.5 - swing * 0.35,
    scarfWave: swing * 2,
    hairWave: swing * 1.5,
    swordExtend: 0.9,
  };
}

export function hunterPoseAttack(combo: number, frame: number): HunterPose {
  const t = frame / 4;
  const base = { bodyY: 0, leftLeg: 0, rightLeg: 0, scarfWave: 0, hairWave: 0, swordExtend: 1 };
  if (combo === 0) {
    const swing = t < 0.5 ? t * 2 : 1;
    return {
      ...base,
      bodyY: swing * -2,
      torsoLean: -0.12 + swing * 0.28,
      armAngle: -1.4 + swing * 1.8,
      leftLeg: swing * 2,
      rightLeg: -swing * 3,
      swordExtend: 0.7 + swing * 0.35,
    };
  }
  if (combo === 1) {
    const swing = t < 0.45 ? t / 0.45 : 1;
    return {
      ...base,
      bodyY: swing * -3,
      torsoLean: -0.2 + swing * 0.15,
      armAngle: 0.2 - swing * 2.2,
      leftLeg: 2,
      rightLeg: -4 + swing * 2,
      swordExtend: 0.75 + swing * 0.3,
    };
  }
  // finisher — windup longo, golpe pesado
  const windup = t < 0.35 ? t / 0.35 : 1;
  const strike = t < 0.35 ? 0 : (t - 0.35) / 0.65;
  const arm = t < 0.35 ? -2.0 + windup * 0.5 : -1.5 + strike * 2.4;
  return {
    ...base,
    bodyY: (t < 0.35 ? windup * 2 : -strike * 4),
    torsoLean: (t < 0.35 ? 0.15 : -0.25 + strike * 0.4),
    armAngle: arm,
    leftLeg: 3,
    rightLeg: -5 + strike * 4,
    scarfWave: strike * 3,
    hairWave: strike * 2.5,
    swordExtend: t < 0.35 ? 0.6 : 0.8 + strike * 0.4,
  };
}

export function hunterPoseDodge(frame: number): HunterPose {
  const t = frame / 3;
  if (t < 0.33) {
    return {
      bodyY: 2, leftLeg: 2, rightLeg: -1, torsoLean: 0.2,
      armAngle: -0.8, scarfWave: 2, hairWave: 1, swordExtend: 0.7,
    };
  }
  if (t < 0.66) {
    return {
      bodyY: 0, leftLeg: -5, rightLeg: 5, torsoLean: 0.35,
      armAngle: -1.2, scarfWave: 4, hairWave: 3, swordExtend: 0.65,
    };
  }
  return {
    bodyY: 1, leftLeg: 0, rightLeg: 0, torsoLean: 0.05,
    armAngle: -0.4, scarfWave: 0, hairWave: 0, swordExtend: 0.85,
  };
}

/** Desenha o caçador olhando para a direita (+X), pés em (0, 0). */
export function drawHunter(g: Graphics, pose: HunterPose): void {
  g.clear();
  const by = pose.bodyY;

  // pernas
  g.rect(-4 + pose.leftLeg, -7 + by, 3.5, 9);
  g.rect(0.5 + pose.rightLeg, -7 + by, 3.5, 9);
  g.fill({ color: C.leg });
  g.rect(-4 + pose.leftLeg, -7 + by, 3.5, 9);
  g.rect(0.5 + pose.rightLeg, -7 + by, 3.5, 9);
  g.stroke({ width: 1, color: C.outline, alpha: 0.5 });

  // tronco
  g.roundRect(-6, -20 + by, 12, 14, 2);
  g.fill({ color: C.armor });
  g.roundRect(-5, -19 + by, 10, 3, 1);
  g.fill({ color: C.armorHi });

  // lenço
  g.roundRect(-6 + pose.scarfWave * 0.2, -21 + by, 12, 4, 1);
  g.fill({ color: C.scarf });
  g.moveTo(5, -19 + by);
  g.lineTo(8 + pose.scarfWave, -17 + by + pose.scarfWave * 0.3);
  g.lineTo(5, -17 + by);
  g.fill({ color: C.scarf, alpha: 0.85 });

  // cabeça
  g.circle(0, -24 + by, 5);
  g.fill({ color: C.skin });
  // cabelo
  g.moveTo(-5, -25 + by - pose.hairWave * 0.2);
  g.lineTo(0, -32 + by - pose.hairWave);
  g.lineTo(5, -25 + by - pose.hairWave * 0.2);
  g.lineTo(3, -24 + by);
  g.lineTo(0, -29 + by - pose.hairWave * 0.5);
  g.lineTo(-3, -24 + by);
  g.fill({ color: C.hair });

  // braço + espada
  const ax = Math.cos(pose.armAngle) * 8;
  const ay = Math.sin(pose.armAngle) * 8;
  g.moveTo(2, -16 + by);
  g.lineTo(2 + ax, -16 + by + ay);
  g.stroke({ width: 2.5, color: C.armor, cap: 'round' });

  const sx = 2 + Math.cos(pose.armAngle) * 10;
  const sy = -16 + by + Math.sin(pose.armAngle) * 10;
  const blade = new Graphics();
  drawSwordBlade(blade, 20 * pose.swordExtend, C.sword);
  blade.rotation = pose.armAngle;
  blade.position.set(sx, sy);
  g.addChild(blade);
}

// ---- Drakmar (olhando para a direita, pés em 0,0) ----

export interface DrakmarPose {
  bodyY: number;
  leftLeg: number;
  rightLeg: number;
  coatSway: number;
  armAngle: number;
  hookExtend: number;
  lean: number;
}

export function drakmarPoseIdle(frame: number): DrakmarPose {
  const t = frame / 4;
  const sway = Math.sin(t * Math.PI * 2);
  return {
    bodyY: sway * 1.2,
    leftLeg: 0,
    rightLeg: 0,
    coatSway: sway * 2,
    armAngle: -0.2 + sway * 0.08,
    hookExtend: 0.9 + sway * 0.05,
    lean: sway * 0.03,
  };
}

export function drakmarPoseWalk(frame: number): DrakmarPose {
  const t = frame / 4;
  const stomp = Math.sin(t * Math.PI * 2);
  return {
    bodyY: Math.abs(stomp) * -2,
    leftLeg: stomp * 5,
    rightLeg: -stomp * 5,
    coatSway: stomp * 3,
    armAngle: -0.3 - stomp * 0.2,
    hookExtend: 0.95,
    lean: stomp * 0.1,
  };
}

export function drakmarPoseAttack(kind: string, frame: number): DrakmarPose {
  const t = frame / 4;
  const base = { bodyY: 0, leftLeg: 0, rightLeg: 0, coatSway: 0, hookExtend: 1, lean: 0 };
  if (kind === 'gancho') {
    const throwT = t < 0.5 ? t * 2 : 1;
    return {
      ...base,
      bodyY: throwT * -2,
      lean: -0.15 * throwT,
      armAngle: -2.2 + throwT * 1.6,
      hookExtend: 0.5 + throwT * 0.8,
      leftLeg: 2,
      rightLeg: -3,
    };
  }
  if (kind === 'onda' || kind === 'cross') {
    const chant = Math.sin(t * Math.PI);
    return {
      ...base,
      bodyY: -chant * 3,
      lean: -0.1,
      armAngle: -1.5 + chant * 0.5,
      hookExtend: 0.8,
      coatSway: chant * 4,
    };
  }
  // cutlass
  const swing = t < 0.4 ? t / 0.4 : 1;
  return {
    ...base,
    bodyY: swing * -3,
    lean: -0.2 + swing * 0.35,
    armAngle: -1.6 + swing * 2.0,
    hookExtend: 0.7,
    coatSway: swing * 5,
    leftLeg: swing * 3,
    rightLeg: -swing * 4,
  };
}

export function drawDrakmar(g: Graphics, pose: DrakmarPose): void {
  g.clear();
  const by = pose.bodyY;
  const lean = pose.lean;

  g.rect(-9 + pose.leftLeg, -10 + by, 7, 12);
  g.rect(2 + pose.rightLeg, -10 + by, 7, 12);
  g.fill({ color: 0x1c130c });

  g.roundRect(-14, -38 + by, 28, 32, 4);
  g.fill({ color: 0x8a1f28 });
  g.roundRect(-14 + pose.coatSway * 0.15, -38 + by, 28, 32, 4);
  g.stroke({ width: 1.5, color: 0xc9a227 });
  g.rect(-14, -16 + by, 28, 3);
  g.fill({ color: 0x2a1a0e });

  g.roundRect(-6, -38 + by, 12, 16, 2);
  g.fill({ color: 0x2a2018 });

  g.circle(0 + lean * 8, -44 + by, 7);
  g.fill({ color: 0xd8b48c });
  g.roundRect(-7 + lean * 8, -42 + by, 14, 7, 2);
  g.fill({ color: 0x3a2a1a });

  // bicorne
  g.moveTo(-14 + lean * 8, -48 + by);
  g.lineTo(14 + lean * 8, -48 + by);
  g.lineTo(8 + lean * 8, -56 + by);
  g.lineTo(-8 + lean * 8, -56 + by);
  g.fill({ color: 0x141019 });
  g.circle(lean * 8, -50 + by, 2.5);
  g.fill({ color: 0xe8e8e8 });

  // cutlass (braço direito)
  const ax = Math.cos(pose.armAngle) * 14;
  const ay = Math.sin(pose.armAngle) * 14;
  g.moveTo(8, -28 + by);
  g.lineTo(8 + ax, -28 + by + ay);
  g.stroke({ width: 3, color: 0x8a1f28, cap: 'round' });
  const blade = new Graphics();
  blade.rect(0, -1.5, 22, 3);
  blade.fill({ color: 0xdfe4ee });
  blade.rotation = pose.armAngle;
  blade.position.set(8 + ax, -28 + by + ay);
  g.addChild(blade);

  // gancho (braço esquerdo)
  const hx = -12 - pose.hookExtend * 10;
  g.moveTo(-12, -26 + by);
  g.lineTo(hx, -24 + by);
  g.stroke({ width: 2.5, color: 0xbfc4cc, cap: 'round' });
  g.arc(hx, -28 + by, 5 * pose.hookExtend, Math.PI * 0.4, Math.PI * 1.6);
  g.stroke({ width: 2.5, color: 0xbfc4cc });
}

export function drawSpectralAdd(g: Graphics, frame: number): void {
  g.clear();
  const t = frame / 4;
  const bob = Math.sin(t * Math.PI * 2) * 2;
  const flicker = 0.7 + Math.sin(t * Math.PI * 4) * 0.15;
  g.roundRect(-5, -18 + bob, 10, 16, 3);
  g.fill({ color: 0x3aa0a8, alpha: flicker });
  g.circle(0, -20 + bob, 4.5);
  g.fill({ color: 0x9ff0f5, alpha: flicker + 0.1 });
  g.circle(-1.5, -20 + bob, 1);
  g.circle(1.5, -20 + bob, 1);
  g.fill({ color: 0x0b1a2a });
  // rastro fantasmagórico
  g.roundRect(-4, -16 + bob, 8, 12, 2);
  g.fill({ color: 0x9ff0f5, alpha: 0.15 });
}
