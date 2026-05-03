import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const name = url.searchParams.get("name") ?? ""

  return NextResponse.json({
    ok: true,
    message: name.toUpperCase(),
  })
}
