import Phaser from 'phaser';
import { MapScene } from '../scenes/MapScene';
import type { GameEventBus } from '../bridge/gameEvents';
import type { Landmark, LandmarkId } from '../../types/content';

export type GameBootData = {
  bus: GameEventBus;
  landmarks: Landmark[];
  visitedIds: LandmarkId[];
  reducedMotion: boolean;
  /**
   * Stills even the small, slow, local effects (steam, notes, water...).
   * Only the in-app toggle sets this: the system's "reduce motion" alone
   * (which phones often have on) leaves them running -- they're the sign a
   * place has come alive -- and only calms the big movement.
   */
  ambientMotionOff: boolean;
};

/** Never render more than 2 canvas pixels per CSS pixel -- 3x phones gain little visibly for 2.25x the fill cost. */
const MAX_RENDER_RESOLUTION = 2;

/**
 * Canvas pixels per CSS pixel: the screen's devicePixelRatio, capped. The
 * canvas is sized at CSS size x this (see PhaserGame.tsx) and displayed
 * back at CSS size, so a retina screen gets a full-resolution image instead
 * of a 1x canvas the browser stretches (which read as soft and pixelated).
 */
export function renderResolution(): number {
  return Math.min(Math.max(window.devicePixelRatio || 1, 1), MAX_RENDER_RESOLUTION);
}

export function createGameConfig(
  parent: HTMLElement,
  bootData: GameBootData,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#6f97a0',
    // NONE mode, sized by hand: Phaser's RESIZE mode always makes the canvas
    // exactly the container's CSS size, i.e. 1x on a retina screen. Instead
    // PhaserGame.tsx keeps the canvas at container size x renderResolution()
    // via game.scale.resize() (the call NONE mode is meant for), and
    // PhaserGame.module.css stretches it back to fill the container. Phaser
    // still maps pointer input correctly through its displayScale.
    scale: {
      mode: Phaser.Scale.NONE,
      width: Math.round((parent.clientWidth || window.innerWidth) * renderResolution()),
      height: Math.round((parent.clientHeight || window.innerHeight) * renderResolution()),
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
      // Lets power-of-two textures (e.g. the 512x512 postbox) shrink smoothly
      // instead of aliasing when drawn at a fraction of their size. Phaser
      // only builds mipmaps for power-of-two textures; others are unaffected.
      mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
    },
    scene: [MapScene],
    callbacks: {
      preBoot: (game) => {
        game.registry.set('bootData', bootData);
      },
    },
  };
}
