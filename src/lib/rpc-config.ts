// RPC Configuration for better performance and reliability

export const RPC_ENDPOINTS = [
  'https://testnet-rpc.monad.xyz/',
  // Add backup endpoints here when available
];

export const RPC_CONFIG = {
  // Rate limiting configuration
  RATE_LIMIT_DELAY: 100, // ms between requests
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // ms
  
  // Batching configuration
  BATCH_SIZE: 10,
  BATCH_DELAY: 150, // ms between batches
  
  // Cache configuration
  CACHE_DURATION: 30000, // 30 seconds
  
  // Performance limits
  MAX_PARALLEL_REQUESTS: 5,
  MAX_RAFFLES_TO_CHECK: 100, // Only check latest 100 raffles
};

// Helper to get a random RPC endpoint
export function getRandomRpcEndpoint(): string {
  return RPC_ENDPOINTS[Math.floor(Math.random() * RPC_ENDPOINTS.length)];
}

// Helper to add delay
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry wrapper for RPC calls
export async function retryRpcCall<T>(
  fn: () => Promise<T>,
  retries = RPC_CONFIG.MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && error?.status === 429) {
      console.log(`⏳ Rate limited, retrying in ${RPC_CONFIG.RETRY_DELAY}ms...`);
      await delay(RPC_CONFIG.RETRY_DELAY);
      return retryRpcCall(fn, retries - 1);
    }
    throw error;
  }
} 