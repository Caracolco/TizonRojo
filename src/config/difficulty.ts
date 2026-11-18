/**
 * Dificultad progresiva — TODOS los parámetros viven aquí.
 * Las velocidades de enemigos son siempre menores que GAME.player.speed (7.0 t/s),
 * por lo que siempre existe una ruta de escape matemáticamente posible.
 */
export interface PhaseConfig {
  id: 1 | 2 | 3 | 4;
  name: string;
  /** segundo de inicio (inclusivo) y fin (exclusivo) */
  start: number;
  end: number;
  /** velocidad de enemigos en tiles/s */
  enemySpeed: number;
  /** probabilidad (0-1) de que el perseguidor tome un giro aleatorio en una intersección */
  chaserMistake: number;
  /** tiles que el emboscador se anticipa sobre la dirección del jugador */
  ambushLookahead: number;
  /** distancia (en pasos) a la que el patrullero abandona su ronda y persigue */
  patrolAggro: number;
  /** rango (s) entre cambios de comportamiento del enemigo variable */
  variableSwitch: [number, number];
  /** si es true los enemigos se coordinan (pinza + emboscada lejana) */
  coordinated: boolean;
  /** duración de la protección de una galleta (s) */
  cookieDuration: number;
  /** tiempo (s) que tarda un enemigo neutralizado en reaparecer */
  respawnDelay: number;
}

export const PHASES: PhaseConfig[] = [
  {
    id: 1, name: 'CALENTANDO', start: 0, end: 60,
    enemySpeed: 5.0, chaserMistake: 0.35, ambushLookahead: 2, patrolAggro: 4,
    variableSwitch: [5, 8], coordinated: false, cookieDuration: 8, respawnDelay: 7,
  },
  {
    id: 2, name: 'A FUEGO MEDIO', start: 60, end: 120,
    enemySpeed: 5.7, chaserMistake: 0.15, ambushLookahead: 3, patrolAggro: 6,
    variableSwitch: [4, 6], coordinated: false, cookieDuration: 7, respawnDelay: 6,
  },
  {
    id: 3, name: 'FUEGO ALTO', start: 120, end: 150,
    enemySpeed: 6.2, chaserMistake: 0.05, ambushLookahead: 4, patrolAggro: 9,
    variableSwitch: [3, 5], coordinated: false, cookieDuration: 6.5, respawnDelay: 5,
  },
  {
    id: 4, name: 'MODO INFIERNO', start: 150, end: 180,
    enemySpeed: 6.55, chaserMistake: 0, ambushLookahead: 6, patrolAggro: 14,
    variableSwitch: [2, 3.5], coordinated: true, cookieDuration: 6, respawnDelay: 4,
  },
];

/** Velocidad de enemigos asustados / neutralizados (factores sobre la velocidad de fase). */
export const ENEMY_SPEED_FACTORS = {
  scared: 0.6,
  /** ojos regresando a la casa */
  eyes: 1.8,
  /** salida de la casa */
  leaving: 0.8,
} as const;

/** Segundos finales de protección en los que la galleta parpadea como aviso. */
export const COOKIE_WARNING_SECONDS = 2;

export function phaseAt(seconds: number): PhaseConfig {
  for (const p of PHASES) if (seconds >= p.start && seconds < p.end) return p;
  return PHASES[PHASES.length - 1];
}
