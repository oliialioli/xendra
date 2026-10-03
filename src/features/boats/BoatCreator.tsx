import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from '@phosphor-icons/react';
import { useFocusTrap } from '../../components/useFocusTrap';
import { MAP_ROUTE } from '../../app/routes';
import { MessageStep } from './MessageStep';
import { BoatDrawingCanvas } from './BoatDrawingCanvas';
import { BoatPreview } from './BoatPreview';
import { PaperBoatSketch } from './PaperBoatSketch';
import { compactDrawingToFit, createEmptyDrawing, isDrawingEmpty, validateDrawingSize } from './drawingUtils';
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

type Step = 'draw' | 'message';

const STEPS: { id: Step; label: string }[] = [
  { id: 'draw', label: 'Zure ontzia' },
  { id: 'message', label: 'Zure mezua' },
];

/** "1. Zure ontzia -> 2. Zure mezua", the current one highlighted. */
function StepIndicator({ step }: { step: Step }) {
  return (
    <ol className={styles.steps} aria-label="Urratsak">
      {STEPS.map((s, i) => (
        <li key={s.id} className={styles.stepItem} aria-current={s.id === step ? 'step' : undefined}>
          <span className={styles.stepNumber}>{i + 1}</span>
          {s.label}
          {i < STEPS.length - 1 && (
            <span className={styles.stepArrow} aria-hidden="true">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

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
 * The dock landmark's own two-step experience: draw a paper boat first (the
 * creative part, right on the first screen), then write the message it will
 * carry and send it down the river -- see docs/BOATS.md for the full feature
 * overview. Going back to the drawing keeps the message, and vice versa.
 * Centered modal on desktop, near-fullscreen on mobile (see
 * BoatCreator.module.css); the map behind it is already blocked by
 * MapLayout's normal controlsBlocked mechanism (this route is still a
 * regular PANEL_ROUTES entry, just rendered directly instead of wrapped in
 * the generic <Panel>).
 */
export function BoatCreator({ onClose, onBoatCreated }: BoatCreatorProps) {
  const navigate = useNavigate();
  const handleClose = onClose ?? (() => navigate(MAP_ROUTE));

  const [step, setStep] = useState<Step>('draw');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [drawing, setDrawing] = useState<BoatDrawing>(() => createEmptyDrawing());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true);

  // Each step starts from its top. Nothing is focused on the way in: on a
  // phone that would open the keyboard over the step before it's been seen --
  // the keyboard only comes up when a field is tapped.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [step]);

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
      setStep('draw');
      return;
    }
    // Stored compacted (simplified strokes, rounded coordinates) so a
    // detailed drawing still fits the size limits instead of being refused.
    const compactDrawing = compactDrawingToFit(drawing);
    const sizeError = validateDrawingSize(compactDrawing);
    if (sizeError) {
      setSubmitError(SUBMIT_ERROR_MESSAGES[sizeError]);
      setStep('draw');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const repository = getBoatRepository();
      const boat = await repository.add({
        displayName: displayName.trim() || null,
        message: message.trim(),
        drawing: compactDrawing,
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

  const drawingEmpty = isDrawingEmpty(drawing);

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
          <div className={styles.heading}>
            <h2 id="boat-creator-title" className={styles.title}>
              Zure mezua, ibaian barrena
            </h2>
            <p className={styles.subtitle}>Marraztu paperezko ontzi bat, idatzi Xendrarentzako mezua eta bota ibaira.</p>
          </div>
          <button type="button" className="xnd-btn-icon" onClick={handleClose} aria-label="Itxi" title="Itxi">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <StepIndicator step={step} />

        <div ref={bodyRef} className={styles.body}>
          {step === 'draw' ? (
            <div className={styles.drawStep}>
              <div className={styles.reference}>
                <PaperBoatSketch className={styles.referenceSketch} />
                <div>
                  <h3 className={styles.stepTitle}>Marraztu zure ontzia</h3>
                  <p className={styles.stepText}>Ontzi honek zure mezua eramango du Arga ibaian barrena.</p>
                </div>
              </div>
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
                  onClick={() => {
                    setSubmitError(null);
                    setStep('message');
                  }}
                  disabled={drawingEmpty}
                >
                  Gehitu zure mezua
                </button>
              </div>
            </div>
          ) : (
            <MessageStep
              drawing={drawing}
              displayName={displayName}
              message={message}
              onDisplayNameChange={setDisplayName}
              onMessageChange={setMessage}
              onEditDrawing={() => {
                setSubmitError(null);
                setStep('draw');
              }}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitError={submitError}
            />
          )}
        </div>
      </div>
    </>
  );
}
