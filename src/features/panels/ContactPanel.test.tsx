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

  it("prepares the message to the band's own address once the form is valid", async () => {
    const user = userEvent.setup();
    render(<ContactPanel />);

    await user.type(screen.getByLabelText('Izena'), 'Ana');
    await user.type(screen.getByLabelText('Emaila'), 'ana@example.com');
    await user.type(screen.getByLabelText('Mezua'), 'Kaixo Xendra');
    await user.click(screen.getByLabelText(/onartzen dut datu hauek/i));
    await user.click(screen.getByRole('button', { name: 'Prestatu mezua' }));

    const link = screen.getByRole('link', { name: 'Ireki emaila' });
    expect(link.getAttribute('href')).toMatch(/^mailto:xendra\.taldea@gmail\.com\?/);
  });

  it('shows the band email and phone as links', () => {
    render(<ContactPanel />);
    expect(screen.getByRole('link', { name: 'xendra.taldea@gmail.com' })).toHaveAttribute('href', 'mailto:xendra.taldea@gmail.com');
    expect(screen.getByRole('link', { name: '616 04 08 06' })).toHaveAttribute('href', 'tel:+34616040806');
  });
});
