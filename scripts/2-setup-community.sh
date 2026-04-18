#!/bin/bash
# Strata — Create "Strata Bangkok" community on devnet
# Usage: bash scripts/2-setup-community.sh <PROGRAM_ID>

set -e

PROGRAM_ID="${1:-}"
if [ -z "$PROGRAM_ID" ]; then
  echo "Usage: bash scripts/2-setup-community.sh <PROGRAM_ID>"
  echo ""
  echo "Example:"
  echo "  bash scripts/2-setup-community.sh ABC123...xyz"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║    STRATA — Create Community On-Chain            ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Program ID: $PROGRAM_ID"
echo "Wallet    : $(solana address)"
echo ""

# ── Install dependencies if missing ───────────────────────────────────────
if [ ! -d "node_modules/@coral-xyz/anchor" ]; then
  echo "Installing root dependencies..."
  npm install --legacy-peer-deps
fi

# ── Ensure ts-node is available ───────────────────────────────────────────
if ! npx ts-node --version &>/dev/null; then
  echo "Installing ts-node..."
  npm install --save-dev ts-node --legacy-peer-deps
fi

# ── Run the TypeScript setup script ───────────────────────────────────────
echo "=== Running community setup script ==="
PROGRAM_ID="$PROGRAM_ID" \
WALLET_PATH="$HOME/.config/solana/id.json" \
COMMUNITY_NAME="Strata Bangkok" \
  npx ts-node --project tsconfig.json scripts/setup-community.ts

echo ""
echo "=== Done! Check app/.env.local for your env vars ==="
echo ""
echo "NEXT STEPS:"
echo "  cd app && npm install && npm run dev"
echo ""
echo "Then open:"
echo "  http://localhost:3000/organizer  ← create event + QR"
echo "  http://localhost:3000/profile    ← your on-chain identity"
