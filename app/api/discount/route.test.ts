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
        cart: { subtotal: 120.0, items: [{ id: "item-1", price: 120.0, quantity: 1 }] },
        couponCode: "WINTER50",
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json).toEqual({ error: "Invalid coupon code" })
    expect(applyDiscount).not.toHaveBeenCalled()
  })

  it("continues to apply the discount when the coupon is valid", async () => {
    vi.mocked(validateCoupon).mockResolvedValue({ code: "SAVE10", discount: 10 })
    vi.mocked(applyDiscount).mockResolvedValue({ subtotal: 120, discount: 12, total: 108 })

    const request = new Request("http://localhost/api/discount", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cart: { subtotal: 120.0, items: [{ id: "item-1", price: 120.0, quantity: 1 }] },
        couponCode: "SAVE10",
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ subtotal: 120, discount: 12, total: 108 })
    expect(validateCoupon).toHaveBeenCalledWith("SAVE10")
    expect(applyDiscount).toHaveBeenCalledWith(
      { subtotal: 120.0, items: [{ id: "item-1", price: 120.0, quantity: 1 }] },
      "SAVE10",
    )
  })
})
