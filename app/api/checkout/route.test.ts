import { beforeEach, describe, expect, it, vi } from "vitest"

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

const db = {
  transaction: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
}
vi.mock("@/lib/db", () => ({ db }))

vi.mock("@/lib/db/schema", () => ({
  orders: {},
  orderItems: {},
  products: { id: "id", stock: "stock", name: "name" },
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
      body: JSON.stringify({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        couponCode: null,
      }),
      headers: { "content-type": "application/json" },
    })

    await expect(POST(req)).resolves.toBeInstanceOf(Response)

    const response = await POST(req.clone())
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Shipping address with city and zip required",
    })
    expect(db.insert).not.toHaveBeenCalled()
    expect(db.transaction).not.toHaveBeenCalled()
  })

  it("returns 400 when shippingAddress is present but missing city or zip", async () => {
    const { POST } = await import("./route")

    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        shippingAddress: { zip: " 12345 " },
        couponCode: null,
      }),
      headers: { "content-type": "application/json" },
    })

    const response = await POST(req)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Shipping address with city and zip required",
    })
    expect(db.insert).not.toHaveBeenCalled()
    expect(db.transaction).not.toHaveBeenCalled()
  })
})
