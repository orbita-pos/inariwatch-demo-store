import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { ilike, or } from "drizzle-orm"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""

  if (!q.trim()) {
    return NextResponse.json([])
  }

  // SECURE: Always use parameterized queries
  const results = await db
    .select()
    .from(products)
    .where(
      or(
        ilike(products.name, `%${q}%`),
        ilike(products.description, `%${q}%`)
      )
    )
  return NextResponse.json(results)
}
