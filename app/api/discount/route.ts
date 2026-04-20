import { NextResponse } from "next/server"
// ... keep existing code ...
import { applyDiscount } from "@/lib/pricing/discount"
import { validateCoupon } from "@/lib/pricing/validators"

// ... keep existing code ...
export async function POST(request: Request) {
  // ... keep existing code ...
  const { cart, couponCode } = await request.json()

  const coupon = await validateCoupon(couponCode)
  if (!coupon) {
    return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 })
  }

  const result = await applyDiscount(cart, couponCode)

  return NextResponse.json(result)
}
