import { Container, Graphics, AnimatedSprite } from 'pixi.js';
import {
  ADD_FLOAT_SPEED,
  BOSS_IDLE_SPEED,
  BOSS_WALK_SPEED,
  getAddAnimations,
  getBossAnimations,
  getHunterAnimations,
  HUNTER_DODGE_SPEED,
  HUNTER_IDLE_SPEED,
  HUNTER_WALK_SPEED,
} from './actorAnimAssets.ts';
import { drawDrakmar, drawHunter, drawSpectralAdd, drakmarPoseIdle, hunterPoseIdle } from './actorFrames.ts';

function drawShadow(parent: Container, width: number): Graphics {
  const shadow = new Graphics();
  shadow.ellipse(0, 0, width * 0.3, width * 0.1);
  shadow.fill({ color: 0x000000, alpha: 0.35 });
  parent.addChild(shadow);
  return shadow;
}

/** Sprites olham para a esquerda em scale.x = 1 (padrão snaredusk). */
function applySpriteFacing(
  target: { scale: { x: number } },
  moveX: number,
  facing: { value: number },
  nativeScale = 1,
): void {
  if (moveX < -0.01) facing.value = 1;
  else if (moveX > 0.01) facing.value = -1;
  target.scale.x = facing.value * nativeScale;
}

export interface HunterSprite extends Container {
  zOffset: number;
  setLocomotion(moving: boolean, moveX?: number): void;
  playAttack(comboIndex: number, aimX: number, duration: number): void;
  playDodge(): void;
  setHurtFlash(active: boolean): void;
}

export function createHunterSprite(): HunterSprite {
  const root = new Container() as HunterSprite;
  root.zOffset = 0.5;
  const anims = getHunterAnimations();
  const facing = { value: 1 };
  let anim: AnimatedSprite | null = null;
  let attacking = false;
  let dodging = false;
  let lastMoving = false;
  let lastMoveX = 0;

  if (anims) {
    const shadow = drawShadow(root, 20);
    shadow.y = anims.layout.shadowY;
    anim = new AnimatedSprite(anims.idle);
    anim.anchor.set(anims.layout.anchorX, anims.layout.anchorY);
    anim.roundPixels = true;
    anim.animationSpeed = HUNTER_IDLE_SPEED;
    anim.play();
    root.addChild(anim);
  } else {
    const shadow = drawShadow(root, 20);
    shadow.y = 0;
    const body = new Graphics();
    drawHunter(body, hunterPoseIdle(0));
    root.addChild(body);
  }

  root.setLocomotion = (moving: boolean, moveX = 0) => {
    if (!anim || !anims) return;
    lastMoving = moving;
    if (Math.abs(moveX) > 0.01) lastMoveX = moveX;
    if (attacking || dodging) return;
    applySpriteFacing(anim, moveX, facing);
    const next = moving ? anims.walk : anims.idle;
    if (anim.textures !== next) {
      anim.textures = next;
      anim.animationSpeed = moving ? HUNTER_WALK_SPEED : HUNTER_IDLE_SPEED;
      anim.loop = true;
      anim.gotoAndPlay(0);
    }
  };

  root.playAttack = (comboIndex: number, aimX: number, duration: number) => {
    if (!anim || !anims) return;
    const textures = anims.attacks[comboIndex] ?? anims.attacks[0];
    if (!textures?.length) return;
    attacking = true;
    dodging = false;
    applySpriteFacing(anim, aimX, facing);
    anim.loop = false;
    anim.textures = textures;
    anim.animationSpeed = textures.length / Math.max(1, duration * 60);
    anim.onComplete = () => {
      if (!anim || !anims) return;
      attacking = false;
      anim.loop = true;
      anim.onComplete = undefined;
      anim.textures = lastMoving ? anims.walk : anims.idle;
      anim.animationSpeed = lastMoving ? HUNTER_WALK_SPEED : HUNTER_IDLE_SPEED;
      applySpriteFacing(anim, lastMoveX, facing);
      anim.gotoAndPlay(0);
    };
    anim.gotoAndPlay(0);
  };

  root.playDodge = () => {
    if (!anim || !anims || attacking) return;
    dodging = true;
    anim.loop = false;
    anim.textures = anims.dodge;
    anim.animationSpeed = HUNTER_DODGE_SPEED;
    anim.onComplete = () => {
      if (!anim || !anims) return;
      dodging = false;
      anim.loop = true;
      anim.onComplete = undefined;
      anim.textures = lastMoving ? anims.walk : anims.idle;
      anim.animationSpeed = lastMoving ? HUNTER_WALK_SPEED : HUNTER_IDLE_SPEED;
      anim.gotoAndPlay(0);
    };
    anim.gotoAndPlay(0);
  };

  root.setHurtFlash = (active: boolean) => {
    root.alpha = active ? 0.55 : 1;
  };

  return root;
}

export interface BossSprite extends Container {
  zOffset: number;
  setLocomotion(moving: boolean, moveX?: number): void;
  playAttack(kind: string, duration?: number): void;
  setStaggered(active: boolean): void;
}

export function createDrakmarSprite(): BossSprite {
  const root = new Container() as BossSprite;
  root.zOffset = 0.5;
  const anims = getBossAnimations();
  const facing = { value: -1 };
  let anim: AnimatedSprite | null = null;
  let attacking = false;
  let lastMoving = false;
  let lastMoveX = 0;

  if (anims) {
    const shadow = drawShadow(root, 36);
    shadow.y = anims.layout.shadowY;
    anim = new AnimatedSprite(anims.idle);
    anim.anchor.set(anims.layout.anchorX, anims.layout.anchorY);
    anim.roundPixels = true;
    anim.animationSpeed = BOSS_IDLE_SPEED;
    anim.play();
    root.addChild(anim);
    facing.value = -1;
    anim.scale.x = -1;
  } else {
    drawShadow(root, 36);
    const body = new Graphics();
    drawDrakmar(body, drakmarPoseIdle(0));
    root.addChild(body);
  }

  root.setLocomotion = (moving: boolean, moveX = 0) => {
    if (!anim || !anims) return;
    lastMoving = moving;
    if (Math.abs(moveX) > 0.01) lastMoveX = moveX;
    if (attacking) return;
    applySpriteFacing(anim, moveX, facing);
    const next = moving ? anims.walk : anims.idle;
    if (anim.textures !== next) {
      anim.textures = next;
      anim.animationSpeed = moving ? BOSS_WALK_SPEED : BOSS_IDLE_SPEED;
      anim.loop = true;
      anim.gotoAndPlay(0);
    }
  };

  root.playAttack = (kind: string, duration = 0.4) => {
    if (!anim || !anims) return;
    const textures = anims.attacks[kind] ?? anims.attacks.cutlass;
    if (!textures?.length) return;
    attacking = true;
    applySpriteFacing(anim, lastMoveX, facing);
    anim.loop = false;
    anim.textures = textures;
    anim.animationSpeed = textures.length / Math.max(1, duration * 60);
    anim.onComplete = () => {
      if (!anim || !anims) return;
      attacking = false;
      anim.loop = true;
      anim.onComplete = undefined;
      anim.textures = lastMoving ? anims.walk : anims.idle;
      anim.animationSpeed = lastMoving ? BOSS_WALK_SPEED : BOSS_IDLE_SPEED;
      applySpriteFacing(anim, lastMoveX, facing);
      anim.gotoAndPlay(0);
    };
    anim.gotoAndPlay(0);
  };

  root.setStaggered = (active: boolean) => {
    root.alpha = active ? 0.72 : 1;
    if (anim) anim.tint = active ? 0xffaaaa : 0xffffff;
  };

  return root;
}

export interface AddSprite extends Container {
  zOffset: number;
}

export function createSpectralAddSprite(): AddSprite {
  const root = new Container() as AddSprite;
  root.zOffset = 0.4;
  const anims = getAddAnimations();

  if (anims) {
    const shadow = drawShadow(root, 14);
    shadow.y = anims.layout.shadowY;
    const anim = new AnimatedSprite(anims.float);
    anim.anchor.set(anims.layout.anchorX, anims.layout.anchorY);
    anim.roundPixels = true;
    anim.animationSpeed = ADD_FLOAT_SPEED;
    anim.play();
    root.addChild(anim);
  } else {
    drawShadow(root, 14);
    const body = new Graphics();
    drawSpectralAdd(body, 0);
    root.addChild(body);
  }

  return root;
}
