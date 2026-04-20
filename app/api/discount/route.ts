import { NextResponse } from "next/server"
import { applyDiscount } from "@/lib/pricing/discount"
import { validateCoupon } from "@/lib/pricing/validators"
// ... keep existing code ...
export async function POST(request: Request) {
  const body = await request.json()
  const { cart, couponCode } = body

  const coupon = await validateCoupon(couponCode)
  if (!coupon) {
    return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 })
  }

  const result = await applyDiscount(cart, couponCode)
  return NextResponse.json(result)
}
