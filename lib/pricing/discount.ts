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

export interface Cart {
  subtotal: number
  items: { productId: string; quantity: number }[]
}

export interface DiscountResult {
  subtotal: number
  discountApplied: number
  total: number
  couponCode: string | null
}

export async function applyDiscount(cart: Cart, couponCode: string): Promise<DiscountResult> {
  // Dev asserted non-null here during initial build but never came back
  // to wire up the unknown-code branch. See route.ts for the contract.
  const validation = (await validateCoupon(couponCode))!

  const discountAmount = cart.subtotal * validation.discount

  return {
    subtotal: cart.subtotal,
    discountApplied: discountAmount,
    total: cart.subtotal - discountAmount,
    couponCode: validation.code,
  }
}
