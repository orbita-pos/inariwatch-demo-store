import { describe, expect, it, vi, beforeEach } from "vitest"
import React from "react"

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND")
})

vi.mock("next/navigation", () => ({
  notFound,
}))

const selectMock = vi.fn()
const fromMock = vi.fn()
const whereMock = vi.fn()
const innerJoinMock = vi.fn()

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
    userId: "reviews.userId",
    productId: "reviews.productId",
  },
  users: { id: "users.id", name: "users.name" },
}))

vi.mock("drizzle-orm", () => ({
  eq: (...args: unknown[]) => ({ eq: args }),
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
  })

  it("renders product details from direct database queries without relying on fetch during server render", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new TypeError("fetch failed"))

    const product = {
      id: "ffecf4c2-42cc-42e1-867a-d660aebe9896",
      name: "Test Mug",
      description: "A product rendered on the server",
      price: 2599,
      category: "mugs",
      stock: 3,
    }

    const productQuery = {
      from: fromMock.mockReturnThis(),
      where: whereMock.mockResolvedValueOnce([product]),
    }

    const reviewsQuery = {
      from: fromMock.mockReturnThis(),
      innerJoin: innerJoinMock.mockReturnThis(),
      where: whereMock.mockResolvedValueOnce([
        {
          id: "review-1",
          rating: 5,
          comment: "Great",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          userName: "Alice",
        },
      ]),
    }

    selectMock
      .mockReturnValueOnce(productQuery)
      .mockReturnValueOnce(reviewsQuery)

    const mod = await import("./page")
    const element = await mod.default({
      params: Promise.resolve({ id: product.id }),
    })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(selectMock).toHaveBeenCalledTimes(2)
    expect(element).toBeTruthy()

    fetchSpy.mockRestore()
  })

  it("calls notFound when the product id does not exist instead of attempting a failing fetch path", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new TypeError("fetch failed"))

    const productQuery = {
      from: fromMock.mockReturnThis(),
      where: whereMock.mockResolvedValueOnce([]),
    }

    selectMock.mockReturnValueOnce(productQuery)

    const mod = await import("./page")

    await expect(
      mod.default({
        params: Promise.resolve({ id: "ffecf4c2-42cc-42e1-867a-d660aebe9896" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND")

    expect(notFound).toHaveBeenCalledTimes(1)
    expect(fetchSpy).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
  })
})
