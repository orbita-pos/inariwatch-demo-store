import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { ilike, or } from 'drizzle-orm'

// Mock the database module
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
  ilike: vi.fn((field, pattern) => ({ type: 'ilike', field, pattern })),
  or: vi.fn((...conditions) => ({ type: 'or', conditions })),
}))

describe('GET /api/search', () => {
  const mockFrom = vi.fn()
  const mockWhere = vi.fn()
  const mockSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mockWhere.mockResolvedValue([])
    mockFrom.mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom })
  })

  it('uses parameterized query (ilike) instead of raw string interpolation for normal search', async () => {
    const req = new Request('http://localhost/api/search?q=shoes')
    await GET(req)

    expect(ilike).toHaveBeenCalledWith(products.name, '%shoes%')
    expect(ilike).toHaveBeenCalledWith(products.description, '%shoes%')
    expect(or).toHaveBeenCalled()
    // Verify .where() was called with the ORM condition, not a raw string
    const whereArg = mockWhere.mock.calls[0][0]
    expect(typeof whereArg).not.toBe('string')
  })

  it('does not execute raw SQL when input contains SQL injection payload', async () => {
    const maliciousInput = "'; DROP TABLE products--"
    const req = new Request(
      `http://localhost/api/search?q=${encodeURIComponent(maliciousInput)}`
    )

    await GET(req)

    // ilike should have been called with the malicious string as a literal pattern value
    expect(ilike).toHaveBeenCalledWith(
      products.name,
      `%${maliciousInput}%`
    )
    expect(ilike).toHaveBeenCalledWith(
      products.description,
      `%${maliciousInput}%`
    )

    // The where clause must use the ORM-built condition object, never a raw string
    const whereArg = mockWhere.mock.calls[0][0]
    expect(typeof whereArg).not.toBe('string')
    // Ensure the raw malicious SQL was NOT passed directly to .where() as a string
    expect(whereArg).not.toContain?.('DROP TABLE')
  })

  it('returns empty array and skips query when search term is blank', async () => {
    const req = new Request('http://localhost/api/search?q=')
    const response = await GET(req)
    const body = await response.json()

    expect(body).toEqual([])
    // db.select should NOT have been called for empty query
    expect(db.select).not.toHaveBeenCalled()
  })
})
