import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductPage from '../page';
import { server } from '@/mocks/server';
import { rest } from 'msw';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ProductPage', () => {
  test('renders product page and handles fetch failure gracefully', async () => {
    server.use(
      rest.get('https://api.example.com/related/:id', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<ProductPage params={Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' })} />);

    const notFoundElement = await screen.findByText(/not found/i);
    expect(notFoundElement).toBeInTheDocument();
  });
});
