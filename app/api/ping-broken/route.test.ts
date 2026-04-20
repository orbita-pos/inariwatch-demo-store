import { describe, expect, it } from "vitest"

import { GET } from "./route"

describe("GET /api/ping-broken", () => {
  it("returns a default greeting when the name query param is missing", async () => {
    const request = new Request("http://localhost/api/ping-broken")

    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ greeting: "Hello, THERE!" })
  })

  it("uppercases the provided name when the name query param is present", async () => {
    const request = new Request("http://localhost/api/ping-broken?name=world")

    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ greeting: "Hello, WORLD!" })
  })
})
