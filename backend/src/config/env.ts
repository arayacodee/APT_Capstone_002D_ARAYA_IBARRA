import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().default("http://localhost:4200"),
  SUPERADMIN_LOGIN: z.string().trim().toLowerCase().min(3).default('superadmin@cronos'),
  SUPERADMIN_PASSWORD_HASH: z.string().regex(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/).optional(),
  TWILIO_ACCOUNT_SID: z.string().regex(/^AC[a-fA-F0-9]{32}$/).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().regex(/^VA[a-fA-F0-9]{32}$/).optional(),
    GOOGLE_CLIENT_ID: z.string().min(1),

    AUTH_SECRET: z.string().min(32),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);
