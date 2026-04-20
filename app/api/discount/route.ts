import { NextResponse } from "next/server"
import { applyDiscount } from "@/lib/pricing/discount"

/**
 * POST /api/discount
 *
 * Body:
 *   {
 *     cart: { subtotal: number, items: [...] },
 *     couponCode: string
 *   }
 *
 * Response:
 *   { subtotal, discountApplied, total, couponCode }
 *
 * Contract:
 *   - Valid coupon  → 200 with discount applied.
 *   - Unknown / expired coupon → 400 with { error: "Invalid coupon code" }.
 *     The user should see a clear error, NOT silently lose the discount.
 *   - Missing cart or couponCode → 400.
 */
export async function POST(req: Request) {
  const { cart, couponCode } = await req.json()

  if (!cart || typeof cart.subtotal !== "number") {
    return NextResponse.json({ error: "cart.subtotal required" }, { status: 400 })
  }
  if (typeof couponCode !== "string" || couponCode.length === 0) {
    return NextResponse.json({ error: "couponCode required" }, { status: 400 })
  }

  try {
    const result = await applyDiscount(cart, couponCode)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid coupon code") {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 })
    }

    throw error
  }
}
