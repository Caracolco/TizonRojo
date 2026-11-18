/** Configuración general del juego (dimensiones, reglas, puntajes). */
export const GAME = {
  /** Resolución lógica vertical (9:16). Phaser la escala con FIT. */
  width: 720,
  height: 1280,
  tile: 36,
  mazeX: 18,
  mazeY: 200,

  /** Objetivo: sobrevivir esta cantidad de segundos. */
  surviveSeconds: 180,
  /** Cuenta regresiva antes de empezar (segundos). */
  readySeconds: 3,

  player: {
    /** tiles por segundo */
    speed: 7.0,
    /** Radio de colisión en tiles (jugador vs enemigo). */
    hitRadius: 0.55,
  },

  scores: {
    pellet: 10,
    cookie: 50,
    /** Primer enemigo neutralizado; se duplica por cada uno dentro de la misma galleta. */
    enemyBase: 200,
    winBonus: 1000,
  },

  /** Retardo (s) de salida de la casa de cada enemigo desde el inicio. */
  releaseDelays: { chaser: 0, ambusher: 2.5, patroller: 5, variable: 8 },
} as const;

export const STORAGE_KEYS = {
  best: 'tizon-rojo-arcade:best:v1',
  audio: 'tizon-rojo-arcade:audio:v1',
} as const;
