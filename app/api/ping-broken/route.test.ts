import { describe, it, expect } from "vitest"
import { GET } from "./route"

describe("GET /api/ping-broken", () => {
  it("returns a default greeting when name is missing", async () => {
    const req = new Request("https://demo-store.inariwatch.com/api/ping-broken")

    const res = await GET(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      greeting: "Hello, WORLD!",
    })
  })

  it("uppercases the provided name in the greeting", async () => {
    const req = new Request("https://demo-store.inariwatch.com/api/ping-broken?name=inari")

    const res = await GET(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      greeting: "Hello, INARI!",
    })
  })
})
