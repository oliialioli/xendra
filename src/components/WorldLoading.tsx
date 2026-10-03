import { useEffect, useState } from 'react';
import { assetPath } from '../lib/assetPath';
import { SnailFigure } from './SnailFigure';
import styles from './WorldLoading.module.css';

const LOGO_SRC = assetPath('/assets/brand/xendra-logo-cream.svg');
const PAPER_SRC = assetPath('/assets/brand/intro-paper-tile.jpg');

/** Little things the island is "doing" while it loads, one after another. */
const MESSAGES = [
  'Ibaia betetzen…',
  'Zuhaitzak landatzen…',
  'Ontziak uretaratzen…',
  'Kioskoa irekitzen…',
  'Sua pizten…',
  'Barraskiloa esnatzen…',
];
const MESSAGE_MS = 1800;

export type WorldLoadingProps = {
  /** 0-1: how much of the island's images have arrived. */
  progress: number;
  /** Fades out (and then stays out of the way) once the island is ready. */
  done: boolean;
};

/**
 * Shown over the map while the island is still loading -- on a slow
 * connection the big map image can take a while. Same kraft paper and cream
 * logo as the intro; the snail crawls along a trail as the images arrive.
 */
export function WorldLoading({ progress, done }: WorldLoadingProps) {
  const [message, setMessage] = useState(0);

  useEffect(() => {
    if (done) return undefined;
    const timer = window.setInterval(() => setMessage((m) => (m + 1) % MESSAGES.length), MESSAGE_MS);
    return () => window.clearInterval(timer);
  }, [done]);

  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div
      className={styles.root}
      data-done={done || undefined}
      style={{ ['--paper' as string]: `url(${PAPER_SRC})` }}
      role="status"
      aria-live="polite"
      aria-busy={!done}
    >
      <div className={styles.column}>
        <img src={LOGO_SRC} alt="Xendra" className={styles.logo} />
        <div
          className={styles.trail}
          role="progressbar"
          aria-label="Uhartea kargatzen"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          style={{ ['--progress' as string]: progress }}
        >
          <span className={styles.trailDone} />
          <SnailFigure direction="right" className={styles.snail} />
        </div>
        <p className={styles.title}>Uhartea prestatzen</p>
        <p key={message} className={styles.message}>
          {MESSAGES[message]}
        </p>
      </div>
    </div>
  );
}
