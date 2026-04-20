import { describe, expect, it, vi, afterEach } from "vitest"

vi.mock("./validators", () => ({
  validateCoupon: vi.fn(),
}))

import { applyDiscount } from "./discount"
import { validateCoupon } from "./validators"

describe("applyDiscount", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns the subtotal unchanged when validateCoupon returns null", async () => {
    vi.mocked(validateCoupon).mockResolvedValue(null)

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
      discountApplied: 0,
      total: 120,
      couponCode: null,
    })
  })

  it("applies the validated coupon discount when the coupon exists", async () => {
    vi.mocked(validateCoupon).mockResolvedValue({
      code: "SAVE10",
      discount: 0.1,
    })

    await expect(
      applyDiscount(
        {
          subtotal: 120,
          items: [{ productId: "sku_1", quantity: 1 }],
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
