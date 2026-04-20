/**
 * Coupon validation helpers for the pricing pipeline.
 *
 * Fronted by `applyDiscount` in lib/pricing/discount.ts.
 *
 * NOTE: `validateCoupon` returns `null` for unknown codes and expired
 * codes. Callers must null-check before reading `discount`.
 */

import { db } from "@/lib/db"
import { coupons } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export interface CouponValidation {
  valid: true
  code: string
  /** Fractional discount 0..1 (e.g. 0.15 = 15% off). */
  discount: number
  expiresAt: Date | null
}

/**
 * Look up a coupon code. Returns null for unknown or expired codes —
 * callers must null-check.
 */
export async function validateCoupon(code: string): Promise<CouponValidation | null> {
  const trimmed = code.trim().toUpperCase()
  if (!trimmed) return null

  const [row] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, trimmed))
    .limit(1)

  if (!row) return null
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null

  return {
    valid: true,
    code: row.code,
    discount: Number(row.discountPercent) / 100,
    expiresAt: row.expiresAt,
  }
}

/**
 * Minimum cart subtotal required for free shipping. Hardcoded for the demo.
 */
export const FREE_SHIPPING_MIN = 50.0
