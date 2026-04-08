"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8"><p className="text-gray-500">Loading...</p></div>}>
      <SearchContent />
    </Suspense>
  )
}

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!query.trim()) return

    setLoading(true)
    setError("")
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Search failed (${r.status})`)
        return r.json()
      })
      .then(setResults)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [query])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Search Results</h1>
      <p className="text-gray-500 mb-6">
        {query ? `Results for "${query}"` : "Enter a search term"}
      </p>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-800 font-medium">Search Error</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Searching...</p>
      ) : results.length === 0 && query ? (
        <p className="text-gray-500 text-center py-12">No products found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-sm">{product.name}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold">{formatPrice(product.price)}</span>
                <span className="text-xs text-gray-400 capitalize">
                  {product.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
