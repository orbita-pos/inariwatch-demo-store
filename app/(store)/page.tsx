export const dynamic = "force-dynamic"

import Link from "next/link"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

const categoryColors: Record<string, string> = {
  stickers: "bg-purple-100 text-purple-700",
  mugs: "bg-blue-100 text-blue-700",
  "t-shirts": "bg-green-100 text-green-700",
  accessories: "bg-amber-100 text-amber-700",
}

export default async function HomePage() {
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))

  const categories = [...new Set(allProducts.map((p) => p.category))]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">InariWatch Demo Store</h1>
        <p className="text-gray-600 mt-2">
          A sticker shop powered by intentional bugs. Toggle them on from the{" "}
          <Link href="/admin/chaos" className="text-red-600 hover:underline font-medium">
            Chaos Panel
          </Link>{" "}
          and watch InariWatch detect, diagnose, and fix them automatically.
        </p>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6">
        {categories.map((cat) => (
          <span
            key={cat}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${categoryColors[cat] || "bg-gray-100 text-gray-700"}`}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {allProducts.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-square bg-gray-100 flex items-center justify-center p-6">
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-4xl text-gray-400">
                  {product.category === "stickers" && "🏷️"}
                  {product.category === "mugs" && "☕"}
                  {product.category === "t-shirts" && "👕"}
                  {product.category === "accessories" && "🎧"}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-sm group-hover:text-orange-600 transition-colors">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-lg">{formatPrice(product.price)}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    product.stock > 10
                      ? "bg-green-100 text-green-700"
                      : product.stock > 0
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {product.stock > 10
                    ? "In Stock"
                    : product.stock > 0
                    ? `Only ${product.stock} left`
                    : "Out of Stock"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
