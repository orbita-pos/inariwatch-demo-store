import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { ilike, or } from 'drizzle-orm'

// Mock drizzle-orm and db to intercept query construction
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}))

vi.mock('@/lib/db/schema', () => ({
  products: {
    name: 'products.name',
    description: 'products.description',
  },
}))

vi.mock('drizzle-orm', () => ({
  ilike: vi.fn((col, pattern) => ({ type: 'ilike', col, pattern })),
  or: vi.fn((...args) => ({ type: 'or', args })),
}))

describe('GET /api/search - SQL injection prevention', () => {
  let mockWhere: ReturnType<typeof vi.fn>
  let mockFrom: ReturnType<typeof vi.fn>
  let mockSelect: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockWhere = vi.fn().mockResolvedValue([])
    mockFrom = vi.fn(() => ({ where: mockWhere }))
    mockSelect = vi.fn(() => ({ from: mockFrom }))

    vi.mocked(db.select).mockImplementation(mockSelect)
  })

  it('should use parameterized ilike expressions and not interpolate raw SQL strings', async () => {
    const maliciousInput = "'; DROP TABLE products--"
    const req = new Request(`http://localhost/api/search?q=${encodeURIComponent(maliciousInput)}`)

    const response = await GET(req)

    expect(response.status).toBe(200)

    // Verify ilike was called with the user input as a pattern argument, not raw SQL
    expect(ilike).toHaveBeenCalledTimes(2)
    expect(ilike).toHaveBeenCalledWith(products.name, `%${maliciousInput}%`)
    expect(ilike).toHaveBeenCalledWith(products.description, `%${maliciousInput}%`)

    // Verify or() wrapped both ilike expressions
    expect(or).toHaveBeenCalledTimes(1)

    // Verify the query was built with .select().from().where() — not raw SQL
    expect(db.select).toHaveBeenCalledTimes(1)
    expect(mockFrom).toHaveBeenCalledWith(products)
    expect(mockWhere).toHaveBeenCalledTimes(1)
  })

  it('should return empty array for blank query without hitting the database', async () => {
    const req = new Request('http://localhost/api/search?q=')

    const response = await GET(req)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual([])

    // Database should never be queried for empty input
    expect(db.select).not.toHaveBeenCalled()
  })

  it('should use parameterized queries for a normal search term', async () => {
    const normalInput = 'laptop'
    const req = new Request(`http://localhost/api/search?q=${normalInput}`)

    const response = await GET(req)

    expect(response.status).toBe(200)

    expect(ilike).toHaveBeenCalledWith(products.name, `%${normalInput}%`)
    expect(ilike).toHaveBeenCalledWith(products.description, `%${normalInput}%`)

    // Ensure the where clause uses the or() result (parameterized), not a raw string
    const orResult = vi.mocked(or).mock.results[0].value
    expect(mockWhere).toHaveBeenCalledWith(orResult)
  })
})
