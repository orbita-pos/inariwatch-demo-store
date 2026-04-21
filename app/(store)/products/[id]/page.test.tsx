import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderToString } from "react-dom/server"

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND")
})

const isChaosActiveMock = vi.fn(async () => false)
const dbSelectMock = vi.fn()

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}))

vi.mock("@/lib/chaos/toggles", () => ({
  isChaosActive: isChaosActiveMock,
}))

vi.mock("@/lib/db", () => ({
  db: {
    select: dbSelectMock,
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
  users: {
    id: "users.id",
    name: "users.name",
  },
}))

vi.mock("drizzle-orm", () => ({
  eq: (...args: unknown[]) => ({ eq: args }),
}))

vi.mock("./add-to-cart", () => ({
  AddToCartButton: ({ productId }: { productId: string }) =>
    `<button data-product-id="${productId}">Add to Cart</button>`,
}))

vi.mock("./review-form", () => ({
  ReviewForm: ({ productId }: { productId: string }) =>
    `<form data-product-id="${productId}"></form>`,
}))

describe("app/(store)/products/[id]/page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("exports force-dynamic so product detail rendering does not use the failing static server fetch path", async () => {
    const mod = await import("./page")
    expect(mod.dynamic).toBe("force-dynamic")
  })

  it("renders a product by querying the database directly during server render", async () => {
    const productId = "ffecf4c2-42cc-42e1-867a-d660aebe9896"

    const productQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          id: productId,
          name: "Test Product",
          description: "Server-rendered product",
          priceCents: 2599,
          imageUrl: null,
          inventory: 3,
        },
      ]),
    }

    const reviewsQuery = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    }

    dbSelectMock
      .mockReturnValueOnce(productQuery)
      .mockReturnValueOnce(reviewsQuery)

    const { default: ProductPage } = await import("./page")
    const element = await ProductPage({ params: Promise.resolve({ id: productId }) })
    const html = renderToString(element)

    expect(dbSelectMock).toHaveBeenCalledTimes(2)
    expect(productQuery.from).toHaveBeenCalled()
    expect(productQuery.where).toHaveBeenCalled()
    expect(reviewsQuery.from).toHaveBeenCalled()
    expect(reviewsQuery.innerJoin).toHaveBeenCalled()
    expect(reviewsQuery.where).toHaveBeenCalled()
    expect(html).toContain("Test Product")
    expect(html).toContain("$25.99")
    expect(notFoundMock).not.toHaveBeenCalled()
  })
}