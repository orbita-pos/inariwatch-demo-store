import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductPage from '../../../../app/(store)/products/[id]/page';
import { db } from '../../../../lib/db';

jest.mock('../../../../lib/db', () => {
  return {
    db: {
      select: jest.fn().mockImplementation(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363', category: 'mugs' }])
      })
    }
  }
});

jest.mock('../../../../lib/chaos/toggles', () => {
  return {
    isChaosActive: jest.fn().mockResolvedValue(false)
  }
});


test('displays error message when fetch for related products fails', async () => {
  // Mock fetch to simulate a network error
  global.fetch = jest.fn(() => Promise.reject(new Error('fetch failed')));

  render(<ProductPage params={ Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' }) } />);

  await waitFor(() => {
    expect(screen.queryByText('Failed to fetch related products')).toBeInTheDocument();
  });
});
