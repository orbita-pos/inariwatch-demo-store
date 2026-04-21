import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { orders, orderItems, products, cartItems } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { isChaosActive } from "@/lib/chaos/toggles"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { cartItems: items, shippingAddress, couponCode } = await req.json()

  if (await isChaosActive("null-checkout")) {
    const city =
      typeof shippingAddress?.city === "string"
        ? shippingAddress.city.toUpperCase()
        : undefined
    const zip =
      typeof shippingAddress?.zip === "string"
        ? shippingAddress.zip.trim()
        : undefined
    const total = items.reduce(
      (sum: number, i: CartItem) => sum + i.priceAtTime * i.quantity,
      0
    )
    const [order] = await db
      .insert(orders)
      .values({
        userId: session.user.id,
        total,
        shippingAddress: {
          ...(shippingAddress ?? {}),
          ...(city !== undefined ? { city } : {}),
          ...(zip !== undefined ? { zip } : {}),
        },
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

interface CartItem {
  productId: string
  quantity: number
  priceAtTime: number
}
