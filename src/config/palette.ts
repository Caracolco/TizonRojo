/** Paleta Tizón Rojo: rojo intenso, negro carbón, blanco, gris metálico, fuego. */
export const COLORS = {
  red: '#e5231d',
  redDeep: '#9b0f12',
  redGlow: '#ff3b2f',
  coal: '#0d0809',
  coalLight: '#1b1113',
  white: '#ffffff',
  cream: '#fff1dc',
  steel: '#9aa3ad',
  steelDark: '#555d66',
  orange: '#ff8a1c',
  yellow: '#ffd23a',
  ember: '#ffb347',
} as const;

export const hex = (c: string): number => parseInt(c.replace('#', ''), 16);

export const FONT = "'Silkscreen', monospace";
/** Silkscreen es más angosta que otras fuentes pixel: escalamos los tamaños de texto. */
export const fpx = (n: number): string => `${Math.round(n * 1.22)}px`;
