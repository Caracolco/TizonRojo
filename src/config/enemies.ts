export type EnemyKind = 'chaser' | 'ambusher' | 'patroller' | 'variable';

export interface EnemyDef {
  kind: EnemyKind;
  name: string;
  /** descripción corta para "Cómo jugar" */
  trait: string;
  color: string;
  dark: string;
  speedMul: number;
  /** casilla de aparición dentro de la casa */
  houseSlot: number;
}

export const ENEMY_DEFS: EnemyDef[] = [
  { kind: 'chaser', name: 'AJÍ', trait: 'te persigue directo', color: '#ff2a55', dark: '#8c0d2c', speedMul: 1.0, houseSlot: 1 },
  { kind: 'ambusher', name: 'HUMO', trait: 'se anticipa a tu ruta', color: '#35d6ff', dark: '#0b6b8a', speedMul: 0.97, houseSlot: 0 },
  { kind: 'patroller', name: 'CENIZA', trait: 'patrulla las esquinas', color: '#b8a7ff', dark: '#5a4a9e', speedMul: 0.95, houseSlot: 2 },
  { kind: 'variable', name: 'CHISPA', trait: 'cambia de plan sin aviso', color: '#9dff3a', dark: '#3f8a0c', speedMul: 0.99, houseSlot: 1 },
];

/** Esquinas que recorre el patrullero (deben ser casillas de camino). */
export const PATROL_ROUTE = [
  { x: 1, y: 1 }, { x: 17, y: 1 }, { x: 17, y: 19 }, { x: 1, y: 19 },
];
