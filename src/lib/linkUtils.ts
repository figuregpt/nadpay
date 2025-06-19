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