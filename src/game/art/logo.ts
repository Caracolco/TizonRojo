import { FONT } from '../../config/palette';
import { Ctx, ellipse, linear, radial, smoothClosed, Pt } from './canvasUtil';

/** Logotipo procedural "TIZÓN ROJO" (emblema de brasa + texto). Sustituible por el logo oficial. */
export function drawLogo(ctx: Ctx, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  // Emblema: llama dentro de un escudo circular
  const cx = w / 2;
  const cy = 118;
  ctx.fillStyle = radial(ctx, cx, cy, 10, 120, [[0, 'rgba(255,90,30,0.55)'], [1, 'rgba(255,40,20,0)']]);
  ctx.fillRect(0, 0, w, 260);
  ctx.beginPath();
  ctx.arc(cx, cy, 92, 0, Math.PI * 2);
  ctx.fillStyle = linear(ctx, 0, cy - 92, 0, cy + 92, [[0, '#2a1518'], [1, '#0d0809']]);
  ctx.fill();
  ctx.lineWidth = 9;
  ctx.strokeStyle = '#e5231d';
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#c9d0d6';
  ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2); ctx.stroke();

  const flame = (scale: number, ox: number, oy: number, a: string, b: string): void => {
    const pts: Pt[] = [
      [0, 62], [-34, 48], [-46, 14], [-30, -10], [-34, -34], [-12, -18], [0, -66], [14, -20], [34, -36], [30, -4], [46, 16], [34, 48],
    ];
    ctx.save();
    ctx.translate(cx + ox, cy + oy);
    ctx.scale(scale, scale);
    smoothClosed(ctx, pts);
    ctx.fillStyle = linear(ctx, 0, -66, 0, 62, [[0, a], [1, b]]);
    ctx.fill();
    ctx.restore();
  };
  flame(1.0, 0, 6, '#ff5a2a', '#b50f10');
  flame(0.62, 0, 22, '#fff2a0', '#ff9a1c');
  // ojitos de la mascota en el emblema
  ctx.fillStyle = '#2a0606';
  ellipse(ctx, cx - 11, cy + 32, 5, 7); ctx.fill();
  ellipse(ctx, cx + 11, cy + 32, 5, 7); ctx.fill();
  ctx.fillStyle = '#fff';
  ellipse(ctx, cx - 12.5, cy + 29, 1.8, 2.2); ctx.fill();
  ellipse(ctx, cx + 9.5, cy + 29, 1.8, 2.2); ctx.fill();

  // Texto
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.font = `bold 82px ${FONT}`;
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#14080a';
  ctx.strokeText('TIZÓN', cx, 262);
  ctx.fillStyle = linear(ctx, 0, 236, 0, 290, [[0, '#ffffff'], [1, '#c9d0d6']]);
  ctx.fillText('TIZÓN', cx, 262);
  ctx.font = `bold 82px ${FONT}`;
  ctx.strokeText('ROJO', cx, 336);
  ctx.fillStyle = linear(ctx, 0, 310, 0, 362, [[0, '#ff4a3a'], [1, '#c4120f']]);
  ctx.fillText('ROJO', cx, 336);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeText('ROJO', cx, 336);
}
