import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "../route"
import { db } from "@/lib/db"
import { ilike, or } from "drizzle-orm"
import { products } from "@/lib/db/schema"

// Mock the database module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock("drizzle-orm", () => ({
  ilike: vi.fn((col, pattern) => ({ type: "ilike", col, pattern })),
  or: vi.fn((...args) => ({ type: "or", args })),
}))

vi.mock("@/lib/db/schema", () => ({
  products: {
    name: "products.name",
    description: "products.description",
  },
}))

describe"GET /api/search - SQL injection regression", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-setup the chain mocks after clearing
    const mockWhere = vi.fn().mockResolvedValue([])
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
    ;(db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect)
  })

  it("should use parameterized ilike queries and not interpolate raw SQL strings", async () => {
    const sqlInjectionPayload = "'; DROP TABLE products--"
    const req = new Request(
      `http://localhost/api/search?q=${encodeURIComponent(sqlInjectionPayload)}`
    )

    // Setup fresh chain
    const mockWhere = vi.fn().mockResolvedValue([])
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
    ;(db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect)

    await GET(req)

    // Verify ilike was called with the raw user input as a pattern (parameterized)
    expect(ilike).toHaveBeenCalledWith(
      products.name,
      `%${sqlInjectionPayload}%`
    )
    expect(ilike).toHaveBeenCalledWith(
      products.description,
      `%${sqlInjectionPayload}%`
    )

    // Verify or() was used to compose the conditions
    expect(or).toHaveBeenCalled()

    // Verify .where() was called with the composed condition (not raw SQL)
    expect(mockWhere).toHaveBeenCalledWith(
      expect.objectContaining({ type: "or" })
    )
  })

  it("should return empty array when query is blank", async () => {
    const req = new Request("http://localhost/api/search?q=")
    const response = await GET(req)
    const body = await response.json()

    expect(body).toEqual([])
    // db.select should NOT have been called for an empty query
    expect(db.select).not.toHaveBeenCalled()
  })

  it("should call db with parameterized query for normal search term", async () => {
    const mockWhere = vi.fn().mockResolvedValue([
      { id: 1, name: "Test Product", description: "A great product" },
    ])
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
    ;(db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect)

    const req = new Request("http://localhost/api/search?q=widget")
    const response = await GET(req)
    const body = await response.json()

    expect(ilike).toHaveBeenCalledWith(products.name, "%widget%")
    expect(ilike).toHaveBeenCalledWith(products.description, "%widget%")
    expect(or).toHaveBeenCalled()
    expect(mockWhere).toHaveBeenCalled()
    expect(body).toEqual([
      { id: 1, name: "Test Product", description: "A great product" },
    ])
  })
})
