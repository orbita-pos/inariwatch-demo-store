import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/pricing/validators", () => ({
  validateCoupon: vi.fn(),
}))

vi.mock("@/lib/pricing/discount", () => ({
  applyDiscount: vi.fn(),
}))

import { POST } from "./route"
import { validateCoupon } from "@/lib/pricing/validators"
import { applyDiscount } from "@/lib/pricing/discount"

describe("POST /api/discount", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 with an invalid coupon error when validateCoupon returns null", async () => {
    vi.mocked(validateCoupon).mockResolvedValue(null)

    const request = new Request("http://localhost/api/discount", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cart: {
          subtotal: 120,
          items: [{ productId: "sku_1", quantity: 1 }],
        },
        couponCode: "WINTER50",
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid coupon code" })
    expect(applyDiscount).not.toHaveBeenCalled()
  })

  it("applies the discount when the coupon is valid", async () => {
    vi.mocked(validateCoupon).mockResolvedValue({
      code: "WINTER50",
      discount: 0.5,
    })
    vi.mocked(applyDiscount).mockResolvedValue({
      subtotal: 120,
      discountApplied: 60,
      total: 60,
      couponCode: "WINTER50",
    })

    const request = new Request("http://localhost/api/discount", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cart: {
          subtotal: 120,
          items: [{ productId: "sku_1", quantity: 1 }],
        },
        couponCode: "WINTER50",
      }),
    })

    const response = await POST(request)

    expect(validateCoupon).toHaveBeenCalledWith("WINTER50")
    expect(applyDiscount).toHaveBeenCalledWith(
      {
        subtotal: 120,
        items: [{ productId: "sku_1", quantity: 1 }],
      },
      "WINTER50",
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      subtotal: 120,
      discountApplied: 60,
      total: 60,
      couponCode: "WINTER50",
    })
  })
})
