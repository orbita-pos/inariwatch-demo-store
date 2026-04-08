import { render, screen } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import ProductPage from '../../app/(store)/products/[id]/page';

fetchMock.enableMocks();

describe('ProductPage', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should handle fetch failure gracefully', async () => {
    fetchMock.mockReject(new Error('fetch failed'));

    render(<ProductPage params={{ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' }} />);
    expect(screen.getByText('Related products could not be loaded.')).toBeInTheDocument();
  });
});