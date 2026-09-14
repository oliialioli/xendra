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

  it('splits concerts into an upcoming timeline and a quieter past section', async () => {
    const concerts: Concert[] = [
      { id: 'c1', city: 'Uharte', venue: 'Plaza', date: '2026-12-01', time: '20:00', status: 'upcoming', ticketsUrl: null },
      { id: 'c2', city: 'Iruña', venue: 'Zentroa', date: '2026-01-01', time: null, status: 'past', ticketsUrl: null },
    ];
    vi.doMock('../../content/xendraContent', () => ({ xendraContent: { concerts } }));
    const { ConcertsPanel } = await import('./ConcertsPanel');
    render(<ConcertsPanel />);

    expect(screen.getByText('Uharte')).toBeInTheDocument();
    expect(screen.getByText('Iruña')).toBeInTheDocument();
    expect(screen.getByText('Iraganeko kontzertuak')).toBeInTheDocument();
    expect(screen.queryByText('Oraindik ez dago hurrengo kontzerturik iragarrita.')).not.toBeInTheDocument();

    vi.doUnmock('../../content/xendraContent');
    vi.resetModules();
  });

  it('notes when every known concert is already past', async () => {
    const concerts: Concert[] = [
      { id: 'c1', city: 'Iruña', venue: 'Zentroa', date: '2026-01-01', time: null, status: 'past', ticketsUrl: null },
    ];
    vi.doMock('../../content/xendraContent', () => ({ xendraContent: { concerts } }));
    const { ConcertsPanel } = await import('./ConcertsPanel');
    render(<ConcertsPanel />);

    expect(screen.getByText(/oraindik ez dago hurrengo kontzerturik iragarrita/i)).toBeInTheDocument();
    expect(screen.getByText('Iraganeko kontzertuak')).toBeInTheDocument();
    expect(screen.getByText('Iruña')).toBeInTheDocument();

    vi.doUnmock('../../content/xendraContent');
    vi.resetModules();
  });
});
