import { Ctx, ellipse, linear, radial, seeded, star } from './canvasUtil';

/** Brasa pequeña (coleccionable normal) 32x32. */
export function drawPellet(ctx: Ctx): void {
  ctx.clearRect(0, 0, 32, 32);
  ctx.fillStyle = radial(ctx, 16, 16, 1, 15, [[0, 'rgba(255,170,40,0.55)'], [1, 'rgba(255,90,20,0)']]);
  ctx.fillRect(0, 0, 32, 32);
  ctx.save();
  ctx.translate(16, 16);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = linear(ctx, -6, -6, 6, 6, [[0, '#fff3a0'], [0.5, '#ffb52e'], [1, '#e8460f']]);
  ctx.beginPath();
  ctx.roundRect(-5.5, -5.5, 11, 11, 2.5);
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#4a1405';
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ellipse(ctx, 14, 13, 1.6, 1.2);
  ctx.fill();
}

/** Galleta especial 72x72: dorada con chispas de chocolate. */
export function drawCookie(ctx: Ctx): void {
  ctx.clearRect(0, 0, 72, 72);
  const cx = 36;
  const cy = 36;
  ctx.fillStyle = radial(ctx, cx, cy, 6, 34, [[0, 'rgba(255,220,120,0.45)'], [1, 'rgba(255,120,30,0)']]);
  ctx.fillRect(0, 0, 72, 72);
  // borde irregular de galleta
  const rnd = seeded(77);
  ctx.beginPath();
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 23 + (i % 2 === 0 ? 1.8 : -0.4) + rnd() * 0.8;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = radial(ctx, cx - 7, cy - 8, 3, 28, [[0, '#ffe29a'], [0.55, '#e9a44f'], [1, '#b36a26']]);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#4a2208';
  ctx.stroke();
  // chispas de chocolate
  const chips: [number, number, number][] = [[-9, -9, 4.2], [8, -11, 3.6], [-14, 3, 3.4], [2, 0, 4.4], [13, 5, 3.8], [-5, 13, 3.8], [9, 15, 3]];
  for (const [ox, oy, r] of chips) {
    ctx.fillStyle = '#4b2412';
    ctx.beginPath();
    ctx.ellipse(cx + ox, cy + oy, r, r * 0.8, ox * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(cx + ox - r * 0.5, cy + oy - r * 0.55, r * 0.7, 1.4);
  }
  // brillo
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, 17, Math.PI * 1.1, Math.PI * 1.45);
  ctx.stroke();
  // destello de estrella
  ctx.fillStyle = '#fffbe0';
  star(ctx, 58, 14, 4, 8, 1.6);
  ctx.fill();
}

export function drawGlow(ctx: Ctx, size: number): void {
  ctx.clearRect(0, 0, size, size);
  const c = size / 2;
  ctx.fillStyle = radial(ctx, c, c, 0, c, [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(0, 0, size, size);
}

export function drawSpark(ctx: Ctx): void {
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = radial(ctx, 8, 8, 0, 8, [[0, '#ffffff'], [0.4, '#ffd06a'], [1, 'rgba(255,100,20,0)']]);
  ctx.fillRect(0, 0, 16, 16);
}

export function drawSmoke(ctx: Ctx): void {
  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = radial(ctx, 32, 32, 0, 32, [[0, 'rgba(210,210,215,0.9)'], [0.6, 'rgba(120,120,128,0.45)'], [1, 'rgba(60,60,64,0)']]);
  ctx.fillRect(0, 0, 64, 64);
}

export function drawConfetti(ctx: Ctx): void {
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(2, 4, 12, 8);
}

/** Corazón-llama de "una vida" 48x48. */
export function drawLifeIcon(ctx: Ctx, filled: boolean): void {
  ctx.clearRect(0, 0, 48, 48);
  ctx.beginPath();
  ctx.moveTo(24, 43);
  ctx.bezierCurveTo(4, 30, 3, 14, 15, 10);
  ctx.bezierCurveTo(20, 9, 23, 12, 24, 16);
  ctx.bezierCurveTo(25, 12, 28, 9, 33, 10);
  ctx.bezierCurveTo(45, 14, 44, 30, 24, 43);
  ctx.closePath();
  ctx.fillStyle = filled ? linear(ctx, 0, 8, 0, 44, [[0, '#ff6a3a'], [1, '#c4120f']]) : '#2b2123';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = filled ? '#3a0606' : '#4a3d40';
  ctx.stroke();
  if (filled) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ellipse(ctx, 14, 17, 3, 4.5, -0.6);
    ctx.fill();
  }
}

/** Icono pequeño de galleta para el HUD (24px de lado) con estado gris cuando se usa. */
export function drawCookieIcon(ctx: Ctx, active: boolean): void {
  ctx.clearRect(0, 0, 48, 48);
  ctx.beginPath();
  ctx.arc(24, 24, 18, 0, Math.PI * 2);
  ctx.fillStyle = active ? radial(ctx, 18, 17, 2, 22, [[0, '#ffe29a'], [0.6, '#e9a44f'], [1, '#b36a26']]) : '#2a2224';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = active ? '#4a2208' : '#4a3d40';
  ctx.stroke();
  ctx.fillStyle = active ? '#4b2412' : '#3d3235';
  for (const [x, y] of [[17, 18], [29, 17], [22, 28], [31, 29]] as [number, number][]) {
    ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
  }
}

/** Botón de pausa / sonido (iconos vectoriales simples). */
export function drawIcon(ctx: Ctx, kind: 'pause' | 'play' | 'music' | 'sfx', on = true): void {
  ctx.clearRect(0, 0, 64, 64);
  ctx.strokeStyle = on ? '#fff1dc' : '#7a6a6c';
  ctx.fillStyle = on ? '#fff1dc' : '#7a6a6c';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (kind) {
    case 'pause':
      ctx.fillRect(20, 16, 8, 32);
      ctx.fillRect(36, 16, 8, 32);
      break;
    case 'play':
      ctx.beginPath(); ctx.moveTo(22, 14); ctx.lineTo(48, 32); ctx.lineTo(22, 50); ctx.closePath(); ctx.fill();
      break;
    case 'music':
      ctx.beginPath(); ctx.ellipse(24, 46, 8, 6, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(31, 44); ctx.lineTo(31, 14); ctx.lineTo(50, 10); ctx.lineTo(50, 36); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(43, 38, 8, 6, -0.3, 0, Math.PI * 2); ctx.fill();
      break;
    case 'sfx':
      ctx.beginPath(); ctx.moveTo(10, 24); ctx.lineTo(20, 24); ctx.lineTo(32, 14); ctx.lineTo(32, 50); ctx.lineTo(20, 40); ctx.lineTo(10, 40); ctx.closePath(); ctx.fill();
      if (on) {
        ctx.beginPath(); ctx.arc(34, 32, 9, -0.9, 0.9); ctx.stroke();
        ctx.beginPath(); ctx.arc(34, 32, 17, -0.9, 0.9); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(42, 22); ctx.lineTo(58, 42); ctx.moveTo(58, 22); ctx.lineTo(42, 42); ctx.stroke();
      }
      break;
  }
  if (!on && kind === 'music') {
    ctx.strokeStyle = '#ff5a4a';
    ctx.beginPath(); ctx.moveTo(8, 8); ctx.lineTo(56, 56); ctx.stroke();
  }
}
