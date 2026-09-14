import { beforeEach, describe, expect, it } from 'vitest';
import {
  LocalStoragePublicNotesRepository,
  NOTE_MESSAGE_MAX_LENGTH,
  validateNoteInput,
} from './PublicNotesRepository';

describe('validateNoteInput', () => {
  it('rejects an empty message', () => {
    expect(validateNoteInput('   ', 'Ana')).toBe('empty');
  });

  it('rejects a message over the max length', () => {
    expect(validateNoteInput('a'.repeat(NOTE_MESSAGE_MAX_LENGTH + 1), '')).toBe('tooLong');
  });

  it('accepts a valid message with no name', () => {
    expect(validateNoteInput('Hola Xendra', '')).toBeNull();
  });
});

describe('LocalStoragePublicNotesRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores and lists a valid note', async () => {
    const repo = new LocalStoragePublicNotesRepository();
    const note = await repo.add({ authorName: 'Ana', message: 'Qué buena isla' });

    expect(note.message).toBe('Qué buena isla');

    const all = await repo.list();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(note.id);
  });

  it('rejects an empty message without writing to storage', async () => {
    const repo = new LocalStoragePublicNotesRepository();
    await expect(repo.add({ authorName: '', message: '   ' })).rejects.toThrow();
    expect(await repo.list()).toHaveLength(0);
  });

  it('strips markup from stored notes', async () => {
    const repo = new LocalStoragePublicNotesRepository();
    const note = await repo.add({ authorName: '', message: '<script>alert(1)</script>Hola' });
    expect(note.message).toBe('alert(1)Hola');
  });
});
