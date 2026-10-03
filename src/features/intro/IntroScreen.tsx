import { useEffect, useRef, useState, type AnimationEvent } from 'react';
import { SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { useSettings } from '../../app/providers/SettingsContext';
import { xendraContent } from '../../content/xendraContent';
import { assetPath } from '../../lib/assetPath';
import { IntroSnail } from './IntroSnail';
import { IntroLogo } from './IntroLogo';
import { useAudioPlayer } from '../audio/AudioContext';
import styles from './IntroScreen.module.css';

export type IntroScreenProps = {
  onEnter: () => void;
  onOpenMenu: () => void;
};

/** A seamless kraft-paper tile, repeated at its own size so it's sharp on any screen (see IntroScreen.module.css). */
const PAPER_SRC = assetPath('/assets/brand/intro-paper-tile.jpg');

/** Never hold the intro back longer than this waiting on images/fonts. */
const PRELOAD_TIMEOUT_MS = 1500;

function preloadImage(src: string): Promise<void> {
  const image = new Image();
  image.src = src;
  return image.decode().catch(() => undefined);
}

/**
 * First screen of the experience: a short scene in which a snail egg
 * wobbles, cracks and hatches the very snail the player is about to steer,
 * followed by the way in. Logo, egg, phrase, buttons and a one-line controls hint
 * all occupy their final place from the first frame (only their opacity
 * animates), so nothing shifts as they appear. See IntroSnail for the
 * hatching itself.
 *
 * Plays in full every time the intro opens (MapLayout opens it on every
 * visit); with reduced motion, everything is shown finished and still.
 */
export function IntroScreen({ onEnter, onOpenMenu }: IntroScreenProps) {
  const settings = useSettings();
  const mode = settings.effectiveReducedMotion ? 'static' : 'play';
  const { soundEnabled, toggleSound } = useAudioPlayer();
  const [ready, setReady] = useState(false);
  const enterButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, PRELOAD_TIMEOUT_MS));
    const assets = Promise.all([preloadImage(PAPER_SRC), document.fonts?.ready]);
    void Promise.race([assets, timeout]).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleActionsShown(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    // Hand keyboard users straight to "enter" -- unless they already moved focus themselves.
    if (document.activeElement === document.body || document.activeElement === null) {
      enterButtonRef.current?.focus({ preventScroll: true });
    }
  }

  return (
    <div
      className={styles.root}
      style={{ ['--paper' as string]: `url(${PAPER_SRC})` }}
      data-mode={mode}
      data-ready={ready}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
    >
      <div className={styles.column}>
        <IntroLogo className={styles.logo} />

        <div className={styles.stage}>
          <IntroSnail />
        </div>

        <h1 id="intro-title" className={styles.tagline}>
          {xendraContent.band.entrySubtitle}
        </h1>

        <div className={styles.actions} onAnimationEnd={handleActionsShown}>
          <button ref={enterButtonRef} type="button" className="xnd-btn-primary" onClick={onEnter}>
            Sartu uhartera
          </button>
          <button type="button" className="xnd-btn-secondary" onClick={onOpenMenu}>
            Ikusi menua
          </button>
        </div>

        <div className={styles.controls}>
          <p className={`${styles.controlsLabel} ${styles.controlsDesktop}`}>Mugitu geziekin edo WASD teklak erabiliz.</p>
          <p className={`${styles.controlsLabel} ${styles.controlsTouch}`}>Ukitu edo irristatu mugitzeko.</p>

          <button
            type="button"
            className={styles.soundToggle}
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Soinua aktibatuta. Desaktibatu' : 'Soinua desaktibatuta. Aktibatu'}
          >
            {soundEnabled ? (
              <SpeakerHigh size={18} weight="fill" aria-hidden="true" />
            ) : (
              <SpeakerSlash size={18} weight="fill" aria-hidden="true" />
            )}
            <span>{soundEnabled ? 'Soinua aktibatuta' : 'Soinua desaktibatuta'}</span>
            <span className={styles.soundAction} aria-hidden="true">
              {soundEnabled ? 'Desaktibatu' : 'Aktibatu'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
