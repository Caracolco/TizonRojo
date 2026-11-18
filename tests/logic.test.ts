import { describe, expect, it } from 'vitest';
import { ENEMY_DEFS } from '../src/config/enemies';
import { PHASES, phaseAt } from '../src/config/difficulty';
import { GAME } from '../src/config/game';
import { AiContext, chooseDirection, enemySpeed, tickAi } from '../src/game/ai/behaviors';
import { Enemy } from '../src/game/entities/Enemy';
import { Mover } from '../src/game/entities/Mover';
import { Player } from '../src/game/entities/Player';
import { DIRS, DOWN, LEFT, Maze, RIGHT, UP, Tile } from '../src/game/maze/Maze';
import { DifficultySystem } from '../src/game/systems/DifficultySystem';

const maze = new Maze();
const DT = 1 / 60;

function seededRng(seed = 1): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function makeEnemy(kind: string, at: Tile): Enemy {
  const def = ENEMY_DEFS.find((d) => d.kind === kind)!;
  const e = new Enemy(maze, def, at);
  e.place(at);
  e.access = 'outside';
  e.state = 'active';
  return e;
}

function ctxFor(player: Player, phaseIdx: number, enemies: Enemy[]): AiContext {
  return {
    maze,
    player: { tile: player.tile, facing: player.facing, protectedNow: player.protectedNow },
    phase: PHASES[phaseIdx],
    playerDist: maze.distances(player.tile),
    chaser: enemies.find((e) => e.kind === 'chaser'),
    rng: seededRng(7),
  };
}

describe('Movimiento y colisiones con paredes', () => {
  it('un caminante aleatorio jamás atraviesa paredes ni sale del carril', () => {
    const rng = seededRng(3);
    const m = new Mover(maze, maze.playerSpawn);
    m.speed = 7;
    for (let i = 0; i < 30000; i++) {
      m.advance(DT, (tile) => {
        const open = maze.openDirs(tile.x, tile.y);
        return open[Math.floor(rng() * open.length)];
      });
      const x = m.px, y = m.py;
      // siempre sobre un eje de casilla (x o y entero) y dentro de casillas transitables
      expect(Math.abs(x - Math.round(x)) < 1e-6 || Math.abs(y - Math.round(y)) < 1e-6).toBe(true);
      expect(maze.walkable(m.from.x, m.from.y)).toBe(true);
      expect(maze.walkable(m.to.x, m.to.y)).toBe(true);
    }
  });

  it('el jugador se detiene ante una pared y no la cruza', () => {
    const p = new Player(maze);
    p.setWanted(UP); // sobre el inicio hay pared
    for (let i = 0; i < 120; i++) p.update(DT);
    expect(p.tile).toEqual(maze.playerSpawn);
    expect(p.isMoving).toBe(false);
  });
});

describe('Control del jugador', () => {
  it('giro de 180° inmediato a mitad de tramo (sin retraso)', () => {
    const p = new Player(maze);
    p.setWanted(RIGHT);
    for (let i = 0; i < 6; i++) p.update(DT);
    const x0 = p.px;
    expect(p.dir).toEqual(RIGHT);
    p.setWanted(LEFT);
    expect(p.dir).toEqual(LEFT);
    p.update(DT);
    expect(p.px).toBeLessThan(x0);
  });

  it('el giro pedido queda en buffer y se ejecuta en la primera casilla posible', () => {
    const p = new Player(maze);
    p.setWanted(RIGHT);
    for (let i = 0; i < 3; i++) p.update(DT);
    p.setWanted(DOWN); // desde el inicio no se puede bajar (pared)
    let turned = false;
    for (let i = 0; i < 600 && !turned; i++) {
      p.update(DT);
      if (p.dir.y === 1) turned = true;
    }
    expect(turned).toBe(true);
  });

  it('la protección decrece con el tiempo', () => {
    const p = new Player(maze);
    p.protection = 1;
    for (let i = 0; i < 30; i++) p.update(DT);
    expect(p.protection).toBeCloseTo(0.5, 1);
    for (let i = 0; i < 60; i++) p.update(DT);
    expect(p.protectedNow).toBe(false);
  });
});

describe('Dificultad progresiva', () => {
  it('cuatro fases contiguas que suman 180 s', () => {
    expect(PHASES).toHaveLength(4);
    expect(PHASES[0].start).toBe(0);
    for (let i = 1; i < 4; i++) expect(PHASES[i].start).toBe(PHASES[i - 1].end);
    expect(PHASES[3].end).toBe(GAME.surviveSeconds);
    expect(PHASES.map((p) => [p.start, p.end])).toEqual([[0, 60], [60, 120], [120, 150], [150, 180]]);
  });

  it('phaseAt respeta los límites 60/120/150', () => {
    expect([0, 59.9, 60, 119.9, 120, 149.9, 150, 179.9].map((t) => phaseAt(t).id)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it('la velocidad enemiga crece por fase y SIEMPRE es menor que la del jugador', () => {
    for (let i = 1; i < 4; i++) expect(PHASES[i].enemySpeed).toBeGreaterThan(PHASES[i - 1].enemySpeed);
    for (const ph of PHASES) for (const def of ENEMY_DEFS) {
      const e = makeEnemy(def.kind, maze.exit);
      expect(enemySpeed(e, ph)).toBeLessThan(GAME.player.speed);
    }
  });

  it('el reloj emite el cambio de fase una sola vez y termina en 180 s', () => {
    const d = new DifficultySystem();
    d.reset(0);
    const changes: number[] = [];
    for (let i = 0; i < 190 * 60; i++) {
      const c = d.tick(DT);
      if (c) changes.push(c.id);
    }
    expect(changes).toEqual([2, 3, 4]);
    expect(d.finished).toBe(true);
    expect(d.elapsed).toBe(180);
  });

  it('la fase 4 (infierno) es coordinada y con duración de galleta mayor que 0', () => {
    expect(PHASES[3].coordinated).toBe(true);
    expect(PHASES[3].chaserMistake).toBe(0);
    for (const p of PHASES) expect(p.cookieDuration).toBeGreaterThan(2);
  });
});

describe('Inteligencia de enemigos', () => {
  function chase(kind: string, phaseIdx: number, enemyStart: Tile, playerTile: Tile, seconds = 20): number | null {
    const player = new Player(maze);
    player.place(playerTile);
    const e = makeEnemy(kind, enemyStart);
    for (let i = 0; i < seconds * 60; i++) {
      const ctx = ctxFor(player, phaseIdx, [e]);
      tickAi(e, ctx, DT);
      e.speed = enemySpeed(e, ctx.phase);
      e.advance(DT, (t, prev) => chooseDirection(e, ctx, t, prev));
      expect(maze.walkable(e.from.x, e.from.y)).toBe(true);
      if (Math.hypot(e.px - player.px, e.py - player.py) < GAME.player.hitRadius) return i / 60;
    }
    return null;
  }

  it('el perseguidor alcanza a un jugador quieto desde varias posiciones', () => {
    for (const start of [{ x: 1, y: 1 }, { x: 17, y: 19 }, { x: 1, y: 19 }, { x: 17, y: 1 }]) {
      expect(chase('chaser', 1, start, maze.playerSpawn), JSON.stringify(start)).not.toBeNull();
    }
  });

  it('emboscador, patrullero y variable (modo caza) también alcanzan al jugador en fase 4', () => {
    for (const kind of ['ambusher', 'patroller', 'variable']) {
      const caught = chase(kind, 3, { x: 1, y: 1 }, maze.playerSpawn, 40);
      expect(caught, kind).not.toBeNull();
    }
  });

  it('el perseguidor reduce la distancia de ruta al jugador cuando está lejos', () => {
    const player = new Player(maze);
    player.place({ x: 17, y: 19 });
    const e = makeEnemy('chaser', { x: 1, y: 1 });
    const d0 = maze.distAt(maze.distances(player.tile), e.tile.x, e.tile.y);
    for (let i = 0; i < 4 * 60; i++) {
      const ctx = ctxFor(player, 3, [e]);
      e.speed = 5;
      e.advance(DT, (t, prev) => chooseDirection(e, ctx, t, prev));
    }
    const d1 = maze.distAt(maze.distances(player.tile), e.tile.x, e.tile.y);
    expect(d1).toBeLessThan(d0);
  });

  it('un enemigo asustado huye (aumenta la distancia de ruta)', () => {
    const player = new Player(maze);
    player.place({ x: 9, y: 19 });
    const e = makeEnemy('chaser', { x: 7, y: 19 });
    e.scared = true;
    const d0 = maze.distAt(maze.distances(player.tile), e.tile.x, e.tile.y);
    for (let i = 0; i < 2 * 60; i++) {
      const ctx = ctxFor(player, 0, [e]);
      e.speed = 3;
      e.advance(DT, (t, prev) => chooseDirection(e, ctx, t, prev));
    }
    expect(maze.distAt(maze.distances(player.tile), e.tile.x, e.tile.y)).toBeGreaterThan(d0);
  });

  it('el patrullero recorre las esquinas cuando el jugador está lejos', () => {
    const player = new Player(maze);
    player.place(maze.playerSpawn);
    const e = makeEnemy('patroller', { x: 1, y: 1 });
    const visited = new Set<string>();
    for (let i = 0; i < 90 * 60; i++) {
      const ctx = ctxFor(player, 0, [e]);
      ctx.phase = { ...PHASES[0], patrolAggro: 0 }; // sin persecución
      e.speed = 6;
      e.advance(DT, (t, prev) => chooseDirection(e, ctx, t, prev));
      visited.add(`${e.tile.x},${e.tile.y}`);
    }
    for (const c of ['1,1', '17,1', '17,19', '1,19']) expect(visited.has(c), c).toBe(true);
  });

  it('un enemigo en la casa sale por la puerta y queda activo afuera', () => {
    const def = ENEMY_DEFS[0];
    const e = new Enemy(maze, def, maze.houseCells[1]);
    e.resetToHouse(0);
    e.state = 'leaving';
    const player = new Player(maze);
    for (let i = 0; i < 6 * 60; i++) {
      const ctx = ctxFor(player, 0, [e]);
      e.speed = 5;
      e.advance(DT, (t, prev) => chooseDirection(e, ctx, t, prev));
      if ((e.state as string) === 'active') break;
    }
    expect(e.state as string).toBe('active');
    expect(e.access).toBe('outside');
    expect(e.grace).toBeGreaterThan(0);
  });

  it('un enemigo neutralizado (ojos) vuelve a la casa y queda esperando para reaparecer', () => {
    const e = makeEnemy('ambusher', { x: 1, y: 1 });
    e.neutralize();
    const player = new Player(maze);
    for (let i = 0; i < 20 * 60 && e.state === 'eyes'; i++) {
      const ctx = ctxFor(player, 1, [e]);
      e.speed = 9;
      e.advance(DT, (t, prev) => chooseDirection(e, ctx, t, prev));
    }
    expect(e.state).toBe('respawning');
    expect(e.timer).toBe(PHASES[1].respawnDelay);
    expect(e.tile).toEqual(maze.houseCenter);
  });

  it('ningún enemigo puede entrar a la casa mientras está activo', () => {
    const rng = seededRng(11);
    const player = new Player(maze);
    const e = makeEnemy('variable', { x: 1, y: 1 });
    for (let i = 0; i < 20000; i++) {
      const ctx = ctxFor(player, 3, [e]);
      ctx.rng = rng;
      tickAi(e, ctx, DT);
      e.speed = 6;
      e.advance(DT, (t, prev) => chooseDirection(e, ctx, t, prev));
      expect(maze.kind(e.to.x, e.to.y)).toBe('path');
    }
  });
});

describe('Direcciones', () => {
  it('DIRS contiene las cuatro direcciones', () => { expect(DIRS).toHaveLength(4); });
});
