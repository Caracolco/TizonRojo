import Phaser from 'phaser';
import { ENEMY_DEFS } from '../config/enemies';
import { GAME } from '../config/game';
import { audio } from '../game/audio/AudioManager';
import { enemyKey, brasaKey } from '../game/art/textures';
import { BTN_GOLD, BTN_RED, BTN_STEEL, makeButton, makeIconButton, setIcon, txt } from '../game/ui/widgets';
import { FONT, fpx } from '../config/palette';
import { fmtTime, loadBest } from '../storage/records';

export class MenuScene extends Phaser.Scene {
  private howTo?: Phaser.GameObjects.Container;

  constructor() { super('Menu'); }

  create(): void {
    const cx = GAME.width / 2;
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.add.image(cx, GAME.height / 2, 'bg');

    this.add.particles(0, 0, 'spark', {
      x: { min: 0, max: GAME.width }, y: GAME.height + 10, lifespan: 5000,
      speedY: { min: -170, max: -60 }, speedX: { min: -30, max: 30 },
      scale: { start: 1.8, end: 0 }, alpha: { start: 0.9, end: 0 }, blendMode: 'ADD',
      frequency: 60, tint: [0xff5a1c, 0xffb347, 0xe5231d, 0xffe27a],
    });

    // Logotipo
    const logo = this.add.image(cx, 210, 'logo').setScale(0.92);
    this.tweens.add({ targets: logo, y: 218, yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.InOut' });

    // Título
    const title = txt(this, cx, 470, 'ARCADE', 84, '#ffd23a', { stroke: '#8a1200', strokeThickness: 18 });
    this.tweens.add({ targets: title, scale: 1.05, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.InOut' });
    txt(this, cx, 545, '¿SOBREVIVIRÁS 180 SEGUNDOS?', 23, '#ffffff', { stroke: '#7a0a0a', strokeThickness: 8 });

    // Mascota principal (escena de "persecución")
    const glow = this.add.image(cx, 700, 'glow').setTint(0xff6a1c).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(300, 300).setAlpha(0.7);
    this.tweens.add({ targets: glow, alpha: 0.4, yoyo: true, repeat: -1, duration: 600 });
    const hero = this.add.image(cx, 700, brasaKey('normal', 'd', 0)).setScale(1.6);
    this.tweens.add({ targets: hero, y: 680, yoyo: true, repeat: -1, duration: 520, ease: 'Sine.InOut' });
    let f = 0;
    this.time.addEvent({ delay: 110, loop: true, callback: () => { f = (f + 1) % 4; hero.setTexture(brasaKey('normal', 'd', f)); } });

    // Cuatro enemigos
    const xs = [135, 285, 435, 585];
    ENEMY_DEFS.forEach((def, i) => {
      const e = this.add.image(xs[i], 860, enemyKey(def.kind, 'normal', 'd', 0)).setScale(0.82);
      this.tweens.add({ targets: e, y: 848, yoyo: true, repeat: -1, duration: 480 + i * 70, delay: i * 90, ease: 'Sine.InOut' });
      this.time.addEvent({ delay: 280 + i * 20, loop: true, callback: () => e.setTexture(enemyKey(def.kind, 'normal', 'd', Math.floor(this.time.now / 280) % 2)) });
      txt(this, xs[i], 925, def.name, 15, def.color, { stroke: '#1a0505', strokeThickness: 5 });
    });

    // Récord local
    const best = loadBest();
    const rec = best.time > 0 ? `MEJOR: ${fmtTime(best.time)} · ${best.score} PTS` : 'AÚN SIN RÉCORD · ¡SÉ EL PRIMERO!';
    txt(this, cx, 970, rec, 15, '#9aa3ad');

    // Botones
    const play = makeButton(this, cx, 1050, 560, 118, 'JUGAR AHORA', () => this.play(), BTN_RED, 38);
    this.tweens.add({ targets: play, scale: 1.04, yoyo: true, repeat: -1, duration: 650, ease: 'Sine.InOut' });
    makeButton(this, cx, 1170, 400, 80, 'CÓMO JUGAR', () => this.openHowTo(), BTN_STEEL, 24);

    // Sonido independiente: música y efectos
    const music = makeIconButton(this, 70, 1200, 32, audio.prefs.music ? 'icon_music_on' : 'icon_music_off', () => {
      setIcon(music, audio.toggleMusic() ? 'icon_music_on' : 'icon_music_off');
    });
    const sfx = makeIconButton(this, GAME.width - 70, 1200, 32, audio.prefs.sfx ? 'icon_sfx_on' : 'icon_sfx_off', () => {
      const on = audio.toggleSfx();
      setIcon(sfx, on ? 'icon_sfx_on' : 'icon_sfx_off');
      if (on) audio.click();
    });
    txt(this, cx, 1255, 'DEMO V1 · SOLO VISUAL', 11, '#6b5a5c');

    this.add.image(cx, GAME.height / 2, 'vignette').setDepth(50);
    this.add.tileSprite(cx, GAME.height / 2, GAME.width, GAME.height, 'scan').setDepth(51);
    this.input.keyboard?.addKey('ENTER').on('down', () => { if (!this.howTo?.visible) this.play(); });
  }

  private play(): void {
    audio.unlock();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game'));
  }

  private openHowTo(): void {
    if (this.howTo) { this.howTo.setVisible(true); return; }
    const cx = GAME.width / 2;
    const c = this.add.container(0, 0).setDepth(60);
    const dim = this.add.rectangle(cx, GAME.height / 2, GAME.width, GAME.height, 0x050203, 0.88).setInteractive();
    const g = this.add.graphics();
    g.fillStyle(0x140a0c, 1).fillRoundedRect(36, 60, GAME.width - 72, 1160, 30);
    g.lineStyle(6, 0xe5231d, 1).strokeRoundedRect(36, 60, GAME.width - 72, 1160, 30);
    const title = txt(this, cx, 128, 'CÓMO JUGAR', 36, '#ffd23a', { stroke: '#7a0a0a', strokeThickness: 10 });
    const lines: [string, string][] = [
      ['🎮', 'DESLIZA el dedo o usa FLECHAS / WASD para moverte.'],
      ['⏱', 'SOBREVIVE 180 SEGUNDOS. ¡Solo tienes UNA vida!'],
      ['✦', 'Recoge BRASAS para sumar puntos. Si se acaban, ¡reaparecen!'],
      ['🍪', 'Hay 4 GALLETAS especiales (no regresan): te protegen y neutralizan enemigos por unos segundos.'],
      ['!', 'Los enemigos neutralizados reaparecen en su casa.'],
    ];
    let y = 200;
    const items: Phaser.GameObjects.GameObject[] = [];
    lines.forEach(([, text], i) => {
      const bullet = txt(this, 90, y + 12, String(i + 1), 20, '#ff3b2f', { stroke: '#1a0505', strokeThickness: 5 });
      const t = this.add.text(125, y, text, { fontFamily: FONT, fontStyle: 'bold', fontSize: fpx(15), color: '#ffffff', wordWrap: { width: 545 }, lineSpacing: 7 });
      items.push(bullet, t);
      y += t.height + 26;
    });
    // Bestiario
    y += 10;
    const heading = txt(this, cx, y, 'LOS CUATRO ENEMIGOS', 20, '#ffd23a', { stroke: '#1a0505', strokeThickness: 6 });
    y += 58;
    const bestiary: Phaser.GameObjects.GameObject[] = [];
    ENEMY_DEFS.forEach((def) => {
      const img = this.add.image(110, y + 6, enemyKey(def.kind, 'normal', 'd', 0)).setScale(0.55);
      const name = this.add.text(165, y - 14, def.name, { fontFamily: FONT, fontStyle: 'bold', fontSize: fpx(18), color: def.color, stroke: '#1a0505', strokeThickness: 5 });
      const desc = this.add.text(165, y + 12, def.trait.toUpperCase(), { fontFamily: FONT, fontStyle: 'bold', fontSize: fpx(13), color: '#cfc6c8' });
      bestiary.push(img, name, desc);
      y += 70;
    });
    const hell = this.add.text(cx, y + 10, 'En los últimos 30 s llega el\n¡MODO INFIERNO!', { fontFamily: FONT, fontStyle: 'bold', fontSize: fpx(17), color: '#ff7a3c', align: 'center', lineSpacing: 8 }).setOrigin(0.5, 0);
    const ok = makeButton(this, cx, 1140, 420, 86, 'ENTENDIDO', () => c.setVisible(false), BTN_GOLD, 28);
    c.add([dim, g, title, ...items, heading, ...bestiary, hell, ok]);
    this.howTo = c;
  }
}
