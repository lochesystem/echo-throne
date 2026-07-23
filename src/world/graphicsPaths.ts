import { Graphics } from 'pixi.js';

/** Lâmina no eixo +X (ponta em x = length). */
export function drawKnifeSlashLine(g: Graphics, length: number, alpha: number): void {
  g.arc(0, 0, length, -0.68, 0.18)
    .stroke({ width: 3, color: 0xf8f1da, alpha, cap: 'round' });
  g.arc(0, 0, Math.max(2, length - 4), -0.62, 0.12)
    .stroke({ width: 1.5, color: 0xc9e7c2, alpha: alpha * 0.55, cap: 'round' });
}

export function drawKnifeSlashArc(
  g: Graphics,
  radius: number,
  color: number,
  alpha: number,
): void {
  g.arc(0, 0, radius, -0.72, 0.2)
    .stroke({ width: 2.5, color, alpha, cap: 'round' });
}

export function drawSwordBlade(g: Graphics, length: number, color: number, alpha = 1): void {
  g.moveTo(length, 0)
    .lineTo(length * 0.35, 2.5)
    .lineTo(length * 0.35, -2.5)
    .closePath()
    .fill({ color, alpha });
  g.moveTo(length, 0)
    .lineTo(length * 0.35, 2.5)
    .lineTo(length * 0.35, -2.5)
    .closePath()
    .stroke({ width: 1, color: 0x8a6a48, alpha: alpha * 0.9 });
  g.rect(-3, -2.5, 5, 5).fill({ color: 0x8a6a3a, alpha });
}
