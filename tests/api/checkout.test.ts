import { POST } from '../../app/api/checkout/route';
import { NextResponse } from 'next/server';
import { describe, it, expect, beforeEach } from 'vitest';

// Mock functions for session and chaos active check
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));

vi.mock('@/lib/chaos/toggles', () => ({
  isChaosActive: vi.fn()
}));

const { getServerSession } = require('next-auth');
const { isChaosActive } = require('@/lib/chaos/toggles');

const mockRequest = (body: any) => {
  return {
    json: () => Promise.resolve(body)
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/checkout', () => {
  it('should return 400 if shippingAddress is null', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'user123' } });
    isChaosActive.mockResolvedValue(true);

    const req = mockRequest({
      cartItems: [{ productId: 'prod1', quantity: 2, priceAtTime: 10 }],
      shippingAddress: null
    });

    const res = await POST(req as any);
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Shipping address with city and zip required');
  });

  it('should return 400 if shippingAddress is missing city', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'user123' } });
    isChaosActive.mockResolvedValue(true);

    const req = mockRequest({
      cartItems: [{ productId: 'prod1', quantity: 2, priceAtTime: 10 }],
      shippingAddress: { zip: '12345' }
    });

    const res = await POST(req as any);
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Shipping address with city and zip required');
  });

  it('should return 400 if shippingAddress is missing zip', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'user123' } });
    isChaosActive.mockResolvedValue(true);

    const req = mockRequest({
      cartItems: [{ productId: 'prod1', quantity: 2, priceAtTime: 10 }],
      shippingAddress: { city: 'New York' }
    });

    const res = await POST(req as any);
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Shipping address with city and zip required');
  });
});