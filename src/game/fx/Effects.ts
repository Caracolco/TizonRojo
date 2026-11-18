import Phaser from 'phaser';
import { FONT, fpx } from '../../config/palette';

/** Partículas, destellos, sacudidas y textos flotantes reutilizables. */
export class Effects {
  private burstEm: Phaser.GameObjects.Particles.ParticleEmitter;
  private smokeEm: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(private scene: Phaser.Scene, depth = 8) {
    this.burstEm = scene.add.particles(0, 0, 'spark', {
      lifespan: { min: 300, max: 650 },
      speed: { min: 80, max: 260 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      gravityY: 120,
      blendMode: 'ADD',
      emitting: false,
    }).setDepth(depth);
    this.smokeEm = scene.add.particles(0, 0, 'smoke', {
      lifespan: { min: 600, max: 1300 },
      speed: { min: 10, max: 60 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.5, end: 1.3 },
      alpha: { start: 0.7, end: 0 },
      emitting: false,
    }).setDepth(depth);
  }

  burst(x: number, y: number, tint: number, count = 12): void {
    this.burstEm.setParticleTint(tint);
    this.burstEm.explode(count, x, y);
  }

  smoke(x: number, y: number, count = 8): void {
    this.smokeEm.explode(count, x, y);
  }

  ring(x: number, y: number, color: number, radius = 150, duration = 520): void {
    const g = this.scene.add.graphics({ x, y }).setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
    g.lineStyle(8, color, 1).strokeCircle(0, 0, 20);
    this.scene.tweens.add({
      targets: g, scale: radius / 20, alpha: 0, duration, ease: 'Cubic.Out', onComplete: () => g.destroy(),
    });
  }

  floatText(x: number, y: number, text: string, color = '#ffe27a', size = 22): void {
    const t = this.scene.add.text(x, y, text, {
      fontFamily: FONT, fontStyle: 'bold', fontSize: fpx(size), color, stroke: '#1a0505', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(25);
    this.scene.tweens.add({
      targets: t, y: y - 60, alpha: 0, scale: 1.25, duration: 800, ease: 'Cubic.Out', onComplete: () => t.destroy(),
    });
  }

  shake(duration = 250, intensity = 0.012): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  flash(r = 255, g = 255, b = 255, duration = 180): void {
    this.scene.cameras.main.flash(duration, r, g, b);
  }
}
