import { ENEMY_SPEED_FACTORS, PhaseConfig } from '../../config/difficulty';
import { PATROL_ROUTE } from '../../config/enemies';
import { Enemy, VariableMode } from '../entities/Enemy';
import { Dir, isNone, Maze, NONE, opposite, sameDir, Tile } from '../maze/Maze';

export interface AiContext {
  maze: Maze;
  player: { tile: Tile; facing: Dir; protectedNow: boolean };
  phase: PhaseConfig;
  /** distancias (pasos) desde el jugador, calculadas una vez por frame/casilla */
  playerDist: Int16Array;
  /** enemigo perseguidor, referencia para coordinación de fase 4 */
  chaser?: Enemy;
  rng: () => number;
}

const tileEq = (a: Tile, b: Tile): boolean => a.x === b.x && a.y === b.y;

/** Velocidad efectiva (tiles/s) según estado y fase. */
export function enemySpeed(e: Enemy, phase: PhaseConfig): number {
  const base = phase.enemySpeed * e.def.speedMul;
  switch (e.state) {
    case 'eyes': return base * ENEMY_SPEED_FACTORS.eyes;
    case 'leaving': return base * ENEMY_SPEED_FACTORS.leaving;
    default: return e.scared ? base * ENEMY_SPEED_FACTORS.scared : base;
  }
}

function candidates(e: Enemy, ctx: AiContext, tile: Tile, prev: Dir): Dir[] {
  const open = ctx.maze.openDirs(tile.x, tile.y, e.access);
  const noBack = open.filter((d) => isNone(prev) || !sameDir(d, opposite(prev)));
  return noBack.length > 0 ? noBack : open;
}

function bestToward(e: Enemy, ctx: AiContext, tile: Tile, prev: Dir, target: Tile): Dir {
  const dist = ctx.maze.distances(target, e.access);
  const opts = candidates(e, ctx, tile, prev);
  let best: Dir = opts[0] ?? NONE;
  let bestD = Infinity;
  for (const d of opts) {
    const v = ctx.maze.distAt(dist, tile.x + d.x, tile.y + d.y);
    const score = v < 0 ? 9999 : v + ctx.rng() * 0.01;
    if (score < bestD) { bestD = score; best = d; }
  }
  return best;
}

function randomDir(e: Enemy, ctx: AiContext, tile: Tile, prev: Dir): Dir {
  const opts = candidates(e, ctx, tile, prev);
  return opts[Math.floor(ctx.rng() * opts.length)] ?? NONE;
}

function flee(e: Enemy, ctx: AiContext, tile: Tile, prev: Dir): Dir {
  const opts = candidates(e, ctx, tile, prev);
  let best: Dir = opts[0] ?? NONE;
  let bestV = -Infinity;
  for (const d of opts) {
    const v = ctx.maze.distAt(ctx.playerDist, tile.x + d.x, tile.y + d.y);
    const score = (v < 0 ? 0 : v) + ctx.rng() * 0.5;
    if (score > bestV) { bestV = score; best = d; }
  }
  return best;
}

/** Casilla a `n` pasos por delante del jugador siguiendo su dirección (se detiene en paredes). */
export function aheadOfPlayer(ctx: AiContext, n: number): Tile {
  const { maze, player } = ctx;
  const dir = isNone(player.facing) ? NONE : player.facing;
  let t = { ...player.tile };
  for (let i = 0; i < n; i++) {
    const nx = t.x + dir.x;
    const ny = t.y + dir.y;
    if (!maze.walkable(nx, ny)) break;
    t = { x: nx, y: ny };
  }
  return t;
}

function pathDistToPlayer(e: Enemy, ctx: AiContext): number {
  return ctx.maze.distAt(ctx.playerDist, e.tile.x, e.tile.y);
}

function pincerTarget(ctx: AiContext): Tile {
  const p2 = aheadOfPlayer(ctx, 2);
  const c = ctx.chaser ? ctx.chaser.tile : ctx.player.tile;
  return ctx.maze.nearestWalkable({ x: p2.x * 2 - c.x, y: p2.y * 2 - c.y });
}

function ambushTarget(e: Enemy, ctx: AiContext): Tile {
  // si ya está cerca no orbita: ataca directo
  if (pathDistToPlayer(e, ctx) <= 3) return ctx.player.tile;
  return aheadOfPlayer(ctx, ctx.phase.ambushLookahead);
}

function pickVariableMode(e: Enemy, ctx: AiContext): VariableMode {
  const pool: VariableMode[] = ctx.phase.coordinated
    ? ['chase', 'ambush', 'ambush', 'chase', 'scatter']
    : ['chase', 'ambush', 'random', 'scatter', 'random'];
  const next = pool[Math.floor(ctx.rng() * pool.length)];
  return next === e.mode && ctx.rng() < 0.5 ? 'chase' : next;
}

/** Actualiza temporizadores internos de la IA (cambio de modo del enemigo variable). */
export function tickAi(e: Enemy, ctx: AiContext, dt: number): void {
  if (e.kind !== 'variable' || e.state !== 'active') return;
  e.modeTimer -= dt;
  if (e.modeTimer <= 0) {
    e.mode = pickVariableMode(e, ctx);
    const [a, b] = ctx.phase.variableSwitch;
    e.modeTimer = a + ctx.rng() * (b - a);
  }
}

/** Decide la dirección del enemigo al llegar al centro de una casilla. */
export function chooseDirection(e: Enemy, ctx: AiContext, tile: Tile, prev: Dir): Dir {
  const { maze } = ctx;

  if (e.state === 'leaving') {
    if (tileEq(tile, maze.exit)) {
      e.state = 'active';
      e.access = 'outside';
      e.grace = 0.6;
      return chooseDirection(e, ctx, tile, NONE);
    }
    return bestToward(e, ctx, tile, NONE, maze.exit);
  }

  if (e.state === 'eyes') {
    if (tileEq(tile, maze.houseCenter)) {
      e.state = 'respawning';
      e.timer = ctx.phase.respawnDelay;
      return NONE;
    }
    return bestToward(e, ctx, tile, NONE, maze.houseCenter);
  }

  if (e.state !== 'active') return NONE;

  if (e.scared) return flee(e, ctx, tile, prev);

  const open = candidates(e, ctx, tile, prev);
  switch (e.kind) {
    case 'chaser': {
      if (open.length > 1 && ctx.rng() < ctx.phase.chaserMistake) return randomDir(e, ctx, tile, prev);
      return bestToward(e, ctx, tile, prev, ctx.player.tile);
    }
    case 'ambusher':
      return bestToward(e, ctx, tile, prev, ambushTarget(e, ctx));
    case 'patroller': {
      if (pathDistToPlayer(e, ctx) >= 0 && pathDistToPlayer(e, ctx) <= ctx.phase.patrolAggro) {
        const target = ctx.phase.coordinated ? pincerTarget(ctx) : ctx.player.tile;
        return bestToward(e, ctx, tile, prev, target);
      }
      let wp = PATROL_ROUTE[e.patrolIndex % PATROL_ROUTE.length];
      if (maze.distAt(maze.distances(tile), wp.x, wp.y) <= 1) {
        e.patrolIndex = (e.patrolIndex + 1) % PATROL_ROUTE.length;
        wp = PATROL_ROUTE[e.patrolIndex];
      }
      return bestToward(e, ctx, tile, prev, wp);
    }
    case 'variable': {
      switch (e.mode) {
        case 'chase': return bestToward(e, ctx, tile, prev, ctx.player.tile);
        case 'ambush': return bestToward(e, ctx, tile, prev, ambushTarget(e, ctx));
        case 'scatter': return bestToward(e, ctx, tile, prev, PATROL_ROUTE[(e.patrolIndex + 2) % 4]);
        default: return randomDir(e, ctx, tile, prev);
      }
    }
  }
  return NONE;
}
