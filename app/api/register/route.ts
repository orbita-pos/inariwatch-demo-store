import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    )
  }

  // Check if user exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    )
  }

  const hashedPassword = await hash(password, 10)

  const [user] = await db
    .insert(users)
    .values({ name, email, password: hashedPassword, role: "user" })
    .returning({ id: users.id, name: users.name, email: users.email })

  return NextResponse.json(user, { status: 201 })
}
