"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface CartItem {
  id: number
  quantity: number
  productId: string
  name: string
  price: number
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [couponError, setCouponError] = useState("")
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
  })
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      fetch("/api/cart")
        .then((r) => r.json())
        .then(setItems)
        .finally(() => setLoading(false))
    }
  }, [status, router])

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discountAmount = Math.round(subtotal * (discount / 100))
  const total = subtotal - discountAmount

  const applyCoupon = async () => {
    setCouponError("")
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode }),
    })
    const data = await res.json()
    if (data.valid) {
      setDiscount(data.discountPercent)
    } else {
      setCouponError(data.error || "Invalid coupon")
      setDiscount(0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            priceAtTime: i.price,
          })),
          shippingAddress: address,
          couponCode: couponCode || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push(`/orders?success=${data.orderId}`)
      } else {
        alert(data.error || "Checkout failed")
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
        {/* Shipping */}
        <div>
          <h2 className="font-semibold mb-4">Shipping Address</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Street address"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              placeholder="City"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="State"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                placeholder="ZIP Code"
                value={address.zip}
                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Coupon */}
          <h2 className="font-semibold mt-6 mb-3">Coupon Code</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={applyCoupon}
              className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900"
            >
              Apply
            </button>
          </div>
          {couponError && (
            <p className="text-red-500 text-xs mt-1">{couponError}</p>
          )}
          {discount > 0 && (
            <p className="text-green-600 text-xs mt-1">
              {discount}% discount applied!
            </p>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({discount}%)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
          >
            {submitting ? "Processing..." : `Place Order (${formatPrice(total)})`}
          </button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            This is a demo store. No real payment will be processed.
          </p>
        </div>
      </form>
    </div>
  )
}
