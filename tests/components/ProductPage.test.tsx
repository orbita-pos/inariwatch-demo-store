import { render, screen, act } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import ProductPage from '../../app/(store)/products/[id]/page';
import '@testing-library/jest-dom';

fetchMock.enableMocks();

describe('ProductPage Component', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('handles fetch error gracefully and shows not found message', async () => {
    fetchMock.mockReject(new Error('fetch failed'));

    await act(async () => {
      render(<ProductPage params={Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' })} />);
    });

    expect(screen.queryByText('Not Found')).toBeInTheDocument();
  });

  it('renders product information when fetch succeeds', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([{ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363', category: 'mugs', name: 'Sample Mug' }]))
              .mockResponseOnce(JSON.stringify([]))
              .mockResponseOnce(JSON.stringify([]));
              
    await act(async () => {
      render(<ProductPage params={Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' })} />);
    });

    expect(screen.getByText('Sample Mug')).toBeInTheDocument();
    expect(screen.getByText('☕')).toBeInTheDocument();
  });
});
