import { GAME } from '../../config/game';
import { Maze } from '../maze/Maze';
import { Ctx, linear, seeded } from './canvasUtil';

export interface MazeTheme {
  glow: string;
  edge: string;
  core: string;
  floorTint: string;
}

export const THEME_NORMAL: MazeTheme = { glow: 'rgba(255,40,30,0.95)', edge: '#e5231d', core: '#ff7a66', floorTint: 'rgba(120,10,14,0.10)' };
export const THEME_HELL: MazeTheme = { glow: 'rgba(255,150,20,1)', edge: '#ff6a00', core: '#ffe27a', floorTint: 'rgba(200,50,0,0.22)' };

/** Pinta el laberinto completo en un canvas (suelo, paredes con borde de neón, casa, puerta). */
export function drawMaze(ctx: Ctx, maze: Maze, theme: MazeTheme): void {
  const T = GAME.tile;
  const W = maze.width * T;
  const H = maze.height * T;
  const rnd = seeded(2024);
  ctx.clearRect(0, 0, W, H);

  // Suelo
  ctx.fillStyle = linear(ctx, 0, 0, 0, H, [[0, '#0d0708'], [1, '#080405']]);
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      const k = maze.kind(x, y);
      if (k === 'wall') continue;
      ctx.fillStyle = (x + y) % 2 === 0 ? 'rgba(255,255,255,0.018)' : 'rgba(255,255,255,0.006)';
      ctx.fillRect(x * T, y * T, T, T);
      ctx.fillStyle = theme.floorTint;
      ctx.fillRect(x * T, y * T, T, T);
      if (k === 'house') {
        ctx.fillStyle = 'rgba(255,60,50,0.10)';
        ctx.fillRect(x * T, y * T, T, T);
      }
    }
  }

  const isWall = (x: number, y: number): boolean => maze.isWall(x, y);
  const open = (x: number, y: number): boolean => !isWall(x, y);
  const R = 11; // radio de esquinas convexas

  const rectFor = (x: number, y: number, inset: number): { px: number; py: number; w: number; h: number; radii: number[] } => {
    const l = open(x - 1, y);
    const r = open(x + 1, y);
    const u = open(x, y - 1);
    const d = open(x, y + 1);
    const px = x * T + (l ? inset : 0);
    const py = y * T + (u ? inset : 0);
    const w = T - (l ? inset : 0) - (r ? inset : 0);
    const h = T - (u ? inset : 0) - (d ? inset : 0);
    const rr = Math.max(R - inset, 1);
    const radii = [u && l ? rr : 0, u && r ? rr : 0, d && r ? rr : 0, d && l ? rr : 0];
    return { px, py, w, h, radii };
  };

  // 1) Capa de neón (rojo) con resplandor hacia el camino
  ctx.save();
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 16;
  ctx.fillStyle = theme.edge;
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (!isWall(x, y)) continue;
      const r = rectFor(x, y, 0);
      ctx.beginPath();
      ctx.roundRect(r.px, r.py, r.w, r.h, r.radii);
      ctx.fill();
    }
  }
  ctx.restore();

  // 2) Núcleo caliente del borde
  ctx.fillStyle = theme.core;
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (!isWall(x, y)) continue;
      const r = rectFor(x, y, 1.5);
      ctx.beginPath();
      ctx.roundRect(r.px, r.py, r.w, r.h, r.radii);
      ctx.fill();
    }
  }

  // 3) Interior oscuro (carbón) dejando un anillo de neón de 4px
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (!isWall(x, y)) continue;
      const r = rectFor(x, y, 4);
      ctx.fillStyle = linear(ctx, x * T, y * T, x * T + T, y * T + T, [[0, '#26161a'], [1, '#0e0709']]);
      ctx.beginPath();
      ctx.roundRect(r.px, r.py, r.w, r.h, r.radii);
      ctx.fill();
    }
  }

  // 4) Textura de carbón: ladrillos tenues y grietas de brasa
  ctx.lineWidth = 1;
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (!isWall(x, y)) continue;
      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.beginPath();
      ctx.moveTo(x * T + 6, y * T + T / 2);
      ctx.lineTo(x * T + T - 6, y * T + T / 2);
      ctx.stroke();
      if (rnd() < 0.3) {
        const ex = x * T + 8 + rnd() * (T - 16);
        const ey = y * T + 8 + rnd() * (T - 16);
        ctx.fillStyle = 'rgba(255,140,40,0.55)';
        ctx.fillRect(ex, ey, 2, 2);
        ctx.fillStyle = 'rgba(255,90,20,0.18)';
        ctx.fillRect(ex - 2, ey - 2, 6, 6);
      }
    }
  }

  // 5) Puerta de la casa de enemigos
  const dx = maze.door.x * T;
  const dy = maze.door.y * T;
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffe9d6';
  ctx.fillRect(dx + 2, dy + T / 2 - 2, T - 4, 4);
  ctx.restore();
}
