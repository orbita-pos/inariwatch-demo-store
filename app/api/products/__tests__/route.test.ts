import { describe, it, expect } from 'vitest';
import { GET } from '../route';
import { db } from "@/lib/db";
import { NextResponse } from 'next/server';
import { products } from '@/lib/db/schema';

jest.mock('@/lib/db');

// Sample mock data
const mockProducts = [
  { id: 1, name: 'Product A', description: 'Great product', isActive: true },
  { id: 2, name: 'Product B; DROP TABLE products--', description: 'Another product', isActive: true }
];

describe('GET /api/products', () => {
  beforeEach(() => {
    db.select.mockResolvedValue(mockProducts);
  });

  it('does not allow SQL injection via name param', async () => {
    const request = new Request('http://localhost/api/products?search=%27;%20DROP%20TABLE%20products--');
    const response = await GET(request);
    const data = await response.json();

    expect(response).toBeInstanceOf(NextResponse);
    expect(data).toEqual(mockProducts);
    // Ensure malicious input doesn't drop or alter the table
    expect(data).not.toContainEqual(expect.objectContaining({ name: expect.stringContaining('DROP TABLE') }));
  });
});
