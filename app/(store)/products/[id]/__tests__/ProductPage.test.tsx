import React from 'react';
import { render, waitFor } from '@testing-library/react';
import ProductPage from '../page';

test('fetch call within ProductPage handles error correctly', async () => {
  const fakeParams = { id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' };

  // Mock fetch to simulate a failed network request
  global.fetch = jest.fn(() =>
    Promise.reject(new Error('fetch failed'))
  );

  // Render the ProductPage component
  const { getByText } = render(<ProductPage params={Promise.resolve(fakeParams)} />);

  // Await and Verify the error handling
  await waitFor(() => {
    const errorMessage = getByText(/Something went wrong, please try again later./i);
    expect(errorMessage).toBeInTheDocument();
  });

  // Clean up the mock
  global.fetch.mockRestore();
});