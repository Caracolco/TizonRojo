import Phaser from 'phaser';
import { FONT, fpx } from '../../config/palette';
import { audio } from '../audio/AudioManager';

export function txt(
  scene: Phaser.Scene, x: number, y: number, text: string, size: number, color = '#ffffff',
  extra: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: FONT, fontStyle: 'bold', fontSize: fpx(size), color, align: 'center', ...extra,
  }).setOrigin(0.5);
}

export interface ButtonStyle { fill: number; fillDark: number; edge: number; text: string }
export const BTN_RED: ButtonStyle = { fill: 0xe5231d, fillDark: 0x9b0f12, edge: 0xffd9c8, text: '#ffffff' };
export const BTN_STEEL: ButtonStyle = { fill: 0x4a525b, fillDark: 0x242a30, edge: 0xd5dbe0, text: '#ffffff' };
export const BTN_GOLD: ButtonStyle = { fill: 0xffa514, fillDark: 0xc4480a, edge: 0xfff1b8, text: '#ffffff' };

/** Botón arcade grande con relieve, brillo y animación de pulsación. */
export function makeButton(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string,
  onClick: () => void, style: ButtonStyle = BTN_RED, fontSize = 34,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const draw = (pressed: boolean): void => {
    g.clear();
    const off = pressed ? 5 : 0;
    g.fillStyle(0x000000, 0.45).fillRoundedRect(-w / 2 + 2, -h / 2 + 10, w, h, 22);
    g.fillStyle(style.fillDark, 1).fillRoundedRect(-w / 2, -h / 2 + 8 - off, w, h, 22);
    g.fillStyle(style.fill, 1).fillRoundedRect(-w / 2, -h / 2 - off + 0, w, h - 6 + (pressed ? 0 : 0), 22);
    g.fillStyle(0xffffff, 0.22).fillRoundedRect(-w / 2 + 10, -h / 2 + 6 - off, w - 20, h * 0.34, 14);
    g.lineStyle(4, style.edge, 0.9).strokeRoundedRect(-w / 2, -h / 2 - off, w, h - 6, 22);
  };
  draw(false);
  const t = txt(scene, 0, -3, label, fontSize, style.text, { stroke: '#1a0505', strokeThickness: 6 });
  c.add([g, t]);
  c.setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => { draw(true); t.y = 2; c.setScale(0.98); });
  const up = (): void => { draw(false); t.y = -3; c.setScale(1); };
  c.on('pointerout', up);
  c.on('pointerup', () => { up(); audio.unlock(); audio.click(); onClick(); });
  return c;
}

/** Botón circular con icono (pausa, sonido...). */
export function makeIconButton(
  scene: Phaser.Scene, x: number, y: number, radius: number, icon: string, onClick: () => void,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.4).fillCircle(0, 4, radius);
  g.fillStyle(0x2a1a1d, 0.95).fillCircle(0, 0, radius);
  g.lineStyle(4, 0xe5231d, 1).strokeCircle(0, 0, radius);
  const img = scene.add.image(0, 0, icon).setDisplaySize(radius * 1.3, radius * 1.3);
  c.add([g, img]);
  c.setSize(radius * 2, radius * 2);
  c.setInteractive(new Phaser.Geom.Circle(radius, radius, radius * 1.15), Phaser.Geom.Circle.Contains);
  c.on('pointerdown', () => c.setScale(0.92));
  c.on('pointerout', () => c.setScale(1));
  c.on('pointerup', () => { c.setScale(1); audio.unlock(); onClick(); });
  (c as unknown as { icon: Phaser.GameObjects.Image }).icon = img;
  return c;
}

export function setIcon(btn: Phaser.GameObjects.Container, key: string): void {
  (btn as unknown as { icon: Phaser.GameObjects.Image }).icon.setTexture(key);
}

/** Silkscreen dibuja "%" ilegible, así que el signo se dibuja a mano con el mismo estilo pixel. */
export function percentSign(scene: Phaser.Scene, size: number, fill: number, edge: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const u = size / 10;
  const draw = (pad: number, color: number): void => {
    g.fillStyle(color, 1);
    g.fillRect(-4.5 * u - pad, -5 * u - pad, 3 * u + pad * 2, 3 * u + pad * 2);
    g.fillRect(1.5 * u - pad, 2 * u - pad, 3 * u + pad * 2, 3 * u + pad * 2);
    g.fillPoints([
      new Phaser.Math.Vector2(3.6 * u + pad, -5 * u - pad), new Phaser.Math.Vector2(4.6 * u + pad, -4 * u),
      new Phaser.Math.Vector2(-3.6 * u - pad, 5 * u + pad), new Phaser.Math.Vector2(-4.6 * u - pad, 4 * u),
    ], true);
  };
  draw(u * 0.8, edge);
  draw(0, fill);
  return g;
}
