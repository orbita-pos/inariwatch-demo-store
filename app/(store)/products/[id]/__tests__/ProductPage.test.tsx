import { render, screen } from '@testing-library/react';
import ProductPage from '../page';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValueOnce([]),
  },
}));

jest.mock('@/lib/chaos/toggles', () => ({
  isChaosActive: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('node-fetch', () => jest.fn(() => Promise.reject(new Error('fetch failed'))));

const useRouter = jest.requireActual('next/router').useRouter;

async function renderPage(props: any) {
  const { container } = render(<ProductPage {...props} />);
  return container;
}

const productParams = {
  params: Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' }),
};

describe('ProductPage', () => {
  it('should handle fetch failure gracefully', async () => {
    const container = await renderPage(productParams);

    expect(container).toBeInTheDocument();
    expect(screen.queryByText('Error loading related products')).toBeNull();
  });

  it('should call notFound if no product is found', async () => {
    const { notFound } = require('next/navigation');
    await renderPage(productParams);

    expect(notFound).toHaveBeenCalled();
  });
});
