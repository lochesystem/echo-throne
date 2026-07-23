export function calcDamage(atk: number, def = 0): number {
  return Math.max(1, Math.round(atk - def * 0.5));
}

export function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.hypot(dx, dy);
}

export function normalize(dx: number, dy: number): { x: number; y: number } {
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/** Verifica se o alvo está dentro do arco de ataque melee. */
export function isInAttackArc(
  originX: number,
  originY: number,
  aimAngle: number,
  targetX: number,
  targetY: number,
  range: number,
  arcHalfAngle: number,
): boolean {
  const dx = targetX - originX;
  const dy = targetY - originY;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  const angleToTarget = Math.atan2(dy, dx);
  let diff = angleToTarget - aimAngle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= arcHalfAngle;
}

export function circlesOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy < (ar + br) ** 2;
}

/**
 * Verifica se um projétil linear alcançará o círculo-alvo dentro da janela.
 * Considera apenas projéteis vindo na direção do alvo e próximos da trajetória.
 */
export function isLinearImpactImminent(
  projectileX: number,
  projectileY: number,
  directionX: number,
  directionY: number,
  speed: number,
  targetX: number,
  targetY: number,
  collisionRadius: number,
  windowSeconds: number,
): boolean {
  if (speed <= 0 || windowSeconds < 0) return false;

  const relX = targetX - projectileX;
  const relY = targetY - projectileY;
  const forward = relX * directionX + relY * directionY;
  if (forward < 0) return false;

  const distanceSq = relX * relX + relY * relY;
  const lateralSq = Math.max(0, distanceSq - forward * forward);
  if (lateralSq > collisionRadius * collisionRadius) return false;

  const alongPathToContact = Math.max(
    0,
    forward - Math.sqrt(Math.max(0, collisionRadius * collisionRadius - lateralSq)),
  );
  return alongPathToContact / speed <= windowSeconds;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
