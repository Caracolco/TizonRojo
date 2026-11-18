import Phaser from 'phaser';
import { GAME } from '../../config/game';
import { Maze, Tile } from '../maze/Maze';
import { toX, toY } from '../entities/views';

/**
 * Brasas (normales, regenerables) y galletas especiales (4, nunca se regeneran).
 * Las brasas se regeneran sin reiniciar la partida cuando se recogen todas.
 */
export class Collectibles {
  private pellets = new Map<number, Phaser.GameObjects.Image>();
  private cookies = new Map<number, { img: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image }>();
  readonly totalCookies: number;

  constructor(private scene: Phaser.Scene, private maze: Maze) {
    this.totalCookies = maze.cookies.length;
    this.spawnAllPellets(null);
    for (const t of maze.cookies) {
      const glow = scene.add.image(toX(t.x), toY(t.y), 'glow').setTint(0xffc84a).setBlendMode(Phaser.BlendModes.ADD).setDepth(2.1).setAlpha(0.75);
      glow.setDisplaySize(96, 96);
      const img = scene.add.image(toX(t.x), toY(t.y), 'cookie').setDepth(2.2).setDisplaySize(52, 52);
      scene.tweens.add({ targets: [img], scale: img.scale * 1.12, angle: { from: -8, to: 8 }, yoyo: true, repeat: -1, duration: 520, ease: 'Sine.InOut' });
      scene.tweens.add({ targets: glow, alpha: 0.35, yoyo: true, repeat: -1, duration: 520, ease: 'Sine.InOut' });
      this.cookies.set(this.key(t), { img, glow });
    }
  }

  private key(t: Tile): number { return t.y * this.maze.width + t.x; }

  get pelletsLeft(): number { return this.pellets.size; }
  get cookiesLeft(): number { return this.cookies.size; }

  /** (Re)crea todas las brasas normales; `skip` evita la casilla bajo el jugador. */
  spawnAllPellets(skip: Tile | null): void {
    let i = 0;
    for (const t of this.maze.pellets) {
      if (skip && skip.x === t.x && skip.y === t.y) continue;
      const k = this.key(t);
      if (this.pellets.has(k)) continue;
      const img = this.scene.add.image(toX(t.x), toY(t.y), 'pellet').setDepth(2).setDisplaySize(26, 26);
      if (this.scene.time.now > 0 && i >= 0) {
        // entrada con "pop" escalonado al regenerarse
        const target = img.scale;
        img.setScale(0);
        this.scene.tweens.add({ targets: img, scale: target, duration: 260, delay: Math.min(i * 6, 500), ease: 'Back.Out' });
      }
      this.pellets.set(k, img);
      i++;
    }
  }

  /** Recoge una brasa en la casilla si existe. */
  takePellet(t: Tile): { x: number; y: number } | null {
    const k = this.key(t);
    const img = this.pellets.get(k);
    if (!img) return null;
    const pos = { x: img.x, y: img.y };
    img.destroy();
    this.pellets.delete(k);
    return pos;
  }

  takeCookie(t: Tile): { x: number; y: number } | null {
    const k = this.key(t);
    const c = this.cookies.get(k);
    if (!c) return null;
    const pos = { x: c.img.x, y: c.img.y };
    this.scene.tweens.killTweensOf([c.img, c.glow]);
    c.img.destroy();
    c.glow.destroy();
    this.cookies.delete(k);
    return pos;
  }

  destroy(): void {
    for (const i of this.pellets.values()) i.destroy();
    for (const c of this.cookies.values()) { this.scene.tweens.killTweensOf([c.img, c.glow]); c.img.destroy(); c.glow.destroy(); }
    this.pellets.clear();
    this.cookies.clear();
  }
}

export const PELLET_SCORE = GAME.scores.pellet;
