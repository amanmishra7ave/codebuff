import z from 'zod'

export const CLIENT_ENV_PREFIX = 'NEXT_PUBLIC_'

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_CB_ENVIRONMENT: z.enum(['dev', 'test', 'prod']).default('prod'),
  NEXT_PUBLIC_CODEBUFF_APP_URL: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPPORT_EMAIL: z.string().default('support@localhost'),
  NEXT_PUBLIC_POSTHOG_API_KEY: z.string().default('local'),
  NEXT_PUBLIC_POSTHOG_HOST_URL: z.string().default('http://localhost:8000'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().default('local'),
  NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL: z.string().default('http://localhost:3001'),
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_ID: z.string().optional(),
  NEXT_PUBLIC_WEB_PORT: z.coerce.number().default(3000),
})

export const clientEnvVars = clientEnvSchema.keyof().options
export type ClientEnvVar = (typeof clientEnvVars)[number]
export type ClientInput = {
  [K in (typeof clientEnvVars)[number]]: string | undefined
}
export type ClientEnv = z.infer<typeof clientEnvSchema>

// Bun will inject all these values, so we need to reference them individually (no for-loops)
export const clientProcessEnv: ClientInput = {
  NEXT_PUBLIC_CB_ENVIRONMENT: process.env.NEXT_PUBLIC_CB_ENVIRONMENT,
  NEXT_PUBLIC_CODEBUFF_APP_URL: process.env.NEXT_PUBLIC_CODEBUFF_APP_URL,
  NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
  NEXT_PUBLIC_POSTHOG_API_KEY: process.env.NEXT_PUBLIC_POSTHOG_API_KEY,
  NEXT_PUBLIC_POSTHOG_HOST_URL: process.env.NEXT_PUBLIC_POSTHOG_HOST_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL:
    process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL,
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_ID:
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_ID,
  NEXT_PUBLIC_WEB_PORT: process.env.NEXT_PUBLIC_WEB_PORT,
}
