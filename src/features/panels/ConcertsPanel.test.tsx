import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Concert } from '../../types/content';

describe('ConcertsPanel', () => {
  it('shows a curated empty state when there are no real concerts yet', async () => {
    vi.doMock('../../content/xendraContent', () => ({ xendraContent: { concerts: [] } }));
    const { ConcertsPanel } = await import('./ConcertsPanel');
    render(<ConcertsPanel />);
    expect(screen.getByText(/oraindik ez dago kontzerturik baieztatuta/i)).toBeInTheDocument();
    vi.doUnmock('../../content/xendraContent');
    vi.resetModules();
  });

  it('puts the snail at today, with concerts ahead of it in colour and passed ones in black and white', async () => {
    const concerts: Concert[] = [
      { id: 'c1', city: 'Uharte', venue: 'Plaza', date: '2026-12-01', time: '20:00', status: 'upcoming', ticketsUrl: null },
      // Still marked upcoming in the content, but its date is already over.
      { id: 'c2', city: 'Barakaldo', venue: '', date: '2026-09-26', time: null, status: 'upcoming', ticketsUrl: null },
      { id: 'c3', city: 'Iruña', venue: 'Zentroa', date: '2025-01-01', time: null, status: 'past', ticketsUrl: null },
    ];
    vi.doMock('../../content/xendraContent', () => ({ xendraContent: { concerts } }));
    const { ConcertsPanel } = await import('./ConcertsPanel');
    render(<ConcertsPanel now={new Date(2026, 9, 2)} />);

    const stops = screen.getAllByRole('listitem');
    const order = stops.map((li) => li.textContent ?? '');
    const nowIndex = order.findIndex((text) => text === 'Gaur');
    expect(order.findIndex((text) => text.includes('Uharte'))).toBeLessThan(nowIndex);
    expect(order.findIndex((text) => text.includes('Barakaldo'))).toBeGreaterThan(nowIndex);
    expect(order.findIndex((text) => text.includes('Iruña'))).toBeGreaterThan(nowIndex);

    const stopOf = (city: string) => screen.getByText(city).closest('li')!;
    expect(stopOf('Uharte')).not.toHaveAttribute('data-past');
    expect(stopOf('Barakaldo')).toHaveAttribute('data-past');
    expect(screen.queryByText('Kontzertu berriak laster!')).not.toBeInTheDocument();

    vi.doUnmock('../../content/xendraContent');
    vi.resetModules();
  });

  it('notes when every known concert is already past', async () => {
    const concerts: Concert[] = [
      { id: 'c1', city: 'Iruña', venue: 'Zentroa', date: '2026-01-01', time: null, status: 'past', ticketsUrl: null },
    ];
    vi.doMock('../../content/xendraContent', () => ({ xendraContent: { concerts } }));
    const { ConcertsPanel } = await import('./ConcertsPanel');
    render(<ConcertsPanel now={new Date(2026, 9, 2)} />);

    expect(screen.getByText('Kontzertu berriak laster!')).toBeInTheDocument();
    expect(screen.getByText('Gaur')).toBeInTheDocument();
    expect(screen.getByText('Iruña').closest('li')).toHaveAttribute('data-past');

    vi.doUnmock('../../content/xendraContent');
    vi.resetModules();
  });
});
