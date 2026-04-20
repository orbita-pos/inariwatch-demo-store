import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('./validators', () => ({
  validateCoupon: vi.fn(),
}))

import { applyDiscount } from './discount'
import { validateCoupon } from './validators'

describe('applyDiscount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws a clear invalid coupon error when validateCoupon returns null', async () => {
    vi.mocked(validateCoupon).mockResolvedValue(null)

    await expect(
      applyDiscount(
        {
          subtotal: 120,
          items: [{ productId: 'sku_123', quantity: 1 }],
        },
        'WINTER50'
      )
    ).rejects.toThrow('Invalid coupon code')
  })

  it('still applies a valid coupon discount when validation succeeds', async () => {
    vi.mocked(validateCoupon).mockResolvedValue({
      code: 'WINTER50',
      discount: 0.5,
    })

    await expect(
      applyDiscount(
        {
          subtotal: 120,
          items: [{ productId: 'sku_123', quantity: 1 }],
        },
        'WINTER50'
      )
    ).resolves.toEqual({
      subtotal: 120,
      discountApplied: 60,
      total: 60,
      couponCode: 'WINTER50',
    })
  })
})
