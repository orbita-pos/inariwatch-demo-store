import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "../route"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { ilike, or } from "drizzle-orm"

// Mock the database module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}))

vi.mock("@/lib/db/schema", () => ({
  products: {
    name: "name",
    description: "description",
  },
}))

vi.mock("drizzle-orm", () => ({
  ilike: vi.fn((field, value) => ({ type: "ilike", field, value })),
  or: vi.fn((...conditions) => ({ type: "or", conditions })),
}))

describe("GET /api/search - SQL injection prevention", () => {
  let mockWhere: ReturnType<typeof vi.fn>
  let mockFrom: ReturnType<typeof vi.fn>
  let mockSelect: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockWhere = vi.fn().mockResolvedValue([])
    mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
    mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

    vi.mocked(db.select).mockReturnValue(mockSelect() as any)
    // Reset to use the chain properly
    vi.mocked(db).select = vi.fn().mockReturnValue({
      from: mockFrom,
    })
    mockFrom.mockReturnValue({ where: mockWhere })
    mockWhere.mockResolvedValue([])
  })

  it("should use parameterized ilike() calls instead of raw SQL interpolation for a SQL injection payload", async () => {
    const injectionPayload = "'; DROP TABLE products--"
    const req = new Request(
      `http://localhost/api/search?q=${encodeURIComponent(injectionPayload)}`
    )

    const response = await GET(req)

    expect(response.status).toBe(200)

    // Verify ilike was called with the raw user input as a value argument (parameterized)
    // not embedded in a raw SQL string
    expect(ilike).toHaveBeenCalledWith(
      products.name,
      `%${injectionPayload}%`
    )
    expect(ilike).toHaveBeenCalledWith(
      products.description,
      `%${injectionPayload}%`
    )

    // Verify or() was called to compose the conditions (ORM-level, not raw SQL)
    expect(or).toHaveBeenCalled()

    // Verify .where() was called with the composed ORM condition
    expect(mockWhere).toHaveBeenCalledWith(
      expect.objectContaining({ type: "or" })
    )
  })

  it("should return an empty array when the query string is blank (no SQL executed)", async () => {
    const req = new Request("http://localhost/api/search?q=")

    const response = await GET(req)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual([])

    // The database should NOT have been queried at all for an empty search
    expect(db.select).not.toHaveBeenCalled()
  })

  it("should pass user input only as a bound parameter value, never building raw SQL strings", async () => {
    const maliciousQuery = "1' OR '1'='1"
    const req = new Request(
      `http://localhost/api/search?q=${encodeURIComponent(maliciousQuery)}`
    )

    await GET(req)

    // The key assertion: ilike() must receive the user input as a plain string value.
    // If the old vulnerable code path (sql`...${q}...`) were used, ilike would never be called.
    const ilikeMock = vi.mocked(ilike)
    expect(ilikeMock).toHaveBeenCalledTimes(2)

    const firstCall = ilikeMock.mock.calls[0]
    const secondCall = ilikeMock.mock.calls[1]

    // The second argument must be the interpolated pattern string passed as a VALUE,
    // confirming drizzle-orm's parameterization is used rather than raw string injection.
    expect(firstCall[1]).toBe(`%${maliciousQuery}%`)
    expect(secondCall[1]).toBe(`%${maliciousQuery}%`)
  })
})
