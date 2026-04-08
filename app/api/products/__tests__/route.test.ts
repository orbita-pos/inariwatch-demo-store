import { describe, it, expect } from 'vitest';
import { GET } from '../route';

const mockDbSelect = jest.fn();

global.URL = jest.fn().mockImplementation((url) => {
  return {
    searchParams: {
      get: jest.fn()
        .mockReturnValueOnce('1') // page
        .mockReturnValueOnce("'; DROP TABLE products--'"), // category
    },
  };
});

jest.mock('@/lib/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => ({
            offset: () => ({
              where: mockDbSelect,
            }),
          }),
        }),
      }),
    }),
  },
}));

jest.mock('@/lib/env', () => ({
  isChaosActive: jest.fn(() => Promise.resolve(false)),
}));




describe('GET /api/products', () => {
  it('should not allow SQL injection via category parameter', async () => {
    await GET(new Request('http://example.com/api/products?page=1&category=%27%3B%20DROP%20TABLE%20products--'));

    expect(mockDbSelect).toHaveBeenCalledWith(expect.anything());
    expect(mockDbSelect).not.toHaveBeenCalledWith(expect.stringContaining('DROP TABLE'));
  });
});
