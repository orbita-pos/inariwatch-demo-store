import { describe, expect, it } from "vitest"

import { GET } from "./route"

describe("GET /api/ping-broken", () => {
  it("returns a default greeting when the name query param is missing", async () => {
    const req = new Request("http://localhost/api/ping-broken")

    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ greeting: "Hello, FRIEND!" })
  })

  it("uppercases the provided name when the query param is present", async () => {
    const req = new Request("http://localhost/api/ping-broken?name=alice")

    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ greeting: "Hello, ALICE!" })
  })
})
