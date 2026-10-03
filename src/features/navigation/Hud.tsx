import { List, Question, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { useSettings } from '../../app/providers/SettingsContext';
import { useAudioPlayer } from '../audio/AudioContext';
import { assetPath } from '../../lib/assetPath';
import styles from './Hud.module.css';

export type HudProps = {
  nearestLabel: string | null;
  onOpenMenu: () => void;
  onInteract: () => void;
  /** Reopens the navigation hint (see NavigationHint) -- works even if it was already dismissed. */
  onOpenNavigationHint: () => void;
  /** Hides the proximity/interact control, e.g. while a panel/menu/intro is open. */
  interactionHidden?: boolean;
};

export function Hud({
  nearestLabel,
  onOpenMenu,
  onInteract,
  onOpenNavigationHint,
  interactionHidden = false,
}: HudProps) {
  const { soundEnabled } = useSettings();
  const { toggleSound } = useAudioPlayer();

  return (
    <>
      <div className={styles.topBar}>
        <span className={styles.logo}>
          <img src={assetPath('/assets/brand/xendra-logo.svg')} alt="Xendra" className={styles.logoImage} />
        </span>
        <div className="xnd-control-module">
          <button
            type="button"
            className="xnd-btn-icon"
            onClick={onOpenNavigationHint}
            aria-label="Kontrolen laguntza"
            title="Kontrolen laguntza"
          >
            <Question size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="xnd-btn-icon"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Soinua desaktibatu' : 'Soinua aktibatu'}
            title={soundEnabled ? 'Soinua desaktibatu' : 'Soinua aktibatu'}
          >
            {soundEnabled ? (
              <SpeakerHigh size={20} aria-hidden="true" />
            ) : (
              <SpeakerSlash size={20} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="xnd-btn-icon"
            onClick={onOpenMenu}
            aria-label="Ireki menua"
            title="Ireki menua"
          >
            <List size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {nearestLabel && !interactionHidden && (
        <div className={styles.proximityBar} role="status">
          <span>{nearestLabel}</span>
          {/* On a keyboard, E opens it too. */}
          <kbd className={styles.keyHint} aria-label="E tekla">
            E
          </kbd>
          <button
            type="button"
            className="xnd-btn-primary"
            onClick={onInteract}
          >
            Ireki
          </button>
        </div>
      )}
    </>
  );
}
