import { beforeEach, describe, expect, it, vi } from "vitest"

const jsonMock = vi.fn((body: unknown, init?: ResponseInit) => ({ body, init }))

vi.mock("next/server", () => ({
  NextResponse: {
    json: jsonMock,
  },
}))

const isChaosActiveMock = vi.fn()
vi.mock("@/lib/chaos", () => ({
  isChaosActive: isChaosActiveMock,
}))

const getServerSessionMock = vi.fn()
vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}))

const returningMock = vi.fn()
const valuesMock = vi.fn(() => ({ returning: returningMock }))
const insertMock = vi.fn(() => ({ values: valuesMock }))

vi.mock("@/db", () => ({
  db: {
    insert: insertMock,
  },
}))

vi.mock("@/db/schema", () => ({
  orders: { __table: "orders" },
  orderItems: { __table: "orderItems" },
}))

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    getServerSessionMock.mockResolvedValue({
      user: { id: "u_test" },
    })

    isChaosActiveMock.mockImplementation(async (flag: string) => flag === "null-checkout")
    returningMock.mockResolvedValue([{ id: "order_123" }])
  })

  it("returns 400 instead of throwing when shippingAddress is omitted during null-checkout chaos", async () => {
    const { POST } = await import("./route")

    const request = {
      json: vi.fn().mockResolvedValue({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        couponCode: null,
      }),
    } as unknown as Request

    await expect(POST(request)).resolves.toEqual({
      body: { error: "Shipping address with city and zip required" },
      init: { status: 400 },
    })

    expect(jsonMock).toHaveBeenCalledWith(
      { error: "Shipping address with city and zip required" },
      { status: 400 }
    )
    expect(insertMock).not.toHaveBeenCalled()
  })

  it("returns 400 when shippingAddress is present but missing city or zip during null-checkout chaos", async () => {
    const { POST } = await import("./route")

    const request = {
      json: vi.fn().mockResolvedValue({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        couponCode: null,
        shippingAddress: { city: "Boston" },
      }),
    } as unknown as Request

    await expect(POST(request)).resolves.toEqual({
      body: { error: "Shipping address with city and zip required" },
      init: { status: 400 },
    })

    expect(insertMock).not.toHaveBeenCalled()
  })
})
