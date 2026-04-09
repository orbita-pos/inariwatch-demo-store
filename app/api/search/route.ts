import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { ilike, or, sql } from "drizzle-orm"
import { isChaosActive } from "@/lib/chaos/toggles"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""

  if (!q.trim()) {
    return NextResponse.json([])
  }

  if (await isChaosActive("sql-injection")) {
    // FIXED: Use parameterized query with proper placeholder syntax
    const searchPattern = `%${q}%`
    const results = await db.execute(
      sql`SELECT * FROM "products" WHERE name ILIKE ${searchPattern} OR description ILIKE ${searchPattern}`
    )
    return NextResponse.json(results.rows)
  }

  // CORRECT: Parameterized query
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
