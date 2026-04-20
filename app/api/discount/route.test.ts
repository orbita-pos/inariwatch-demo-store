import { describe, it, expect, vi, beforeEach } from "vitest"

const jsonMock = vi.fn()
const validateCouponMock = vi.fn()
const applyDiscountMock = vi.fn()

vi.mock("next/server", () => ({
  NextResponse: {
    json: jsonMock,
  },
}))

vi.mock("@/lib/pricing/validators", () => ({
  validateCoupon: validateCouponMock,
}))

vi.mock("@/lib/pricing/discount", () => ({
  applyDiscount: applyDiscountMock,
}))

import { POST } from "./route"

describe("POST /api/discount", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    jsonMock.mockImplementation((body, init) => ({ body, init }))
  })

  it("returns 400 with an invalid coupon error when validateCoupon returns null", async () => {
    validateCouponMock.mockResolvedValue(null)

    const request = {
      json: vi.fn().mockResolvedValue({
        cart: { subtotal: 120.0, items: [{ id: "sku_1", price: 120.0, quantity: 1 }] },
        couponCode: "WINTER50",
      }),
    } as unknown as Request

    const response = await POST(request)

    expect(validateCouponMock).toHaveBeenCalledWith("WINTER50")
    expect(applyDiscountMock).not.toHaveBeenCalled()
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid coupon code" }, { status: 400 })
    expect(response).toEqual({ body: { error: "Invalid coupon code" }, init: { status: 400 } })
  })

  it("applies the discount when the coupon is valid", async () => {
    validateCouponMock.mockResolvedValue({ code: "WINTER50", discount: 50 })
    applyDiscountMock.mockResolvedValue({ subtotal: 120.0, total: 60.0, discount: 60.0 })

    const request = {
      json: vi.fn().mockResolvedValue({
        cart: { subtotal: 120.0, items: [{ id: "sku_1", price: 120.0, quantity: 1 }] },
        couponCode: "WINTER50",
      }),
    } as unknown as Request

    const response = await POST(request)

    expect(validateCouponMock).toHaveBeenCalledWith("WINTER50")
    expect(applyDiscountMock).toHaveBeenCalledWith(
      { subtotal: 120.0, items: [{ id: "sku_1", price: 120.0, quantity: 1 }] },
      "WINTER50",
    )
    expect(response).toBeDefined()
  })
})
