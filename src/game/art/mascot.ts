import { Ctx, ellipse, linear, Pt, radial, smoothClosed, star } from './canvasUtil';

export type DirName = 'l' | 'r' | 'u' | 'd';
export type MascotMood = 'normal' | 'power' | 'hurt' | 'win';

export interface MascotOpts {
  dir: DirName;
  frame: number; // 0..3
  mood: MascotMood;
}

const OUTLINE = '#2a0606';
export const MASCOT_SIZE = 96;

/** Contorno de llama con la punta oscilando según `sway` (-1..1) y `squash`. */
function flamePoints(sway: number, grow = 1): Pt[] {
  const s = sway * 5;
  const pts: Pt[] = [
    [48, 90], [27, 86], [13, 69], [14, 51], [24, 41],
    [23, 30], [29, 16 + s * 0.2], [35, 31], [40, 24],
    [46 + s, 5], [55 + s * 0.6, 24], [62, 31],
    [68 - s * 0.4, 20], [72, 36], [82, 50], [84, 66], [70, 85],
  ];
  if (grow === 1) return pts;
  return pts.map(([x, y]) => [48 + (x - 48) * grow, 90 + (y - 90) * grow] as Pt);
}

export function drawMascot(ctx: Ctx, o: MascotOpts): void {
  const S = MASCOT_SIZE;
  ctx.clearRect(0, 0, S, S);
  const phase = (o.frame / 4) * Math.PI * 2;
  const sway = Math.sin(phase);
  const bob = Math.cos(phase * 2) * 1.5;
  const hurt = o.mood === 'hurt';
  const power = o.mood === 'power';

  ctx.save();
  ctx.translate(0, bob);

  // Sombra de contacto
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ellipse(ctx, 48, 92, 26, 4);
  ctx.fill();

  // Cuerpo
  const pts = flamePoints(sway);
  smoothClosed(ctx, pts);
  const body = hurt
    ? linear(ctx, 0, 0, 0, 96, [[0, '#7a7a80'], [1, '#2e2c30']])
    : power
      ? radial(ctx, 48, 62, 4, 52, [[0, '#ffffff'], [0.35, '#fff2a8'], [0.75, '#ffc83a'], [1, '#ff7a1c']])
      : radial(ctx, 48, 70, 4, 56, [[0, '#ff9a2a'], [0.45, '#ff3d1f'], [1, '#c4120f']]);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  // Llama interior (brasa caliente)
  ctx.save();
  ctx.translate(0, 8);
  smoothClosed(ctx, flamePoints(-sway * 0.8, 0.62));
  ctx.fillStyle = hurt
    ? 'rgba(160,160,165,0.55)'
    : linear(ctx, 0, 30, 0, 92, [[0, power ? '#ffffff' : '#fff59a'], [0.6, power ? '#ffe27a' : '#ffc12b'], [1, '#ff8a1c']]);
  ctx.fill();
  ctx.restore();

  // Brillos
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ellipse(ctx, 25, 56, 3.2, 8, -0.25);
  ctx.fill();
  ellipse(ctx, 29, 43, 2.2, 3.4, -0.4);
  ctx.fill();

  drawFace(ctx, o, sway);
  ctx.restore();
}

function drawFace(ctx: Ctx, o: MascotOpts, sway: number): void {
  // desplazamiento según la dirección
  const dx = o.dir === 'l' ? -5 : o.dir === 'r' ? 5 : 0;
  const dy = o.dir === 'u' ? -5 : o.dir === 'd' ? 3 : 0;
  const ex = 48 + dx * 0.9;
  const ey = 60 + dy * 0.9;
  const gap = o.dir === 'l' || o.dir === 'r' ? 12 : 14;
  const lx = ex - gap;
  const rx = ex + gap;

  if (o.mood === 'hurt') {
    // ojos en X
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    for (const x of [lx, rx]) {
      ctx.beginPath();
      ctx.moveTo(x - 5, ey - 5); ctx.lineTo(x + 5, ey + 5);
      ctx.moveTo(x + 5, ey - 5); ctx.lineTo(x - 5, ey + 5);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(ex, ey + 17, 6, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    return;
  }

  if (o.mood === 'win') {
    // ojos felices ^ ^ y boca abierta
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    for (const x of [lx, rx]) {
      ctx.beginPath();
      ctx.arc(x, ey + 3, 6, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
    mouthOpen(ctx, ex, ey + 14, 9, 8);
    cheeks(ctx, lx - 3, rx + 3, ey + 10);
    return;
  }

  // Ojos grandes expresivos
  for (const x of [lx, rx]) {
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, x, ey, 8.2, 10);
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.fillStyle = OUTLINE;
    const px = x + dx * 0.55;
    const py = ey + dy * 0.7 + 1;
    ellipse(ctx, px, py, 4.4, 5.6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, px - 1.4, py - 2, 1.5, 1.8);
    ctx.fill();
  }

  if (o.mood === 'power') {
    // cejas decididas + sonrisa con dientes
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lx - 8, ey - 11); ctx.lineTo(lx + 6, ey - 15);
    ctx.moveTo(rx + 8, ey - 11); ctx.lineTo(rx - 6, ey - 15);
    ctx.stroke();
    mouthOpen(ctx, ex, ey + 15, 10, 8, true);
  } else {
    // boca que mastica con el cuadro de animación
    const chomp = o.frame % 2 === 0 ? 1 : 0.55;
    mouthOpen(ctx, ex, ey + 16 - (1 - chomp) * 2, 6.5 + chomp * 2, 3 + chomp * 5);
  }
  cheeks(ctx, lx - 3, rx + 3, ey + 9, sway);
}

function mouthOpen(ctx: Ctx, x: number, y: number, w: number, h: number, teeth = false): void {
  ctx.beginPath();
  ctx.moveTo(x - w, y - h * 0.3);
  ctx.quadraticCurveTo(x, y + h * 1.5, x + w, y - h * 0.3);
  ctx.quadraticCurveTo(x, y - h * 0.5, x - w, y - h * 0.3);
  ctx.closePath();
  ctx.fillStyle = '#4a0a0a';
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  if (teeth) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - w * 0.65, y - h * 0.3, w * 1.3, 3);
  }
  // lengua
  ctx.fillStyle = '#ff6b6b';
  ellipse(ctx, x, y + h * 0.55, w * 0.45, h * 0.3);
  ctx.fill();
}

function cheeks(ctx: Ctx, lx: number, rx: number, y: number, _sway = 0): void {
  ctx.fillStyle = 'rgba(255,110,120,0.55)';
  ellipse(ctx, lx, y, 4.5, 2.8);
  ctx.fill();
  ellipse(ctx, rx, y, 4.5, 2.8);
  ctx.fill();
}

/** Brazos y destellos para la celebración (se dibujan sobre el sprite 'win'). */
export function drawWinSparkles(ctx: Ctx): void {
  ctx.fillStyle = '#fff59a';
  star(ctx, 14, 14, 4, 9, 3);
  ctx.fill();
  star(ctx, 82, 20, 4, 7, 2.4);
  ctx.fill();
}
