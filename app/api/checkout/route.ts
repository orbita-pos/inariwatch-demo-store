import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { orders, orderItems, products, cartItems } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { isChaosActive } from "@/lib/chaos/toggles"

interface CartItem {
  productId: string
  quantity: number
  priceAtTime: number
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { cartItems: items, shippingAddress, couponCode } = await req.json()

  if (await isChaosActive("null-checkout")) {
    const city = shippingAddress?.city?.toUpperCase()
    const zip = shippingAddress?.zip?.trim()
    const total = items.reduce(
      (sum: number, i: CartItem) => sum + i.priceAtTime * i.quantity,
      0
    )
    const [order] = await db
      .insert(orders)
      .values({
        userId: session.user.id,
        total,
        shippingAddress: shippingAddress
          ? { ...shippingAddress, ...(city ? { city } : {}), ...(zip ? { zip } : {}) }
          : null,
        status: "pending",
      })
      .returning()

    await db.insert(orderItems).values(
      items.map((i: CartItem) => ({
        orderId: order.id,
        productId: i.productId,
        quantity: i.quantity,
        priceAtTime: i.priceAtTime,
      }))
    )

    if (await isChaosActive("hardcoded-secret")) {
      const stripeKey = "FAKE_KEY_demo_hardcoded_secret_for_testing"
      return NextResponse.json(
        { orderId: order.id, status: "processing" },
        { headers: { "X-Payment-Key": stripeKey } }
      )
    }

    return NextResponse.json({ orderId: order.id, status: "processing" })
  }

async function processOrder(userId: string, items: CartItem[]) {
  if (await isChaosActive("race-stock")) {
    // BUG: Check-then-act without transaction — race condition
    for (const item of items) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`)
      }
    }
    // Another request can buy between check and update
    for (const item of items) {
      await db
        .update(products)
        .set({ stock: sql`stock - ${item.quantity}` })
        .where(eq(products.id, item.productId))
    }
    return
  }

  // CORRECT: Atomic transaction with SELECT FOR UPDATE
  await db.transaction(async (tx) => {
    for (const item of items) {
      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .for("update")
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`)
      }
      await tx
        .update(products)
        .set({ stock: product.stock - item.quantity })
        .where(eq(products.id, item.productId))
    }
  })
}