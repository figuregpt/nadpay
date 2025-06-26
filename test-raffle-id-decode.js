const { keccak256, toBytes } = require('viem');

const RAFFLE_SALT = "nadraffle_secure_salt_2024";

function createPredictableSecureRaffleId(internalId) {
  const data = `${internalId}_${RAFFLE_SALT}`;
  const hash = keccak256(toBytes(data));
  return hash.slice(2, 18); // 16 character hex string
}

function decodePredictableSecureRaffleId(secureId) {
  for (let i = 0; i < 100; i++) { // Test first 100 IDs
    if (createPredictableSecureRaffleId(i) === secureId) {
      return i;
    }
  }
  return null;
}

// Test the URL hash
const urlHash = "bbcc814a93a1e9c6";
console.log("🔍 Testing Raffle ID Decoding:");
console.log("URL Hash:", urlHash);

const decodedId = decodePredictableSecureRaffleId(urlHash);
console.log("Decoded Internal ID:", decodedId);

// Show what IDs 0-5 would encode to
console.log("\n📊 ID Mapping:");
for (let i = 0; i <= 5; i++) {
  const encoded = createPredictableSecureRaffleId(i);
  console.log(`Internal ID ${i} -> ${encoded}`);
}

// If URL hash doesn't match any ID, maybe it's using a different encoding
if (decodedId === null) {
  console.log("\n❌ URL hash doesn't match any ID in range 0-99");
  console.log("🔍 This suggests either:");
  console.log("  1. Different encoding method was used");
  console.log("  2. ID is outside 0-99 range");
  console.log("  3. Hash was generated with different salt/method");
} 