import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConcertsPanel } from './ConcertsPanel';

describe('ConcertsPanel', () => {
  it('shows a curated empty state when there are no real concerts yet', () => {
    render(<ConcertsPanel />);
    expect(screen.getByText(/oraindik ez dago kontzerturik baieztatuta/i)).toBeInTheDocument();
  });
});
