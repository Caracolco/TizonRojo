/**
 * Modo de pruebas EXCLUSIVO de desarrollo (npm run dev).
 * En la compilación de producción `import.meta.env.DEV` es false y todo este
 * módulo queda inerte: no existe ningún parámetro que active ayudas ni premios.
 *
 * Parámetros de URL (solo dev):  ?speed=10  acelera el cronómetro x10
 *                                ?t=145     empieza en el segundo 145
 *                                ?god=1     invulnerable (para validar fases/victoria)
 */
export interface DevFlags {
  enabled: boolean;
  timeScale: number;
  startAt: number;
  god: boolean;
}

function read(): DevFlags {
  const off: DevFlags = { enabled: false, timeScale: 1, startAt: 0, god: false };
  if (!import.meta.env.DEV) return off;
  const q = new URLSearchParams(window.location.search);
  const num = (k: string, d: number): number => {
    const v = Number(q.get(k));
    return q.has(k) && Number.isFinite(v) ? v : d;
  };
  return {
    enabled: q.has('speed') || q.has('t') || q.has('god'),
    timeScale: Math.min(Math.max(num('speed', 1), 0.1), 60),
    startAt: Math.max(num('t', 0), 0),
    god: q.get('god') === '1',
  };
}

export const DEV: DevFlags = read();
