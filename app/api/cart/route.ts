import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { cartItems, products } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { isChaosActive } from "@/lib/chaos/toggles"

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    if (typeof source[key] === "object" && source[key] !== null) {
      target[key] = deepMerge(
        (target[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      )
    } else {
      target[key] = source[key]
    }
  }
  return target
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const items = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      productId: cartItems.productId,
      name: products.name,
      price: products.price,
      imageUrl: products.imageUrl,
      stock: products.stock,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, session.user.id))

  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  if (await isChaosActive("prototype-pollution")) {
    // BUG: Deep merge without sanitization allows __proto__ injection
    const defaults = { quantity: 1, notes: "" }
    const merged = deepMerge(defaults as Record<string, unknown>, body)
    return NextResponse.json(merged)
  }

  // CORRECT: Only pick known fields
  const { productId, quantity = 1 } = body
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 })
  }

  // Check if already in cart
  const [existing] = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.userId, session.user.id),
        eq(cartItems.productId, productId)
      )
    )
    .limit(1)

  if (existing) {
    await db
      .update(cartItems)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(cartItems.id, existing.id))
  } else {
    await db.insert(cartItems).values({
      userId: session.user.id,
      productId,
      quantity,
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get("id")

  if (itemId) {
    await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.id, Number(itemId)),
          eq(cartItems.userId, session.user.id)
        )
      )
  } else {
    await db.delete(cartItems).where(eq(cartItems.userId, session.user.id))
  }

  return NextResponse.json({ success: true })
}
