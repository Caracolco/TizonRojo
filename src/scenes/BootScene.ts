import Phaser from 'phaser';
import { GAME } from '../config/game';
import { generateTextures } from '../game/art/textures';
import { Maze } from '../game/maze/Maze';
import { txt } from '../game/ui/widgets';

/** Genera todo el arte procedural y pasa al menú. */
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create(): void {
    const label = txt(this, GAME.width / 2, GAME.height / 2, 'ENCENDIENDO BRASAS...', 18, '#ffd9c8');
    // se difiere un frame para que el texto de carga sea visible
    this.time.delayedCall(30, () => {
      generateTextures(this, new Maze());
      label.destroy();
      this.scene.start('Menu');
    });
  }
}
