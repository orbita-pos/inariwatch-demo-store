import { describe, expect, it } from "vitest"
import { GET } from "./route"

describe("GET /api/ping-broken", () => {
  it("returns a default greeting when the name query param is missing", async () => {
    const req = new Request("http://localhost/api/ping-broken")

    const res = await GET(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ greeting: "Hello!" })
  })

  it("uppercases the provided name when the query param is present", async () => {
    const req = new Request("http://localhost/api/ping-broken?name=world")

    const res = await GET(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ greeting: "Hello, WORLD!" })
  })
})
