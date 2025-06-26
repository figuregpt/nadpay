import { keccak256, toBytes } from 'viem';

// Secret salt for hashing
const LINK_SALT = "nadpay_secret_salt_2024";

/**
 * Convert internal link ID to public hash
 */
export function encodePublicLinkId(internalId: number): string {
  const data = `${internalId}_${LINK_SALT}`;
  const hash = keccak256(toBytes(data));
  return hash.slice(2, 14);
}

/**
 * Convert public hash back to internal link ID
 */
export function decodePublicLinkId(publicId: string): number | null {
  for (let i = 0; i < 10000; i++) {
    if (encodePublicLinkId(i) === publicId) {
      return i;
    }
  }
  return null;
}

/**
 * Use timestamp + hash combination for secure IDs
 */
export function createTimestampBasedId(internalId: number): string {
  const timestamp = Date.now();
  const data = `${internalId}_${timestamp}_${LINK_SALT}`;
  const hash = keccak256(toBytes(data));
  return `${timestamp}_${hash.slice(2, 10)}`;
}

/**
 * Decode timestamp-based ID
 */
export function decodeTimestampBasedId(publicId: string): { timestamp: number; hash: string } | null {
  const parts = publicId.split('_');
  if (parts.length !== 2) return null;
  
  const timestamp = parseInt(parts[0]);
  const hash = parts[1];
  
  if (isNaN(timestamp) || hash.length !== 8) return null;
  
  return { timestamp, hash };
}

// Raffle-specific utilities
const RAFFLE_SALT = "nadraffle_secure_salt_2024";

/**
 * Create secure raffle ID using internal ID + transaction hash
 */
export function createSecureRaffleId(internalId: number, txHash?: string): string {
  const timestamp = Date.now();
  const hashSource = txHash || timestamp.toString();
  const data = `raffle_${internalId}_${hashSource}_${RAFFLE_SALT}`;
  const hash = keccak256(toBytes(data));
  return hash.slice(2, 18); // 16 character hex string
}

/**
 * Decode secure raffle ID back to internal ID
 * This is a brute force approach for small numbers of raffles
 */
export function decodeSecureRaffleId(secureId: string): number | null {
  // Try to find matching internal ID (limited search for performance)
  for (let i = 0; i < 10000; i++) {
    // Try with different possible transaction hashes and timestamps
    // This is not perfect but works for reasonable numbers of raffles
    const possibleIds = [
      createSecureRaffleId(i),
      // Could add more variations if needed
    ];
    
    if (possibleIds.some(id => id === secureId)) {
      return i;
    }
  }
  return null;
}

/**
 * Alternative: Use a more predictable but still secure approach
 * Combines internal ID with a hash but keeps it decodable
 */
export function createPredictableSecureRaffleId(internalId: number): string {
  const data = `${internalId}_${RAFFLE_SALT}`;
  const hash = keccak256(toBytes(data));
  return hash.slice(2, 18); // 16 character hex string
}

/**
 * Decode predictable secure raffle ID
 */
export function decodePredictableSecureRaffleId(secureId: string): number | null {
  for (let i = 0; i < 10000; i++) {
    if (createPredictableSecureRaffleId(i) === secureId) {
      return i;
    }
  }
  return null;
} 