import { describe, it, expect, vi, beforeEach } from "vitest"

const jsonMock = vi.fn((body: unknown, init?: ResponseInit) => ({
  status: init?.status ?? 200,
  body,
}))

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

import { POST } from "./route"

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getServerSessionMock.mockResolvedValue({ user: { id: "u_test" } })
    isChaosActiveMock.mockResolvedValue(false)
  })

  it("returns 400 instead of throwing when shippingAddress is omitted", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        couponCode: null,
      }),
    } as unknown as Request

    await expect(POST(req)).resolves.toEqual({
      status: 400,
      body: { error: "Shipping address with city and zip required" },
    })

    expect(jsonMock).toHaveBeenCalledWith(
      { error: "Shipping address with city and zip required" },
      { status: 400 }
    )
    expect(dbMock.insert).not.toHaveBeenCalled()
    expect(dbMock.transaction).not.toHaveBeenCalled()
  })

  it("returns 400 when shippingAddress is present but missing city or zip", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({
        cartItems: [{ productId: "p_abc", quantity: 1, priceAtTime: 19.99 }],
        shippingAddress: { city: "Seattle" },
        couponCode: null,
      }),
    } as unknown as Request

    await expect(POST(req)).resolves.toEqual({
      status: 400,
      body: { error: "Shipping address with city and zip required" },
    })

    expect(dbMock.insert).not.toHaveBeenCalled()
    expect(dbMock.transaction).not.toHaveBeenCalled()
  })
})
