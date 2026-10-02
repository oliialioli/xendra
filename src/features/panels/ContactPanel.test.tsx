import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContactPanel } from './ContactPanel';

describe('ContactPanel', () => {
  it('shows the band email and phone as links', () => {
    render(<ContactPanel />);
    expect(screen.getByRole('link', { name: 'xendra.taldea@gmail.com' })).toHaveAttribute('href', 'mailto:xendra.taldea@gmail.com');
    expect(screen.getByRole('link', { name: '616 04 08 06' })).toHaveAttribute('href', 'tel:+34616040806');
  });

  it('lists the social profiles', () => {
    render(<ContactPanel />);
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/_xendra_/');
    expect(screen.getByRole('link', { name: 'YouTube' })).toHaveAttribute('href', 'https://www.youtube.com/@Xendra6');
  });

  it('has no form to fill in', () => {
    const { container } = render(<ContactPanel />);
    expect(container.querySelector('form')).toBeNull();
  });
});
