import Phaser from 'phaser';
import { PHASES, PhaseConfig } from '../../config/difficulty';
import { GAME } from '../../config/game';
import { fmtTime } from '../../storage/records';
import { makeIconButton, setIcon, txt } from './widgets';

const PHASE_COLORS = [0xffc21a, 0xff8a1c, 0xff3d1f, 0xff0a3c];
const PHASE_TEXT = ['#ffd23a', '#ff9a3c', '#ff5a3a', '#ff2a55'];

/** HUD superior: no invade el laberinto (todo queda por encima de y=190). */
export class Hud {
  private score: Phaser.GameObjects.Text;
  private timer: Phaser.GameObjects.Text;
  private phaseChip: Phaser.GameObjects.Text;
  private bar: Phaser.GameObjects.Graphics;
  private cookieIcons: Phaser.GameObjects.Image[] = [];
  private life: Phaser.GameObjects.Image;
  readonly pauseBtn: Phaser.GameObjects.Container;
  private hell = false;
  private scoreShown = 0;
  private scoreTarget = 0;

  constructor(private scene: Phaser.Scene, totalCookies: number, onPause: () => void) {
    const D = 20;
    // panel de fondo
    const panel = scene.add.graphics().setDepth(D - 1);
    panel.fillStyle(0x0b0506, 0.82).fillRect(0, 0, GAME.width, 190);
    panel.fillStyle(0xe5231d, 1).fillRect(0, 188, GAME.width, 4);
    panel.fillStyle(0xff7a66, 0.8).fillRect(0, 188, GAME.width, 1);

    txt(scene, 100, 30, 'PUNTOS', 14, '#9aa3ad').setDepth(D);
    this.score = txt(scene, 100, 66, '0', 30, '#ffffff', { stroke: '#1a0505', strokeThickness: 6 }).setDepth(D);

    this.timer = txt(scene, 360, 56, '00:00', 52, '#ffffff', { stroke: '#7a0a0a', strokeThickness: 10 }).setDepth(D);
    txt(scene, 360, 100, `/ ${fmtTime(GAME.surviveSeconds)}`, 14, '#9aa3ad').setDepth(D);

    this.pauseBtn = makeIconButton(scene, 650, 62, 38, 'icon_pause', onPause).setDepth(D);

    this.life = scene.add.image(54, 130, 'life_on').setDisplaySize(40, 40).setDepth(D);
    txt(scene, 138, 132, '1 VIDA', 14, '#ffd9c8').setDepth(D);

    this.phaseChip = txt(scene, 360, 132, 'FASE 1', 17, '#ffd23a', { stroke: '#1a0505', strokeThickness: 5 }).setDepth(D);

    for (let i = 0; i < totalCookies; i++) {
      const icon = scene.add.image(556 + i * 44, 130, 'cookie_on').setDisplaySize(38, 38).setDepth(D);
      this.cookieIcons.push(icon);
    }

    this.bar = scene.add.graphics().setDepth(D);
    this.setTime(0, PHASES[0]);
  }

  setScore(v: number): void { this.scoreTarget = v; }

  tick(): void {
    // contador de puntos animado
    if (this.scoreShown !== this.scoreTarget) {
      const diff = this.scoreTarget - this.scoreShown;
      this.scoreShown += Math.sign(diff) * Math.max(1, Math.ceil(Math.abs(diff) * 0.25));
      this.score.setText(String(this.scoreShown));
    }
  }

  setTime(sec: number, phase: PhaseConfig): void {
    this.timer.setText(fmtTime(sec));
    this.phaseChip.setText(phase.id === 4 ? '¡MODO INFIERNO!' : `FASE ${phase.id} · ${phase.name}`);
    this.phaseChip.setColor(PHASE_TEXT[phase.id - 1]);
    const x0 = 28;
    const w = GAME.width - 56;
    const y = 166;
    const g = this.bar;
    g.clear();
    g.fillStyle(0x22181a, 1).fillRoundedRect(x0, y, w, 12, 6);
    for (const p of PHASES) {
      const a = (p.start / GAME.surviveSeconds) * w;
      const b = (Math.min(sec, p.end) - p.start) / GAME.surviveSeconds * w;
      if (b > 0) g.fillStyle(PHASE_COLORS[p.id - 1], 1).fillRect(x0 + a, y, b, 12);
    }
    g.lineStyle(3, 0x0b0506, 1);
    for (const p of PHASES.slice(1)) {
      const sx = x0 + (p.start / GAME.surviveSeconds) * w;
      g.lineBetween(sx, y - 2, sx, y + 14);
    }
    const mx = x0 + (sec / GAME.surviveSeconds) * w;
    g.fillStyle(0xffffff, 1).fillCircle(mx, y + 6, 9).lineStyle(3, 0x1a0505, 1).strokeCircle(mx, y + 6, 9);
  }

  setCookies(left: number): void {
    this.cookieIcons.forEach((img, i) => img.setTexture(i < left ? 'cookie_on' : 'cookie_off'));
  }

  setHell(on: boolean): void {
    if (this.hell === on) return;
    this.hell = on;
    if (on) {
      this.scene.tweens.add({ targets: [this.timer], scale: 1.12, yoyo: true, repeat: -1, duration: 420, ease: 'Sine.InOut' });
      this.timer.setColor('#ffe27a');
      this.phaseChip.setScale(1);
      this.scene.tweens.add({ targets: [this.phaseChip], scale: 1.1, yoyo: true, repeat: -1, duration: 300, ease: 'Sine.InOut' });
    }
  }

  setLifeLost(): void { setIcon(this.pauseBtn, 'icon_pause'); this.life.setTexture('life_off'); }
}
