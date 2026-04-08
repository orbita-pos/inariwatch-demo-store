import { render, screen, waitFor } from '@testing-library/react';
import ProductPage from '@/app/(store)/products/[id]/page';
import * as chaos from '@/lib/chaos/toggles';
import * as db from '@/lib/db';

jest.mock('@/lib/db');
jest.mock('@/lib/chaos/toggles');
global.fetch = jest.fn();

const mockProduct = [{ id: 'test-product-id', category: 'stickers', price: 1500 }];
const mockReviews = [
  { id: 'review1', rating: 5, comment: 'Great product!', createdAt: new Date(), userName: 'User1' }
];
const mockRelatedProducts = [{ id: 'related-product-1', name: 'Related Product 1' }];

(db as jest.Mocked<typeof db>).select = jest.fn().mockImplementation(() => ({
  from: jest.fn().mockReturnValue({
    where: jest.fn().mockResolvedValueOnce(mockProduct)
                   .mockResolvedValueOnce(mockReviews),
  }),
}));

(chaos as jest.Mocked<typeof chaos>).isChaosActive = jest.fn().mockReturnValue(false);

fetch.mockImplementation(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockRelatedProducts),
  })
);

describe('ProductPage', () => {
  it('displays product page with product and related products', async () => {
    render(<ProductPage params={Promise.resolve({ id: 'test-product-id' })} />);

    await waitFor(() => expect(screen.getByText('🏷️')).toBeInTheDocument());
    expect(screen.getByText('$15.00')).toBeInTheDocument();
    expect(screen.getByText('Related Product 1')).toBeInTheDocument();
  });

  it('handles fetch failure gracefully for related products', async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new Error('Error fetching related products')));

    render(<ProductPage params={Promise.resolve({ id: 'test-product-id' })} />);

    await waitFor(() => expect(screen.getByText('🏷️')).toBeInTheDocument());
    expect(screen.queryByText('Related Product 1')).not.toBeInTheDocument();
  });
});
