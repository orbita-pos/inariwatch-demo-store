import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("../../../lib/pricing/discount", () => ({
  applyDiscount: vi.fn(),
}))

import { POST } from "./route"
import { applyDiscount } from "../../../lib/pricing/discount"

describe("POST /api/discount", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 with an invalid coupon error when applyDiscount rejects for an unknown coupon", async () => {
    vi.mocked(applyDiscount).mockRejectedValue(new Error("Invalid coupon code"))

    const request = new Request("http://localhost/api/discount", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        cart: {
          subtotal: 120,
          items: [{ productId: "sku_1", quantity: 1 }],
        },
        couponCode: "WINTER50",
      }),
    })

    const response = await POST(request as any)
    const body = await response.json()

    expect(applyDiscount).toHaveBeenCalledWith(
      {
        subtotal: 120,
        items: [{ productId: "sku_1", quantity: 1 }],
      },
      "WINTER50",
    )
    expect(response.status).toBe(400)
    expect(body).toEqual({ error: "Invalid coupon code" })
  })

  it("returns 200 and the discount result for a valid coupon", async () => {
    vi.mocked(applyDiscount).mockResolvedValue({
      subtotal: 120,
      discountApplied: 60,
      total: 60,
      couponCode: "WINTER50",
    })

    const request = new Request("http://localhost/api/discount", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        cart: {
          subtotal: 120,
          items: [{ productId: "sku_1", quantity: 1 }],
        },
        couponCode: "WINTER50",
      }),
    })

    const response = await POST(request as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      subtotal: 120,
      discountApplied: 60,
      total: 60,
      couponCode: "WINTER50",
    })
  })
})
