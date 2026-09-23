import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Minutes from './Minutes';
import { getMinutes } from '../lib/content';

describe('Minutes page search', () => {
  it('narrows the list to matching minutes', () => {
    const total = getMinutes().length;

    render(
      <MemoryRouter>
        <Minutes />
      </MemoryRouter>
    );

    const countText = (expected: string) => (_: string, element: Element | null) =>
      element?.tagName === 'P' &&
      element?.textContent?.replace(/\s+/g, ' ').trim() === expected;

    expect(screen.getByText(countText(`${total} of ${total} sets of minutes`))).toBeInTheDocument();

    const search = screen.getByLabelText('Search minutes');
    fireEvent.change(search, { target: { value: 'August 4, 2026' } });

    expect(screen.getByText(countText(`1 of ${total} sets of minutes`))).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('shows no results for a query that matches nothing', () => {
    render(
      <MemoryRouter>
        <Minutes />
      </MemoryRouter>
    );

    const search = screen.getByLabelText('Search minutes');
    fireEvent.change(search, { target: { value: 'this text matches no minutes at all' } });

    expect(screen.getByText('No minutes match your search')).toBeInTheDocument();
  });
});
