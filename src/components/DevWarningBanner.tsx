import styles from './DevWarningBanner.module.css';

/** Dev-only notice shown when the approved map asset is missing and a fallback SVG is in use. */
export function DevWarningBanner() {
  if (!import.meta.env.DEV) return null;

  return (
    <div className={styles.banner} role="status">
      Ordezko mapa erabiltzen: falta da{' '}
      <code>public/assets/map/xendra-map-base.png</code>. Abisu hau garapenean bakarrik
      erakusten da.
    </div>
  );
}
