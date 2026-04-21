import { beforeEach, describe, expect, it, vi } from "vitest"

const getServerSessionMock = vi.fn()
const isChaosActiveMock = vi.fn()
const ordersValuesMock = vi.fn()
const orderItemsValuesMock = vi.fn()
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
  orders: { __name: "orders" },
  orderItems: { __name: "orderItems" },
  products: { __name: "products" },
  cartItems: { __name: "cartItems" },
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

    getServerSessionMock.mockResolvedValue({ user: { id: "u_test" } })
    isChaosActiveMock.mockImplementation(async (flag: string) => flag === "null-checkout")

    ordersValuesMock.mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: "ord_123" }]),
    })
    orderItemsValuesMock.mockResolvedValue(undefined)

    dbInsertMock.mockImplementation((table: { __name?: string }) => {
      if (table?.__name === "orders") {
        return { values: ordersValuesMock }
      }
      if (table?.__name === "orderItems") {
        return { values: orderItemsValuesMock }
      }
      throw new Error("Unexpected table")
    })
  })

  it("does not throw when shippingAddress is omitted and returns a successful response", async () => {
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

    expect(res.status).toBeLessThan(500)
    expect(ordersValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u_test",
        total: 19.99,
        shippingAddress: {
          city: "",
          zip: "",
        },
        status: "pending",
      })
    )
  })

  it("normalizes provided shippingAddress city and zip without crashing", async () => {
    const { POST } = await import("./route")

    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        shippingAddress: { city: "seattle", zip: " 98101 " },
        couponCode: null,
      }),
    })

    const res = await POST(req)

    expect(res.status).toBeLessThan(500)
    expect(ordersValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shippingAddress: {
          city: "SEATTLE",
          zip: "98101",
        },
      })
    )
  })
})
