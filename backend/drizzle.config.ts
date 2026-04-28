/// <reference types="node" />
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl.includes(".supabase.co")) {
  throw new Error("DATABASE_URL must point to Supabase PostgreSQL host (*.supabase.co).");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/infrastructure/database/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});

