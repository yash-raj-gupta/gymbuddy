import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js runtime reads .env.local; mirror that for the Prisma CLI.
loadEnv({ path: ".env.local" });
loadEnv(); // .env fallback

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations use the direct (non-pooled) connection on Supabase.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
