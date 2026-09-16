import { useId, useState } from 'react';
import { BOAT_MESSAGE_MAX_LENGTH, BOAT_NAME_MAX_LENGTH, validateBoatMessageInput } from './boatValidation';
import shared from '../panels/panelShared.module.css';
import styles from './MessageStep.module.css';

const ERROR_MESSAGES: Record<string, string> = {
  messageEmpty: 'Idatzi mezu bat aurrera egin baino lehen.',
  messageTooLong: `Mezuak ezin ditu ${BOAT_MESSAGE_MAX_LENGTH} karaktere baino gehiago izan.`,
  messageHasLink: 'Mezuak ezin du estekarik izan.',
  nameTooLong: `Izenak ezin ditu ${BOAT_NAME_MAX_LENGTH} karaktere baino gehiago izan.`,
};

/**
 * Copy translated to Basque to match the rest of the site (every other
 * string in the app is Basque, even though requests arrive in Spanish) --
 * literal Spanish source from the brief: title "Deja tu mensaje", optional
 * field "Tu nombre", required field "Escribe algo para Xendra", CTA
 * "Siguiente".
 */

export type MessageStepProps = {
  displayName: string;
  message: string;
  onDisplayNameChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onNext: () => void;
};

/** Step 1 of the boat creator: the text form -- see BoatCreator for the surrounding two-step wizard. */
export function MessageStep({ displayName, message, onDisplayNameChange, onMessageChange, onNext }: MessageStepProps) {
  const formId = useId();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validateBoatMessageInput(message, displayName);
    if (validationError) {
      setError(ERROR_MESSAGES[validationError]);
      return;
    }
    setError(null);
    onNext();
  }

  const over = message.length > BOAT_MESSAGE_MAX_LENGTH;

  return (
    <form className={shared.form} onSubmit={handleSubmit} noValidate>
      <h3 className={styles.title}>Idatzi zure mezua</h3>

      <div className={shared.field}>
        <label htmlFor={`${formId}-name`}>Izena (aukerakoa)</label>
        <input
          id={`${formId}-name`}
          value={displayName}
          maxLength={BOAT_NAME_MAX_LENGTH}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className={shared.field}>
        <label htmlFor={`${formId}-message`}>Idatzi zerbait Xendrarentzat</label>
        <textarea
          id={`${formId}-message`}
          rows={4}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${formId}-error` : `${formId}-counter`}
          required
        />
        <div className={styles.counterRow}>
          <span id={`${formId}-counter`} className={styles.counter} data-over={over}>
            {message.length}/{BOAT_MESSAGE_MAX_LENGTH}
          </span>
        </div>
        {error && (
          <p id={`${formId}-error`} className={shared.errorText} role="alert">
            {error}
          </p>
        )}
      </div>

      <div className={styles.footer}>
        <button type="submit" className="xnd-btn-primary">
          Hurrengoa
        </button>
      </div>
    </form>
  );
}
