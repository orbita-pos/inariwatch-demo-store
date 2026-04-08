import { render, screen, waitFor } from '@testing-library/react';
import ProductPage from '../products/[id]/page';
import { db } from '@/lib/db';
import fetch from 'node-fetch';

jest.mock('@/lib/db');
jest.mock('node-fetch');

const mockProduct = [{ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363', name: 'Test Product' }];
const mockReviews = [{
  id: '1',
  rating: 5,
  comment: 'Great product!',
  createdAt: new Date(),
  userName: 'John Doe'
}];
const mockFetchResponse = {
  json: jest.fn().mockResolvedValue([{ id: 'related-product-id', name: 'Related Product' }])
};

describe('ProductPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.select().from.mockReturnValueOnce().where as jest.Mock).mockResolvedValueOnce(mockProduct);
    (db.select.mockReturnValue as jest.Mock).mockResolvedValueOnce(mockReviews);
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockFetchResponse);
  });

  it('renders the product page without errors', async () => {
    render(<ProductPage params={Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' })} />);
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  it('handles fetch failure gracefully', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('fetch failed'));

    render(<ProductPage params={Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' })} />);
    await waitFor(() => {
      expect(screen.getByText(/could not load related products/i)).toBeInTheDocument();
    });
  });
});