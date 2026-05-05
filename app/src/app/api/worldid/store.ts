// In-memory World ID state — resets on cold start (fine for devnet)

// Nullifiers that passed World ID verification: "nullifier_hash:EVENT_CODE"
export const usedNullifiers = new Set<string>();

// Nullifiers that have been verified but not yet spent (validated by /api/worldid/verify)
export const pendingNullifiers = new Map<string, { wallet: string; eventCode: string; ts: number }>();

// Wallets that have at least one World ID verified check-in
export const verifiedWallets = new Set<string>();
