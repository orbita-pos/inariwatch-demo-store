import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("@/lib/pricing/discount", () => ({
  applyDiscount: vi.fn(),
}))

import { POST } from "./route"
import { applyDiscount } from "@/lib/pricing/discount"

describe("POST /api/discount", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 with an invalid coupon error when applyDiscount rejects for an unknown coupon", async () => {
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
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body).toEqual({ error: "Invalid coupon code" })
    expect(applyDiscount).toHaveBeenCalledWith(
      {
        subtotal: 120,
        items: [{ productId: "sku_1", quantity: 1 }],
      },
      "WINTER50",
    )
  })
})
