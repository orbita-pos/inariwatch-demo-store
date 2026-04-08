import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { hash } from "bcryptjs"
import dotenv from "dotenv"
import {
  users,
  products,
  orders,
  orderItems,
  reviews,
  coupons,
  chaosToggles,
} from "./schema"

dotenv.config()

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const CHAOS_BUG_IDS = [
  "sql-injection",
  "xss-reviews",
  "hardcoded-secret",
  "null-checkout",
  "race-stock",
  "open-redirect",
  "unhandled-promise",
  "prototype-pollution",
  "missing-auth",
  "weak-crypto",
  "off-by-one",
  "cors-wildcard",
]

async function seed() {
  console.log("Seeding database...")

  // Clear existing data
  await db.delete(orderItems)
  await db.delete(reviews)
  await db.delete(orders)
  await db.delete(coupons)
  await db.delete(chaosToggles)
  // cartItems depends on users/products
  const { cartItems } = await import("./schema")
  await db.delete(cartItems)
  await db.delete(products)
  await db.delete(users)

  // Users
  const passwordHash = await hash("password123", 10)
  const [admin, alice, bob] = await db
    .insert(users)
    .values([
      { name: "Admin", email: "admin@demo.com", password: passwordHash, role: "admin" as const },
      { name: "Alice", email: "alice@demo.com", password: passwordHash, role: "user" as const },
      { name: "Bob", email: "bob@demo.com", password: passwordHash, role: "user" as const },
    ])
    .returning()
  console.log("  Users created")

  // Products
  const productData = [
    { name: "Cosmic Cat Sticker", description: "A holographic cat floating through space. Waterproof vinyl.", price: 399, imageUrl: "/products/cosmic-cat.svg", stock: 50, category: "stickers" },
    { name: "Retro Terminal Sticker", description: "Green phosphor CRT aesthetic. Perfect for laptops.", price: 349, imageUrl: "/products/retro-terminal.svg", stock: 35, category: "stickers" },
    { name: "Bug Hunter Badge", description: "Show the world you squash bugs for a living.", price: 299, imageUrl: "/products/bug-hunter.svg", stock: 100, category: "stickers" },
    { name: "404 Sticker Pack", description: "Five different 404 designs. Because pages get lost.", price: 599, imageUrl: "/products/404-pack.svg", stock: 25, category: "stickers" },
    { name: "Stack Overflow Sticker", description: "Recursive sticker that references itself.", price: 449, imageUrl: "/products/stack-overflow.svg", stock: 1, category: "stickers" },
    { name: "Coffee & Code Mug", description: "11oz ceramic mug. console.log('need coffee')", price: 1299, imageUrl: "/products/coffee-code.svg", stock: 30, category: "mugs" },
    { name: "Debug Mode Mug", description: "Changes color when hot. Reveals hidden error messages.", price: 1599, imageUrl: "/products/debug-mug.svg", stock: 20, category: "mugs" },
    { name: "SQL Query Mug", description: "SELECT coffee FROM kitchen WHERE time = 'morning'", price: 1199, imageUrl: "/products/sql-mug.svg", stock: 15, category: "mugs" },
    { name: "Git Commit Mug", description: "git commit -m 'fix: everything'. We've all been there.", price: 1299, imageUrl: "/products/git-mug.svg", stock: 40, category: "mugs" },
    { name: "Merge Conflict Mug", description: "<<<<<<< HEAD. The scariest thing a dev can see.", price: 1399, imageUrl: "/products/merge-mug.svg", stock: 1, category: "mugs" },
    { name: "Syntax Error Tee", description: "Unexpected token 'style'. 100% cotton, unisex fit.", price: 2499, imageUrl: "/products/syntax-tee.svg", stock: 45, category: "t-shirts" },
    { name: "It Works On My Machine Tee", description: "The universal developer excuse. Comfort fit.", price: 2299, imageUrl: "/products/works-on-my-machine.svg", stock: 60, category: "t-shirts" },
    { name: "Hello World Tee", description: "Every journey starts with a single print statement.", price: 1999, imageUrl: "/products/hello-world.svg", stock: 75, category: "t-shirts" },
    { name: "Dark Mode Tee", description: "Black tee. White text. No light theme option.", price: 2699, imageUrl: "/products/dark-mode.svg", stock: 30, category: "t-shirts" },
    { name: "Recursion Tee", description: "To understand recursion, you must first understand recursion.", price: 2199, imageUrl: "/products/recursion.svg", stock: 1, category: "t-shirts" },
    { name: "Rubber Duck Debugger", description: "Your most reliable debugging partner. Squeaks when squeezed.", price: 799, imageUrl: "/products/rubber-duck.svg", stock: 200, category: "accessories" },
    { name: "Mechanical Keycap Set", description: "Custom ESC key that actually lets you escape meetings.", price: 1499, imageUrl: "/products/keycap.svg", stock: 10, category: "accessories" },
    { name: "Cable Management Kit", description: "Because your desk looks like spaghetti code.", price: 999, imageUrl: "/products/cables.svg", stock: 55, category: "accessories" },
    { name: "Monitor Light Bar", description: "Illuminate your code. Not your bugs.", price: 2999, imageUrl: "/products/light-bar.svg", stock: 15, category: "accessories" },
    { name: "Dev Socks Pack", description: "Three pairs: JavaScript, Python, Rust. Step into typed comfort.", price: 1499, imageUrl: "/products/dev-socks.svg", stock: 80, category: "accessories" },
  ]

  const insertedProducts = await db.insert(products).values(productData).returning()
  console.log("  Products created")

  // Reviews
  const reviewData = [
    { userId: alice.id, productId: insertedProducts[0].id, rating: 5, comment: "Absolutely love this sticker! The holographic effect is amazing." },
    { userId: bob.id, productId: insertedProducts[0].id, rating: 4, comment: "Great quality, but shipping took a while." },
    { userId: alice.id, productId: insertedProducts[5].id, rating: 5, comment: "Perfect mug for morning standups." },
    { userId: bob.id, productId: insertedProducts[5].id, rating: 3, comment: "Decent mug but the print faded after a few washes." },
    { userId: alice.id, productId: insertedProducts[10].id, rating: 5, comment: "Best dev tee I own. Comfortable and funny." },
    { userId: bob.id, productId: insertedProducts[11].id, rating: 5, comment: "Wore this to a meeting and everyone laughed." },
    { userId: alice.id, productId: insertedProducts[15].id, rating: 5, comment: "This duck has solved more bugs than my entire team." },
    { userId: bob.id, productId: insertedProducts[15].id, rating: 4, comment: "Good duck. Would debug again." },
    { userId: alice.id, productId: insertedProducts[16].id, rating: 4, comment: "The ESC keycap is hilarious. Fits Cherry MX switches." },
    { userId: bob.id, productId: insertedProducts[18].id, rating: 5, comment: "My desk finally looks like clean code." },
  ]

  await db.insert(reviews).values(reviewData)
  console.log("  Reviews created")

  // Coupons
  await db.insert(coupons).values([
    { code: "WELCOME10", discountPercent: 10, maxUses: 100, currentUses: 0, isActive: true },
    { code: "SUMMER25", discountPercent: 25, maxUses: 50, currentUses: 0, isActive: true },
    { code: "EXPIRED", discountPercent: 15, maxUses: 10, currentUses: 10, expiresAt: new Date("2024-01-01"), isActive: false },
  ])
  console.log("  Coupons created")

  // Orders
  const [order1, order2, order3, order4, order5] = await db
    .insert(orders)
    .values([
      { userId: alice.id, status: "shipped" as const, total: 3498, shippingAddress: { street: "123 Main St", city: "San Francisco", state: "CA", zip: "94102" } },
      { userId: alice.id, status: "processing" as const, total: 2499, shippingAddress: { street: "123 Main St", city: "San Francisco", state: "CA", zip: "94102" } },
      { userId: bob.id, status: "shipped" as const, total: 1598, shippingAddress: { street: "456 Oak Ave", city: "Portland", state: "OR", zip: "97201" } },
      { userId: bob.id, status: "pending" as const, total: 4498, shippingAddress: { street: "456 Oak Ave", city: "Portland", state: "OR", zip: "97201" } },
      { userId: alice.id, status: "cancelled" as const, total: 799, shippingAddress: { street: "123 Main St", city: "San Francisco", state: "CA", zip: "94102" } },
    ])
    .returning()

  await db.insert(orderItems).values([
    { orderId: order1.id, productId: insertedProducts[0].id, quantity: 2, priceAtTime: 399 },
    { orderId: order1.id, productId: insertedProducts[5].id, quantity: 1, priceAtTime: 1299 },
    { orderId: order2.id, productId: insertedProducts[10].id, quantity: 1, priceAtTime: 2499 },
    { orderId: order3.id, productId: insertedProducts[2].id, quantity: 2, priceAtTime: 299 },
    { orderId: order3.id, productId: insertedProducts[15].id, quantity: 1, priceAtTime: 799 },
    { orderId: order4.id, productId: insertedProducts[11].id, quantity: 1, priceAtTime: 2299 },
    { orderId: order4.id, productId: insertedProducts[13].id, quantity: 1, priceAtTime: 2699 },
    { orderId: order5.id, productId: insertedProducts[15].id, quantity: 1, priceAtTime: 799 },
  ])
  console.log("  Orders created")

  // Chaos toggles (all off by default)
  await db.insert(chaosToggles).values(
    CHAOS_BUG_IDS.map((bugId) => ({ bugId, isActive: false }))
  )
  console.log("  Chaos toggles created")

  console.log("Seeding complete!")
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
