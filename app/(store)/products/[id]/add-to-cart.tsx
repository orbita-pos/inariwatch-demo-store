"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function AddToCartButton({
  productId,
  disabled,
}: {
  productId: string
  disabled: boolean
}) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const router = useRouter()

  const handleAdd = async () => {
    if (!session) {
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      })
      if (res.ok) {
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleAdd}
      disabled={disabled || loading}
      className={`mt-6 w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
        disabled
          ? "bg-gray-300 cursor-not-allowed"
          : added
          ? "bg-green-600"
          : "bg-orange-600 hover:bg-orange-700"
      }`}
    >
      {loading ? "Adding..." : added ? "Added to Cart!" : disabled ? "Out of Stock" : "Add to Cart"}
    </button>
  )
}
