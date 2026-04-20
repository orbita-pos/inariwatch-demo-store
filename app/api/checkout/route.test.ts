import { beforeEach, describe, expect, it, vi } from "vitest"

const jsonMock = vi.fn()
const getServerSessionMock = vi.fn()
const isChaosActiveMock = vi.fn()

vi.mock("next/server", () => ({
  NextResponse: {
    json: jsonMock,
  },
}))

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
    transaction: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  },
}))

vi.mock("@/lib/db/schema", () => ({
  orders: {},
  orderItems: {},
  products: {},
  cartItems: {},
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  sql: vi.fn(),
}))

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    jsonMock.mockImplementation((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }))
    getServerSessionMock.mockResolvedValue({ user: { id: "u_test" } })
    isChaosActiveMock.mockResolvedValue(false)
  })

  it("returns 400 instead of throwing when shippingAddress is omitted", async () => {
    const { POST } = await import("./route")

    const req = {
      json: vi.fn().mockResolvedValue({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        couponCode: null,
      }),
    } as unknown as Request

    await expect(POST(req)).resolves.toEqual({
      body: { error: "Shipping address with city and zip required" },
      status: 400,
    })

    expect(jsonMock).toHaveBeenCalledWith(
      { error: "Shipping address with city and zip required" },
      { status: 400 }
    )
  })

  it("returns 400 when shippingAddress is present but missing city or zip", async () => {
    const { POST } = await import("./route")

    const req = {
      json: vi.fn().mockResolvedValue({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        shippingAddress: { city: "New York" },
        couponCode: null,
      }),
    } as unknown as Request

    await expect(POST(req)).resolves.toEqual({
      body: { error: "Shipping address with city and zip required" },
      status: 400,
    })
  })
})
