"use client"

import { Suspense } from "react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface OrderItem {
  id: number
  quantity: number
  priceAtTime: number
  productName: string
}

interface Order {
  id: string
  status: string
  total: number
  shippingAddress: Record<string, string>
  createdAt: string
  items: OrderItem[]
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-8"><p className="text-gray-500">Loading...</p></div>}>
      <OrdersContent />
    </Suspense>
  )
}

function OrdersContent() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const successId = searchParams.get("success")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      fetch("/api/orders")
        .then((r) => r.json())
        .then(setOrders)
        .finally(() => setLoading(false))
    }
  }, [status, router])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

      {successId && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            Order placed successfully!
          </p>
          <p className="text-green-600 text-sm">Order ID: {successId}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No orders yet</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">
                    Order {order.id.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}
                  >
                    {order.status}
                  </span>
                  <span className="font-bold">{formatPrice(order.total)}</span>
                </div>
              </div>
              {order.items && (
                <div className="border-t border-gray-100 pt-2 space-y-1">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm text-gray-600"
                    >
                      <span>
                        {item.productName} x{item.quantity}
                      </span>
                      <span>
                        {formatPrice(item.priceAtTime * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
