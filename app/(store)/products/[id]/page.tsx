export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { products, reviews, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isChaosActive } from "@/lib/chaos/toggles"
import { AddToCartButton } from "./add-to-cart"
import { ReviewForm } from "./review-form"

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-500">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  )
}

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
  userName: string
}

async function ReviewCard({ review }: { review: Review }) {
  if (await isChaosActive("xss-reviews")) {
    // BUG: Renders raw HTML from user input
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{review.userName}</span>
          <Stars rating={review.rating} />
        </div>
        <div
          className="text-sm text-gray-700 mt-2"
          dangerouslySetInnerHTML={{ __html: review.comment || "" }}
        />
      </div>
    )
  }

  // CORRECT: Renders as text
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">{review.userName}</span>
        <Stars rating={review.rating} />
      </div>
      <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
    </div>
  )
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (await isChaosActive("unhandled-promise")) {
    // BUG: No error handling on DB query — unhandled rejection crashes page
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
    // External API call with no error handling
    try {
      const relatedProducts = await fetch(
        `https://api.example.com/related/${id}`
      ).then((r) => r.json())
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
    } catch {
      // Handle fetch failure
      return (
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Could not load related products
          </h1>
          <p className="text-gray-600 mt-2">Please try again later.</p>
        </div>
      )
    }
  }

  // CORRECT: Graceful error handling
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))

    if (!product) return notFound()

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
              {product.category === "stickers" && "🏷️"}
              {product.category === "mugs" && "☕"}
              {product.category === "t-shirts" && "👕"}
              {product.category === "accessories" && "🎧"}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-gray-600 mt-2">{product.description}</p>
            <p className="text-3xl font-bold mt-4">
              {formatPrice(product.price)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Stars rating={Math.round(avgRating)} />
              <span className="text-sm text-gray-500">
                ({productReviews.length} reviews)
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </p>
            <AddToCartButton
              productId={product.id}
              disabled={product.stock === 0}
            />
          </div>
        </div>
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">
            Reviews ({productReviews.length})
          </h2>
          <ReviewForm productId={product.id} />
          <div className="space-y-4 mt-6">
            {productReviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </div>
      </div>
    )
  } catch {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Could not load product
        </h1>
        <p className="text-gray-600 mt-2">Please try again later.</p>
      </div>
    )
  }
}
