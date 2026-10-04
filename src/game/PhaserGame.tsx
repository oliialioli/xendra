import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig, renderResolution } from './config/gameConfig';
import type { GameEventBus } from './bridge/gameEvents';
import type { Landmark, LandmarkId } from '../types/content';
import styles from './PhaserGame.module.css';

export type PhaserGameProps = {
  bus: GameEventBus;
  landmarks: Landmark[];
  visitedIds: LandmarkId[];
  reducedMotion: boolean;
  /** See GameBootData.ambientMotionOff. */
  ambientMotionOff: boolean;
};

/**
 * Mounts a single Phaser.Game instance for the lifetime of the app.
 * React never re-creates it on re-render; only the bridge carries updates in.
 */
export function PhaserGame({ bus, landmarks, visitedIds, reducedMotion, ambientMotionOff }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || gameRef.current) return;

    const config = createGameConfig(container, {
      bus,
      landmarks,
      visitedIds,
      reducedMotion,
      ambientMotionOff,
    });
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Keep the canvas at the container's size x screen resolution -- see
    // the `scale` comment in gameConfig.ts. Window resize also covers the
    // resolution itself changing (browser zoom, moving to another screen).
    const fitCanvas = () => {
      const resolution = renderResolution();
      const width = Math.round(container.clientWidth * resolution);
      const height = Math.round(container.clientHeight * resolution);
      if (width === 0 || height === 0) return;
      if (width === game.scale.width && height === game.scale.height) return;
      game.scale.resize(width, height);
    };
    const resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(container);
    window.addEventListener('resize', fitCanvas);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', fitCanvas);
      game.destroy(true);
      gameRef.current = null;
    };
    // Bridge/content/landmarks are stable for the app's lifetime; the game
    // reads live updates (visited ids, reduced motion) via bridge events instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={styles.root} data-testid="phaser-game-root" />;
}
