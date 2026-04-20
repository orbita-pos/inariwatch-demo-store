import { describe, expect, it } from "vitest"
import { GET } from "./route"

describe("GET /api/ping-broken", () => {
  it("returns 400 with a helpful error when name query param is missing", async () => {
    const req = new Request("http://localhost/api/ping-broken")

    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body).toEqual({
      error: "Missing required query parameter: name",
    })
  })

  it("returns an uppercased greeting when name query param is provided", async () => {
    const req = new Request("http://localhost/api/ping-broken?name=world")

    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({
      greeting: "Hello, WORLD!",
    })
  })
})
