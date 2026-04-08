import { render } from '@testing-library/react';
import ProductPage from '../(store)/products/[id]/page';

jest.mock('../../lib/chaos/toggles', () => ({
  isChaosActive: jest.fn(() => false)
}));

jest.mock('../../lib/db', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn().mockResolvedValueOnce([])
      }))
    })),
  }
}));

beforeEach(() => {
  jest.clearAllMocks();
});

it('handles fetch failure gracefully', async () => {
  global.fetch = jest.fn().mockRejectedValueOnce(new TypeError('fetch failed'));

  const params = Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' });

  const { findByText } = render(<ProductPage params={params} />);

  expect(await findByText('Related products')).toBeDefined();
  expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/related/d386e506-782d-4b72-adf0-8cb5fcf72363');
});