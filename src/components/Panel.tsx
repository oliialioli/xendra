import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useFocusTrap } from './useFocusTrap';
import styles from './Panel.module.css';

export type PanelProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  variant?: 'side' | 'wide';
  /** Small glyph shown in the header's icon stamp (e.g. an emoji). Optional. */
  icon?: string;
};

/**
 * Shared panel shell used by every section (music, concerts, group...).
 * Desktop: a compact card anchored near the bottom-left, so the map stays
 * visible and stays the protagonist -- no full-screen dark backdrop, just an
 * invisible click-catcher behind it for "click outside to close". Mobile:
 * the same component becomes a bottom sheet (see Panel.module.css).
 * Handles focus trap, Escape-to-close, aria-labelledby, and scroll
 * containment, so each section only needs to provide a title and content.
 */
export function Panel({ title, onClose, children, variant = 'side', icon }: PanelProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <div
        ref={containerRef}
        className={`${styles.panel} ${variant === 'wide' ? styles.wide : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          {icon && (
            <span className={styles.iconStamp} aria-hidden="true">
              {icon}
            </span>
          )}
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className="xnd-btn-icon"
            onClick={onClose}
            aria-label="Itxi"
            title="Itxi"
          >
            ✕
          </button>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </>
  );
}
