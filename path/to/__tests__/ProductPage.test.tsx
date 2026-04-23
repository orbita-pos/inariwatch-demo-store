import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import ProductPage from '../app/(store)/products/[id]/page';

const server = setupServer(
  rest.get('https://api.example.com/related/:id', (req, res, ctx) => {
    return res(ctx.json([]));
  })
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ProductPage Component', () => {
  test('handles fetch failure gracefully', async () => {
    server.use(
      rest.get('https://api.example.com/related/:id', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<ProductPage params={Promise.resolve({ id: 'd386e506-782d-4b72-adf0-8cb5fcf72363' })} />);

    expect(await screen.findByText(/Error fetching related products/i)).toBeInTheDocument();
  });
});