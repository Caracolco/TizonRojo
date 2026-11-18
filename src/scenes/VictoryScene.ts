import Phaser from 'phaser';
import { GAME } from '../config/game';
import { audio } from '../game/audio/AudioManager';
import { BTN_GOLD, BTN_STEEL, makeButton, percentSign, txt } from '../game/ui/widgets';
import { fmtTime } from '../storage/records';

interface VictoryData { score: number; newScore: boolean }

/**
 * Pantalla de victoria. El premio es SOLO visual (demostración): no se genera
 * ningún código, cupón, QR ni descuento válido.
 */
export class VictoryScene extends Phaser.Scene {
  constructor() { super('Victory'); }

  create(data: VictoryData): void {
    const cx = GAME.width / 2;
    this.cameras.main.fadeIn(500, 255, 255, 255);
    this.add.image(cx, GAME.height / 2, 'bg');
    const rays = this.add.image(cx, 470, 'glow').setTint(0xffc83a).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(900, 900).setAlpha(0.45);
    this.tweens.add({ targets: rays, alpha: 0.2, yoyo: true, repeat: -1, duration: 700 });

    // confeti + chispas de fuego
    this.add.particles(0, -20, 'confetti', {
      x: { min: 0, max: GAME.width }, lifespan: 5200, speedY: { min: 120, max: 320 }, speedX: { min: -60, max: 60 },
      rotate: { min: 0, max: 360 }, angle: { min: 0, max: 360 }, scale: { start: 1.1, end: 0.7 },
      tint: [0xff3b2f, 0xffd23a, 0xffffff, 0xff8a1c, 0x35d6ff, 0x9dff3a], frequency: 28,
    }).setDepth(40);
    this.add.particles(0, GAME.height + 10, 'spark', {
      x: { min: 0, max: GAME.width }, lifespan: 3600, speedY: { min: -420, max: -160 }, speedX: { min: -50, max: 50 },
      scale: { start: 2, end: 0 }, blendMode: 'ADD', tint: [0xff5a1c, 0xffb347, 0xffe27a], frequency: 25,
    }).setDepth(40);

    const t1 = txt(this, cx, 120, '¡SOBREVIVISTE', 50, '#ffffff', { stroke: '#7a0a0a', strokeThickness: 14 });
    const t2 = txt(this, cx, 195, 'AL INFIERNO!', 56, '#ffd23a', { stroke: '#8a1200', strokeThickness: 16 });
    this.tweens.add({ targets: [t1, t2], scale: 1.06, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.InOut' });

    // personaje celebrando
    const hero = this.add.image(cx, 440, 'brasa_win_0').setScale(2.8);
    let f = 0;
    this.time.addEvent({ delay: 120, loop: true, callback: () => { f = (f + 1) % 4; hero.setTexture(`brasa_win_${f}`); } });
    this.tweens.add({ targets: hero, y: 380, yoyo: true, repeat: -1, duration: 380, ease: 'Sine.Out' });
    this.tweens.add({ targets: hero, angle: { from: -8, to: 8 }, yoyo: true, repeat: -1, duration: 380 });

    txt(this, cx, 640, 'TIEMPO', 16, '#9aa3ad');
    txt(this, cx, 690, fmtTime(GAME.surviveSeconds), 56, '#ffffff', { stroke: '#7a0a0a', strokeThickness: 12 });
    txt(this, cx, 760, `PUNTAJE ${data.score}${data.newScore ? '  ¡RÉCORD!' : ''}`, 18, '#ffd23a', { stroke: '#1a0505', strokeThickness: 6 });

    // tarjeta visual de premio (solo demostración)
    const card = this.add.container(cx, 900);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4).fillRoundedRect(-300, -86, 600, 190, 26);
    g.fillStyle(0xe5231d, 1).fillRoundedRect(-300, -100, 600, 190, 26);
    g.fillStyle(0xffffff, 0.18).fillRoundedRect(-286, -92, 572, 60, 18);
    g.lineStyle(6, 0xffd23a, 1).strokeRoundedRect(-300, -100, 600, 190, 26);
    g.lineStyle(3, 0xffffff, 0.8).strokeRoundedRect(-286, -86, 572, 162, 18);
    const d1 = this.add.container(0, -42);
    const left = txt(this, 0, 0, 'DESCUENTO DEL 50', 34, '#ffffff', { stroke: '#7a0a0a', strokeThickness: 9 }).setOrigin(0, 0.5);
    const pct = percentSign(this, 34, 0xffffff, 0x7a0a0a);
    const total = left.width + 12 + 30;
    left.x = -total / 2;
    pct.setPosition(-total / 2 + left.width + 12 + 14, 0);
    d1.add([left, pct]);
    const d2 = txt(this, 0, 20, '— DEMOSTRACIÓN —', 24, '#ffd23a', { stroke: '#7a0a0a', strokeThickness: 7 });
    card.add([g, d1, d2]);
    this.tweens.add({ targets: card, scale: 1.04, angle: { from: -1.5, to: 1.5 }, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.InOut' });
    txt(this, cx, 1020, 'Premio solo visual: no es un cupón válido', 13, '#cfc6c8');

    makeButton(this, cx, 1110, 520, 104, 'VOLVER A JUGAR', () => this.go('Game'), BTN_GOLD, 32);
    makeButton(this, cx, 1210, 300, 66, 'MENÚ', () => this.go('Menu'), BTN_STEEL, 20);

    this.add.image(cx, GAME.height / 2, 'vignette').setDepth(50);
    this.add.tileSprite(cx, GAME.height / 2, GAME.width, GAME.height, 'scan').setDepth(51);
    this.input.keyboard?.addKey('ENTER').on('down', () => this.go('Game'));
  }

  private go(scene: string): void {
    audio.unlock();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene));
  }
}
