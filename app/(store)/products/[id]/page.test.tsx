import { describe, it, expect, vi, beforeEach } from "vitest"
import React from "react"

const notFound = vi.fn()
const selectMock = vi.fn()
const fromMock = vi.fn()
const whereMock = vi.fn()
const innerJoinMock = vi.fn()
const isChaosActiveMock = vi.fn()

vi.mock("next/navigation", () => ({
  notFound,
}))

vi.mock("@/lib/chaos/toggles", () => ({
  isChaosActive: isChaosActiveMock,
}))

vi.mock("@/lib/db", () => ({
  db: {
    select: selectMock,
  },
}))

vi.mock("@/lib/db/schema", () => ({
  products: { id: "products.id" },
  reviews: {
    id: "reviews.id",
    rating: "reviews.rating",
    comment: "reviews.comment",
    createdAt: "reviews.createdAt",
    productId: "reviews.productId",
    userId: "reviews.userId",
  },
  users: { id: "users.id", name: "users.name" },
}))

vi.mock("drizzle-orm", () => ({
  eq: (...args: unknown[]) => ({ type: "eq", args }),
}))

vi.mock("./add-to-cart", () => ({
  AddToCartButton: () => React.createElement("button", null, "Add to Cart"),
}))

vi.mock("./review-form", () => ({
  ReviewForm: () => React.createElement("form", null, "Review Form"),
}))

describe("ProductPage regression", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isChaosActiveMock.mockResolvedValue(false)

    whereMock.mockResolvedValue([])
    innerJoinMock.mockReturnValue({ where: whereMock })
    fromMock.mockReturnValue({ where: whereMock, innerJoin: innerJoinMock })
    selectMock.mockReturnValue({ from: fromMock })
  })

  it("renders without triggering a failing external fetch during server render for an existing product", async () => {
    const product = {
      id: "ffecf4c2-42cc-42e1-867a-d660aebe9896",
      name: "Test Product",
      description: "A product used for regression testing",
      priceCents: 2599,
      imageUrl: null,
      inventory: 3,
    }

    whereMock
      .mockResolvedValueOnce([product])
      .mockResolvedValueOnce([])

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new TypeError("fetch failed"))

    const mod = await import("./page")
    const element = await mod.default({
      params: Promise.resolve({ id: product.id }),
    })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(notFound).not.toHaveBeenCalled()
    expect(element).toBeTruthy()

    fetchSpy.mockRestore()
  })

  it("still returns notFound for a missing product without attempting the failing fetch", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new TypeError("fetch failed"))

    const mod = await import("./page")
    await mod.default({
      params: Promise.resolve({ id: "ffecf4c2-42cc-42e1-867a-d660aebe9896" }),
    })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(notFound).toHaveBeenCalled()

    fetchSpy.mockRestore()
  })
})
