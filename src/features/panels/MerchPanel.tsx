import { useState } from 'react';
import { MagnifyingGlassPlus } from '@phosphor-icons/react';
import type { MediaItem, MerchProduct } from '../../types/content';
import { MediaLightbox } from './MediaLightbox';
import { xendraContent } from '../../content/xendraContent';
import { assetPath } from '../../lib/assetPath';
import shared from './panelShared.module.css';
import styles from './MerchPanel.module.css';

/**
 * The product photo. Pressing it opens it large (MediaLightbox), together
 * with its close-up when it has one, to step between. With a mouse, hovering
 * it already fades the close-up in -- and opens on that one.
 */
function ProductPhoto({ product }: { product: MerchProduct }) {
  const [hovering, setHovering] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!product.imagePath) return <div aria-hidden="true" className={styles.photo} />;

  const views: MediaItem[] = [
    {
      id: `${product.id}-photo`,
      kind: 'photo',
      thumbnailPath: null,
      fullPath: product.imagePath,
      altText: product.name,
    },
    ...(product.detailImagePath
      ? [
          {
            id: `${product.id}-detail`,
            kind: 'photo' as const,
            thumbnailPath: null,
            fullPath: product.detailImagePath,
            altText: `${product.name}: xehetasuna`,
          },
        ]
      : []),
  ];
  const hasDetail = views.length > 1;

  return (
    <>
      <button
        type="button"
        className={styles.photo}
        data-detail={(hasDetail && hovering) || undefined}
        aria-label={`${product.name}: ikusi handian`}
        onClick={() => setOpenIndex(hasDetail && hovering ? 1 : 0)}
        // Only a real mouse hovers: phones send these around a tap too.
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') setHovering(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') setHovering(false);
        }}
      >
        <img className={styles.image} src={assetPath(product.imagePath)} alt={product.name} />
        {hasDetail && <img className={`${styles.image} ${styles.detail}`} src={assetPath(views[1].fullPath!)} alt="" />}
        <span className={styles.zoomHint} aria-hidden="true">
          <MagnifyingGlassPlus size={18} weight="bold" />
        </span>
      </button>
      {openIndex !== null && (
        <MediaLightbox
          items={views}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
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
