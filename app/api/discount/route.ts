import { NextResponse } from "next/server"
import { applyDiscount } from "@/lib/pricing/discount"
import { validateCoupon } from "@/lib/pricing/validators"
// ... keep existing code ...
  const { cart, couponCode } = await request.json()

  const coupon = await validateCoupon(couponCode)
  if (!coupon) {
    return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 })
  }

  const result = await applyDiscount(cart, couponCode)
  return NextResponse.json(result)
// ... keep existing code ...