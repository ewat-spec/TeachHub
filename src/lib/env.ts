import { z } from 'zod';

const envSchema = z.object({
  // Next.js
  NODE_ENV: z.enum(['development', 'production', 'test']),
  
  // Firebase
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  
  // Optional environment variables
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_VERCEL_URL: z.string().optional(),
  
  // AI/Genkit (server-side only)
  GOOGLE_GENAI_API_KEY: z.string().optional(),
  
  // Analytics (optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  
  // Sentry (optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

// Validate environment variables
const parseEnv = (): Env => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map(err => err.path.join('.'))
        .join(', ');
      
      throw new Error(
        `Missing or invalid environment variables: ${missingVars}\n` +
        'Please check your .env.local file and ensure all required variables are set.'
      );
    }
    throw error;
  }
};

// Export validated environment variables
export const env = parseEnv();

// Helper functions
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

export const getAppUrl = (): string => {
  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL;
  }
  
  if (env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  if (isDevelopment) {
    return 'http://localhost:9002';
  }
  
  return 'https://teachhub.app'; // fallback
};

// Feature flags based on environment
export const features = {
  analytics: !!env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  errorTracking: !!env.NEXT_PUBLIC_SENTRY_DSN,
  performanceTracking: isProduction,
  debugMode: isDevelopment,
} as const;