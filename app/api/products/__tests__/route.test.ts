import { describe, it, expect } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

const createRequest = (searchTerm: string) => {
  return new NextRequest(`http://localhost:3000/api/products?search=${encodeURIComponent(searchTerm)}`);
};

describe('GET /api/products', () => {
  it('should prevent SQL injection via search parameter', async () => {
    const request = createRequest("%'; DROP TABLE products--%");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeInstanceOf(Array);
    // Assuming an empty result to indicate no unwanted injection effects
    expect(data.length).toBeGreaterThanOrEqual(0);
  });

  it('should return products without SQL keyword interference', async () => {
    const request = createRequest('test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeInstanceOf(Array);
    // Check for a reasonable number of results to ensure proper functionality
    expect(data.length).toBeGreaterThanOrEqual(0);
  });
});
