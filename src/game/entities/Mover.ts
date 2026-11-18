import { Access, Dir, isNone, Maze, NONE, opposite, Tile } from '../maze/Maze';

/**
 * Movimiento continuo sobre la cuadrícula: la entidad va de la casilla `from` a `to`
 * con progreso t∈[0,1). Al llegar al centro de una casilla se pide una nueva dirección
 * (`choose`). Nunca se atraviesa una pared y los giros nunca se bloquean.
 */
export class Mover {
  from: Tile;
  to: Tile;
  t = 0;
  /** dirección actual (NONE si está detenido en el centro de una casilla) */
  dir: Dir = NONE;
  /** tiles por segundo */
  speed = 5;
  access: Access = 'outside';
  private moving = false;

  constructor(protected maze: Maze, start: Tile) {
    this.from = { ...start };
    this.to = { ...start };
  }

  /** Posición en unidades de casilla (el centro de una casilla es un entero). */
  get px(): number { return this.from.x + (this.to.x - this.from.x) * this.t; }
  get py(): number { return this.from.y + (this.to.y - this.from.y) * this.t; }

  /** Casilla más cercana a la posición actual. */
  get tile(): Tile { return this.t < 0.5 ? this.from : this.to; }

  place(tile: Tile): void {
    this.from = { ...tile };
    this.to = { ...tile };
    this.t = 0;
    this.dir = NONE;
    this.moving = false;
  }

  /** Invierte el sentido en mitad de un tramo, sin esperar a llegar a la casilla. */
  reverse(): void {
    if (!this.moving) return;
    const f = this.from;
    this.from = this.to;
    this.to = f;
    this.t = 1 - this.t;
    this.dir = opposite(this.dir);
  }

  get isMoving(): boolean { return this.moving; }

  /**
   * Avanza `dt` segundos. `choose(tile, previousDir)` se invoca en el centro de cada
   * casilla y devuelve la dirección deseada (NONE para detenerse).
   */
  advance(dt: number, choose: (tile: Tile, previous: Dir) => Dir): void {
    let remaining = this.speed * dt;
    let guard = 8;
    while (remaining > 1e-9 && guard-- > 0) {
      if (!this.moving) {
        const d = choose(this.from, this.dir);
        if (isNone(d) || !this.maze.walkable(this.from.x + d.x, this.from.y + d.y, this.access)) {
          this.dir = NONE;
          return;
        }
        this.dir = d;
        this.to = { x: this.from.x + d.x, y: this.from.y + d.y };
        this.t = 0;
        this.moving = true;
      }
      const step = Math.min(remaining, 1 - this.t);
      this.t += step;
      remaining -= step;
      if (this.t >= 1 - 1e-9) {
        this.from = { ...this.to };
        this.t = 0;
        this.moving = false;
      }
    }
  }
}
