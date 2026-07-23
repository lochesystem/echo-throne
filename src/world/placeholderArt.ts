import { Container, Graphics } from 'pixi.js';

export interface ActorSprite extends Container {
  zOffset: number;
  body: Graphics;
}

function addShadow(parent: Container, radius: number): void {
  const shadow = new Graphics();
  shadow.ellipse(0, 0, radius * 1.1, radius * 0.45);
  shadow.fill({ color: 0x000000, alpha: 0.32 });
  parent.addChild(shadow);
}

/** Caçador: cabelo branco, lenço azul, armadura escura, espada prateada. */
export function createHunterSprite(): ActorSprite {
  const root = new Container() as ActorSprite;
  root.zOffset = 0.5;
  addShadow(root, 7);

  const body = new Graphics();
  // pernas
  body.rect(-3.5, -6, 3, 8);
  body.rect(0.5, -6, 3, 8);
  body.fill({ color: 0x2a2f3a });
  // tronco / armadura
  body.roundRect(-5, -18, 10, 13, 2);
  body.fill({ color: 0x3b4250 });
  // lenço azul
  body.roundRect(-5, -19, 10, 4, 1);
  body.fill({ color: 0x2f6fb0 });
  // cabeça
  body.circle(0, -22, 4.5);
  body.fill({ color: 0xe8c9a8 });
  // cabelo branco
  body.moveTo(-5, -23);
  body.lineTo(0, -30);
  body.lineTo(5, -23);
  body.lineTo(3, -22);
  body.lineTo(0, -27);
  body.lineTo(-3, -22);
  body.fill({ color: 0xf2f2f2 });
  root.addChild(body);
  root.body = body;

  return root;
}

/** Espada segurada pelo caçador (girada durante o golpe). */
export function createSwordSprite(): Graphics {
  const g = new Graphics();
  g.rect(0, -1, 22, 2);
  g.fill({ color: 0xd8dce8 });
  g.rect(-4, -2.5, 5, 5);
  g.fill({ color: 0x8a6a3a });
  return g;
}

/** Capitão Drakmar: bicorne com caveira, casaco vermelho, gancho e cutlass. */
export function createDrakmarSprite(): ActorSprite {
  const root = new Container() as ActorSprite;
  root.zOffset = 0.5;
  addShadow(root, 16);

  const body = new Graphics();
  // botas
  body.rect(-8, -8, 6, 10);
  body.rect(2, -8, 6, 10);
  body.fill({ color: 0x1c130c });
  // casaco vermelho
  body.roundRect(-12, -34, 24, 30, 4);
  body.fill({ color: 0x8a1f28 });
  body.roundRect(-12, -34, 24, 30, 4);
  body.stroke({ color: 0xc9a227, width: 1.5 });
  // cinto
  body.rect(-12, -14, 24, 3);
  body.fill({ color: 0x2a1a0e });
  // camisa
  body.roundRect(-5, -34, 10, 14, 2);
  body.fill({ color: 0x2a2018 });
  // cabeça / barba
  body.circle(0, -40, 6);
  body.fill({ color: 0xd8b48c });
  body.roundRect(-6, -38, 12, 6, 2);
  body.fill({ color: 0x3a2a1a });
  // bicorne
  body.moveTo(-12, -44);
  body.lineTo(12, -44);
  body.lineTo(6, -50);
  body.lineTo(-6, -50);
  body.fill({ color: 0x141019 });
  body.circle(0, -46, 2);
  body.fill({ color: 0xe8e8e8 });
  // cutlass
  body.rect(12, -30, 20, 2.5);
  body.fill({ color: 0xdfe4ee });
  // gancho
  body.moveTo(-12, -24);
  body.lineTo(-20, -22);
  body.arc(-20, -26, 4, Math.PI * 0.5, Math.PI * 1.9);
  body.stroke({ color: 0xbfc4cc, width: 2 });
  root.addChild(body);
  root.body = body;

  return root;
}

/** Tripulante espectral (add da fase 2). */
export function createSpectralAddSprite(): ActorSprite {
  const root = new Container() as ActorSprite;
  root.zOffset = 0.4;
  addShadow(root, 6);
  const body = new Graphics();
  body.roundRect(-4, -16, 8, 14, 3);
  body.fill({ color: 0x3aa0a8, alpha: 0.75 });
  body.circle(0, -18, 3.5);
  body.fill({ color: 0x9ff0f5, alpha: 0.85 });
  body.circle(-1.2, -18, 0.8);
  body.circle(1.2, -18, 0.8);
  body.fill({ color: 0x0b1a2a });
  root.addChild(body);
  root.body = body;
  return root;
}
