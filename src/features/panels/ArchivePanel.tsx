import { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    if (openIndex === null) return undefined;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenIndex(null);
      } else if (event.key === 'ArrowRight') {
        setOpenIndex((i) => (i === null ? null : Math.min(i + 1, items.length - 1)));
      } else if (event.key === 'ArrowLeft') {
        setOpenIndex((i) => (i === null ? null : Math.max(i - 1, 0)));
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openIndex, items.length]);

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
            style={{ position: 'relative', padding: 0, overflow: 'hidden' }}
            onClick={() => setOpenIndex(index)}
            aria-label={`Ireki ${item.altText}`}
          >
            {item.thumbnailPath ? (
              <img
                src={assetPath(item.thumbnailPath)}
                alt={item.altText}
                loading="lazy"
                style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{ width: '100%', aspectRatio: '4 / 3', background: 'var(--color-sand)' }}
              />
            )}
            {item.kind === 'video' && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgb(0 0 0 / 45%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                  }}
                >
                  ▶
                </span>
              </span>
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
        >
          {openIndex !== null && openIndex > 0 && (
            <button
              type="button"
              className="xnd-btn-icon"
              aria-label="Aurrekoa"
              style={{ position: 'absolute', left: 'var(--space-4)' }}
              onClick={(event) => {
                event.stopPropagation();
                setOpenIndex((i) => (i === null ? null : Math.max(i - 1, 0)));
              }}
            >
              ‹
            </button>
          )}

          {openItem.kind === 'video' && openItem.fullPath ? (
            <video
              src={assetPath(openItem.fullPath)}
              poster={openItem.thumbnailPath ? assetPath(openItem.thumbnailPath) : undefined}
              controls
              autoPlay
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
              onClick={(event) => event.stopPropagation()}
            />
          ) : (
            <img
              src={assetPath(openItem.fullPath ?? openItem.thumbnailPath ?? '')}
              alt={openItem.altText}
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
              onClick={(event) => event.stopPropagation()}
            />
          )}

          {openIndex !== null && openIndex < items.length - 1 && (
            <button
              type="button"
              className="xnd-btn-icon"
              aria-label="Hurrengoa"
              style={{ position: 'absolute', right: 'var(--space-4)' }}
              onClick={(event) => {
                event.stopPropagation();
                setOpenIndex((i) => (i === null ? null : Math.min(i + 1, items.length - 1)));
              }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}
