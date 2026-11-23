import * as Phaser from 'phaser';
import { GameScene, type GameConfig } from './scenes/GameScene';

export function startGame(parent: HTMLElement, config: GameConfig): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    backgroundColor: '#5aa0e6',
    pixelArt: true,
    input: { activePointers: 4 },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1500 }, debug: false } },
  });
  game.scene.add('GameScene', GameScene, true, config);
  return game;
}
