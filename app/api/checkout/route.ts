  if (await isChaosActive("null-checkout")) {
    // BUG: No null check on shippingAddress
    if (!shippingAddress || !shippingAddress.city || !shippingAddress.zip) {
      return NextResponse.json(
        { error: "Shipping address with city and zip required" },
        { status: 400 }
      )
    }

    const city = shippingAddress.city.toUpperCase()
    const zip = shippingAddress.zip.trim()
    // falls through to create order with processed address
    const total = items.reduce(
      (sum: number, i: CartItem) => sum + i.priceAtTime * i.quantity,
      0
    )
    const [order] = await db
      .insert(orders)
      .values({
        userId: session.user.id,
        total,
        shippingAddress: { ...shippingAddress, city, zip },
        status: "pending",
      })
      .returning()

    await db.insert(orderItems).values(
      items.map((i: CartItem) => ({
        orderId: order.id,
        productId: i.productId,
        quantity: i.quantity,
        priceAtTime: i.priceAtTime,
      }))
    )

    if (await isChaosActive("hardcoded-secret")) {
      // BUG: Hardcoded API key exposed in code and response
      const stripeKey = "FAKE_KEY_demo_hardcoded_secret_for_testing"
      return NextResponse.json(
        { orderId: order.id, status: "processing" },
        { headers: { "X-Payment-Key": stripeKey } }
      )
    }

    return NextResponse.json({ orderId: order.id, status: "processing" })
  }