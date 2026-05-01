import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional(),
  CEREBRAS_API_KEY: z.string().min(1, "CEREBRAS_API_KEY is required"),
  CEREBRAS_MODEL: z.string().min(1).default("gpt-oss-120b"),
  CEREBRAS_FALLBACK_MODEL: z.string().min(1).default("zai-glm-4.7"),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  GROQ_CHAT_MODEL: z.string().min(1).default("openai/gpt-oss-120b"),
  GROQ_VISION_MODEL: z.string().min(1).default("meta-llama/llama-4-scout-17b-16e-instruct"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export function getSupabaseStorageEnv() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET } = env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_STORAGE_BUCKET) {
    throw new Error(
      "Supabase storage requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET.",
    );
  }

  return {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET,
  };
}
