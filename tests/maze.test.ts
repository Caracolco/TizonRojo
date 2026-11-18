import { describe, expect, it } from 'vitest';
import { Maze, DIRS } from '../src/game/maze/Maze';

const maze = new Maze();

describe('Laberinto', () => {
  it('tiene 4 galletas especiales y muchas brasas', () => {
    expect(maze.cookies).toHaveLength(4);
    expect(maze.pellets.length).toBeGreaterThan(100);
  });

  it('es simétrico (izquierda/derecha)', () => {
    for (let y = 0; y < maze.height; y++)
      for (let x = 0; x < maze.width; x++)
        expect(maze.kind(x, y)).toBe(maze.kind(maze.width - 1 - x, y));
  });

  it('todo el camino es alcanzable desde el jugador (sin zonas aisladas)', () => {
    const d = maze.distances(maze.playerSpawn);
    for (const t of maze.pathTiles()) expect(d[t.y * maze.width + t.x], `${t.x},${t.y}`).toBeGreaterThanOrEqual(0);
    for (const t of [...maze.pellets, ...maze.cookies]) expect(maze.distAt(d, t.x, t.y)).toBeGreaterThanOrEqual(0);
  });

  it('no hay callejones sin salida (cada camino tiene >= 2 salidas)', () => {
    for (const t of maze.pathTiles()) expect(maze.openDirs(t.x, t.y).length, `${t.x},${t.y}`).toBeGreaterThanOrEqual(2);
  });

  it('la casa solo se alcanza con acceso de casa, y la puerta conecta al camino', () => {
    expect(maze.walkable(maze.door.x, maze.door.y, 'outside')).toBe(false);
    expect(maze.walkable(maze.houseCenter.x, maze.houseCenter.y, 'outside')).toBe(false);
    const d = maze.distances(maze.houseCenter, 'house');
    expect(maze.distAt(d, maze.exit.x, maze.exit.y)).toBe(2);
    expect(maze.walkable(maze.exit.x, maze.exit.y)).toBe(true);
  });

  it('las paredes bloquean y nearestWalkable devuelve camino válido', () => {
    for (const d of DIRS) expect(maze.walkable(0 + (d.x > 0 ? 0 : 0), 0, 'outside')).toBe(false);
    const t = maze.nearestWalkable({ x: 0, y: 0 });
    expect(maze.walkable(t.x, t.y)).toBe(true);
  });
});
