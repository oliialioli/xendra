import { xendraContent } from '../../content/xendraContent';
import shared from './panelShared.module.css';

export function MerchPanel() {
  const greeting = xendraContent.kiosk.greetingTodo;

  return (
    <div>
      <p className={shared.lead}>«Aupa, egun on!» ({greeting})</p>
      <div className={shared.grid}>
        {xendraContent.merch.map((product) => (
          <article key={product.id} className={shared.card}>
            {product.imagePath ? (
              <img
                src={product.imagePath}
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
            ) : (
              <span className={shared.statusText}>Laster</span>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
