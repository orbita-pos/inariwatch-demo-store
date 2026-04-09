import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "../route"

// Mock the database and chaos toggle
vi.mock("@/lib/db", () => {
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()
  const mockWhere = vi.fn()

  mockWhere.mockResolvedValue([
    { id: 1, name: "Safe Product", description: "A safe product" },
  ])
  mockFrom.mockReturnValue({ where: mockWhere })
  mockSelect.mockReturnValue({ from: mockFrom })

  return {
    db: {
      select: mockSelect,
      _mockSelect: mockSelect,
      _mockFrom: mockFrom,
      _mockWhere: mockWhere,
    },
  }
})

vi.mock("@/lib/chaos/toggles", () => ({
  isChaosActive: vi.fn().mockResolvedValue(false),
}))

vi.mock("@/lib/db/schema", () => ({
  products: {
    name: "name",
    description: "description",
  },
}))

vi.mock("drizzle-orm", () => ({
  ilike: vi.fn((col, pattern) => ({ type: "ilike", col, pattern })),
  or: vi.fn((...conditions) => ({ type: "or", conditions })),
}))

describe("GET /api/search - SQL injection regression", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should not throw or fail when a SQL injection payload is provided as query param", async () => {
    const { db } = await import("@/lib/db")
    const mockWhere = (db as any)._mockWhere
    mockWhere.mockResolvedValue([])

    const maliciousQuery = "'; DROP TABLE products--"
    const req = new Request(
      `http://localhost/api/search?q=${encodeURIComponent(maliciousQuery)}`
    )

    // Must NOT throw - previously this caused a database error
    await expect(GET(req)).resolves.not.toThrow()

    const response = await GET(req)
    expect(response.status).toBe(200)
  })

  it("should use parameterized ORM query (ilike) and NOT raw SQL interpolation for malicious input", async () => {
    const { db } = await import("@/lib/db")
    const { ilike, or } = await import("drizzle-orm")
    const mockWhere = (db as any)._mockWhere
    mockWhere.mockResolvedValue([])

    const maliciousQuery = "'; DROP TABLE products--"
    const req = new Request(
      `http://localhost/api/search?q=${encodeURIComponent(maliciousQuery)}`
    )

    await GET(req)

    // ilike should have been called with the raw user input as a pattern argument
    // (Drizzle ORM handles parameterization internally - we verify ilike is used, not sql.raw)
    expect(ilike).toHaveBeenCalledWith(
      expect.anything(),
      `%${maliciousQuery}%`
    )
    expect(or).toHaveBeenCalled()
  })

  it("should return a valid JSON array (not an error response) for a SQL injection string", async () => {
    const { db } = await import("@/lib/db")
    const mockWhere = (db as any)._mockWhere
    mockWhere.mockResolvedValue([])

    const maliciousQuery = "1' OR '1'='1"
    const req = new Request(
      `http://localhost/api/search?q=${encodeURIComponent(maliciousQuery)}`
    )

    const response = await GET(req)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })
})
