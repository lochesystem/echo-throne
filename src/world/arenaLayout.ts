import { Container, Graphics } from 'pixi.js';
import { ARENA_HEIGHT, ARENA_WALL, ARENA_WIDTH } from '../engine/constants.ts';

export interface ArenaBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Limites caminháveis do convés (dentro das amuradas). */
export function getArenaBounds(): ArenaBounds {
  return {
    minX: ARENA_WALL,
    minY: ARENA_WALL,
    maxX: ARENA_WIDTH - ARENA_WALL,
    maxY: ARENA_HEIGHT - ARENA_WALL,
  };
}

export function clampToArena(x: number, y: number, radius: number): { x: number; y: number } {
  const b = getArenaBounds();
  return {
    x: Math.max(b.minX + radius, Math.min(b.maxX - radius, x)),
    y: Math.max(b.minY + radius, Math.min(b.maxY - radius, y)),
  };
}

/** Desenha o convés do navio: tábuas, amuradas, grades, barris e bandeira. */
export function buildArenaBackground(): Container {
  const root = new Container();

  // Mar ao redor
  const sea = new Graphics();
  sea.rect(-40, -40, ARENA_WIDTH + 80, ARENA_HEIGHT + 80);
  sea.fill({ color: 0x0b1a2a });
  root.addChild(sea);

  // Casco / borda externa
  const hull = new Graphics();
  hull.roundRect(-6, -6, ARENA_WIDTH + 12, ARENA_HEIGHT + 12, 26);
  hull.fill({ color: 0x2a1c12 });
  root.addChild(hull);

  // Convés (tábuas)
  const deck = new Graphics();
  deck.roundRect(ARENA_WALL - 4, ARENA_WALL - 4, ARENA_WIDTH - ARENA_WALL * 2 + 8, ARENA_HEIGHT - ARENA_WALL * 2 + 8, 18);
  deck.fill({ color: 0x5a3d24 });
  for (let x = ARENA_WALL; x < ARENA_WIDTH - ARENA_WALL; x += 16) {
    deck.rect(x, ARENA_WALL, 1, ARENA_HEIGHT - ARENA_WALL * 2);
    deck.fill({ color: 0x4a3018, alpha: 0.6 });
  }
  root.addChild(deck);

  // Grades no chão (as duas do mockup)
  for (const gx of [ARENA_WIDTH * 0.32, ARENA_WIDTH * 0.68]) {
    const grate = new Graphics();
    const gy = ARENA_HEIGHT * 0.5;
    grate.roundRect(gx - 22, gy - 18, 44, 36, 3);
    grate.fill({ color: 0x2b1d12 });
    for (let i = -18; i <= 18; i += 6) {
      grate.rect(gx - 20, gy + i, 40, 1.5);
      grate.fill({ color: 0x120a06 });
    }
    for (let i = -20; i <= 20; i += 6) {
      grate.rect(gx + i, gy - 16, 1.5, 32);
      grate.fill({ color: 0x120a06 });
    }
    root.addChild(grate);
  }

  // Amuradas (borda)
  const rail = new Graphics();
  rail.roundRect(2, 2, ARENA_WIDTH - 4, ARENA_HEIGHT - 4, 22);
  rail.stroke({ color: 0x3a2616, width: ARENA_WALL, alignment: 0 });
  root.addChild(rail);

  // Barris nos cantos
  for (const [bx, by] of [
    [ARENA_WALL + 12, ARENA_WALL + 12],
    [ARENA_WIDTH - ARENA_WALL - 12, ARENA_WALL + 14],
    [ARENA_WALL + 14, ARENA_HEIGHT - ARENA_WALL - 14],
    [ARENA_WIDTH - ARENA_WALL - 14, ARENA_HEIGHT - ARENA_WALL - 12],
  ] as const) {
    const barrel = new Graphics();
    barrel.ellipse(bx, by, 9, 9);
    barrel.fill({ color: 0x6b4a2a });
    barrel.ellipse(bx, by, 9, 9);
    barrel.stroke({ color: 0x3a2614, width: 2 });
    barrel.rect(bx - 9, by - 2, 18, 1.5);
    barrel.fill({ color: 0x3a2614 });
    root.addChild(barrel);
  }

  return root;
}
