import { validateCoupon } from "./validators"

/**
 * Apply a coupon discount to a cart subtotal. Used by the
 * `POST /api/discount` endpoint.
 *
 * Relies on `validateCoupon` from ./validators.ts which may return
 * `null` for unknown / expired codes — the caller of THIS function is
 * responsible for surfacing a 4xx when the discount isn't applied,
 * so we just return the subtotal unchanged in that case.
 */

import { validateCoupon } from "./validators"

export async function applyDiscount(cart: Cart, couponCode: string): Promise<DiscountResult> {
  const validation = (await validateCoupon(couponCode))!

  const discountAmount = cart.subtotal * validation.discount

  return {
    subtotal: cart.subtotal,
    discountApplied: discountAmount,
    total: cart.subtotal - discountAmount,
    couponCode: validation.code,
  }
}
