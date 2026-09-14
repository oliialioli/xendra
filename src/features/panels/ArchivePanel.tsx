import { useMemo, useState } from 'react';
import { xendraContent } from '../../content/xendraContent';
import { EmptyState } from '../../components/EmptyState';
import { assetPath } from '../../lib/assetPath';
import shared from './panelShared.module.css';

type Filter = 'all' | 'photo' | 'video';

export function ArchivePanel() {
  const [filter, setFilter] = useState<Filter>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = useMemo(
    () => xendraContent.media.filter((item) => filter === 'all' || item.kind === filter),
    [filter],
  );

  if (xendraContent.media.length === 0) {
    return (
      <EmptyState title="Artxiboa oraindik hutsik dago">
        Oraindik ez dago erakusteko argazki edo bideo errealik. Itzuli aurrerago.
      </EmptyState>
    );
  }

  const openItem = openIndex !== null ? items[openIndex] : null;

  return (
    <div>
      <div
        role="group"
        aria-label="Iragazi artxiboa"
        className={`xnd-control-module ${shared.section}`}
      >
        {(['all', 'photo', 'video'] as Filter[]).map((option) => (
          <button
            key={option}
            type="button"
            className="xnd-btn-icon"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
          >
            {option === 'all' ? 'Guztiak' : option === 'photo' ? 'Argazkiak' : 'Bideoak'}
          </button>
        ))}
      </div>

      <div className={shared.grid}>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={shared.card}
            onClick={() => setOpenIndex(index)}
            aria-label={`Ireki ${item.altText}`}
          >
            {item.thumbnailPath ? (
              <img src={assetPath(item.thumbnailPath)} alt={item.altText} loading="lazy" />
            ) : (
              <div
                aria-hidden="true"
                style={{ width: '100%', aspectRatio: '4 / 3', background: 'var(--color-sand)' }}
              />
            )}
          </button>
        ))}
      </div>

      {openItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={openItem.altText}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setOpenIndex(null)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpenIndex(null);
          }}
        >
          <img
            src={assetPath(openItem.fullPath ?? openItem.thumbnailPath ?? '')}
            alt={openItem.altText}
            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
          />
        </div>
      )}
    </div>
  );
}
