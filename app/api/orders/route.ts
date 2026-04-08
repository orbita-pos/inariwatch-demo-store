import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { orders, orderItems, products } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { isChaosActive } from "@/lib/chaos/toggles"

export async function GET() {
  if (await isChaosActive("missing-auth")) {
    // BUG: No auth check — returns all orders for all users
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(50)
    return NextResponse.json(allOrders)
  }

  // CORRECT: Require auth, filter by user
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt))

  // Get items for each order
  const ordersWithItems = await Promise.all(
    userOrders.map(async (order) => {
      const items = await db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          priceAtTime: orderItems.priceAtTime,
          productName: products.name,
          productId: orderItems.productId,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id))

      return { ...order, items }
    })
  )

  return NextResponse.json(ordersWithItems)
}
