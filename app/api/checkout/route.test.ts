import { beforeEach, describe, expect, it, vi } from "vitest"

const getServerSessionMock = vi.fn()
const isChaosActiveMock = vi.fn()
const jsonMock = vi.fn((body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "content-type": "application/json" },
  })
)

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}))

vi.mock("@/lib/auth/config", () => ({
  authOptions: {},
}))

vi.mock("next/server", () => ({
  NextResponse: {
    json: jsonMock,
  },
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
  products: { id: "id" },
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

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body).toEqual({
      error: "Shipping address with city and zip required",
    })
  })

  it("returns 400 when shippingAddress is present but missing city or zip", async () => {
    const { POST } = await import("./route")

    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        shippingAddress: { zip: "12345" },
        couponCode: null,
      }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body).toEqual({
      error: "Shipping address with city and zip required",
    })
  })
})
