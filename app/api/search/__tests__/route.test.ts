import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { db } from '@/lib/db'
import { isChaosActive } from '@/lib/chaos/toggles'

vi.mock('@/lib/chaos/toggles', () => ({
  isChaosActive: vi.fn(),
}))

vi.mock('@/lib/db', () => {
  const executeMock = vi.fn()
  const selectMock = vi.fn()
  return {
    db: {
      execute: executeMock,
      select: selectMock,
    },
  }
})

const mockedIsChaosActive = vi.mocked(isChaosActive)
const mockedDb = vi.mocked(db)

function makeRequest(q: string): Request {
  return new Request(`http://localhost/api/search?q=${encodeURIComponent(q)}`)
}

describe('GET /api/search - SQL injection prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should NOT interpolate malicious input directly into SQL string in chaos mode', async () => {
    mockedIsChaosActive.mockResolvedValue(true)

    const maliciousInput = "'; DROP TABLE products--"
    const capturedCalls: any[] = []

    // Capture what is passed to db.execute
    mockedDb.execute = vi.fn().mockImplementation((query: any) => {
      capturedCalls.push(query)
      return Promise.resolve({ rows: [] })
    }) as any

    const req = makeRequest(maliciousInput)
    const response = await GET(req)
    expect(response.status).toBe(200)

    // Verify db.execute was called
    expect(capturedCalls.length).toBe(1)

    const executedQuery = capturedCalls[0]

    // The sql template tag from drizzle-orm produces an object with `queryChunks` or `params`
    // The raw SQL string should NOT contain the malicious payload directly concatenated
    // instead it should be passed as a parameterized value.
    // Drizzle's sql`` tagged template produces an object (not a plain string).
    expect(typeof executedQuery).toBe('object')
    expect(executedQuery).not.toBeNull()

    // The query chunks/SQL string portion should NOT contain the malicious string directly
    const queryString: string = executedQuery?.queryChunks
      ?.filter((chunk: any) => typeof chunk === 'string')
      ?.join('') ??
      executedQuery?.sql ??
      ''

    // If the bug were present, the raw SQL string would contain the malicious payload
    expect(queryString).not.toContain(maliciousInput)
    expect(queryString).not.toContain('DROP TABLE')
  })

  it('should pass malicious search term as a parameter (not inline SQL) in chaos mode', async () => {
    mockedIsChaosActive.mockResolvedValue(true)

    const maliciousInput = "'; DROP TABLE products--"
    const expectedPattern = `%${maliciousInput}%`
    const capturedCalls: any[] = []

    mockedDb.execute = vi.fn().mockImplementation((query: any) => {
      capturedCalls.push(query)
      return Promise.resolve({ rows: [{ id: 1, name: 'safe product' }] })
    }) as any

    const req = makeRequest(maliciousInput)
    const response = await GET(req)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(Array.isArray(body)).toBe(true)

    expect(capturedCalls.length).toBe(1)

    const executedQuery = capturedCalls[0]

    // With the fix, drizzle's sql`` tag places values in a `params` array
    // rather than concatenating them into the SQL string.
    // The params should contain the search pattern with the malicious string.
    const params: any[] = executedQuery?.params ?? []
    // The malicious value should appear as a bound parameter
    expect(params).toContain(expectedPattern)
  })

  it('should return empty array for empty query without hitting the database', async () => {
    mockedIsChaosActive.mockResolvedValue(false)

    mockedDb.execute = vi.fn() as any
    ;(mockedDb.select as any) = vi.fn()

    const req = makeRequest('')
    const response = await GET(req)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual([])

    // Database should not be called for empty queries
    expect(mockedDb.execute).not.toHaveBeenCalled()
  })
})
