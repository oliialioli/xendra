import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';
import type { GameEventBus } from './bridge/gameEvents';
import type { Landmark, LandmarkId } from '../types/content';
import styles from './PhaserGame.module.css';

export type PhaserGameProps = {
  bus: GameEventBus;
  landmarks: Landmark[];
  visitedIds: LandmarkId[];
  reducedMotion: boolean;
};

/**
 * Mounts a single Phaser.Game instance for the lifetime of the app.
 * React never re-creates it on re-render; only the bridge carries updates in.
 */
export function PhaserGame({ bus, landmarks, visitedIds, reducedMotion }: PhaserGameProps) {
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
    });
    const game = new Phaser.Game(config);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
    // Bridge/content/landmarks are stable for the app's lifetime; the game
    // reads live updates (visited ids, reduced motion) via bridge events instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={styles.root} data-testid="phaser-game-root" />;
}
