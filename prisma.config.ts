import { loadEnvConfig } from "@next/env"
import { defineConfig } from "prisma/config"

// Prisma CLI debe usar las mismas variables que Next.js. En Hostinger, las
// variables inyectadas por el panel conservan prioridad sobre archivos locales.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production")

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
})
