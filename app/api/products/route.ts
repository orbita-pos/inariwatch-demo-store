import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { eq, ilike } from "drizzle-orm"
import { isChaosActive } from "@/lib/chaos/toggles"

async function corsHeaders(): Promise<Record<string, string>> {
  if (await isChaosActive("cors-wildcard")) {
    // BUG: Wildcard CORS allows any origin
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Credentials": "true",
    }
  }

  // CORRECT: Restrict to known origins
  return {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "https://demo-store.vercel.app",
    "Access-Control-Allow-Methods": "GET, POST",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get("page")) || 1
  const category = searchParams.get("category")
  const nameSearch = searchParams.get("name") || ""
  const descriptionSearch = searchParams.get("description") || ""
  const limit = 12

  const headers = await corsHeaders()

  if (await isChaosActive("off-by-one")) {
    // BUG: offset is page * limit instead of (page - 1) * limit
    // Page 1 skips first 12 products, page 2 skips 24, etc.
    const offset = page * limit
    const results = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .and(ilike(products.name, `%${nameSearch}%`))
      .and(ilike(products.description, `%${descriptionSearch}%`))
      .limit(limit)
      .offset(offset)
    return NextResponse.json(results, { headers })
  }

  // CORRECT
  const offset = (page - 1) * limit
  let query = db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .and(ilike(products.name, `%${nameSearch}%`))
    .and(ilike(products.description, `%${descriptionSearch}%`))
    .limit(limit)
    .offset(offset)

  const results = await query
  const filtered = category
    ? results.filter((p) => p.category === category)
    : results

  return NextResponse.json(filtered, { headers })
}

export async function OPTIONS() {
  const headers = await corsHeaders()
  return new NextResponse(null, { status: 204, headers })
}
