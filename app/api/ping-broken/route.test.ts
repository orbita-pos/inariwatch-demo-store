import { describe, expect, it } from "vitest"
import { GET } from "./route"

describe("app/api/ping-broken/route", () => {
  it("returns ok with an empty message when name is missing instead of throwing", async () => {
    const request = new Request("http://localhost/api/ping-broken")

    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      ok: true,
      message: "",
    })
  })

  it("uppercases the provided name", async () => {
    const request = new Request("http://localhost/api/ping-broken?name=alice")

    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      ok: true,
      message: "ALICE",
    })
  })
})
