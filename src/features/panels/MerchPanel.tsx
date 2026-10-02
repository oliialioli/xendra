import { xendraContent } from '../../content/xendraContent';
import { assetPath } from '../../lib/assetPath';
import shared from './panelShared.module.css';

/** Mail to the band about one product, with its name already in the subject. */
function askUsHref(email: string, productName: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(`Denda: ${productName}`)}`;
}

export function MerchPanel() {
  const { kiosk, merch, contact } = xendraContent;
  const instagram = contact.socialLinks.find((link) => link.label === 'Instagram');

  return (
    <div>
      <p className={shared.lead}>{kiosk.intro}</p>
      <p className={`${shared.statusText} ${shared.section}`}>
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
            {product.imagePath ? (
              <img
                src={assetPath(product.imagePath)}
                alt={product.name}
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-sand)',
                }}
              />
            )}
            <h3 className={shared.cardTitle}>{product.name}</h3>
            <p className={shared.statusText}>
              {product.priceLabel ?? 'Prezioa zehazteke'}
            </p>
            {product.ctaMode === 'externalLink' && product.ctaUrl ? (
              <a className={shared.secondaryLink} href={product.ctaUrl}>
                Ikusi dendan
              </a>
            ) : product.ctaMode === 'askUs' && contact.email ? (
              <a className={shared.secondaryLink} href={askUsHref(contact.email, product.name)}>
                Eskatu
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
