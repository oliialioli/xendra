import { xendraContent } from '../../content/xendraContent';
import { assetPath } from '../../lib/assetPath';
import styles from './IntroScreen.module.css';

export type IntroScreenProps = {
  onEnter: () => void;
  onOpenMenu: () => void;
};

export function IntroScreen({ onEnter, onOpenMenu }: IntroScreenProps) {
  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <img src={assetPath('/assets/brand/xendra-logo.svg')} alt="Xendra" className={styles.logo} />
      <h1 id="intro-title" className={styles.tagline}>
        {xendraContent.band.tagline}
      </h1>
      <p className={styles.subtitle}>{xendraContent.band.entrySubtitle}</p>

      <div className={styles.actions}>
        <button type="button" className="xnd-btn-primary" onClick={onEnter}>
          Sartu uhartera
        </button>
        <button type="button" className="xnd-btn-secondary" onClick={onOpenMenu}>
          Ikusi menua
        </button>
      </div>

      <p className={styles.controlsHint}>
        Mugitu geziekin, WASD-ekin edo saguarekin. Soinua itzalita hasten da.
      </p>
    </div>
  );
}
