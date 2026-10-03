import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { BoatDrawing } from './boatTypes';

const add = vi.fn();

// The real canvas needs pointer drawing (and a 2D context jsdom doesn't have):
// stand in a button that "draws" a two-point stroke.
vi.mock('./BoatDrawingCanvas', () => ({
  BoatDrawingCanvas: ({ onChange }: { onChange: (d: BoatDrawing) => void }) => (
    <button
      type="button"
      onClick={() =>
        onChange({
          version: 1,
          strokes: [{ color: '#232b21', size: 0.02, tool: 'pen', points: [{ x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }] }],
        })
      }
    >
      marraztu
    </button>
  ),
}));
vi.mock('./BoatPreview', () => ({ BoatPreview: () => <div data-testid="boat-preview" /> }));
vi.mock('./boatRepository', () => ({ getBoatRepository: () => ({ add }) }));

const { BoatCreator } = await import('./BoatCreator');

/** One of the two steps in the "1. Zure ontzia -> 2. Zure mezua" indicator. */
const stepItem = (label: string) => within(screen.getByRole('list', { name: 'Urratsak' })).getByText(label).closest('li');

function setup() {
  const onClose = vi.fn();
  const onBoatCreated = vi.fn();
  render(
    <MemoryRouter>
      <BoatCreator onClose={onClose} onBoatCreated={onBoatCreated} />
    </MemoryRouter>,
  );
  return { onClose, onBoatCreated, user: userEvent.setup() };
}

describe('BoatCreator', () => {
  it('starts on drawing the boat, with both steps shown and the first one current', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Zure mezua, ibaian barrena' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Marraztu zure ontzia' })).toBeInTheDocument();
    expect(stepItem('Zure ontzia')).toHaveAttribute('aria-current', 'step');
    expect(stepItem('Zure mezua')).not.toHaveAttribute('aria-current');
    // Nothing drawn yet: can't move on.
    expect(screen.getByRole('button', { name: 'Gehitu zure mezua' })).toBeDisabled();
  });

  it('goes on to the message with the boat drawn, and back to the drawing without losing the message', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'marraztu' }));
    await user.click(screen.getByRole('button', { name: 'Gehitu zure mezua' }));

    expect(screen.getByRole('heading', { name: 'Zer eramango du zure ontziak?' })).toBeInTheDocument();
    expect(stepItem('Zure mezua')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByTestId('boat-preview')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Zure mezua'), 'Kaixo Xendra!');
    await user.click(screen.getByRole('button', { name: 'Aldatu marrazkia' }));
    expect(screen.getByRole('heading', { name: 'Marraztu zure ontzia' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Gehitu zure mezua' }));
    expect(screen.getByLabelText('Zure mezua')).toHaveValue('Kaixo Xendra!');
  });

  it('sends the boat with its message, then closes', async () => {
    add.mockResolvedValueOnce({ id: 'b1', displayName: 'Ane', message: 'Kaixo Xendra!', drawing: { version: 1, strokes: [] }, createdAtIso: '' });
    const { user, onClose, onBoatCreated } = setup();
    await user.click(screen.getByRole('button', { name: 'marraztu' }));
    await user.click(screen.getByRole('button', { name: 'Gehitu zure mezua' }));
    await user.type(screen.getByLabelText('Zure mezua'), 'Kaixo Xendra!');
    await user.type(screen.getByLabelText('Izena (aukerakoa)'), 'Ane');
    await user.click(screen.getByRole('button', { name: 'Bota ontzia ibaira' }));

    expect(add).toHaveBeenCalledWith(expect.objectContaining({ message: 'Kaixo Xendra!', displayName: 'Ane' }));
    expect(onBoatCreated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('asks for a message before sending', async () => {
    add.mockClear();
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'marraztu' }));
    await user.click(screen.getByRole('button', { name: 'Gehitu zure mezua' }));
    await user.click(screen.getByRole('button', { name: 'Bota ontzia ibaira' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Idatzi mezu bat');
    expect(add).not.toHaveBeenCalled();
  });
});
