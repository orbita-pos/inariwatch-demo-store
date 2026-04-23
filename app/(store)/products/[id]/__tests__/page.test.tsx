import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProductPage from '../page';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('ProductPage Component', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should display an error message if related products fetch fails', async () => {
    fetchMock.mockReject(new Error('fetch failed'));

    const { container } = render(<ProductPage params={Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' })} />);

    await waitFor(() => expect(screen.getByText('Could not load related products.')).toBeInTheDocument());

    expect(container).toMatchSnapshot();
  });

  it('should display fetched related products correctly', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([{ id: 'related1', name: 'Related Product 1' }]));

    render(<ProductPage params={Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' })} />);

    await waitFor(() => expect(screen.getByText('Related Product 1')).toBeInTheDocument());
  });
});
