import Phaser from 'phaser';
import { ENEMY_DEFS } from '../../config/enemies';
import { GAME } from '../../config/game';
import { Maze } from '../maze/Maze';
import { linear, makeCanvas, radial, seeded } from './canvasUtil';
import { drawEnemy, ENEMY_SIZE, EnemyVisual } from './enemies';
import { drawLogo } from './logo';
import { DirName, drawMascot, drawWinSparkles, MASCOT_SIZE, MascotMood } from './mascot';
import { drawMaze, THEME_HELL, THEME_NORMAL } from './mazeArt';
import * as props from './props';

export const DIR_NAMES: DirName[] = ['l', 'r', 'u', 'd'];
export const brasaKey = (mood: MascotMood, dir: DirName, frame: number): string => `brasa_${mood}_${dir}_${frame}`;
export const enemyKey = (kind: string, visual: EnemyVisual, dir: DirName, frame: number): string => `en_${kind}_${visual}_${dir}_${frame}`;

/**
 * Genera TODAS las texturas del juego de forma procedural al arrancar.
 * Son arte original del proyecto: no hay imágenes externas ni dependencias en tiempo de ejecución.
 */
export function generateTextures(scene: Phaser.Scene, maze: Maze): void {
  const tex = scene.textures;
  const add = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): void => {
    if (tex.exists(key)) return;
    const { canvas, ctx } = makeCanvas(w, h);
    draw(ctx);
    tex.addCanvas(key, canvas);
  };

  // Mascota
  for (const mood of ['normal', 'power'] as MascotMood[])
    for (const dir of DIR_NAMES)
      for (let f = 0; f < 4; f++)
        add(brasaKey(mood, dir, f), MASCOT_SIZE, MASCOT_SIZE, (c) => drawMascot(c, { dir, frame: f, mood }));
  add('brasa_hurt', MASCOT_SIZE, MASCOT_SIZE, (c) => drawMascot(c, { dir: 'd', frame: 0, mood: 'hurt' }));
  for (let f = 0; f < 4; f++)
    add(`brasa_win_${f}`, MASCOT_SIZE, MASCOT_SIZE, (c) => { drawMascot(c, { dir: 'd', frame: f, mood: 'win' }); drawWinSparkles(c); });

  // Enemigos
  for (const def of ENEMY_DEFS) {
    for (const dir of DIR_NAMES) {
      for (const visual of ['normal', 'scared', 'blink'] as EnemyVisual[])
        for (let f = 0; f < 2; f++)
          add(enemyKey(def.kind, visual, dir, f), ENEMY_SIZE, ENEMY_SIZE, (c) => drawEnemy(c, def.kind, def.color, def.dark, { dir, frame: f, visual }));
      add(enemyKey(def.kind, 'eyes', dir, 0), ENEMY_SIZE, ENEMY_SIZE, (c) => drawEnemy(c, def.kind, def.color, def.dark, { dir, frame: 0, visual: 'eyes' }));
    }
  }

  // Coleccionables y utilidades
  add('pellet', 32, 32, props.drawPellet);
  add('cookie', 72, 72, props.drawCookie);
  add('glow', 128, 128, (c) => props.drawGlow(c, 128));
  add('spark', 16, 16, props.drawSpark);
  add('smoke', 64, 64, props.drawSmoke);
  add('confetti', 16, 16, props.drawConfetti);
  add('life_on', 48, 48, (c) => props.drawLifeIcon(c, true));
  add('life_off', 48, 48, (c) => props.drawLifeIcon(c, false));
  add('cookie_on', 48, 48, (c) => props.drawCookieIcon(c, true));
  add('cookie_off', 48, 48, (c) => props.drawCookieIcon(c, false));
  add('icon_pause', 64, 64, (c) => props.drawIcon(c, 'pause'));
  add('icon_play', 64, 64, (c) => props.drawIcon(c, 'play'));
  add('icon_music_on', 64, 64, (c) => props.drawIcon(c, 'music', true));
  add('icon_music_off', 64, 64, (c) => props.drawIcon(c, 'music', false));
  add('icon_sfx_on', 64, 64, (c) => props.drawIcon(c, 'sfx', true));
  add('icon_sfx_off', 64, 64, (c) => props.drawIcon(c, 'sfx', false));
  add('logo', 520, 380, (c) => drawLogo(c, 520, 380));

  // Laberinto (normal e infierno)
  const mw = maze.width * GAME.tile;
  const mh = maze.height * GAME.tile;
  add('maze', mw, mh, (c) => drawMaze(c, maze, THEME_NORMAL));
  add('maze_hell', mw, mh, (c) => drawMaze(c, maze, THEME_HELL));

  // Fondo con brasas, viñeta y líneas de escaneo (CRT sutil)
  add('bg', GAME.width, GAME.height, (c) => {
    c.fillStyle = linear(c, 0, 0, 0, GAME.height, [[0, '#120708'], [0.6, '#0a0506'], [1, '#1c0707']]);
    c.fillRect(0, 0, GAME.width, GAME.height);
    c.fillStyle = radial(c, GAME.width / 2, GAME.height + 40, 0, 700, [[0, 'rgba(229,35,29,0.38)'], [1, 'rgba(229,35,29,0)']]);
    c.fillRect(0, 0, GAME.width, GAME.height);
    const rnd = seeded(5);
    for (let i = 0; i < 90; i++) {
      c.fillStyle = `rgba(255,${100 + Math.floor(rnd() * 100)},40,${0.04 + rnd() * 0.1})`;
      const s = 1 + Math.floor(rnd() * 3);
      c.fillRect(Math.floor(rnd() * GAME.width), Math.floor(rnd() * GAME.height), s, s);
    }
  });
  add('vignette', GAME.width, GAME.height, (c) => {
    c.fillStyle = radial(c, GAME.width / 2, GAME.height / 2, 380, 860, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.75)']]);
    c.fillRect(0, 0, GAME.width, GAME.height);
  });
  add('hellvignette', GAME.width, GAME.height, (c) => {
    c.fillStyle = radial(c, GAME.width / 2, GAME.height / 2, 300, 820, [[0, 'rgba(255,60,0,0)'], [1, 'rgba(255,30,0,0.65)']]);
    c.fillRect(0, 0, GAME.width, GAME.height);
  });
  add('scan', 4, 4, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.16)';
    c.fillRect(0, 0, 4, 1);
  });
}
