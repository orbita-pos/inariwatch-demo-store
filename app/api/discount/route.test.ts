import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}))

vi.mock("@/lib/pricing/discount", () => ({
  applyDiscount: vi.fn(),
}))

vi.mock("@/lib/pricing/validators", () => ({
  validateCoupon: vi.fn(),
}))

import { POST } from "./route"
import { applyDiscount } from "@/lib/pricing/discount"
import { validateCoupon } from "@/lib/pricing/validators"

describe("POST /api/discount", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 with an error when the coupon code is invalid", async () => {
    vi.mocked(validateCoupon).mockResolvedValue(null)

    const request = {
      json: vi.fn().mockResolvedValue({
        cart: { subtotal: 120, items: [{ id: "sku_1", price: 120, quantity: 1 }] },
        couponCode: "WINTER50",
      }),
    } as any

    const response = await POST(request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid coupon code" })
    expect(validateCoupon).toHaveBeenCalledWith("WINTER50")
    expect(applyDiscount).not.toHaveBeenCalled()
  })

  it("applies the discount when the coupon code is valid", async () => {
    vi.mocked(validateCoupon).mockResolvedValue({ code: "WINTER50", discount: 50 } as any)
    vi.mocked(applyDiscount).mockResolvedValue({ subtotal: 120, discount: 60, total: 60 } as any)

    const request = {
      json: vi.fn().mockResolvedValue({
        cart: { subtotal: 120, items: [{ id: "sku_1", price: 120, quantity: 1 }] },
        couponCode: "WINTER50",
      }),
    } as any

    const response = await POST(request)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ subtotal: 120, discount: 60, total: 60 })
    expect(validateCoupon).toHaveBeenCalledWith("WINTER50")
    expect(applyDiscount).toHaveBeenCalledWith(
      { subtotal: 120, items: [{ id: "sku_1", price: 120, quantity: 1 }] },
      "WINTER50",
    )
  })
})
