import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import ProductPage from '@/app/(store)/products/[id]/page';
import { db } from '@/lib/db';

// Set up MSW server to mock fetch
const server = setupServer(
  rest.get('https://api.example.com/related/:id', (req, res, ctx) => {
    return res(ctx.json([
      { id: 'related-1', name: 'Related Product 1' },
      { id: 'related-2', name: 'Related Product 2' }
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

jest.mock('@/lib/db', () => {
  const originalModule = jest.requireActual('@/lib/db');
  return {
    ...originalModule,
    db: {
      ...originalModule.db,
      select: jest.fn(() => {
        return {
          from: jest.fn(() => ({
            where: jest.fn(() => Promise.resolve([{ id: 'product-1', name: 'Product 1', price: 1099 }]))
          }))
        }
      })
    }
  };
});

// Test cases

describe('ProductPage', () => {
  it('renders product details and related products successfully', async () => {
    render(<ProductPage params={Promise.resolve({ id: 'product-1' })} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for page to render product details
    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());
    await waitFor(() => {
      expect(screen.getByText('$10.99')).toBeInTheDocument();
    });

    // Verify related products are fetched
    await waitFor(() => {
      expect(screen.getByText('Related Product 1')).toBeInTheDocument();
      expect(screen.getByText('Related Product 2')).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully when fetching related products', async () => {
    server.use(
      rest.get('https://api.example.com/related/:id', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<ProductPage params={Promise.resolve({ id: 'product-1' })} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for page to render product details
    await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

    // Check console log for fetch errors (needs jest spy for actual console verification)
    // Jest spyOn is not demonstrated here for simplicity
  });
});
