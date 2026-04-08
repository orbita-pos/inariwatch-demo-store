import { GET } from '../route';
import { NextResponse } from 'next/server';

describe('GET /products', () => {
  let request: Request;
  
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([]),
      })
    ) as jest.Mock;

    request = new Request('https://example.com/api/products?search=%27%3B+DROP+TABLE+products--%27');
  });

  it('should prevent SQL injection in search parameter', async () => {
    const response = await GET(request);
    const json = await response.json();

    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('DROP TABLE products'));
    expect(json).toEqual([]);
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});