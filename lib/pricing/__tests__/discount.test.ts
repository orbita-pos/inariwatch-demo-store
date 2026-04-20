import { describe, expect, it, vi, afterEach } from 'vitest'

vi.mock('../validators', () => ({
  validateCoupon: vi.fn(),
}))

import { applyDiscount } from '../discount'
import { validateCoupon } from '../validators'

describe('applyDiscount', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('throws a route-mappable invalid coupon error when validateCoupon returns null', async () => {
    vi.mocked(validateCoupon).mockResolvedValue(null)

    await expect(
      applyDiscount(
        {
          subtotal: 120,
          items: [{ productId: 'sku_1', quantity: 1 }],
        },
        'WINTER50',
      ),
    ).rejects.toThrow('Invalid coupon code')
  })

  it('applies the validated coupon discount for a known coupon code', async () => {
    vi.mocked(validateCoupon).mockResolvedValue({
      code: 'SAVE10',
      discount: 0.1,
    })

    await expect(
      applyDiscount(
        {
          subtotal: 120,
          items: [{ productId: 'sku_1', quantity: 1 }],
        },
        'SAVE10',
      ),
    ).resolves.toEqual({
      subtotal: 120,
      discountApplied: 12,
      total: 108,
      couponCode: 'SAVE10',
    })
  })
})
