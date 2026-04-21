import { beforeEach, describe, expect, it, vi } from "vitest"

const jsonMock = vi.fn((body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "content-type": "application/json" },
  })
)

vi.mock("next/server", () => ({
  NextResponse: {
    json: jsonMock,
  },
}))

const getServerSessionMock = vi.fn()
vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}))

vi.mock("@/lib/auth/config", () => ({
  authOptions: {},
}))

const isChaosActiveMock = vi.fn()
vi.mock("@/lib/chaos/toggles", () => ({
  isChaosActive: isChaosActiveMock,
}))

const ordersInsertReturningMock = vi.fn()
const ordersInsertValuesMock = vi.fn(() => ({
  returning: ordersInsertReturningMock,
}))
const orderItemsInsertValuesMock = vi.fn()
const dbInsertMock = vi.fn((table: { __name?: string }) => {
  if (table?.__name === "orders") {
    return { values: ordersInsertValuesMock }
  }
  if (table?.__name === "orderItems") {
    return { values: orderItemsInsertValuesMock }
  }
  return { values: vi.fn() }
})

vi.mock("@/lib/db", () => ({
  db: {
    insert: dbInsertMock,
  },
}))

vi.mock("@/lib/db/schema", () => ({
  orders: { __name: "orders" },
  orderItems: { __name: "orderItems" },
  products: { __name: "products" },
  cartItems: { __name: "cartItems" },
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  sql: vi.fn(),
}))

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: "u_test" } })
    isChaosActiveMock.mockImplementation(async (flag: string) => flag === "null-checkout")
    ordersInsertReturningMock.mockResolvedValue([{ id: "ord_123" }])
    orderItemsInsertValuesMock.mockResolvedValue(undefined)
  })

  it("returns 400 instead of throwing when shippingAddress is missing", async () => {
    const { POST } = await import("./route")

    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        couponCode: null,
      }),
    })

    const res = await POST(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: "Shipping address is required" })
    expect(dbInsertMock).not.toHaveBeenCalled()
  })

  it("creates the order when shippingAddress is present but city and zip are omitted", async () => {
    const { POST } = await import("./route")

    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        couponCode: null,
        shippingAddress: {
          line1: "123 Test St",
        },
      }),
    })

    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(ordersInsertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u_test",
        total: 19.99,
        shippingAddress: {
          line1: "123 Test St",
          city: undefined,
          zip: undefined,
        },
        status: "pending",
      })
    )
    expect(orderItemsInsertValuesMock).toHaveBeenCalledWith([
      {
        orderId: "ord_123",
        productId: "p_abc",
        quantity: 1,
        priceAtTime: 19.99,
      },
    ])
  })
})
