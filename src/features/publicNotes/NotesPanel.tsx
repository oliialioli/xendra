import { useEffect, useId, useState, type FormEvent } from 'react';
import {
  LocalStoragePublicNotesRepository,
  NOTE_MESSAGE_MAX_LENGTH,
  NOTE_NAME_MAX_LENGTH,
  validateNoteInput,
  type PublicNote,
} from './PublicNotesRepository';
import { EmptyState } from '../../components/EmptyState';
import shared from '../panels/panelShared.module.css';

const repository = new LocalStoragePublicNotesRepository();

const ERROR_MESSAGES: Record<string, string> = {
  empty: 'Idatzi mezu bat esekitzen utzi aurretik.',
  tooLong: `Mezuak ezin ditu ${NOTE_MESSAGE_MAX_LENGTH} karaktere baino gehiago izan.`,
  nameTooLong: `Izenak ezin ditu ${NOTE_NAME_MAX_LENGTH} karaktere baino gehiago izan.`,
};

export function NotesPanel() {
  const formId = useId();
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    repository.list().then(setNotes);
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validation = validateNoteInput(message, authorName);
    if (validation) {
      setError(ERROR_MESSAGES[validation]);
      return;
    }
    setError(null);
    const note = await repository.add({ authorName, message });
    setNotes((prev) => [note, ...prev]);
    setMessage('');
  }

  return (
    <div>
      <p className={shared.lead}>
        Ohar hauek zure nabigatzailean bakarrik gordetzen dira proiektuaren fase honetan.
        Oraindik ez dira publikoak: ez dira zerbitzari batera bidaltzen.
      </p>

      <form className={shared.form} onSubmit={handleSubmit}>
        <div className={shared.field}>
          <label htmlFor={`${formId}-name`}>Izena (aukerakoa)</label>
          <input
            id={`${formId}-name`}
            value={authorName}
            maxLength={NOTE_NAME_MAX_LENGTH}
            onChange={(e) => setAuthorName(e.target.value)}
          />
        </div>
        <div className={shared.field}>
          <label htmlFor={`${formId}-message`}>Mezua</label>
          <textarea
            id={`${formId}-message`}
            rows={3}
            maxLength={NOTE_MESSAGE_MAX_LENGTH}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${formId}-error` : undefined}
          />
          {error && (
            <p id={`${formId}-error`} className={shared.errorText}>
              {error}
            </p>
          )}
        </div>
        <button type="submit" className={shared.primaryButton}>
          Zintzilikatu oharra
        </button>
      </form>

      <div className={shared.section} style={{ marginTop: 'var(--space-5)' }}>
        {notes.length === 0 ? (
          <EmptyState title="Oraindik ez dago ohar lokalik">
            Izan frontoian mezu bat uzten duen lehen pertsona.
          </EmptyState>
        ) : (
          <ul className={shared.list}>
            {notes.map((note) => (
              <li key={note.id} className={shared.listItem}>
                <p>{note.message}</p>
                <p className={shared.statusText}>
                  {note.authorName ?? 'Anonimoa'} ·{' '}
                  {new Date(note.createdAtIso).toLocaleDateString('eu-ES')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
