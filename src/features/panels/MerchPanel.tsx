import { useMemo, useRef, useState } from 'react';
import { MagnifyingGlassPlus } from '@phosphor-icons/react';
import type { MediaItem, MerchProduct } from '../../types/content';
import { MediaLightbox } from './MediaLightbox';
import { xendraContent } from '../../content/xendraContent';
import { assetPath } from '../../lib/assetPath';
import shared from './panelShared.module.css';
import styles from './MerchPanel.module.css';

/**
 * The product photo. With more than one, they sit side by side in a strip
 * that scrolls sideways (a swipe, or a trackpad's sideways scroll), snapping
 * photo by photo, with dots saying which is showing; pressing one opens it
 * large (MediaLightbox), to carry on stepping through there.
 */
function ProductPhoto({ product }: { product: MerchProduct }) {
  const [index, setIndex] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const views = useMemo<MediaItem[]>(
    () =>
      product.imagePath
        ? [
            { id: `${product.id}-photo`, kind: 'photo', thumbnailPath: null, fullPath: product.imagePath, altText: product.name },
            ...(product.views ?? []).map((view, i) => ({
              id: `${product.id}-view-${i}`,
              kind: 'photo' as const,
              thumbnailPath: null,
              fullPath: view.path,
              altText: view.altText,
            })),
          ]
        : [],
    [product],
  );

  if (views.length === 0) return <div aria-hidden="true" className={styles.photo} />;

  return (
    <div className={styles.photo}>
      <div
        ref={stripRef}
        className={styles.strip}
        onScroll={(event) => {
          const strip = event.currentTarget;
          setIndex(Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth)));
        }}
      >
        {views.map((view, i) => (
          <button
            key={view.id}
            type="button"
            className={styles.slide}
            aria-label={`${view.altText}: ikusi handian`}
            onClick={() => setOpenIndex(i)}
          >
            <img className={styles.image} src={assetPath(view.fullPath!)} alt={view.altText} loading={i === 0 ? undefined : 'lazy'} />
          </button>
        ))}
      </div>

      {views.length > 1 && (
        <span className={styles.dots} aria-hidden="true">
          {views.map((view, i) => (
            <span key={view.id} className={styles.dot} data-current={i === index || undefined} />
          ))}
        </span>
      )}

      <span className={styles.zoomHint} aria-hidden="true">
        <MagnifyingGlassPlus size={18} weight="bold" />
      </span>

      {openIndex !== null && (
        <MediaLightbox
          items={views}
          index={openIndex}
          onIndexChange={(i) => {
            setOpenIndex(i);
            // The card follows along, so closing leaves it on the same photo.
            const strip = stripRef.current;
            strip?.scrollTo({ left: i * strip.clientWidth });
          }}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
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
