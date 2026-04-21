import { beforeEach, describe, expect, it, vi } from "vitest"

const getServerSessionMock = vi.fn()
const isChaosActiveMock = vi.fn()
const ordersInsertValuesMock = vi.fn()
const orderItemsInsertValuesMock = vi.fn()
const dbInsertMock = vi.fn()
const jsonMock = vi.fn()

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}))

vi.mock("@/lib/auth/config", () => ({
  authOptions: {},
}))

vi.mock("@/lib/chaos/toggles", () => ({
  isChaosActive: isChaosActiveMock,
}))

vi.mock("next/server", () => ({
  NextResponse: {
    json: jsonMock,
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

vi.mock("@/lib/db", () => ({
  db: {
    insert: dbInsertMock,
  },
}))

describe("POST /api/checkout null shippingAddress regression", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getServerSessionMock.mockResolvedValue({ user: { id: "u_test" } })
    isChaosActiveMock.mockImplementation(async (flag: string) => flag === "null-checkout")

    ordersInsertValuesMock.mockResolvedValue([{ id: "ord_123" }])
    orderItemsInsertValuesMock.mockResolvedValue(undefined)

    dbInsertMock.mockImplementation((table: { __name?: string }) => {
      if (table?.__name === "orders") {
        return {
          values: (values: unknown) => {
            ordersInsertValuesMock(values)
            return {
              returning: () => Promise.resolve([{ id: "ord_123" }]),
            }
          },
        }
      }

      if (table?.__name === "orderItems") {
        return {
          values: (values: unknown) => {
            orderItemsInsertValuesMock(values)
            return Promise.resolve(undefined)
          },
        }
      }

      throw new Error(`Unexpected table: ${String(table)}`)
    })

    jsonMock.mockReturnValue({ ok: true })
  })

  it("does not throw when shippingAddress is omitted and persists empty normalized city/zip", async () => {
    const { POST } = await import("./route")

    const req = {
      json: vi.fn().mockResolvedValue({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        couponCode: null,
      }),
    } as unknown as Request

    await expect(POST(req)).resolves.toEqual({ ok: true })

    expect(ordersInsertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u_test",
        total: 19.99,
        status: "pending",
        shippingAddress: {
          city: "",
          zip: "",
        },
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

  it("still normalizes provided shippingAddress city and zip", async () => {
    const { POST } = await import("./route")

    const req = {
      json: vi.fn().mockResolvedValue({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        couponCode: null,
        shippingAddress: {
          line1: "1 Main St",
          city: "seattle",
          zip: " 98101 ",
        },
      }),
    } as unknown as Request

    await POST(req)

    expect(ordersInsertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shippingAddress: {
          line1: "1 Main St",
          city: "SEATTLE",
          zip: "98101",
        },
      })
    )
  })
})
