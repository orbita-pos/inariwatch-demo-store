import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const products = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // cents
  imageUrl: text("image_url"),
  stock: integer("stock").notNull().default(0),
  category: text("category").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const orders = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  status: text("status", {
    enum: ["pending", "processing", "shipped", "cancelled"],
  }).notNull().default("pending"),
  total: integer("total").notNull(), // cents
  shippingAddress: jsonb("shipping_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id),
  productId: text("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtTime: integer("price_at_time").notNull(), // cents
})

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  productId: text("product_id").notNull().references(() => products.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const coupons = pgTable("coupons", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
})

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  productId: text("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
})

export const chaosToggles = pgTable("chaos_toggles", {
  id: serial("id").primaryKey(),
  bugId: text("bug_id").notNull().unique(),
  isActive: boolean("is_active").notNull().default(false),
  activatedAt: timestamp("activated_at"),
  activatedBy: text("activated_by"),
}, (table) => [
  uniqueIndex("chaos_toggles_bug_id_idx").on(table.bugId),
])
