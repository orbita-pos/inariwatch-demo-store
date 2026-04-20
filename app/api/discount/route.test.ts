import { describe, it, expect, vi, beforeEach } from "vitest"

const jsonMock = vi.fn((body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "content-type": "application/json" },
  })
)

vi.mock("next/server", () => ({
  NextResponse: {
    json: jsonMock,
  },
}))

const validateCouponMock = vi.fn()
vi.mock("@/lib/pricing/validators", () => ({
  validateCoupon: validateCouponMock,
}))

const applyDiscountMock = vi.fn()
vi.mock("@/lib/pricing/discount", () => ({
  applyDiscount: applyDiscountMock,
}))

import { POST } from "./route"

describe("POST /api/discount", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 with an invalid coupon error when validateCoupon returns null", async () => {
    validateCouponMock.mockResolvedValue(null)

    const request = new Request("http://localhost/api/discount", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cart: { subtotal: 120, items: [{ id: "sku_1", price: 120, quantity: 1 }] },
        couponCode: "WINTER50",
      }),
    })

    const response = await POST(request)

    expect(validateCouponMock).toHaveBeenCalledWith("WINTER50")
    expect(applyDiscountMock).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid coupon code" })
  })

  it("still applies the discount for a valid coupon", async () => {
    validateCouponMock.mockResolvedValue({ code: "WINTER50", discount: 0.5 })
    applyDiscountMock.mockResolvedValue({
      subtotal: 120,
      discountApplied: 60,
      total: 60,
      couponCode: "WINTER50",
    })

    const request = new Request("http://localhost/api/discount", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cart: { subtotal: 120, items: [{ id: "sku_1", price: 120, quantity: 1 }] },
        couponCode: "WINTER50",
      }),
    })

    const response = await POST(request)

    expect(validateCouponMock).toHaveBeenCalledWith("WINTER50")
    expect(applyDiscountMock).toHaveBeenCalledWith(
      { subtotal: 120, items: [{ id: "sku_1", price: 120, quantity: 1 }] },
      "WINTER50"
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
