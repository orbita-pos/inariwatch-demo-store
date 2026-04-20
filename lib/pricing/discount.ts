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
  const validation = await validateCoupon(couponCode)

  if (!validation) {
    return {
      subtotal: cart.subtotal,
      discountApplied: 0,
      total: cart.subtotal,
      couponCode: null,
    }
  }

  const discountAmount = cart.subtotal * validation.discount

  return {
    subtotal: cart.subtotal,
    discountApplied: discountAmount,
    total: cart.subtotal - discountAmount,
    couponCode: validation.code,
  }
}