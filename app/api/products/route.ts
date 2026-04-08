import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, ilike } from "drizzle-orm";
import { isChaosActive } from "@/lib/chaos/toggles";

async function corsHeaders(): Promise<Record<string, string>> {
  if (await isChaosActive("cors-wildcard")) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Credentials": "true",
    };
  }

  return {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "https://demo-store.vercel.app",
    "Access-Control-Allow-Methods": "GET, POST",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const limit = 12;

  const headers = await corsHeaders();

  const offset = (page - 1) * limit;
  let query = db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .limit(limit)
    .offset(offset);

  if (search) {
    query = query.where(ilike(products.name, `%${search}%`));
  }

  const results = await query;
  const filtered = category
    ? results.filter((p) => p.category === category)
    : results;

  return NextResponse.json(filtered, { headers });
}

export async function OPTIONS() {
  const headers = await corsHeaders();
  return new NextResponse(null, { status: 204, headers });
}
