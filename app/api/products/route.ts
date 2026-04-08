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
  const category = searchParams.get("category"), limit = 12

  const headers = await corsHeaders()

  let offset
  if (await isChaosActive("off-by-one")) {
    // BUG: offset is page * limit instead of (page - 1) * limit
    // Page 1 skips first 12 products, page 2 skips 24, etc.
    offset = page * limit
  } else {
    // CORRECT
    offset = (page - 1) * limit
  }

  let query = db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .limit(limit)
    .offset(offset)

  if (category) {
    // Adding parameterized input for added security
    query = query.where(ilike(products.category, category))
  }

  const results = await query

  return NextResponse.json(results, { headers })
}

export async function OPTIONS() {
  const headers = await corsHeaders()
  return new NextResponse(null, { status: 204, headers })
}
