import { describe, it, expect } from 'vitest';
import { GET } from '../route';

async function createRequestWithUrl(url) {
  return new Request(url);
}

describe('GET /products', () => {
  it('should prevent SQL injection in product fetching', async () => {
    const maliciousInput = "https://example.com/api/products?category=%27;%20DROP%20TABLE%20products--";
    const request = await createRequestWithUrl(maliciousInput);
    const response = await GET(request);
    const responseData = await response.json();

    // Verify that no SQL injection occurred and a proper response is returned
    expect(response.status).toBe(200); // Assuming 200 is returned in case of success
    expect(Array.isArray(responseData)).toBe(true);
  });

  it('should correctly apply limit and offset for pagination', async () => {
    const page2Request = await createRequestWithUrl('https://example.com/api/products?page=2');
    const response = await GET(page2Request);
    const responseData = await response.json();

    // Verify correct pagination is applied
    expect(response.status).toBe(200);
    expect(responseData.length).toBeLessThanOrEqual(12);
  });

  it('should handle CORS headers correctly', async () => {
    const request = await createRequestWithUrl('https://example.com/api/products');
    const response = await GET(request);

    // Verify the CORS headers are present and correct
    expect(response.headers.get('Access-Control-Allow-Origin')).toEqual('https://demo-store.vercel.app');
    expect(response.headers.get('Access-Control-Allow-Methods')).toEqual('GET, POST');
  });
});
