import { MAZE_LAYOUT } from './layout';

export type CellKind = 'wall' | 'path' | 'door' | 'house';
export interface Tile { x: number; y: number }
export interface Dir { x: -1 | 0 | 1; y: -1 | 0 | 1 }

export const UP: Dir = { x: 0, y: -1 };
export const DOWN: Dir = { x: 0, y: 1 };
export const LEFT: Dir = { x: -1, y: 0 };
export const RIGHT: Dir = { x: 1, y: 0 };
export const NONE: Dir = { x: 0, y: 0 };
export const DIRS: readonly Dir[] = [UP, LEFT, DOWN, RIGHT];

export const sameDir = (a: Dir, b: Dir): boolean => a.x === b.x && a.y === b.y;
export const opposite = (d: Dir): Dir => ({ x: (-d.x || 0) as Dir['x'], y: (-d.y || 0) as Dir['y'] });
export const isNone = (d: Dir): boolean => d.x === 0 && d.y === 0;

/** Quién camina: el jugador y los enemigos "afuera" no pueden entrar a la casa. */
export type Access = 'outside' | 'house';

export class Maze {
  readonly width: number;
  readonly height: number;
  private cells: CellKind[] = [];
  readonly pellets: Tile[] = [];
  readonly cookies: Tile[] = [];
  readonly houseCells: Tile[] = [];
  playerSpawn: Tile = { x: 0, y: 0 };
  door: Tile = { x: 0, y: 0 };
  /** casilla de camino justo encima de la puerta: donde los enemigos "salen" */
  exit: Tile = { x: 0, y: 0 };
  /** centro de la casa (a donde regresan los ojos) */
  houseCenter: Tile = { x: 0, y: 0 };

  constructor(layout: readonly string[] = MAZE_LAYOUT) {
    this.height = layout.length;
    this.width = layout[0].length;
    for (let y = 0; y < this.height; y++) {
      if (layout[y].length !== this.width) throw new Error(`Fila ${y} del laberinto con ancho inválido`);
      for (let x = 0; x < this.width; x++) {
        const ch = layout[y][x];
        let kind: CellKind = 'path';
        switch (ch) {
          case '#': kind = 'wall'; break;
          case 'D': kind = 'door'; this.door = { x, y }; break;
          case 'H': kind = 'house'; this.houseCells.push({ x, y }); break;
          case '.': this.pellets.push({ x, y }); break;
          case 'o': this.cookies.push({ x, y }); break;
          case 'P': this.playerSpawn = { x, y }; break;
          default: break;
        }
        this.cells.push(kind);
      }
    }
    this.exit = { x: this.door.x, y: this.door.y - 1 };
    const hx = Math.round(this.houseCells.reduce((s, t) => s + t.x, 0) / this.houseCells.length);
    const hy = this.houseCells[0].y;
    this.houseCenter = { x: hx, y: hy };
  }

  kind(x: number, y: number): CellKind {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 'wall';
    return this.cells[y * this.width + x];
  }

  isWall(x: number, y: number): boolean { return this.kind(x, y) === 'wall'; }

  walkable(x: number, y: number, access: Access = 'outside'): boolean {
    const k = this.kind(x, y);
    if (k === 'wall') return false;
    if (k === 'path') return true;
    return access === 'house';
  }

  /** Direcciones disponibles desde una casilla. */
  openDirs(x: number, y: number, access: Access = 'outside'): Dir[] {
    return DIRS.filter((d) => this.walkable(x + d.x, y + d.y, access));
  }

  /** Mapa de distancias (pasos) desde `from` a toda casilla alcanzable. -1 = inalcanzable. */
  distances(from: Tile, access: Access = 'outside'): Int16Array {
    const dist = new Int16Array(this.width * this.height).fill(-1);
    if (!this.walkable(from.x, from.y, access) && this.kind(from.x, from.y) === 'wall') return dist;
    const queue: number[] = [from.y * this.width + from.x];
    dist[queue[0]] = 0;
    for (let i = 0; i < queue.length; i++) {
      const cur = queue[i];
      const cx = cur % this.width;
      const cy = (cur / this.width) | 0;
      for (const d of DIRS) {
        const nx = cx + d.x;
        const ny = cy + d.y;
        if (!this.walkable(nx, ny, access)) continue;
        const ni = ny * this.width + nx;
        if (dist[ni] !== -1) continue;
        dist[ni] = dist[cur] + 1;
        queue.push(ni);
      }
    }
    return dist;
  }

  distAt(map: Int16Array, x: number, y: number): number {
    return map[y * this.width + x];
  }

  /** Casilla transitable más cercana (BFS) a una posición cualquiera, útil para objetivos proyectados. */
  nearestWalkable(t: Tile, access: Access = 'outside'): Tile {
    const cx = Math.min(Math.max(t.x, 0), this.width - 1);
    const cy = Math.min(Math.max(t.y, 0), this.height - 1);
    if (this.walkable(cx, cy, access)) return { x: cx, y: cy };
    const seen = new Set<number>([cy * this.width + cx]);
    const q: Tile[] = [{ x: cx, y: cy }];
    for (let i = 0; i < q.length; i++) {
      for (const d of DIRS) {
        const nx = q[i].x + d.x;
        const ny = q[i].y + d.y;
        if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
        const key = ny * this.width + nx;
        if (seen.has(key)) continue;
        seen.add(key);
        if (this.walkable(nx, ny, access)) return { x: nx, y: ny };
        q.push({ x: nx, y: ny });
      }
    }
    return { ...this.playerSpawn };
  }

  /** Todas las casillas de camino (sin casa ni puerta). */
  pathTiles(): Tile[] {
    const out: Tile[] = [];
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) if (this.kind(x, y) === 'path') out.push({ x, y });
    return out;
  }
}
