import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { chaosToggles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const toggles = await db.select().from(chaosToggles)
  return NextResponse.json(toggles)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { bugId, isActive } = await req.json()

  if (!bugId) {
    return NextResponse.json({ error: "bugId required" }, { status: 400 })
  }

  await db
    .update(chaosToggles)
    .set({
      isActive: Boolean(isActive),
      activatedAt: isActive ? new Date() : null,
      activatedBy: isActive ? session.user.id : null,
    })
    .where(eq(chaosToggles.bugId, bugId))

  return NextResponse.json({ success: true, bugId, isActive })
}
