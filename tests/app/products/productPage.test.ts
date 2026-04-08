import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductPage from '@/app/products/[id]/page';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('ProductPage', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('fetches related products successfully', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([{ id: '1', name: 'Related Product' }]));

    render(<ProductPage params={Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' })} />);

    const relatedProduct = await screen.findByText('Related Product');
    expect(relatedProduct).toBeInTheDocument();
  });

  test('handles fetch error without crashing', async () => {
    fetchMock.mockReject(new Error('fetch failed'));

    render(<ProductPage params={Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' })} />);

    const noRelatedProducts = await screen.findByText('No related products.');
    expect(noRelatedProducts).toBeInTheDocument();
  });
});
