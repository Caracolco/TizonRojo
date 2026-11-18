import { EnemyKind } from '../../config/enemies';
import { Ctx, ellipse, linear, Pt, radial, smoothClosed, star } from './canvasUtil';
import { DirName } from './mascot';

export type EnemyVisual = 'normal' | 'scared' | 'blink' | 'eyes';
export const ENEMY_SIZE = 96;
const OUTLINE = '#14080c';

interface Look { top: string; bottom: string }

function look(color: string, dark: string, v: EnemyVisual): Look {
  if (v === 'scared') return { top: '#5f78ff', bottom: '#1b2596' };
  if (v === 'blink') return { top: '#ffffff', bottom: '#b9c2ff' };
  return { top: lighten(color), bottom: dark };
}

function lighten(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number): number => Math.min(255, Math.round(v + (255 - v) * 0.45));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function fillBody(ctx: Ctx, l: Look, base: string): void {
  ctx.fillStyle = linear(ctx, 0, 14, 0, 92, [[0, l.top], [0.45, base], [1, l.bottom]]);
  ctx.fill();
  ctx.lineWidth = 4.5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

export function drawEnemy(ctx: Ctx, kind: EnemyKind, color: string, dark: string, o: { dir: DirName; frame: number; visual: EnemyVisual }): void {
  ctx.clearRect(0, 0, ENEMY_SIZE, ENEMY_SIZE);
  const f = o.frame % 2;
  const dx = o.dir === 'l' ? -4 : o.dir === 'r' ? 4 : 0;
  const dy = o.dir === 'u' ? -4 : o.dir === 'd' ? 3 : 0;

  if (o.visual === 'eyes') {
    drawEyes(ctx, 48, 50, 13, dx, dy, false);
    return;
  }
  const l = look(color, dark, o.visual);
  const scared = o.visual === 'scared' || o.visual === 'blink';

  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ellipse(ctx, 48, 91, 28, 4);
  ctx.fill();

  switch (kind) {
    case 'chaser': drawChili(ctx, color, l, f, scared, dx, dy); break;
    case 'ambusher': drawSmoke(ctx, color, l, f, scared, dx, dy); break;
    case 'patroller': drawAsh(ctx, color, l, f, scared, dx, dy); break;
    case 'variable': drawSpark(ctx, color, l, f, scared, dx, dy, o.frame); break;
  }
}

function drawEyes(ctx: Ctx, cx: number, cy: number, gap: number, dx: number, dy: number, big: boolean): void {
  for (const sx of [-1, 1]) {
    const x = cx + sx * gap;
    ctx.fillStyle = '#fff';
    ellipse(ctx, x, cy, big ? 10 : 8.4, big ? 12 : 10.4);
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.fillStyle = OUTLINE;
    ellipse(ctx, x + dx * 0.9, cy + dy * 0.9 + 1, big ? 3.4 : 4.6, big ? 4 : 5.6);
    ctx.fill();
  }
}

function scaredMouth(ctx: Ctx, x: number, y: number): void {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  for (let i = 0; i < 6; i++) ctx.lineTo(x - 16 + (i + 1) * 5.4, y + (i % 2 === 0 ? -5 : 4));
  ctx.stroke();
}

function drawChili(ctx: Ctx, color: string, l: Look, f: number, scared: boolean, dx: number, dy: number): void {
  const tail = f ? 5 : -3;
  const pts: Pt[] = [
    [48, 24], [68, 30], [79, 50], [73, 72], [59, 86], [46 + tail, 93], [34, 84], [24, 70], [17, 50], [28, 30],
  ];
  smoothClosed(ctx, pts);
  fillBody(ctx, l, color);
  // brillo
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ellipse(ctx, 29, 48, 3.5, 11, -0.2);
  ctx.fill();
  // tallo verde con hoja
  ctx.fillStyle = scared ? '#9aa6ff' : '#46c93a';
  ctx.beginPath();
  ctx.moveTo(40, 28); ctx.quadraticCurveTo(44, 8, 58, 6 + f * 2); ctx.lineTo(62, 12);
  ctx.quadraticCurveTo(54, 14, 54, 30); ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  if (scared) {
    drawEyes(ctx, 48, 50, 14, dx, dy, true);
    scaredMouth(ctx, 48, 72);
    return;
  }
  drawEyes(ctx, 48, 50, 14, dx, dy, false);
  // cejas furiosas
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(26, 36); ctx.lineTo(42, 44);
  ctx.moveTo(70, 36); ctx.lineTo(54, 44);
  ctx.stroke();
  // boca con dientes
  ctx.fillStyle = '#3a0612';
  ctx.beginPath();
  ctx.moveTo(34, 66); ctx.quadraticCurveTo(48, 58, 62, 66); ctx.quadraticCurveTo(48, 82, 34, 66);
  ctx.fill();
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) ctx.fillRect(38 + i * 6, 64 + (i % 2) * 0.5, 4, 5);
}

function drawSmoke(ctx: Ctx, color: string, l: Look, f: number, scared: boolean, dx: number, dy: number): void {
  const w = f ? 3 : -3;
  const circles: [number, number, number][] = [
    [30, 44, 15], [48, 34, 19], [66, 44, 15], [22, 62, 12], [74, 62, 12], [48, 58, 25],
    [30, 80 + w, 9], [48, 84 - w, 10], [66, 80 + w, 9],
  ];
  const grad = linear(ctx, 0, 14, 0, 92, [[0, l.top], [0.5, color], [1, l.bottom]]);
  ctx.lineWidth = 9;
  ctx.strokeStyle = OUTLINE;
  for (const [x, y, r] of circles) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = grad;
  for (const [x, y, r] of circles) { ctx.beginPath(); ctx.arc(x, y, r + 0.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ellipse(ctx, 36, 36, 6, 3.2, -0.5);
  ctx.fill();
  if (scared) {
    drawEyes(ctx, 48, 52, 13, dx, dy, true);
    scaredMouth(ctx, 48, 72);
    return;
  }
  drawEyes(ctx, 48, 54, 13, dx, dy, false);
  // párpados caídos (actitud de emboscada tranquila)
  ctx.fillStyle = l.bottom;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(48 + sx * 13, 54, 9.6, 11.6, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = OUTLINE; ctx.stroke();
  }
  // sonrisa ladeada
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(36, 72); ctx.quadraticCurveTo(50, 80, 62, 68);
  ctx.stroke();
}

function drawAsh(ctx: Ctx, color: string, l: Look, f: number, scared: boolean, dx: number, dy: number): void {
  const j = f ? 2 : 0;
  ctx.beginPath();
  const poly: Pt[] = [
    [13, 86], [15, 58], [24, 42], [28, 22 + j], [37, 38], [46, 16 - j], [55, 38], [64, 22 + j], [70, 42], [80, 58], [83, 86],
    [72, 86], [66, 78 + j], [58, 86], [48, 79 - j], [38, 86], [30, 78 + j], [22, 86],
  ];
  poly.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  fillBody(ctx, l, color);
  // remaches metálicos
  ctx.fillStyle = scared ? '#d8defa' : '#e6e0ff';
  for (const [x, y] of [[24, 70], [72, 70], [48, 66]] as Pt[]) { ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, 26, 56, 3, 9, -0.1);
  ctx.fill();
  if (scared) {
    drawEyes(ctx, 48, 52, 14, dx, dy, true);
    scaredMouth(ctx, 48, 72);
    return;
  }
  // visor oscuro con ojos brillantes
  ctx.fillStyle = '#1a1030';
  ctx.beginPath();
  ctx.roundRect(22, 42, 52, 20, 8);
  ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = OUTLINE; ctx.stroke();
  for (const sx of [-1, 1]) {
    ctx.fillStyle = radial(ctx, 48 + sx * 14 + dx * 0.6, 52 + dy * 0.6, 1, 9, [[0, '#ffffff'], [1, '#8f7bff']]);
    ellipse(ctx, 48 + sx * 14 + dx * 0.6, 52 + dy * 0.6, 7, 6);
    ctx.fill();
  }
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(38, 71); ctx.lineTo(58, 71);
  ctx.stroke();
}

function drawSpark(ctx: Ctx, color: string, l: Look, f: number, scared: boolean, dx: number, dy: number, frame: number): void {
  const rot = (frame % 2 === 0 ? -1 : 1) * 0.12;
  star(ctx, 48, 52, 8, 44, 27, -Math.PI / 2 + rot);
  fillBody(ctx, l, color);
  ctx.fillStyle = scared ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,160,0.6)';
  ellipse(ctx, 48, 52, 20, 20);
  ctx.fill();
  if (scared) {
    drawEyes(ctx, 48, 48, 12, dx, dy, true);
    scaredMouth(ctx, 48, 66);
    return;
  }
  // ojos dispares: carácter impredecible
  const eyes: [number, number, number][] = [[-12, 11.5, 13], [12, 7.5, 9]];
  for (const [ox, rx, ry] of eyes) {
    ctx.fillStyle = '#fff';
    ellipse(ctx, 48 + ox, 47, rx, ry);
    ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = OUTLINE; ctx.stroke();
    ctx.fillStyle = OUTLINE;
    ellipse(ctx, 48 + ox + dx * 0.7 + (f ? 1.5 : -1.5), 47 + dy * 0.7, 3.6, 4.4);
    ctx.fill();
  }
  // sonrisa en zig-zag
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(32, 68);
  for (let i = 0; i < 6; i++) ctx.lineTo(32 + (i + 1) * 5.3, 68 + (i % 2 === 0 ? 6 : 0));
  ctx.stroke();
}
