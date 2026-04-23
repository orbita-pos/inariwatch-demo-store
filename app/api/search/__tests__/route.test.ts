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

describe("GET /api/search", () => {
  const mockWhere = vi.fn()
  const mockFrom = vi.fn()
  const mockSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mockWhere.mockResolvedValue([])
    mockFrom.mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom })
    mockFrom.mockReturnValue({ where: mockWhere })
  })

  it("uses parameterized ilike queries instead of raw string interpolation for SQL injection payload", async () => {
    const sqlInjectionPayload = "'; DROP TABLE products--"
    const req = new Request(
      `http://localhost/api/search?q=${encodeURIComponent(sqlInjectionPayload)}`
    )

    mockWhere.mockResolvedValue([])

    const response = await GET(req)

    expect(response.status).toBe(200)

    // Verify ilike was called with the raw user input as a parameter (not interpolated into SQL)
    expect(ilike).toHaveBeenCalledWith(
      products.name,
      `%${sqlInjectionPayload}%`
    )
    expect(ilike).toHaveBeenCalledWith(
      products.description,
      `%${sqlInjectionPayload}%`
    )

    // Verify or() was used to compose the parameterized conditions
    expect(or).toHaveBeenCalled()

    // Verify the query was built using Drizzle ORM's safe query builder
    expect(db.select).toHaveBeenCalled()
    expect(mockFrom).toHaveBeenCalledWith(products)
    expect(mockWhere).toHaveBeenCalled()
  })

  it("returns empty array when query string is blank (no unnecessary DB call)", async () => {
    const req = new Request("http://localhost/api/search?q=")

    const response = await GET(req)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual([])
    // DB should NOT be queried for empty search terms
    expect(db.select).not.toHaveBeenCalled()
  })

  it("safely handles classic SQL injection string and returns JSON without throwing", async () => {
    const classicInjection = "' OR '1'='1"
    const req = new Request(
      `http://localhost/api/search?q=${encodeURIComponent(classicInjection)}`
    )

    mockWhere.mockResolvedValue([{ id: 1, name: "Safe Product", description: "desc" }])

    const response = await GET(req)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(body)).toBe(true)

    // The injection string must be passed as a bound parameter to ilike, never raw SQL
    expect(ilike).toHaveBeenCalledWith(products.name, `%${classicInjection}%`)
    expect(ilike).toHaveBeenCalledWith(products.description, `%${classicInjection}%`)
  })
})
