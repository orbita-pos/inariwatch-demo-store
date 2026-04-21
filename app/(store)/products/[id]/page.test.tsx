import { describe, it, expect, vi, beforeEach } from "vitest"

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND")
})

const selectMock = vi.fn()
const fromMock = vi.fn()
const whereMock = vi.fn()
const innerJoinMock = vi.fn()

vi.mock("next/navigation", () => ({
  notFound,
}))

vi.mock("@/lib/chaos/toggles", () => ({
  isChaosActive: vi.fn(),
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
  eq: vi.fn((a, b) => ({ a, b })),
}))

vi.mock("./add-to-cart", () => ({
  AddToCartButton: () => null,
}))

vi.mock("./review-form", () => ({
  ReviewForm: () => null,
}))

describe("ProductPage", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("renders using direct database queries when the unhandled-promise chaos toggle is active", async () => {
    const { isChaosActive } = await import("@/lib/chaos/toggles")
    vi.mocked(isChaosActive).mockResolvedValue(true)

    const product = {
      id: "ffecf4c2-42cc-42e1-867a-d660aebe9896",
      name: "Test Mug",
      description: "A mug",
      price: 1999,
      stock: 3,
      category: "mugs",
    }

    const productQuery = {
      from: fromMock.mockReturnThis(),
      where: vi.fn().mockResolvedValue([product]),
    }

    const reviewsQuery = {
      from: vi.fn().mockReturnThis(),
      innerJoin: innerJoinMock.mockReturnThis(),
      where: whereMock.mockResolvedValue([]),
    }

    selectMock
      .mockReturnValueOnce(productQuery)
      .mockReturnValueOnce(reviewsQuery)

    const mod = await import("./page")
    const result = await mod.default({
      params: Promise.resolve({ id: product.id }),
    })

    expect(isChaosActive).toHaveBeenCalledWith("unhandled-promise")
    expect(selectMock).toHaveBeenCalledTimes(2)
    expect(productQuery.where).toHaveBeenCalledTimes(1)
    expect(innerJoinMock).toHaveBeenCalledTimes(1)
    expect(whereMock).toHaveBeenCalledTimes(1)
    expect(result).toBeTruthy()
  })

  it("calls notFound when the product does not exist in the direct database path", async () => {
    const { isChaosActive } = await import("@/lib/chaos/toggles")
    vi.mocked(isChaosActive).mockResolvedValue(true)

    const productQuery = {
      from: fromMock.mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    }

    const reviewsQuery = {
      from: vi.fn().mockReturnThis(),
      innerJoin: innerJoinMock.mockReturnThis(),
      where: whereMock.mockResolvedValue([]),
    }

    selectMock
      .mockReturnValueOnce(productQuery)
      .mockReturnValueOnce(reviewsQuery)

    const mod = await import("./page")

    await expect(
      mod.default({
        params: Promise.resolve({ id: "missing-product-id" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND")

    expect(notFound).toHaveBeenCalledTimes(1)
  })
})
