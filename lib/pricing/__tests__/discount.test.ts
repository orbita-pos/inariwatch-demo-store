import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("../validators", () => ({
  validateCoupon: vi.fn(),
}))

import { applyDiscount } from "../discount"
import { validateCoupon } from "../validators"

describe("applyDiscount", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the subtotal unchanged when validateCoupon returns null", async () => {
    vi.mocked(validateCoupon).mockResolvedValue(null)

    await expect(
      applyDiscount(
        {
          subtotal: 120,
          items: [{ productId: "sku_123", quantity: 1 }],
        },
        "WINTER50",
      ),
    ).resolves.toEqual({
      subtotal: 120,
      discountApplied: 0,
      total: 120,
      couponCode: null,
    })
  })

  it("applies the validated discount when the coupon exists", async () => {
    vi.mocked(validateCoupon).mockResolvedValue({
      code: "WINTER50",
      discount: 0.5,
    })

    await expect(
      applyDiscount(
        {
          subtotal: 120,
          items: [{ productId: "sku_123", quantity: 1 }],
        },
        "WINTER50",
      ),
    ).resolves.toEqual({
      subtotal: 120,
      discountApplied: 60,
      total: 60,
      couponCode: "WINTER50",
    })
  })
})
