import { beforeEach, describe, expect, it, vi } from "vitest"

const getServerSessionMock = vi.fn()
const isChaosActiveMock = vi.fn()
const ordersInsertReturningMock = vi.fn()
const orderItemsInsertValuesMock = vi.fn()
const ordersInsertValuesMock = vi.fn(() => ({ returning: ordersInsertReturningMock }))
const dbInsertMock = vi.fn((table: unknown) => {
  if (table === "orders_table") {
    return { values: ordersInsertValuesMock }
  }

  if (table === "order_items_table") {
    return { values: orderItemsInsertValuesMock }
  }

  throw new Error(`Unexpected table: ${String(table)}`)
})

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}))

vi.mock("@/lib/auth/config", () => ({
  authOptions: {},
}))

vi.mock("@/lib/chaos/toggles", () => ({
  isChaosActive: isChaosActiveMock,
}))

vi.mock("@/lib/db", () => ({
  db: {
    insert: dbInsertMock,
  },
}))

vi.mock("@/lib/db/schema", () => ({
  orders: "orders_table",
  orderItems: "order_items_table",
  products: "products_table",
  cartItems: "cart_items_table",
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  sql: vi.fn(),
}))

describe("POST /api/checkout regression", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    getServerSessionMock.mockResolvedValue({ user: { id: "u_test" } })
    isChaosActiveMock.mockImplementation(async (flag: string) => flag === "null-checkout")
    ordersInsertReturningMock.mockResolvedValue([{ id: "ord_123" }])
    orderItemsInsertValuesMock.mockResolvedValue(undefined)
  })

  it("does not throw when shippingAddress is omitted and persists empty normalized fields", async () => {
    const { POST } = await import("./route")

    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        couponCode: null,
      }),
    })

    const response = await POST(req)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ orderId: "ord_123", status: "processing" })
    expect(ordersInsertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u_test",
        total: 19.99,
        shippingAddress: expect.objectContaining({ city: "", zip: "" }),
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

  it("still normalizes provided shippingAddress fields", async () => {
    const { POST } = await import("./route")

    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        couponCode: null,
        shippingAddress: { city: "seattle", zip: " 98101 " },
      }),
    })

    const response = await POST(req)

    expect(response.status).toBe(200)
    expect(ordersInsertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shippingAddress: expect.objectContaining({ city: "SEATTLE", zip: "98101" }),
      })
    )
  })
})
