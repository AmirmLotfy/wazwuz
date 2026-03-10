import { z } from "zod";

const envSchema = z.object({
  AUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GCP_PROJECT_ID: z.string().optional(),
  GCS_BUCKET_NAME: z.string().optional(),
  FIRESTORE_DATABASE_ID: z.string().optional(),
  LIVE_MODEL: z.string().optional(),
  IMAGE_FAST_MODEL: z.string().optional(),
  IMAGE_PRO_MODEL: z.string().optional(),
  REASONING_MODEL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
export const env = parsed.success ? parsed.data : ({} as z.infer<typeof envSchema>);
