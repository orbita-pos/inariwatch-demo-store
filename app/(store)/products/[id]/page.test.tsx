import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND")
})

const isChaosActive = vi.fn()
const select = vi.fn()
const from = vi.fn()
const where = vi.fn()

vi.mock("next/navigation", () => ({
  notFound,
}))

vi.mock("@/lib/chaos/toggles", () => ({
  isChaosActive,
}))

vi.mock("@/lib/db", () => ({
  db: {
    select,
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
  eq: (...args: unknown[]) => ({ eq: args }),
}))

vi.mock("./add-to-cart", () => ({
  AddToCartButton: ({ productId, disabled }: { productId: string; disabled?: boolean }) =>
    React.createElement("button", { "data-product-id": productId, disabled }, "Add to cart"),
}))

vi.mock("./review-form", () => ({
  ReviewForm: ({ productId }: { productId: string }) =>
    React.createElement("form", { "data-product-id": productId }),
}))

describe("ProductPage regression", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders using direct database queries without calling fetch when chaos toggle is enabled", async () => {
    isChaosActive.mockResolvedValue(true)

    where
      .mockResolvedValueOnce([
        {
          id: "ffecf4c2-42cc-42e1-867a-d660aebe9896",
          name: "Test Mug",
          description: "A product loaded directly from the database",
          price: 1999,
          stock: 3,
          category: "mugs",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "review-1",
          rating: 5,
          comment: "Great",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          userName: "Pat",
        },
      ])

    from.mockReturnThis()
    select.mockReturnThis()

    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const { default: ProductPage } = await import("./page")

    const result = await ProductPage({
      params: Promise.resolve({ id: "ffecf4c2-42cc-42e1-867a-d660aebe9896" }),
    })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(isChaosActive).toHaveBeenCalledWith("unhandled-promise")
    expect(select).toHaveBeenCalledTimes(2)
    expect(result).toBeTruthy()
  })

  it("calls notFound when the product does not exist instead of failing via fetch", async () => {
    isChaosActive.mockResolvedValue(true)

    where
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    from.mockReturnThis()
    select.mockReturnThis()

    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const { default: ProductPage } = await import("./page")

    await expect(
      ProductPage({
        params: Promise.resolve({ id: "ffecf4c2-42cc-42e1-867a-d660aebe9896" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND")

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(notFound).toHaveBeenCalledTimes(1)
  })
})
