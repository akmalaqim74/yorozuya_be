import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000").transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
  SUPABASE_URL: z.string().url().default("https://placeholder.supabase.co"),
  SUPABASE_ANON_KEY: z.string().default("placeholder-anon-key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default("placeholder-service-role-key"),
  JWT_SECRET: z.string().default("yorozuya_development_jwt_secret_key_12345"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export default env;
