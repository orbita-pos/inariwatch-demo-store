import { db } from "@/lib/db"
import { chaosToggles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const cache = new Map<string, { active: boolean; ts: number }>()

export async function isChaosActive(bugId: string): Promise<boolean> {
  const cached = cache.get(bugId)
  if (cached && Date.now() - cached.ts < 5000) return cached.active

  try {
    const [toggle] = await db
      .select()
      .from(chaosToggles)
      .where(eq(chaosToggles.bugId, bugId))
      .limit(1)

    const active = toggle?.isActive ?? false
    cache.set(bugId, { active, ts: Date.now() })
    return active
  } catch {
    return false
  }
}
