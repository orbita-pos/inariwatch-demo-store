import { render } from '@testing-library/react';
import ProductPage from '../page';
import { describe, it, expect } from 'vitest';

const mockProductId = 'd386e506-782d-4b72-adf0-8cb5fcf72363';

const mockFetchResponse = [
  { id: 'related-1', name: 'Related Product 1' },
  { id: 'related-2', name: 'Related Product 2' }
];

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockFetchResponse)
  })
);


describe('ProductPage fetch operation', () => {
  it('should handle fetch failure by returning an empty relatedProducts array', async () => {
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('fetch failed')));
    const { container } = render(<ProductPage params={Promise.resolve({ id: mockProductId })} />);
    const relatedProductsElement = container.querySelector('.related-products');
    expect(relatedProductsElement).toBeNull();
  });
});