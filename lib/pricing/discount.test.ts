import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("./validators", () => ({
  validateCoupon: vi.fn(),
}))

import { applyDiscount } from "./discount"
import { validateCoupon } from "./validators"

describe("applyDiscount", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("throws a clear invalid coupon error when validateCoupon returns null", async () => {
    vi.mocked(validateCoupon).mockResolvedValue(null)

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
})
