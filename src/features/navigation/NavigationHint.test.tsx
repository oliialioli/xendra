import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NavigationHint } from './NavigationHint';

describe('NavigationHint', () => {
  it('is exposed to the accessibility tree when open, with a labelled close button', () => {
    render(<NavigationHint open onDismiss={() => {}} />);

    expect(screen.getByRole('region', { name: 'Mapa arakatzeko gida' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Itxi nabigazio-gida' })).toBeInTheDocument();
    expect(screen.getByText('Arakatu mapa')).toBeInTheDocument();
  });

  it('is hidden from the accessibility tree when closed', () => {
    render(<NavigationHint open={false} onDismiss={() => {}} />);

    expect(screen.queryByRole('region', { name: 'Mapa arakatzeko gida' })).not.toBeInTheDocument();
  });

  it('calls onDismiss when the close button is activated', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<NavigationHint open onDismiss={onDismiss} />);

    await user.click(screen.getByRole('button', { name: 'Itxi nabigazio-gida' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('moves on to how to open a place once the player moves, then closes itself after a while', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<NavigationHint open onDismiss={onDismiss} />);

    // Within the grace period right after opening: a stray/held key changes nothing.
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(screen.getByText('Arakatu mapa')).toBeInTheDocument();

    vi.advanceTimersByTime(300);
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(screen.getByText('Sartu lekuetan')).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();

    vi.advanceTimersByTime(15000);
    expect(onDismiss).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('counts WASD as moving too', () => {
    vi.useFakeTimers();
    render(<NavigationHint open onDismiss={() => {}} />);
    vi.advanceTimersByTime(300);
    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByText('Sartu lekuetan')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('closes on Escape', () => {
    const onDismiss = vi.fn();
    render(<NavigationHint open onDismiss={onDismiss} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('ignores unrelated keys', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<NavigationHint open onDismiss={onDismiss} />);
    vi.advanceTimersByTime(300);

    fireEvent.keyDown(window, { key: 'x' });
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByText('Arakatu mapa')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
