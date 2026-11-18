import { GAME } from '../../config/game';
import { Dir, isNone, Maze, NONE, opposite, RIGHT, sameDir, Tile } from '../maze/Maze';
import { Mover } from './Mover';

export type PlayerState = 'alive' | 'dead' | 'won';

/** Lógica pura de la mascota "Brasita" (sin dependencias de Phaser). */
export class Player extends Mover {
  /** dirección que pide el jugador (se mantiene hasta que sea posible girar) */
  wanted: Dir = NONE;
  /** última dirección hacia la que miró (para animación) */
  facing: Dir = RIGHT;
  state: PlayerState = 'alive';
  /** segundos de protección restantes (galleta) */
  protection = 0;

  constructor(maze: Maze) {
    super(maze, maze.playerSpawn);
    this.speed = GAME.player.speed;
  }

  get protectedNow(): boolean { return this.protection > 0; }

  reset(): void {
    this.place(this.maze.playerSpawn);
    this.wanted = NONE;
    this.facing = RIGHT;
    this.state = 'alive';
    this.protection = 0;
  }

  setWanted(d: Dir): void {
    if (isNone(d)) return;
    this.wanted = d;
    // giro de 180° inmediato en mitad del tramo: respuesta sin retrasos
    if (this.isMoving && sameDir(d, opposite(this.dir))) this.reverse();
  }

  update(dt: number): void {
    if (this.state !== 'alive') return;
    if (this.protection > 0) this.protection = Math.max(0, this.protection - dt);
    this.advance(dt, (tile: Tile, prev: Dir) => {
      if (!isNone(this.wanted) && this.canTurn(tile, this.wanted)) return this.wanted;
      if (!isNone(prev) && this.canTurn(tile, prev)) return prev;
      return NONE;
    });
    if (!isNone(this.dir)) this.facing = this.dir;
  }

  private canTurn(tile: Tile, d: Dir): boolean {
    return this.maze.walkable(tile.x + d.x, tile.y + d.y, this.access);
  }
}
