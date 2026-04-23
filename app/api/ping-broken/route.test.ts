import { describe, expect, it } from "vitest"
import { GET } from "./route"

describe("GET /api/ping-broken", () => {
  it("returns a Guest greeting when name is omitted instead of throwing", async () => {
    const req = new Request("https://demo-store.inariwatch.com/api/ping-broken")

    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ greeting: "Hello, GUEST!" })
  })

  it("uppercases the provided name in the greeting", async () => {
    const req = new Request("https://demo-store.inariwatch.com/api/ping-broken?name=inari")

    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ greeting: "Hello, INARI!" })
  })
})
