import {
  Assets,
  Container,
  Graphics,
  Rectangle,
  Texture,
  type Renderer,
} from 'pixi.js';
import {
  drawDrakmar,
  drawHunter,
  drawSpectralAdd,
  drakmarPoseAttack,
  drakmarPoseIdle,
  drakmarPoseWalk,
  hunterPoseAttack,
  hunterPoseDodge,
  hunterPoseIdle,
  hunterPoseWalk,
} from './actorFrames.ts';

export interface SpriteLayout {
  anchorX: number;
  anchorY: number;
  shadowY: number;
}

export interface HunterAnimations {
  idle: Texture[];
  walk: Texture[];
  attacks: Texture[][];
  dodge: Texture[];
  layout: SpriteLayout;
}

export interface BossAnimations {
  idle: Texture[];
  walk: Texture[];
  attacks: Record<string, Texture[]>;
  layout: SpriteLayout;
}

export interface AddAnimations {
  float: Texture[];
  layout: SpriteLayout;
}

export const HUNTER_IDLE_SPEED = 4 / 60;
export const HUNTER_WALK_SPEED = 10 / 60;
export const HUNTER_ATTACK_SPEED = 14 / 60;
export const HUNTER_DODGE_SPEED = 16 / 60;
export const BOSS_IDLE_SPEED = 5 / 60;
export const BOSS_WALK_SPEED = 8 / 60;
export const BOSS_ATTACK_SPEED = 12 / 60;
export const ADD_FLOAT_SPEED = 5 / 60;

const HUNTER_W = 48;
const HUNTER_H = 48;
const BOSS_W = 80;
const BOSS_H = 80;
const ADD_W = 32;
const ADD_H = 40;

let hunterAnims: HunterAnimations | null = null;
let bossAnims: BossAnimations | null = null;
let addAnims: AddAnimations | null = null;

function bakeFrame(
  renderer: Renderer,
  width: number,
  height: number,
  draw: (g: Graphics) => void,
): Texture {
  const g = new Graphics();
  draw(g);
  const root = new Container();
  root.addChild(g);
  root.position.set(width / 2, height - 4);
  const texture = renderer.generateTexture({
    target: root,
    resolution: 1,
    antialias: false,
  });
  texture.source.scaleMode = 'nearest';
  root.destroy({ children: true });
  return texture;
}

function bakeHunterFrames(renderer: Renderer): HunterAnimations {
  const idle = Array.from({ length: 4 }, (_, i) =>
    bakeFrame(renderer, HUNTER_W, HUNTER_H, (g) => drawHunter(g, hunterPoseIdle(i))));
  const walk = Array.from({ length: 4 }, (_, i) =>
    bakeFrame(renderer, HUNTER_W, HUNTER_H, (g) => drawHunter(g, hunterPoseWalk(i))));
  const attacks = [0, 1, 2].map((combo) =>
    Array.from({ length: 4 }, (_, i) =>
      bakeFrame(renderer, HUNTER_W, HUNTER_H, (g) => drawHunter(g, hunterPoseAttack(combo, i)))));
  const dodge = Array.from({ length: 3 }, (_, i) =>
    bakeFrame(renderer, HUNTER_W, HUNTER_H, (g) => drawHunter(g, hunterPoseDodge(i))));
  return {
    idle,
    walk,
    attacks,
    dodge,
    layout: { anchorX: 0.5, anchorY: 0.92, shadowY: 0 },
  };
}

function bakeBossFrames(renderer: Renderer): BossAnimations {
  const idle = Array.from({ length: 4 }, (_, i) =>
    bakeFrame(renderer, BOSS_W, BOSS_H, (g) => drawDrakmar(g, drakmarPoseIdle(i))));
  const walk = Array.from({ length: 4 }, (_, i) =>
    bakeFrame(renderer, BOSS_W, BOSS_H, (g) => drawDrakmar(g, drakmarPoseWalk(i))));
  const attackKinds = ['cutlass', 'gancho', 'onda', 'cross'] as const;
  const attacks: Record<string, Texture[]> = {};
  for (const kind of attackKinds) {
    attacks[kind] = Array.from({ length: 4 }, (_, i) =>
      bakeFrame(renderer, BOSS_W, BOSS_H, (g) => drawDrakmar(g, drakmarPoseAttack(kind, i))));
  }
  return {
    idle,
    walk,
    attacks,
    layout: { anchorX: 0.5, anchorY: 0.92, shadowY: 2 },
  };
}

function bakeAddFrames(renderer: Renderer): AddAnimations {
  const float = Array.from({ length: 4 }, (_, i) =>
    bakeFrame(renderer, ADD_W, ADD_H, (g) => drawSpectralAdd(g, i)));
  return {
    float,
    layout: { anchorX: 0.5, anchorY: 0.9, shadowY: 2 },
  };
}

export function bakeActorAnimations(renderer: Renderer): void {
  hunterAnims = bakeHunterFrames(renderer);
  bossAnims = bakeBossFrames(renderer);
  addAnims = bakeAddFrames(renderer);
}

function atlasRow(sheet: Texture, cell: number, row: number, count = 8): Texture[] {
  return Array.from({ length: count }, (_, column) => {
    const texture = new Texture({
      source: sheet.source,
      frame: new Rectangle(column * cell, row * cell, cell, cell),
    });
    texture.source.scaleMode = 'nearest';
    return texture;
  });
}

/**
 * Prepara fallbacks procedurais e, quando disponíveis, substitui os atores
 * principais pelos atlases pintados.
 */
export async function prepareActorAnimations(renderer: Renderer): Promise<void> {
  bakeActorAnimations(renderer);
  try {
    const base = import.meta.env.BASE_URL;
    const [hunterSheet, bossSheet, hunterRollSheet, bossWalkSheet] = await Promise.all([
      Assets.load<Texture>(`${base}assets/actors/hunter-atlas-v1.png`),
      Assets.load<Texture>(`${base}assets/actors/drakmar-atlas-v1.png`),
      Assets.load<Texture>(`${base}assets/actors/hunter-roll-v2.png`),
      Assets.load<Texture>(`${base}assets/actors/drakmar-walk-v2.png`),
    ]);
    hunterAnims = {
      idle: atlasRow(hunterSheet, 64, 0),
      walk: atlasRow(hunterSheet, 64, 1),
      attacks: [2, 3, 4].map((row) => atlasRow(hunterSheet, 64, row)),
      dodge: atlasRow(hunterRollSheet, 64, 0),
      layout: { anchorX: 0.5, anchorY: 53 / 64, shadowY: 0 },
    };
    bossAnims = {
      idle: atlasRow(bossSheet, 96, 0),
      walk: atlasRow(bossWalkSheet, 96, 0),
      attacks: {
        cutlass: atlasRow(bossSheet, 96, 2),
        gancho: atlasRow(bossSheet, 96, 3),
        onda: atlasRow(bossSheet, 96, 4),
        cross: atlasRow(bossSheet, 96, 4),
      },
      layout: { anchorX: 0.5, anchorY: 89 / 96, shadowY: 2 },
    };
  } catch (error) {
    console.warn('Atlases pintados indisponíveis; usando atores procedurais.', error);
  }
}

export function getHunterAnimations(): HunterAnimations | null {
  return hunterAnims;
}

export function getBossAnimations(): BossAnimations | null {
  return bossAnims;
}

export function getAddAnimations(): AddAnimations | null {
  return addAnims;
}

export function resetActorAnimations(): void {
  hunterAnims = null;
  bossAnims = null;
  addAnims = null;
}
