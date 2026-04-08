import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const all = await db.select().from(products)
  return NextResponse.json(all)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { name, description, price, imageUrl, stock, category } = body

  if (!name || !description || !price || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const [product] = await db
    .insert(products)
    .values({ name, description, price: Math.round(price), imageUrl, stock: stock || 0, category })
    .returning()

  return NextResponse.json(product, { status: 201 })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "Product id required" }, { status: 400 })
  }

  if (updates.price) updates.price = Math.round(updates.price)

  await db.update(products).set(updates).where(eq(products.id, id))

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Product id required" }, { status: 400 })
  }

  await db.update(products).set({ isActive: false }).where(eq(products.id, id))

  return NextResponse.json({ success: true })
}
