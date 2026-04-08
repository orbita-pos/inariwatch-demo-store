import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { coupons } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isChaosActive } from "@/lib/chaos/toggles"

export async function POST(req: Request) {
  const { code } = await req.json()

  if (!code) {
    return NextResponse.json({ error: "Coupon code required" }, { status: 400 })
  }

  if (await isChaosActive("weak-crypto")) {
    // BUG: MD5 hash for coupon validation — weak and reversible
    const hash = crypto.createHash("md5").update(code).digest("hex")
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, hash))
      .limit(1)

    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon" }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      discountPercent: coupon.discountPercent,
    })
  }

  // CORRECT: Direct comparison (coupons aren't secrets)
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.toUpperCase()))
    .limit(1)

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: "Invalid coupon" }, { status: 400 })
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: "Coupon has expired" }, { status: 400 })
  }

  if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
    return NextResponse.json(
      { error: "Coupon usage limit reached" },
      { status: 400 }
    )
  }

  return NextResponse.json({
    valid: true,
    discountPercent: coupon.discountPercent,
    code: coupon.code,
  })
}
