import { describe, expect, it } from "vitest"

import { GET } from "./route"

describe("GET /api/ping-broken", () => {
  it("returns a greeting instead of throwing when name is missing", async () => {
    const req = new Request("http://localhost/api/ping-broken")

    await expect(GET(req)).resolves.toBeDefined()

    const res = await GET(req)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      greeting: "Hello, !",
    })
  })

  it("uppercases the provided name", async () => {
    const req = new Request("http://localhost/api/ping-broken?name=world")

    const res = await GET(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      greeting: "Hello, WORLD!",
    })
  })
})
