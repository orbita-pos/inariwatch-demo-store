import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { products, reviews, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  const productReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userName: users.name,
      userId: reviews.userId,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, id))

  return NextResponse.json({ ...product, reviews: productReviews })
}
