import Phaser from 'phaser';
import './styles.css';
import { GAME } from './config/game';
import { BootScene } from './scenes/BootScene';
import { DefeatScene } from './scenes/DefeatScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { VictoryScene } from './scenes/VictoryScene';

async function start(): Promise<void> {
  // La tipografía pixel se carga localmente (paquete npm) antes de crear textos en el canvas.
  try {
    await Promise.all([document.fonts.load("bold 32px 'Silkscreen'"), document.fonts.ready]);
  } catch { /* si falla se usa la fuente de respaldo */ }

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME.width,
    height: GAME.height,
    backgroundColor: '#080405',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, powerPreference: 'high-performance', roundPixels: false },
    input: { activePointers: 2 },
    scene: [BootScene, MenuScene, GameScene, DefeatScene, VictoryScene],
  });
}

void start();
