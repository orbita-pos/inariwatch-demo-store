import { beforeEach, describe, expect, it, vi } from "vitest"

const getServerSession = vi.fn()
const isChaosActive = vi.fn()
const jsonMock = vi.fn()
const insertValuesMock = vi.fn()
const insertReturningMock = vi.fn()
const dbInsertMock = vi.fn()

vi.mock("next-auth", () => ({
  getServerSession,
}))

vi.mock("@/lib/auth/config", () => ({
  authOptions: {},
}))

vi.mock("@/lib/chaos/toggles", () => ({
  isChaosActive,
}))

vi.mock("next/server", () => ({
  NextResponse: {
    json: jsonMock,
  },
}))

vi.mock("@/lib/db/schema", () => ({
  orders: { __table: "orders" },
  orderItems: { __table: "orderItems" },
  products: { __table: "products" },
  cartItems: { __table: "cartItems" },
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  sql: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    insert: dbInsertMock,
    transaction: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}))

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    getServerSession.mockResolvedValue({ user: { id: "u_test" } })
    isChaosActive.mockImplementation(async (flag: string) => flag === "null-checkout")
    jsonMock.mockImplementation((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }))

    insertReturningMock.mockResolvedValue([{ id: "o_123" }])
    insertValuesMock.mockReturnValue({
      returning: insertReturningMock,
    })
    dbInsertMock.mockImplementation((table: { __table: string }) => {
      if (table.__table === "orders") {
        return { values: insertValuesMock }
      }
      if (table.__table === "orderItems") {
        return { values: vi.fn().mockResolvedValue(undefined) }
      }
      throw new Error(`Unexpected table: ${table.__table}`)
    })
  })

  it("does not throw when shippingAddress is omitted and stores null shippingAddress", async () => {
    const { POST } = await import("./route")

    const req = {
      json: vi.fn().mockResolvedValue({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        couponCode: null,
      }),
    } as unknown as Request

    await expect(POST(req)).resolves.toEqual(
      expect.objectContaining({ status: 200 })
    )

    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u_test",
        total: 19.99,
        shippingAddress: null,
        status: "pending",
      })
    )
  })

  it("normalizes city and zip when shippingAddress is provided", async () => {
    const { POST } = await import("./route")

    const req = {
      json: vi.fn().mockResolvedValue({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        shippingAddress: {
          city: "seattle",
          zip: " 98101 ",
          line1: "123 Pike St",
        },
        couponCode: null,
      }),
    } as unknown as Request

    await POST(req)

    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shippingAddress: {
          city: "SEATTLE",
          zip: "98101",
          line1: "123 Pike St",
        },
      })
    )
  })
})
