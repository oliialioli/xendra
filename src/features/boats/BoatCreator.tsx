import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../../components/useFocusTrap';
import { MAP_ROUTE } from '../../app/routes';
import { MessageStep } from './MessageStep';
import { BoatDrawingCanvas } from './BoatDrawingCanvas';
import { BoatPreview } from './BoatPreview';
import { createEmptyDrawing, isDrawingEmpty, validateDrawingSize } from './drawingUtils';
import { validateBoatMessageInput } from './boatValidation';
import { getBoatRepository } from './boatRepository';
import type { BoatDrawing, Boat } from './boatTypes';
import styles from './BoatCreator.module.css';

export type BoatCreatorProps = {
  /** Defaults to navigating back to the map route -- see routes.ts's own note on why this entry is special-cased. */
  onClose?: () => void;
  /** Called right after a successful save, before closing -- see MapLayout, which uses this to add the boat locally and show the non-blocking confirmation. */
  onBoatCreated?: (boat: Boat) => void;
};

type Step = 'message' | 'draw';

const SUBMIT_ERROR_MESSAGES: Record<string, string> = {
  messageEmpty: 'Idatzi mezu bat aurrera egin baino lehen.',
  messageTooLong: 'Mezua luzeegia da.',
  messageHasLink: 'Mezuak ezin du estekarik izan.',
  nameTooLong: 'Izena luzeegia da.',
  drawingEmpty: 'Marraztu zerbait ontzia bidali aurretik.',
  tooManyStrokes: 'Marrazkiak trazu gehiegi ditu.',
  tooManyPoints: 'Marrazkiak puntu gehiegi ditu.',
  tooLarge: 'Marrazkia handiegia da.',
};
const GENERIC_SUBMIT_ERROR = 'Ezin izan da ontzia gorde. Egiaztatu konexioa eta saiatu berriro.';

/**
 * The dock landmark's own two-step experience: write a message, then draw a
 * boat and send it -- see docs/BOATS.md for the full feature overview.
 * Centered modal on desktop, near-fullscreen on mobile (see
 * BoatCreator.module.css); the map behind it is already blocked by
 * MapLayout's normal controlsBlocked mechanism (this route is still a
 * regular PANEL_ROUTES entry, just rendered directly instead of wrapped in
 * the generic <Panel>).
 */
export function BoatCreator({ onClose, onBoatCreated }: BoatCreatorProps) {
  const navigate = useNavigate();
  const handleClose = onClose ?? (() => navigate(MAP_ROUTE));

  const [step, setStep] = useState<Step>('message');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [drawing, setDrawing] = useState<BoatDrawing>(() => createEmptyDrawing());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleClose is stable enough per render; re-binding every render is unnecessary
  }, []);

  async function handleSubmit() {
    if (submitting) return; // guards against a double-tap firing two inserts

    // Defensive re-validation -- step 1 already checked the text, the canvas
    // already disables the CTA while empty, but both are re-checked here
    // right before the actual write, same as boatRepository's own adapters do.
    const messageError = validateBoatMessageInput(message, displayName);
    if (messageError) {
      setSubmitError(SUBMIT_ERROR_MESSAGES[messageError]);
      setStep('message');
      return;
    }
    if (isDrawingEmpty(drawing)) {
      setSubmitError(SUBMIT_ERROR_MESSAGES.drawingEmpty);
      return;
    }
    const sizeError = validateDrawingSize(drawing);
    if (sizeError) {
      setSubmitError(SUBMIT_ERROR_MESSAGES[sizeError]);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const repository = getBoatRepository();
      const boat = await repository.add({
        displayName: displayName.trim() || null,
        message: message.trim(),
        drawing,
      });
      // Drawing/message are only ever cleared on success -- a failed save
      // (below) must leave both exactly as the person left them.
      onBoatCreated?.(boat);
      handleClose();
    } catch (error) {
      const key = error instanceof Error ? error.message : '';
      setSubmitError(SUBMIT_ERROR_MESSAGES[key] ?? GENERIC_SUBMIT_ERROR);
      setSubmitting(false);
    }
  }

  const canSubmit = !isDrawingEmpty(drawing) && !submitting;

  return (
    <>
      <div className={styles.scrim} onClick={handleClose} />
      <div
        ref={containerRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="boat-creator-title"
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2 id="boat-creator-title" className={styles.title}>
            {step === 'message' ? 'Mezuen kaia' : 'Marraztu zure ontzi papera'}
          </h2>
          <button type="button" className="xnd-btn-icon" onClick={handleClose} aria-label="Itxi" title="Itxi">
            ✕
          </button>
        </header>

        <div className={styles.body}>
          {step === 'message' ? (
            <MessageStep
              displayName={displayName}
              message={message}
              onDisplayNameChange={setDisplayName}
              onMessageChange={setMessage}
              onNext={() => setStep('draw')}
            />
          ) : (
            <div className={styles.drawStep}>
              <p className={styles.helpText}>Eskuinera begira →</p>
              <div className={styles.canvasArea}>
                <BoatDrawingCanvas drawing={drawing} onChange={setDrawing} />
              </div>
              {submitError && (
                <p className={styles.errorText} role="alert">
                  {submitError}
                </p>
              )}
              <div className={styles.drawFooter}>
                <BoatPreview drawing={drawing} />
                <button
                  type="button"
                  className="xnd-btn-primary"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  aria-busy={submitting}
                >
                  {submitting ? 'Bidaltzen...' : 'Bota ibaira'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
