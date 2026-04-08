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
    // BUG: String concatenation in SQL query
    const results = await db.execute(
      sql.raw(
        `SELECT * FROM products WHERE name ILIKE '%${q}%' OR description ILIKE '%${q}%'`
      )
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
