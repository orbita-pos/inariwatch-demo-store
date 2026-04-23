import { render, screen } from '@testing-library/react';
import ProductPage from '../page';
import { isChaosActive } from '@/lib/chaos/toggles';
import { db } from '@/lib/db';

jest.mock('@/lib/chaos/toggles', () => ({
  isChaosActive: jest.fn()
}));

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn()
  }
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn()
}));

describe('ProductPage fetch operation error handling', () => {
  it('should handle fetch failure without crashing', async () => {
    isChaosActive.mockResolvedValueOnce(false);
    db.select.mockResolvedValueOnce([{ id: 'product-id' }]);
    db.select.mockResolvedValueOnce([]);

    global.fetch = jest.fn(() => Promise.reject('Fetch failed'));

    await render(<ProductPage params={Promise.resolve({ id: 'product-id' })} />);

    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/related/product-id');
    expect(screen.queryByText('related Products')).not.toBeInTheDocument();
  });

  it('should display notFound when product is not in database', async () => {
    isChaosActive.mockResolvedValueOnce(false);
    db.select.mockResolvedValueOnce([]);

    const { notFound } = require('next/navigation');

    await render(<ProductPage params={Promise.resolve({ id: 'non-existent-id' })} />);

    expect(notFound).toHaveBeenCalled();
  });
});
