import { EnemyDef, EnemyKind } from '../../config/enemies';
import { Dir, Maze, NONE, Tile } from '../maze/Maze';
import { Mover } from './Mover';

export type EnemyState = 'waiting' | 'leaving' | 'active' | 'eyes' | 'respawning';
export type VariableMode = 'chase' | 'ambush' | 'random' | 'scatter';

/** Estado y movimiento de un enemigo (sin Phaser). La decisión de ruta vive en ai/behaviors.ts. */
export class Enemy extends Mover {
  state: EnemyState = 'waiting';
  scared = false;
  timer = 0;
  patrolIndex = 0;
  mode: VariableMode = 'chase';
  modeTimer = 0;
  lastDir: Dir = NONE;
  /** segundos de gracia tras reaparecer: no puede dañar (evita muertes injustas en la salida) */
  grace = 0;

  constructor(maze: Maze, readonly def: EnemyDef, readonly homeCell: Tile) {
    super(maze, homeCell);
  }

  get kind(): EnemyKind { return this.def.kind; }

  /** Puede dañar al jugador. */
  get dangerous(): boolean {
    return this.state === 'active' && !this.scared && this.grace <= 0;
  }
  /** Puede ser neutralizado por el jugador protegido. */
  get vulnerable(): boolean {
    return this.state === 'active' && this.scared;
  }

  resetToHouse(releaseIn: number): void {
    this.place(this.homeCell);
    this.access = 'house';
    this.state = 'waiting';
    this.timer = releaseIn;
    this.scared = false;
    this.grace = 0;
    this.patrolIndex = 0;
    this.modeTimer = 0;
    this.mode = 'chase';
  }

  neutralize(): void {
    this.state = 'eyes';
    this.scared = false;
    this.access = 'house';
  }
}
