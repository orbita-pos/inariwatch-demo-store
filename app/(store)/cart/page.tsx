"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface CartItem {
  id: number
  quantity: number
  productId: string
  name: string
  price: number
  imageUrl: string | null
  stock: number
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export default function CartPage() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
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

  const removeItem = async (id: number) => {
    await fetch(`/api/cart?id=${id}`, { method: "DELETE" })
    setItems(items.filter((i) => i.id !== id))
  }

  const clearCart = async () => {
    await fetch("/api/cart", { method: "DELETE" })
    setItems([])
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading cart...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link
            href="/"
            className="text-orange-600 hover:underline font-medium"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl text-gray-400">📦</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.productId}`}
                    className="font-medium text-sm hover:text-orange-600"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    Qty: {item.quantity} x {formatPrice(item.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Subtotal</span>
              <span className="text-xl font-bold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearCart}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Clear Cart
              </button>
              <Link
                href="/checkout"
                className="flex-1 py-2 bg-orange-600 text-white text-center rounded-lg text-sm hover:bg-orange-700 font-medium"
              >
                Checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
