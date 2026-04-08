import { NextResponse } from "next/server"
import { isChaosActive } from "@/lib/chaos/toggles"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url") || "/"

  if (await isChaosActive("open-redirect")) {
    // BUG: Redirects to any URL without validation
    return NextResponse.redirect(url)
  }

  // CORRECT: Only allow relative paths
  const safeUrl = url.startsWith("/") && !url.startsWith("//") ? url : "/"
  return NextResponse.redirect(new URL(safeUrl, req.url))
}
