import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND")
})

const selectChainFactory = (result: unknown) => {
  const where = vi.fn().mockResolvedValue(result)
  const innerJoin = vi.fn(() => ({ where }))
  const from = vi.fn((table: unknown) => {
    if (table === reviewsTable) {
      return { innerJoin }
    }
    return { where }
  })
  const select = vi.fn(() => ({ from }))
  return { select, from, innerJoin, where }
}

const productsTable = { id: "products.id" }
const reviewsTable = {
  id: "reviews.id",
  rating: "reviews.rating",
  comment: "reviews.comment",
  createdAt: "reviews.createdAt",
  productId: "reviews.productId",
  userId: "reviews.userId",
}
const usersTable = { id: "users.id", name: "users.name" }

let dbSelectMock: ReturnType<typeof vi.fn>
let isChaosActiveMock: ReturnType<typeof vi.fn>
let fetchMock: ReturnType<typeof vi.fn>

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}))

vi.mock("@/lib/chaos/toggles", () => ({
  isChaosActive: (...args: unknown[]) => isChaosActiveMock(...args),
}))

vi.mock("@/lib/db/schema", () => ({
  products: productsTable,
  reviews: reviewsTable,
  users: usersTable,
}))

vi.mock("drizzle-orm", () => ({
  eq: (a: unknown, b: unknown) => ({ a, b }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => dbSelectMock(...args),
  },
}))

vi.mock("./add-to-cart", () => ({
  AddToCartButton: ({ productId, disabled }: { productId: string; disabled: boolean }) =>
    React.createElement("button", { disabled, "data-product-id": productId }, "Add to cart"),
}))

vi.mock("./review-form", () => ({
  ReviewForm: () => React.createElement("form", null, "Review form"),
}))

describe("ProductPage", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    isChaosActiveMock = vi.fn().mockResolvedValue(true)
    fetchMock = vi.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it("renders the product page when the related-products fetch fails under chaos mode", async () => {
    const product = {
      id: "ffecf4c2-42cc-42e1-867a-d660aebe9896",
      name: "Chaos Mug",
      description: "A mug that still renders.",
      price: 1999,
      stock: 3,
      category: "mugs",
    }
    const reviews = [
      {
        id: "r1",
        rating: 5,
        comment: "Great",
        createdAt: new Date("2024-01-01"),
        userName: "Pat",
      },
    ]

    const first = selectChainFactory([product])
    const second = selectChainFactory(reviews)
    dbSelectMock = vi.fn()
      .mockImplementationOnce(first.select)
      .mockImplementationOnce(second.select)

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"))

    const mod = await import("./page")
    const element = await mod.default({
      params: Promise.resolve({ id: product.id }),
    })
    const html = renderToStaticMarkup(element)

    expect(fetchMock).toHaveBeenCalledWith(`https://api.example.com/related/${product.id}`)
    expect(html).toContain("Chaos Mug")
    expect(html).toContain("A mug that still renders.")
    expect(html).toContain("(1 reviews)")
    expect(notFoundMock).not.toHaveBeenCalled()
  })

  it("still calls notFound when the product does not exist even if the related-products fetch fails", async () => {
    const missingId = "ffecf4c2-42cc-42e1-867a-d660aebe9896"

    const first = selectChainFactory([])
    const second = selectChainFactory([])
    dbSelectMock = vi.fn()
      .mockImplementationOnce(first.select)
      .mockImplementationOnce(second.select)

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"))

    const mod = await import("./page")

    await expect(
      mod.default({ params: Promise.resolve({ id: missingId }) })
    ).rejects.toThrow("NEXT_NOT_FOUND")

    expect(fetchMock).toHaveBeenCalledWith(`https://api.example.com/related/${missingId}`)
    expect(notFoundMock).toHaveBeenCalled()
  })
})
