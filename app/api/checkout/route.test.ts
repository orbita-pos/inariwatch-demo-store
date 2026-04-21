import { beforeEach, describe, expect, it, vi } from "vitest"

const getServerSession = vi.fn()
const jsonResponse = vi.fn((body: unknown, init?: ResponseInit) => ({ body, status: init?.status ?? 200 }))
const isChaosActive = vi.fn()

vi.mock("next-auth", () => ({
  getServerSession,
}))

vi.mock("next/server", () => ({
  NextResponse: {
    json: jsonResponse,
  },
}))

vi.mock("@/lib/auth/config", () => ({
  authOptions: {},
}))

vi.mock("@/lib/chaos/toggles", () => ({
  isChaosActive,
}))

vi.mock("@/lib/db", () => ({
  db: {},
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
    getServerSession.mockResolvedValue({ user: { id: "u_test" } })
    isChaosActive.mockResolvedValue(false)
  })

  it("returns 400 when shippingAddress is omitted instead of throwing on shippingAddress.city", async () => {
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

    expect(jsonResponse).toHaveBeenCalledWith(
      { error: "Shipping address with city and zip required" },
      { status: 400 }
    )
  })

  it("returns 400 when shippingAddress is present but city is missing", async () => {
    const { POST } = await import("./route")

    const req = {
      json: vi.fn().mockResolvedValue({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        shippingAddress: { zip: "10001" },
        couponCode: null,
      }),
    } as unknown as Request

    await expect(POST(req)).resolves.toEqual({
      body: { error: "Shipping address with city and zip required" },
      status: 400,
    })
  })
})
