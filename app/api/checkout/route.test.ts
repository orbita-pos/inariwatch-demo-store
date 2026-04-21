import { describe, it, expect, vi, beforeEach } from "vitest"

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

const dbMock = {
  transaction: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
}
vi.mock("@/lib/db", () => ({
  db: dbMock,
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
    getServerSessionMock.mockResolvedValue({ user: { id: "u_test" } })
    isChaosActiveMock.mockResolvedValue(false)
  })

  it("returns 400 instead of throwing when shippingAddress is omitted", async () => {
    const { POST } = await import("./route")

    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        couponCode: null,
      }),
    })

    await expect(POST(req)).resolves.toBeInstanceOf(Response)

    expect(jsonMock).toHaveBeenCalledWith(
      { error: "Shipping address with city and zip is required" },
      { status: 400 }
    )
    expect(dbMock.transaction).not.toHaveBeenCalled()
    expect(dbMock.insert).not.toHaveBeenCalled()
  })

  it("returns 400 when shippingAddress is present but missing zip", async () => {
    const { POST } = await import("./route")

    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        shippingAddress: { city: "boston" },
        couponCode: null,
      }),
    })

    const res = await POST(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      error: "Shipping address with city and zip is required",
    })
    expect(dbMock.transaction).not.toHaveBeenCalled()
    expect(dbMock.insert).not.toHaveBeenCalled()
  })
})
