import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageBoatRepository } from './boatRepository';
import { createStroke } from './drawingUtils';
import type { BoatDrawing } from './boatTypes';

function validDrawing(): BoatDrawing {
  const stroke = createStroke('#3a3530', 0.02, 'pen');
  stroke.points.push({ x: 0.2, y: 0.2 }, { x: 0.4, y: 0.4 }, { x: 0.6, y: 0.3 });
  return { version: 1, strokes: [stroke] };
}

describe('LocalStorageBoatRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty', async () => {
    const repo = new LocalStorageBoatRepository();
    expect(await repo.list()).toEqual([]);
  });

  it('inserts a boat and returns it from list()', async () => {
    const repo = new LocalStorageBoatRepository();
    const boat = await repo.add({ displayName: 'Ane', message: 'Kaixo Xendra!', drawing: validDrawing() });

    expect(boat.id).toBeTruthy();
    expect(boat.displayName).toBe('Ane');
    expect(boat.message).toBe('Kaixo Xendra!');

    const listed = await repo.list();
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(boat.id);
  });

  it('defaults a blank name to null (rendered as "Anonimoa" by the UI)', async () => {
    const repo = new LocalStorageBoatRepository();
    const boat = await repo.add({ displayName: '', message: 'Mezu anonimoa', drawing: validDrawing() });
    expect(boat.displayName).toBeNull();
  });

  it('notifies a subscriber synchronously when a boat is inserted', async () => {
    const repo = new LocalStorageBoatRepository();
    const onInsert = vi.fn();
    const unsubscribe = repo.subscribe({ onInsert, onDelete: vi.fn() });

    await repo.add({ displayName: null, message: 'Kaixo!', drawing: validDrawing() });
    expect(onInsert).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('rejects an empty message', async () => {
    const repo = new LocalStorageBoatRepository();
    await expect(repo.add({ displayName: null, message: '   ', drawing: validDrawing() })).rejects.toThrow();
  });

  it('rejects an empty drawing', async () => {
    const repo = new LocalStorageBoatRepository();
    await expect(
      repo.add({ displayName: null, message: 'Mezu ona', drawing: { version: 1, strokes: [] } }),
    ).rejects.toThrow('drawingEmpty');
  });

  it('rejects a message containing a link', async () => {
    const repo = new LocalStorageBoatRepository();
    await expect(
      repo.add({ displayName: null, message: 'ikusi https://spam.test', drawing: validDrawing() }),
    ).rejects.toThrow('messageHasLink');
  });
});
