import { GET } from "./route"

describe("GET /api/ping-broken", () => {
  it("returns a Guest greeting when name query param is missing", async () => {
    const req = new Request("http://localhost/api/ping-broken")

    const res = await GET(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      greeting: "Hello, Guest!",
    })
  })

  it("uppercases the provided name when name query param is present", async () => {
    const req = new Request("http://localhost/api/ping-broken?name=alice")

    const res = await GET(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      greeting: "Hello, ALICE!",
    })
  })
})
