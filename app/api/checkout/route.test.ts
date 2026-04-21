import { beforeEach, describe, expect, it, vi } from "vitest"

const getServerSessionMock = vi.fn()
const isChaosActiveMock = vi.fn()
const orderInsertValuesMock = vi.fn()
const orderInsertReturningMock = vi.fn()
const orderItemsInsertValuesMock = vi.fn()
const dbInsertMock = vi.fn()

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}))

vi.mock("@/lib/auth/config", () => ({
  authOptions: {},
}))

vi.mock("@/lib/chaos/toggles", () => ({
  isChaosActive: isChaosActiveMock,
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
  },
}))

describe("POST /api/checkout regression", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getServerSessionMock.mockResolvedValue({ user: { id: "u_test" } })
    isChaosActiveMock.mockImplementation(async (flag: string) => flag === "null-checkout")

    orderInsertReturningMock.mockResolvedValue([{ id: "ord_123" }])
    orderInsertValuesMock.mockReturnValue({
      returning: orderInsertReturningMock,
    })
    orderItemsInsertValuesMock.mockResolvedValue(undefined)

    dbInsertMock.mockImplementation((table: { __table?: string }) => {
      if (table?.__table === "orders") {
        return { values: orderInsertValuesMock }
      }
      if (table?.__table === "orderItems") {
        return { values: orderItemsInsertValuesMock }
      }
      throw new Error(`Unexpected table: ${String(table)}`)
    })
  })

  it("does not throw when shippingAddress is omitted and creates the order with an empty shippingAddress object", async () => {
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
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ orderId: "ord_123", status: "processing" })
    expect(orderInsertValuesMock).toHaveBeenCalledWith({
      userId: "u_test",
      total: 19.99,
      shippingAddress: {},
      status: "pending",
    })
    expect(orderItemsInsertValuesMock).toHaveBeenCalledWith([
      {
        orderId: "ord_123",
        productId: "p_abc",
        quantity: 1,
        priceAtTime: 19.99,
      },
    ])
  })

  it("normalizes provided city and zip when shippingAddress exists", async () => {
    const { POST } = await import("./route")

    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        shippingAddress: {
          line1: "123 Test St",
          city: "seattle",
          zip: " 98101 ",
        },
        couponCode: null,
      }),
    })

    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(orderInsertValuesMock).toHaveBeenCalledWith({
      userId: "u_test",
      total: 19.99,
      shippingAddress: {
        line1: "123 Test St",
        city: "SEATTLE",
        zip: "98101",
      },
      status: "pending",
    })
  })
})
