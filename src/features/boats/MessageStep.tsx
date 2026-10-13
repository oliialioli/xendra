import { useId, useState } from 'react';
import { PencilSimple } from '@phosphor-icons/react';
import { BOAT_MESSAGE_MAX_LENGTH, BOAT_NAME_MAX_LENGTH, validateBoatMessageInput } from './boatValidation';
import { BoatPreview } from './BoatPreview';
import type { BoatDrawing } from './boatTypes';
import { useT } from '../../i18n/LanguageContext';
import { msg } from '../../i18n/translate';
import shared from '../panels/panelShared.module.css';
import styles from './MessageStep.module.css';

const ERROR_MESSAGES: Record<string, string> = {
  messageEmpty: msg('Idatzi mezu bat aurrera egin baino lehen.'),
  messageTooLong: msg('Mezuak ezin ditu {max} karaktere baino gehiago izan.'),
  messageHasLink: msg('Mezuak ezin du estekarik izan.'),
  nameTooLong: msg('Izenak ezin ditu {max} karaktere baino gehiago izan.'),
};
/** What `{max}` stands for in each. */
const ERROR_LIMITS: Record<string, number> = { messageTooLong: BOAT_MESSAGE_MAX_LENGTH, nameTooLong: BOAT_NAME_MAX_LENGTH };

export type MessageStepProps = {
  /** The boat just drawn, shown small beside the form: this is what will carry the message. */
  drawing: BoatDrawing;
  displayName: string;
  message: string;
  onDisplayNameChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  /** Back to step 1; the message typed so far is kept (it lives in BoatCreator). */
  onEditDrawing: () => void;
  /** Validated here first, then sends the boat (see BoatCreator.handleSubmit). */
  onSubmit: () => void;
  submitting: boolean;
  /** A failure from actually saving the boat, shown above the button. */
  submitError: string | null;
};

/** Step 2 of the boat creator: the message the boat will carry -- see BoatCreator for the surrounding two-step flow. */
export function MessageStep({
  drawing,
  displayName,
  message,
  onDisplayNameChange,
  onMessageChange,
  onEditDrawing,
  onSubmit,
  submitting,
  submitError,
}: MessageStepProps) {
  const formId = useId();
  const t = useT();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validateBoatMessageInput(message, displayName);
    if (validationError) {
      setError(t(ERROR_MESSAGES[validationError], { max: ERROR_LIMITS[validationError] ?? 0 }));
      return;
    }
    setError(null);
    onSubmit();
  }

  const over = message.length > BOAT_MESSAGE_MAX_LENGTH;

  return (
    <form className={shared.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.boatRow}>
        <BoatPreview drawing={drawing} size="large" />
        <div>
          <h3 className={styles.title}>{t('Zer eramango du zure ontziak?')}</h3>
          <p className={styles.intro}>{t('Idatzi Xendrari esan nahi diozuna eta utzi ibaiari eramaten.')}</p>
          <button type="button" className={styles.editDrawing} onClick={onEditDrawing}>
            <PencilSimple size={16} aria-hidden="true" />
            {t('Aldatu marrazkia')}
          </button>
        </div>
      </div>

      <div className={shared.field}>
        <label htmlFor={`${formId}-message`}>{t('Zure mezua')}</label>
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

      <div className={shared.field}>
        <label htmlFor={`${formId}-name`}>{t('Izena (aukerakoa)')}</label>
        <input
          id={`${formId}-name`}
          value={displayName}
          maxLength={BOAT_NAME_MAX_LENGTH}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          autoComplete="off"
        />
      </div>

      {submitError && (
        <p className={shared.errorText} role="alert">
          {t(submitError)}
        </p>
      )}

      <div className={styles.footer}>
        <button type="submit" className="xnd-btn-primary" disabled={submitting} aria-busy={submitting}>
          {submitting ? t('Bidaltzen...') : t('Bota ontzia ibaira')}
        </button>
      </div>
    </form>
  );
}
