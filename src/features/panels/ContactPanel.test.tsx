import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ContactPanel } from './ContactPanel';

describe('ContactPanel', () => {
  it('shows validation errors instead of pretending to submit', async () => {
    const user = userEvent.setup();
    render(<ContactPanel />);

    await user.click(screen.getByRole('button', { name: 'Prestatu mezua' }));

    expect(screen.getByText('Adierazi zure izena.')).toBeInTheDocument();
    expect(screen.getByText('Adierazi baliozko email bat.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ireki emaila' })).not.toBeInTheDocument();
  });

  it('never fakes a send while the real contact email is unconfirmed', async () => {
    const user = userEvent.setup();
    render(<ContactPanel />);

    await user.type(screen.getByLabelText('Izena'), 'Ana');
    await user.type(screen.getByLabelText('Emaila'), 'ana@example.com');
    await user.type(screen.getByLabelText('Mezua'), 'Kaixo Xendra');
    await user.click(screen.getByLabelText(/onartzen dut datu hauek/i));
    await user.click(screen.getByRole('button', { name: 'Prestatu mezua' }));

    expect(screen.queryByRole('link', { name: 'Ireki emaila' })).not.toBeInTheDocument();
    expect(screen.getByText(/oraindik ezin dugu bidalketa prestatu/i)).toBeInTheDocument();
  });
});
