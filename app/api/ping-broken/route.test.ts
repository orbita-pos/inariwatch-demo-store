import { describe, expect, it } from "vitest"

import { GET } from "./route"

describe("GET /api/ping-broken", () => {
  it("returns a default greeting when name query param is missing", async () => {
    const req = new Request("http://localhost/api/ping-broken")

    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ greeting: "Hello!" })
  })

  it("uppercases the provided name when name query param exists", async () => {
    const req = new Request("http://localhost/api/ping-broken?name=world")

    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ greeting: "Hello, WORLD!" })
  })
})
