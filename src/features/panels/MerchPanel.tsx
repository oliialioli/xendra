import { useState } from 'react';
import { MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react';
import type { MerchProduct } from '../../types/content';
import { xendraContent } from '../../content/xendraContent';
import { assetPath } from '../../lib/assetPath';
import shared from './panelShared.module.css';
import styles from './MerchPanel.module.css';

/**
 * The product photo. With a close-up, hovering it (or focusing it) fades the
 * close-up in; on a touch screen, where there's no hover, tapping it swaps
 * between the two -- the magnifier in its corner says so.
 */
function ProductPhoto({ product }: { product: MerchProduct }) {
  const [showDetail, setShowDetail] = useState(false);
  if (!product.imagePath) return <div aria-hidden="true" className={styles.photo} />;
  const photo = <img className={styles.image} src={assetPath(product.imagePath)} alt={product.name} />;
  if (!product.detailImagePath) return <div className={styles.photo}>{photo}</div>;

  return (
    <button
      type="button"
      className={styles.photo}
      data-detail={showDetail || undefined}
      aria-pressed={showDetail}
      aria-label={`${product.name}: ikusi xehetasuna`}
      onClick={() => setShowDetail((shown) => !shown)}
      // Only a real mouse leaving resets it: some phones send a "leave" right after a tap.
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setShowDetail(false);
      }}
    >
      {photo}
      <img className={`${styles.image} ${styles.detail}`} src={assetPath(product.detailImagePath)} alt="" />
      <span className={styles.zoomHint} aria-hidden="true">
        {showDetail ? <MagnifyingGlassMinus size={18} weight="bold" /> : <MagnifyingGlassPlus size={18} weight="bold" />}
      </span>
    </button>
  );
}

export function MerchPanel() {
  const { kiosk, merch, contact } = xendraContent;
  const instagram = contact.socialLinks.find((link) => link.label === 'Instagram');

  return (
    <div>
      <p className={shared.lead}>{kiosk.intro}</p>
      {kiosk.orderUrl && (
        <a className={shared.primaryButton} href={kiosk.orderUrl} target="_blank" rel="noreferrer">
          Bete eskaera-orria
        </a>
      )}
      <p className={`${shared.statusText} ${shared.section}`} style={{ marginTop: 'var(--space-4)' }}>
        {kiosk.orAskUs}{' '}
        {instagram && (
          <>
            <a className={shared.secondaryLink} href={instagram.url} target="_blank" rel="noreferrer">
              Instagram
            </a>
            {contact.email && ' · '}
          </>
        )}
        {contact.email && (
          <a className={shared.secondaryLink} href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        )}
      </p>
      <div className={shared.grid}>
        {merch.map((product) => (
          <article key={product.id} className={shared.card}>
            <ProductPhoto product={product} />
            <h3 className={shared.cardTitle}>{product.name}</h3>
            <p className={shared.statusText}>
              {product.priceLabel ?? 'Prezioa zehazteke'}
            </p>
            {product.ctaMode === 'externalLink' && product.ctaUrl ? (
              <a className={shared.secondaryLink} href={product.ctaUrl} target="_blank" rel="noreferrer">
                Erosi
              </a>
            ) : (
              <span className={shared.statusText}>Laster</span>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
