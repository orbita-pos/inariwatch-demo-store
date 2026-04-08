import { describe, it, expect } from 'vitest';
import { GET } from '../route';
import { db } from '@/lib/db';

// Mock the database module
jest.mock('@/lib/db', () => ({
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  query: jest.fn().mockResolvedValue([]),
}));

const NextResponseMock = {
  json: jest.fn((data, options) => ({
    data,
    headers: options.headers,
  })),
};

jest.mock('next/server', () => ({
  NextResponse: NextResponseMock,
}));

describe('GET /api/products', () => {
  it('should sanitize inputs to prevent SQL injection', async () => {
    const req = new Request('http://localhost/api/products?name=%27); DROP TABLE products;--&description=%27); DROP TABLE descriptions;--');

    // Call the GET function
    const response = await GET(req);

    // Verify that the query is sanitizing inputs correctly
    expect(db.where).toHaveBeenCalledWith(expect.not.stringContaining('DROP TABLE products'));
    expect(db.where).toHaveBeenCalledWith(expect.not.stringContaining('DROP TABLE descriptions'));

    // Verify that a JSON response is returned
    expect(response.data).toEqual([]);
    expect(response.headers).toBeDefined();
  });
});