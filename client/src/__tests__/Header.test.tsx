import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../components/Header';

describe('Header Brand Logo', () => {
  it('renders the brand logo image and brand name', () => {
    render(
      <Header
        onClearGraph={vi.fn()}
        onGenerateRandomGraph={vi.fn()}
      />
    );

    const logo = screen.getByAltText('PathForge Brand Logo');
    expect(logo).toBeInTheDocument();
    expect(logo.tagName.toLowerCase()).toBe('img');
    expect(screen.getByText('PathForge')).toBeInTheDocument();
  });
});
