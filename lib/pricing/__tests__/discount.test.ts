import { describe, expect, it, vi } from "vitest"

vi.mock("../validators", () => ({
  validateCoupon: vi.fn(),
}))

import { applyDiscount } from "../discount"
import { validateCoupon } from "../validators"

describe("applyDiscount", () => {
  it("returns null instead of throwing when validateCoupon returns null for an unknown coupon", async () => {
    vi.mocked(validateCoupon).mockResolvedValueOnce(null)

    await expect(
      applyDiscount(
        {
          subtotal: 120,
          items: [{ productId: "sku_1", quantity: 1 }],
        },
        "WINTER50",
      ),
    ).resolves.toBeNull()
  })

  it("still applies a valid coupon discount when validation succeeds", async () => {
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
