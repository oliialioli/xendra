import { readJSON, storageKey, writeJSON } from '../../lib/storage';

export type PublicNote = {
  id: string;
  authorName: string | null;
  message: string;
  createdAtIso: string;
};

export const NOTE_MESSAGE_MAX_LENGTH = 280;
export const NOTE_NAME_MAX_LENGTH = 40;

export type NoteValidationError = 'empty' | 'tooLong' | 'nameTooLong';

export function validateNoteInput(message: string, authorName: string): NoteValidationError | null {
  const trimmed = message.trim();
  if (trimmed.length === 0) return 'empty';
  if (trimmed.length > NOTE_MESSAGE_MAX_LENGTH) return 'tooLong';
  if (authorName.trim().length > NOTE_NAME_MAX_LENGTH) return 'nameTooLong';
  return null;
}

/** Strips control/markup characters; React already escapes text on render, this just keeps stored data plain. */
function sanitizePlainText(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}

/**
 * Notes are local-only in this phase (see prompt maestro §10.7) -- this interface
 * exists so a future API/CMS-backed, moderated implementation can be swapped in
 * without changing the panel UI.
 */
export interface PublicNotesRepository {
  list(): Promise<PublicNote[]>;
  add(input: { authorName: string; message: string }): Promise<PublicNote>;
}

const NOTES_KEY = storageKey('publicNotes');

export class LocalStoragePublicNotesRepository implements PublicNotesRepository {
  async list(): Promise<PublicNote[]> {
    const raw = readJSON<unknown>(NOTES_KEY, []);
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (item): item is PublicNote =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as PublicNote).id === 'string' &&
        typeof (item as PublicNote).message === 'string' &&
        typeof (item as PublicNote).createdAtIso === 'string',
    );
  }

  async add(input: { authorName: string; message: string }): Promise<PublicNote> {
    const error = validateNoteInput(input.message, input.authorName);
    if (error) throw new Error(error);

    const note: PublicNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      authorName: sanitizePlainText(input.authorName) || null,
      message: sanitizePlainText(input.message).slice(0, NOTE_MESSAGE_MAX_LENGTH),
      createdAtIso: new Date().toISOString(),
    };

    const existing = await this.list();
    const next = [note, ...existing].slice(0, 200);
    writeJSON(NOTES_KEY, next);
    return note;
  }
}
