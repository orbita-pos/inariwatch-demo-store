import { GET } from '../route';
import { db } from '@/lib/db';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn(() => [{ id: 1, name: 'test', description: 'test', isActive: true }]),
  },
}));

vi.mock('@/lib/chaos/toggles', () => ({
  isChaosActive: vi.fn(() => Promise.resolve(false))
}));

describe('GET /products', () => {
  it('should prevent SQL injection through name and description search', async () => {
    const req = new Request('http://localhost/products?name=%27%3B%20DROP%20TABLE%20products--&description=%27%3B%20DROP%20TABLE%20products--');
    const response = await GET(req);
    const results = await response.json();

    expect(response.status).toBe(200);
    expect(results).toEqual([{ id: 1, name: 'test', description: 'test', isActive: true }]);
    expect(db.where).toHaveBeenCalledWith(expect.anything(), true);
    expect(db.and).toHaveBeenCalledTimes(2);
  });

  it('should return limited results based on pagination without vulnerabilities', async () => {
    const req = new Request('http://localhost/products?page=1&name=test');
    const response = await GET(req);
    const results = await response.json();

    expect(response.status).toBe(200);
    expect(results.length).toBe(1);
  });
});
