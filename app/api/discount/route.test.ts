import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/pricing/discount", () => ({
  applyDiscount: vi.fn(),
}))

import { POST } from "./route"
import { applyDiscount } from "@/lib/pricing/discount"

describe("POST /api/discount", () => {
  it('returns 400 with { error: "Invalid coupon code" } when applyDiscount rejects for an unknown coupon', async () => {
    vi.mocked(applyDiscount).mockRejectedValueOnce(new Error("Invalid coupon code"))

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
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body).toEqual({ error: "Invalid coupon code" })
  })

  it("does not return a 500 for an unknown coupon submission", async () => {
    vi.mocked(applyDiscount).mockRejectedValueOnce(new Error("Invalid coupon code"))

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

    expect(res.status).not.toBe(500)
  })
})
