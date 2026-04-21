import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { products, reviews, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isChaosActive } from "@/lib/chaos/toggles"
import { AddToCartButton } from "./add-to-cart"
import { ReviewForm } from "./review-form"

export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { products, reviews, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isChaosActive } from "@/lib/chaos/toggles"
import { AddToCartButton } from "./add-to-cart"
import { ReviewForm } from "./review-form"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (await isChaosActive("unhandled-promise")) {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
    const productReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: users.name,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.productId, id))

    const p = product[0]
    if (!p) return notFound()

    const avgRating =
      productReviews.length > 0
        ? productReviews.reduce((s, r) => s + r.rating, 0) /
          productReviews.length
        : 0

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
            <span className="text-6xl text-gray-400">
              {p.category === "stickers" && "🏷️"}
              {p.category === "mugs" && "☕"}
              {p.category === "t-shirts" && "👕"}
              {p.category === "accessories" && "🎧"}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{p.name}</h1>
            <p className="text-gray-600 mt-2">{p.description}</p>
            <p className="text-3xl font-bold mt-4">{formatPrice(p.price)}</p>
            <div className="mt-2 flex items-center gap-2">
              <Stars rating={Math.round(avgRating)} />
              <span className="text-sm text-gray-500">
                ({productReviews.length} reviews)
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
            </p>
            <AddToCartButton productId={p.id} disabled={p.stock === 0} />
          </div>
        </div>
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">
            Reviews ({productReviews.length})
          </h2>
          <ReviewForm productId={p.id} />
          <div className="space-y-4 mt-6">
            {productReviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </div>
      </div>
    )
  }

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}