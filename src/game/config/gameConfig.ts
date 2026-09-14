import Phaser from 'phaser';
import { MapScene } from '../scenes/MapScene';
import type { GameEventBus } from '../bridge/gameEvents';
import type { Landmark, LandmarkId } from '../../types/content';

export type GameBootData = {
  bus: GameEventBus;
  landmarks: Landmark[];
  visitedIds: LandmarkId[];
  reducedMotion: boolean;
};

export function createGameConfig(
  parent: HTMLElement,
  bootData: GameBootData,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#6f97a0',
    // RESIZE mode: the canvas always fills its container 1:1, no letterbox
    // bars. Phaser's own ScaleManager listens for window resize/orientation
    // changes and keeps parentSize/canvas/main-camera in sync automatically --
    // never call `game.scale.resize()` yourself alongside this mode (its own
    // docs say that call is only for `NONE` mode; doing so fights the
    // ScaleManager's internal RESIZE bookkeeping and corrupts the canvas size).
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth || window.innerWidth,
      height: parent.clientHeight || window.innerHeight,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    fps: {
      target: 60,
      smoothStep: true,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    scene: [MapScene],
    callbacks: {
      preBoot: (game) => {
        game.registry.set('bootData', bootData);
      },
    },
  };
}
