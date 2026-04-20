import { describe, expect, it, vi } from "vitest"

vi.mock("./validators", () => ({
  validateCoupon: vi.fn(),
}))

import { applyDiscount } from "./discount"
import { validateCoupon } from "./validators"

describe("applyDiscount", () => {
  it("throws a clear invalid coupon error when validateCoupon returns null", async () => {
    vi.mocked(validateCoupon).mockResolvedValueOnce(null)

    await expect(
      applyDiscount(
        {
          subtotal: 120,
          items: [{ productId: "sku_123", quantity: 1 }],
        },
        "WINTER50",
      ),
    ).rejects.toThrow("Invalid coupon code")
  })

  it("still applies the validated discount for a known coupon", async () => {
    vi.mocked(validateCoupon).mockResolvedValueOnce({
      code: "SAVE10",
      discount: 0.1,
    })

    await expect(
      applyDiscount(
        {
          subtotal: 120,
          items: [{ productId: "sku_123", quantity: 1 }],
        },
        "SAVE10",
      ),
    ).resolves.toEqual({
      subtotal: 120,
      discountApplied: 12,
      total: 108,
      couponCode: "SAVE10",
    })
  })
})
