import { describe, expect, it, vi, beforeEach } from "vitest"
import { POST } from "./route"

vi.mock("@/lib/pricing/discount", () => ({
  applyDiscount: vi.fn(),
}))

import { applyDiscount } from "@/lib/pricing/discount"

describe("POST /api/discount", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 with { error: "Invalid coupon code" } when the coupon code is unknown', async () => {
    vi.mocked(applyDiscount).mockRejectedValue(new Error("validation missing or invalid"))

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

    const response = await POST(request as any)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid coupon code" })
  })
})
