import { render, screen, waitFor } from '@testing-library/react';
import ProductPage from '../page';

jest.mock('node-fetch', () => jest.fn());
const fetch = require('node-fetch');

jest.mock('@/lib/chaos/toggles', () => ({
  isChaosActive: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn().mockResolvedValue([{ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363', name: 'Sample Product' }]),
  },
}));

jest.mock('@/lib/db/schema', () => ({
  products: {},
  reviews: {},
  users: {},
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
}));

describe('ProductPage Network Error Handling', () => {
  it('should log an error message if fetching related products fails', async () => {
    fetch.mockRejectedValue(new Error('Network Error'));

    console.error = jest.fn();

    render(<ProductPage params={Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' })} />);

    await waitFor(() => expect(console.error).toHaveBeenCalledWith('Failed to fetch related products'));
  });
});