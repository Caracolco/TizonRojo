import Phaser from 'phaser';
import { GAME } from '../../config/game';
import { COOKIE_WARNING_SECONDS } from '../../config/difficulty';
import { brasaKey, enemyKey } from '../art/textures';
import { DirName } from '../art/mascot';
import { Dir, isNone } from '../maze/Maze';
import { Enemy } from './Enemy';
import { Player } from './Player';

const T = GAME.tile;
export const toX = (tx: number): number => GAME.mazeX + (tx + 0.5) * T;
export const toY = (ty: number): number => GAME.mazeY + (ty + 0.5) * T;

export function dirName(d: Dir, fallback: DirName = 'r'): DirName {
  if (isNone(d)) return fallback;
  if (d.x < 0) return 'l';
  if (d.x > 0) return 'r';
  return d.y < 0 ? 'u' : 'd';
}

const SPRITE_SCALE = 0.5;

/** Representación gráfica de la mascota: sprite animado, aura de luz y estela de brasas. */
export class PlayerView {
  readonly sprite: Phaser.GameObjects.Image;
  readonly aura: Phaser.GameObjects.Image;
  private trail: Phaser.GameObjects.Particles.ParticleEmitter;
  private squash = 0;

  constructor(scene: Phaser.Scene) {
    this.aura = scene.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xff6a1c).setAlpha(0.55).setDepth(5.5);
    this.aura.setDisplaySize(130, 130);
    this.sprite = scene.add.image(0, 0, brasaKey('normal', 'r', 0)).setDepth(6).setScale(SPRITE_SCALE);
    this.trail = scene.add.particles(0, 0, 'spark', {
      lifespan: 420, speed: { min: 5, max: 30 }, scale: { start: 0.9, end: 0 }, alpha: { start: 0.8, end: 0 },
      blendMode: 'ADD', frequency: 45, tint: [0xffb347, 0xff5a1c, 0xffe27a], follow: this.sprite, emitting: true,
    }).setDepth(5.2);
  }

  /** Pequeño "pop" al recoger algo. */
  chomp(): void { this.squash = 1; }

  show(v: boolean): void { this.sprite.setVisible(v); this.aura.setVisible(v); this.trail.setVisible(v); this.trail.emitting = v; }

  update(p: Player, time: number): void {
    const x = toX(p.px);
    const y = toY(p.py);
    this.squash = Math.max(0, this.squash - 0.08);
    const powered = p.protectedNow;
    const blink = powered && p.protection < COOKIE_WARNING_SECONDS && Math.floor(time / 110) % 2 === 0;
    const frame = p.isMoving ? Math.floor(time / 85) % 4 : Math.floor(time / 180) % 4;
    const mood = powered && !blink ? 'power' : 'normal';
    this.sprite.setTexture(brasaKey(mood, dirName(p.facing), frame));
    const pulse = 1 + Math.sin(time / 90) * (p.isMoving ? 0.035 : 0.02);
    const pop = this.squash * 0.22;
    this.sprite.setScale(SPRITE_SCALE * (pulse + pop) * (powered ? 1.18 : 1), SPRITE_SCALE * (pulse - pop * 0.6) * (powered ? 1.18 : 1));
    this.sprite.setPosition(x, y - 4);
    this.aura.setPosition(x, y);
    this.aura.setTint(powered ? 0xfff0a0 : 0xff6a1c);
    this.aura.setAlpha((powered ? 0.9 : 0.5) + Math.sin(time / 120) * 0.08);
    this.aura.setDisplaySize(powered ? 190 : 120, powered ? 190 : 120);
  }
}

/** Representación gráfica de un enemigo con cambios de estado visibles. */
export class EnemyView {
  readonly sprite: Phaser.GameObjects.Image;
  private lastDir: DirName = 'd';

  constructor(scene: Phaser.Scene, private e: Enemy) {
    this.sprite = scene.add.image(0, 0, enemyKey(e.kind, 'normal', 'd', 0)).setDepth(5).setScale(SPRITE_SCALE);
  }

  update(time: number, powerLeft: number): void {
    const e = this.e;
    let x = toX(e.px);
    let y = toY(e.py);
    if (isNone(e.dir)) { /* mantiene la última orientación */ } else this.lastDir = dirName(e.dir);
    const frame = Math.floor(time / 140) % 2;
    let visual: 'normal' | 'scared' | 'blink' | 'eyes' = 'normal';
    let alpha = 1;
    if (e.state === 'eyes') visual = 'eyes';
    else if (e.state === 'respawning' || e.state === 'waiting') {
      // oscilan dentro de la casa
      y += Math.sin(time / 160 + e.homeCell.x) * 3;
      alpha = e.state === 'respawning' ? 0.45 + Math.sin(time / 120) * 0.15 : 0.9;
    } else if (e.scared) {
      visual = powerLeft < COOKIE_WARNING_SECONDS && Math.floor(time / 120) % 2 === 0 ? 'blink' : 'scared';
    }
    if (e.state === 'active' && e.grace > 0) alpha = 0.5 + 0.4 * Math.sin(time / 50);
    this.sprite.setTexture(enemyKey(e.kind, visual, this.lastDir, visual === 'eyes' ? 0 : frame));
    const bob = 1 + Math.sin(time / 130 + e.homeCell.x) * 0.03;
    this.sprite.setScale(SPRITE_SCALE * bob, SPRITE_SCALE * (2 - bob));
    this.sprite.setPosition(x, y - 3).setAlpha(alpha);
    this.sprite.setDepth(visual === 'eyes' ? 4.8 : 5);
  }

  destroy(): void { this.sprite.destroy(); }
}
