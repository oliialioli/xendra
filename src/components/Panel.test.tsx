import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Panel } from './Panel';

describe('Panel', () => {
  it('renders as an accessible dialog labelled by its title', () => {
    render(
      <Panel title="Música" onClose={() => {}}>
        <p>Contenido</p>
      </Panel>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Música' });
    expect(dialog).toBeInTheDocument();
  });

  it('calls onClose when the close button is activated', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Panel title="Música" onClose={onClose}>
        <p>Contenido</p>
      </Panel>,
    );

    await user.click(screen.getByRole('button', { name: 'Itxi' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Panel title="Música" onClose={onClose}>
        <p>Contenido</p>
      </Panel>,
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('moves initial focus inside the dialog', () => {
    render(
      <Panel title="Música" onClose={() => {}}>
        <button type="button">Otro botón</button>
      </Panel>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
