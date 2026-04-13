import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const notFound = vi.fn()
const isChaosActive = vi.fn()
const eq = vi.fn((a, b) => ({ a, b }))

const products = { id: "products.id" }
const reviews = {
  id: "reviews.id",
  rating: "reviews.rating",
  comment: "reviews.comment",
  createdAt: "reviews.createdAt",
  userId: "reviews.userId",
  productId: "reviews.productId",
}
const users = {
  id: "users.id",
  name: "users.name",
}

const makeDb = () => ({
  select: vi.fn((selection?: unknown) => {
    if (selection) {
      return {
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
      }
    }

    return {
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([
          {
            id: "d386e506-782d-4b72-adf0-8cb5fcf72363",
            name: "Test Product",
            description: "Test description",
            priceCents: 1999,
            imageUrl: null,
            inventory: 3,
          },
        ]),
      })),
    }
  }),
})

let db = makeDb()

vi.mock("next/navigation", () => ({
  notFound,
}))

vi.mock("@/lib/chaos/toggles", () => ({
  isChaosActive,
}))

vi.mock("drizzle-orm", () => ({
  eq,
}))

vi.mock("@/lib/db/schema", () => ({
  products,
  reviews,
  users,
}))

vi.mock("@/lib/db", () => ({
  get db() {
    return db
  },
}))

vi.mock("./add-to-cart", () => ({
  AddToCartButton: () => React.createElement("button", null, "Add to cart"),
}))

vi.mock("./review-form", () => ({
  ReviewForm: () => React.createElement("form", null, "Review form"),
}))

describe("ProductPage", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    db = makeDb()
    notFound.mockReset()
    isChaosActive.mockImplementation(async (flag: string) => flag === "unhandled-promise")
  })

  it("does not throw when related products fetch fails during render", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed"))
    )

    const mod = await import("./page")

    await expect(
      mod.default({
        params: Promise.resolve({ id: "d386e506-782d-4b72-adf0-8cb5fcf72363" }),
      })
    ).resolves.toBeTruthy()

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/related/d386e506-782d-4b72-adf0-8cb5fcf72363"
    )
    expect(notFound).not.toHaveBeenCalled()
  })

  it("still returns notFound for a missing product even if related fetch also fails", async () => {
    db = {
      select: vi.fn((selection?: unknown) => {
        if (selection) {
          return {
            from: vi.fn(() => ({
              innerJoin: vi.fn(() => ({
                where: vi.fn().mockResolvedValue([]),
              })),
            })),
          }
        }

        return {
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        }
      }),
    }

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed"))
    )
    notFound.mockImplementation(() => "NOT_FOUND")

    const mod = await import("./page")

    await expect(
      mod.default({
        params: Promise.resolve({ id: "d386e506-782d-4b72-adf0-8cb5fcf72363" }),
      })
    ).resolves.toBe("NOT_FOUND")

    expect(notFound).toHaveBeenCalledTimes(1)
  })
})
