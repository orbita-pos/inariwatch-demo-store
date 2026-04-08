import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { chaosToggles, orders, orderItems, reviews, cartItems } from "@/lib/db/schema"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Reset all chaos toggles
  await db
    .update(chaosToggles)
    .set({ isActive: false, activatedAt: null, activatedBy: null })

  // Clear demo data (orders, reviews, cart)
  await db.delete(orderItems)
  await db.delete(orders)
  await db.delete(reviews)
  await db.delete(cartItems)

  return NextResponse.json({ success: true, message: "Demo reset complete" })
}
