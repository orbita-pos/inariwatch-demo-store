import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/pricing/discount", () => ({
  applyDiscount: vi.fn(),
}))

import { POST } from "./route"
import { applyDiscount } from "@/lib/pricing/discount"

describe("POST /api/discount", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 with a clear error when applyDiscount reports an invalid coupon code", async () => {
    vi.mocked(applyDiscount).mockRejectedValue(new Error("Invalid coupon code"))

    const req = new Request("http://localhost/api/discount", {
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

    const res = await POST(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: "Invalid coupon code" })
    expect(applyDiscount).toHaveBeenCalledWith(
      {
        subtotal: 120,
        items: [{ productId: "sku_1", quantity: 1 }],
      },
      "WINTER50",
    )
  })

  it("throws through unexpected errors instead of converting them to invalid coupon responses", async () => {
    const unexpected = new Error("database unavailable")
    vi.mocked(applyDiscount).mockRejectedValue(unexpected)

    const req = new Request("http://localhost/api/discount", {
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

    await expect(POST(req)).rejects.toThrow("database unavailable")
  })
})
