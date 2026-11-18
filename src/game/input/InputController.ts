import Phaser from 'phaser';
import { Dir, DOWN, LEFT, RIGHT, UP } from '../maze/Maze';

export interface JoystickView {
  /** desplazamiento del pomo (px lógicos), 0 si no hay toque */
  knobX: number;
  knobY: number;
  active: boolean;
}

/**
 * Entrada unificada: flechas/WASD en teclado y joystick flotante/deslizamiento táctil.
 * La dirección pedida se bufferiza en el jugador, por lo que girar nunca se "pierde".
 */
export class InputController {
  readonly joystick: JoystickView = { knobX: 0, knobY: 0, active: false };
  private activeId = -1;
  private ox = 0;
  private oy = 0;
  private last: Dir | null = null;

  private static readonly DEADZONE = 16;
  private static readonly RADIUS = 56;

  constructor(
    private scene: Phaser.Scene,
    private onDir: (d: Dir) => void,
    private onPause: () => void,
  ) {
    const kb = scene.input.keyboard;
    if (kb) {
      const map: Record<string, Dir> = {
        UP, W: UP, DOWN, S: DOWN, LEFT, A: LEFT, RIGHT, D: RIGHT,
      };
      for (const [key, dir] of Object.entries(map)) {
        kb.addKey(key, true).on('down', () => this.onDir(dir));
      }
      kb.addKey('P').on('down', () => this.onPause());
      kb.addKey('ESC').on('down', () => this.onPause());
      kb.addKey('SPACE').on('down', () => this.onPause());
    }

    scene.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0 || this.activeId !== -1) return;
      this.activeId = p.id;
      this.ox = p.x;
      this.oy = p.y;
      this.joystick.active = true;
      this.joystick.knobX = 0;
      this.joystick.knobY = 0;
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id !== this.activeId || !p.isDown) return;
      this.track(p.x, p.y);
    });
    const release = (p: Phaser.Input.Pointer): void => {
      if (p.id !== this.activeId) return;
      this.activeId = -1;
      this.joystick.active = false;
      this.joystick.knobX = 0;
      this.joystick.knobY = 0;
      this.last = null;
    };
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', release);
  }

  private track(x: number, y: number): void {
    let dx = x - this.ox;
    let dy = y - this.oy;
    const len = Math.hypot(dx, dy);
    const R = InputController.RADIUS;
    if (len > R) {
      // el joystick "sigue" al dedo: giros rápidos sin tener que volver al centro
      this.ox += (dx / len) * (len - R);
      this.oy += (dy / len) * (len - R);
      dx = x - this.ox;
      dy = y - this.oy;
    }
    this.joystick.knobX = dx;
    this.joystick.knobY = dy;
    if (Math.hypot(dx, dy) < InputController.DEADZONE) return;
    const d: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? RIGHT : LEFT) : dy > 0 ? DOWN : UP;
    if (this.last !== d) {
      this.last = d;
      this.onDir(d);
    }
  }

  destroy(): void {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');
    this.scene.input.off('pointerupoutside');
  }
}
