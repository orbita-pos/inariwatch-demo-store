import { defineConfig } from "drizzle-kit"
import dotenv from "dotenv"

dotenv.config()

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
