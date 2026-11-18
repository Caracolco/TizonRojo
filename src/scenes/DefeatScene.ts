import Phaser from 'phaser';
import { GAME } from '../config/game';
import { audio } from '../game/audio/AudioManager';
import { BTN_RED, BTN_STEEL, makeButton, txt } from '../game/ui/widgets';
import { fmtTime, loadBest } from '../storage/records';

interface DefeatData { time: number; score: number; newTime: boolean; newScore: boolean }

export class DefeatScene extends Phaser.Scene {
  constructor() { super('Defeat'); }

  create(data: DefeatData): void {
    const cx = GAME.width / 2;
    this.cameras.main.fadeIn(350, 0, 0, 0);
    this.add.image(cx, GAME.height / 2, 'bg');
    this.add.rectangle(cx, GAME.height / 2, GAME.width, GAME.height, 0x000000, 0.45);

    // humo subiendo
    this.add.particles(cx, 560, 'smoke', {
      lifespan: 2600, speedY: { min: -90, max: -40 }, speedX: { min: -30, max: 30 },
      scale: { start: 0.7, end: 2.2 }, alpha: { start: 0.55, end: 0 }, frequency: 120,
    });

    txt(this, cx, 150, '¡TE APAGASTE!', 56, '#ffffff', { stroke: '#7a0a0a', strokeThickness: 14 });
    txt(this, cx, 225, 'La brasa se enfrió...', 18, '#9aa3ad');

    // animación de derrota: brasa chamuscada que tiembla
    const hero = this.add.image(cx, 440, 'brasa_hurt').setScale(2.6);
    this.tweens.add({ targets: hero, angle: { from: -6, to: 6 }, yoyo: true, repeat: -1, duration: 140 });
    this.tweens.add({ targets: hero, scaleY: 2.35, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.InOut' });
    const zzz = txt(this, cx + 130, 330, 'x_x', 30, '#9aa3ad');
    this.tweens.add({ targets: zzz, y: 290, alpha: 0.2, repeat: -1, duration: 1300 });

    // estadísticas
    const best = loadBest();
    const panel = this.add.graphics();
    panel.fillStyle(0x140a0c, 0.95).fillRoundedRect(60, 640, GAME.width - 120, 340, 26);
    panel.lineStyle(5, 0xe5231d, 1).strokeRoundedRect(60, 640, GAME.width - 120, 340, 26);
    txt(this, cx, 690, 'TIEMPO SOBREVIVIDO', 16, '#9aa3ad');
    txt(this, cx, 740, fmtTime(data.time), 52, '#ffffff', { stroke: '#7a0a0a', strokeThickness: 10 });
    txt(this, cx - 150, 830, 'PUNTAJE', 15, '#9aa3ad');
    txt(this, cx - 150, 872, String(data.score), 30, '#ffd23a', { stroke: '#1a0505', strokeThickness: 7 });
    txt(this, cx + 150, 830, 'MEJOR RÉCORD', 15, '#9aa3ad');
    txt(this, cx + 150, 872, `${fmtTime(best.time)}`, 30, '#ffd23a', { stroke: '#1a0505', strokeThickness: 7 });
    txt(this, cx + 150, 912, `${best.score} PTS`, 15, '#cfc6c8');
    if (data.newTime || data.newScore) {
      const n = txt(this, cx, 950, '¡NUEVO RÉCORD!', 22, '#ff5a3a', { stroke: '#1a0505', strokeThickness: 6 });
      this.tweens.add({ targets: n, scale: 1.15, yoyo: true, repeat: -1, duration: 350 });
    }

    const retry = makeButton(this, cx, 1090, 560, 110, 'VOLVER A INTENTAR', () => this.go('Game'), BTN_RED, 28);
    this.tweens.add({ targets: retry, scale: 1.04, yoyo: true, repeat: -1, duration: 650, ease: 'Sine.InOut' });
    makeButton(this, cx, 1200, 320, 70, 'MENÚ', () => this.go('Menu'), BTN_STEEL, 22);

    this.add.image(cx, GAME.height / 2, 'vignette');
    this.add.tileSprite(cx, GAME.height / 2, GAME.width, GAME.height, 'scan');
    this.input.keyboard?.addKey('ENTER').on('down', () => this.go('Game'));
  }

  private go(scene: string): void {
    audio.unlock();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene));
  }
}
