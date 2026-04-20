import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("../validators", () => ({
  validateCoupon: vi.fn(),
}))

import { applyDiscount } from "../discount"
import { validateCoupon } from "../validators"

afterEach(() => {
  vi.clearAllMocks()
})

describe("applyDiscount", () => {
  it("returns the cart unchanged when validateCoupon returns null for an unknown coupon", async () => {
    vi.mocked(validateCoupon).mockResolvedValue(null)

    const cart = {
      subtotal: 120,
      items: [{ productId: "sku_1", quantity: 1 }],
    }

    await expect(applyDiscount(cart, "WINTER50")).resolves.toEqual({
      subtotal: 120,
      discountApplied: 0,
      total: 120,
      couponCode: null,
    })
  })

  it("still applies a valid coupon discount when validation succeeds", async () => {
    vi.mocked(validateCoupon).mockResolvedValue({
      code: "SAVE10",
      discount: 0.1,
    })

    const cart = {
      subtotal: 120,
      items: [{ productId: "sku_1", quantity: 1 }],
    }

    await expect(applyDiscount(cart, "SAVE10")).resolves.toEqual({
      subtotal: 120,
      discountApplied: 12,
      total: 108,
      couponCode: "SAVE10",
    })
  })
})
