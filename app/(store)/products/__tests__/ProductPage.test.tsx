import { render, screen, waitFor } from '@testing-library/react';
import ProductPage from '../[id]/page';
import * as navigation from 'next/navigation';
import fetchMock from 'jest-fetch-mock';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

fetchMock.enableMocks();

describe('ProductPage', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should handle failing fetch operations gracefully', async () => {
    const mockParams = Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' });
    fetchMock.mockRejectOnce(new Error('Network error'));

    render(<ProductPage params={mockParams} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/related/d386e506-782d-4b72-adf0-8cb5fcf72363'
      );
    });

    expect(console.error).toHaveBeenCalledWith(
      'Failed to fetch related products',
      expect.any(Error)
    );
  });

  it('should call notFound if product does not exist', async () => {
    const mockParams = Promise.resolve({ id: 'non-existent-id' });
    jest.spyOn(require('@/lib/db'), 'db').mockImplementation(() => ({
      select: jest.fn().mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }) })
    }));

    render(<ProductPage params={mockParams} />);

    await waitFor(() => {
      expect(navigation.notFound).toHaveBeenCalled();
    });
  });
});