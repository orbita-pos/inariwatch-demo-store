import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { reviews } from "@/lib/db/schema"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { productId, rating, comment } = await req.json()

  if (!productId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "productId and rating (1-5) required" },
      { status: 400 }
    )
  }

  const [review] = await db
    .insert(reviews)
    .values({
      userId: session.user.id,
      productId,
      rating,
      comment: comment || "",
    })
    .returning()

  return NextResponse.json(review, { status: 201 })
}
