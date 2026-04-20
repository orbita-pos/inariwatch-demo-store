import { describe, expect, it, vi } from "vitest"

vi.mock("../validators", () => ({
  validateCoupon: vi.fn(),
}))

import { applyDiscount } from "../discount"
import { validateCoupon } from "../validators"

describe("applyDiscount", () => {
  it("throws a clear invalid coupon error when validateCoupon returns null", async () => {
    vi.mocked(validateCoupon).mockResolvedValueOnce(null)

    await expect(
      applyDiscount(
        {
          subtotal: 120,
          items: [{ productId: "sku_1", quantity: 1 }],
        },
        "WINTER50",
      ),
    ).rejects.toThrow("Invalid coupon code")
  })

  it("applies the validated coupon discount when the coupon exists", async () => {
    vi.mocked(validateCoupon).mockResolvedValueOnce({
      code: "WINTER50",
      discount: 0.5,
    })

    await expect(
      applyDiscount(
        {
          subtotal: 120,
          items: [{ productId: "sku_1", quantity: 1 }],
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
