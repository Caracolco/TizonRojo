import Phaser from 'phaser';
import { GAME } from '../../config/game';
import { audio } from '../audio/AudioManager';
import { BTN_RED, BTN_STEEL, makeButton, makeIconButton, setIcon, txt } from './widgets';

/** Menú de pausa con controles de sonido independientes (música / efectos). */
export class PauseOverlay {
  private root: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, onResume: () => void, onRestart: () => void, onMenu: () => void) {
    const cx = GAME.width / 2;
    this.root = scene.add.container(0, 0).setDepth(40).setVisible(false);
    const dim = scene.add.rectangle(cx, GAME.height / 2, GAME.width, GAME.height, 0x050203, 0.82).setInteractive();
    const panel = scene.add.graphics();
    panel.fillStyle(0x140a0c, 0.98).fillRoundedRect(cx - 290, 330, 580, 640, 30);
    panel.lineStyle(6, 0xe5231d, 1).strokeRoundedRect(cx - 290, 330, 580, 640, 30);
    const title = txt(scene, cx, 410, 'PAUSA', 56, '#ffffff', { stroke: '#7a0a0a', strokeThickness: 12 });
    const resume = makeButton(scene, cx, 540, 480, 100, 'SEGUIR', onResume, BTN_RED, 34);
    const restart = makeButton(scene, cx, 665, 480, 90, 'REINICIAR', onRestart, BTN_STEEL, 28);
    const menu = makeButton(scene, cx, 780, 480, 90, 'MENÚ', onMenu, BTN_STEEL, 28);

    const lblMusic = txt(scene, cx - 110, 880, 'MÚSICA', 14, '#9aa3ad');
    const lblSfx = txt(scene, cx + 110, 880, 'EFECTOS', 14, '#9aa3ad');
    const music = makeIconButton(scene, cx - 110, 930, 34, audio.prefs.music ? 'icon_music_on' : 'icon_music_off', () => {
      setIcon(music, audio.toggleMusic() ? 'icon_music_on' : 'icon_music_off');
    });
    const sfx = makeIconButton(scene, cx + 110, 930, 34, audio.prefs.sfx ? 'icon_sfx_on' : 'icon_sfx_off', () => {
      const on = audio.toggleSfx();
      setIcon(sfx, on ? 'icon_sfx_on' : 'icon_sfx_off');
      if (on) audio.click();
    });
    this.root.add([dim, panel, title, resume, restart, menu, lblMusic, lblSfx, music, sfx]);
  }

  show(v: boolean): void { this.root.setVisible(v); }
  get visible(): boolean { return this.root.visible; }
}
