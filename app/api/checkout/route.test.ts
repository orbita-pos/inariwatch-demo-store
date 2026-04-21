import { beforeEach, describe, expect, it, vi } from "vitest"

const getServerSessionMock = vi.fn()
const isChaosActiveMock = vi.fn()
const ordersInsertValuesMock = vi.fn()
const orderItemsInsertValuesMock = vi.fn()

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
  orders: { id: "id" },
  orderItems: {},
  products: {},
  cartItems: {},
}))

vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn((table: unknown) => {
      if (table && typeof table === "object" && "id" in (table as Record<string, unknown>)) {
        return { values: ordersInsertValuesMock }
      }
      return { values: orderItemsInsertValuesMock }
    }),
    transaction: vi.fn(),
  },
}))

describe("POST /api/checkout regression", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getServerSessionMock.mockResolvedValue({ user: { id: "u_test" } })
    isChaosActiveMock.mockImplementation(async (flag: string) => flag === "null-checkout")

    ordersInsertValuesMock.mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: "ord_123" }]),
    })

    orderItemsInsertValuesMock.mockResolvedValue(undefined)
  })

  it("does not throw when shippingAddress is omitted and stores null shippingAddress", async () => {
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
        shippingAddress: null,
        status: "pending",
      })
    )
  })

  it("normalizes city and zip when shippingAddress is provided", async () => {
    const { POST } = await import("./route")

    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        shippingAddress: {
          line1: "123 Main St",
          city: "seattle",
          zip: " 98101 ",
        },
        couponCode: null,
      }),
    })

    const response = await POST(req)

    expect(response.status).toBe(200)
    expect(ordersInsertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shippingAddress: expect.objectContaining({
          line1: "123 Main St",
          city: "SEATTLE",
          zip: "98101",
        }),
      })
    )
  })
})
