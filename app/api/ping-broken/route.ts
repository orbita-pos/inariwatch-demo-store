import { NextResponse } from "next/server"

/**
 * Test fixture for InariWatch remediation e2e tests.
 *
 * BUG: when ?name=X is not provided in the query string, `name` is
 * undefined, and calling `.toUpperCase()` on it throws TypeError.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const name = url.searchParams.get("name")
  if (!name) {
    return NextResponse.json({ greeting: "Hello!" });
  }
  return NextResponse.json({
    greeting: `Hello, ${name.toUpperCase()}!`,
  })
}
