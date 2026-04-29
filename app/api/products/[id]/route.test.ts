import { describe, expect, it } from "vitest"
import { randomUUID } from "crypto"
import { GET } from "./route"
import { db } from "@/lib/db"
import { products, reviews, users } from "@/lib/db/schema"

describe("GET /api/products/[id]", () => {
  it("returns the product with reviews for a valid product id passed through async params", async () => {
    const userId = randomUUID()
    const productId = randomUUID()

    await db.insert(users).values({
      id: userId,
      name: "Regression Test User",
      email: `regression-${userId}@example.com`,
      password: "test-password",
    })

    await db.insert(products).values({
      id: productId,
      name: "Regression Test Product",
      description: "Ensures product detail data can be resolved during SSR",
      price: "19.99",
      imageUrl: "/test-product.jpg",
      category: "test-category",
      stock: 3,
    })

    await db.insert(reviews).values({
      id: randomUUID(),
      productId,
      userId,
      rating: 5,
      comment: "Excellent",
    })

    const response = await GET(new Request(`http://localhost/api/products/${productId}`), {
      params: Promise.resolve({ id: productId }),
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.id).toBe(productId)
    expect(body.name).toBe("Regression Test Product")
    expect(body.reviews).toHaveLength(1)
    expect(body.reviews[0]).toMatchObject({
      userId,
      userName: "Regression Test User",
      rating: 5,
      comment: "Excellent",
    })
  })

  it("returns 404 instead of throwing when the product does not exist", async () => {
    const missingId = randomUUID()

    const response = await GET(new Request(`http://localhost/api/products/${missingId}`), {
      params: Promise.resolve({ id: missingId }),
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: "Product not found" })
  })
})
