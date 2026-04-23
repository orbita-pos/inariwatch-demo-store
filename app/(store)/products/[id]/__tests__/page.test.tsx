import { render, screen } from '@testing-library/react';
import ProductPage from '../page';

// Mock the modules necessary
jest.mock('next/navigation', () => ({ notFound: jest.fn() }));
jest.mock('@/lib/db', () => ({
  db: { select: jest.fn(() => ({ from: jest.fn(() => ({ where: jest.fn(() => [{}] }) }) }) ) },
}));

jest.mock('@/lib/chaos/toggles', () => ({ isChaosActive: jest.fn() }));

// Test block
describe('ProductPage', () => {
  it('should handle fetch errors gracefully when fetching related products', async () => {
    // Simulate error in fetch
    global.fetch = jest.fn(() => Promise.reject(new Error('fetch failed')));

    const { notFound } = require('next/navigation');

    // Act
    render(<ProductPage params={Promise.resolve({ id: 'test-id' })} />);

    // Await and Assert
    await screen.findByText(/Failed to fetch related products/);
    expect(notFound).not.toHaveBeenCalled();
  });
});
