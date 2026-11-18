import Phaser from 'phaser';
import { GAME } from '../../config/game';
import { txt } from './widgets';

/** Avisos centrales breves (cuenta regresiva, cambios de fase, MODO INFIERNO). */
export class Banner {
  constructor(private scene: Phaser.Scene) {}

  show(text: string, opts: { size?: number; color?: string; stroke?: string; sub?: string; hold?: number; y?: number; shake?: boolean } = {}): void {
    const y = opts.y ?? GAME.mazeY + (21 * GAME.tile) / 2;
    const t = txt(this.scene, GAME.width / 2, y, text, opts.size ?? 56, opts.color ?? '#ffffff', {
      stroke: opts.stroke ?? '#7a0a0a', strokeThickness: 14,
    }).setDepth(30).setScale(0.2).setAlpha(0);
    const items: Phaser.GameObjects.Text[] = [t];
    if (opts.sub) items.push(txt(this.scene, GAME.width / 2, y + (opts.size ?? 56) * 0.9, opts.sub, 20, '#ffd23a', { stroke: '#1a0505', strokeThickness: 6 }).setDepth(30).setAlpha(0));
    this.scene.tweens.add({
      targets: t, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: items, alpha: 0, y: '-=30', delay: opts.hold ?? 900, duration: 380, onComplete: () => items.forEach((i) => i.destroy()),
        });
      },
    });
    if (items[1]) this.scene.tweens.add({ targets: items[1], alpha: 1, duration: 260, delay: 120 });
    if (opts.shake) {
      this.scene.tweens.add({ targets: t, angle: { from: -3, to: 3 }, yoyo: true, repeat: 6, duration: 60 });
    }
  }
}
