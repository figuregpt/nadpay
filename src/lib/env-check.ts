// Environment variable validation that runs at runtime, not build time
export function checkRequiredEnvVars() {
  const required = [
    'MONGODB_URI',
    'NEXT_PUBLIC_RPC_URL',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your Railway environment variables.`
    );
  }
}

// Optional environment variables (warn but don't fail)
export function checkOptionalEnvVars() {
  const optional = [
    'PRIVATE_KEY', // For finalizer
    'TWITTER_CLIENT_ID', // For Twitter OAuth
    'TWITTER_CLIENT_SECRET',
    'TWITTER_CALLBACK_URL',
  ];

  const missing = optional.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(
      `Warning: Missing optional environment variables: ${missing.join(', ')}\n` +
      `Some features may not work properly.`
    );
  }
}

// Get environment variable with fallback
export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value && !fallback) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value || fallback || '';
} 