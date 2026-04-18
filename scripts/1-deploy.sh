#!/bin/bash
# Strata — Deploy to Solana Devnet (bypasses anchor build for toolchain compatibility)
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       STRATA — Deploy to Devnet          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

for cmd in solana cargo node; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' not found."
    exit 1
  fi
done

echo "Wallet : $(solana address)"
echo "Balance: $(solana balance)"
echo ""

# ── Step 1: Generate program keypair ──────────────────────────────────────
echo "=== Step 1: Generating program keypair ==="
mkdir -p target/deploy
if [ ! -f target/deploy/strata-keypair.json ]; then
  solana-keygen new --no-bip39-passphrase --outfile target/deploy/strata-keypair.json
fi
PROGRAM_ID=$(solana-keygen pubkey target/deploy/strata-keypair.json)
echo "Program ID: $PROGRAM_ID"
echo ""

# ── Step 2: Patch declare_id! and Anchor.toml ─────────────────────────────
echo "=== Step 2: Patching source files ==="
sed -i "s/declare_id!(\"[^\"]*\")/declare_id!(\"$PROGRAM_ID\")/" programs/strata/src/lib.rs
echo "  ✓ programs/strata/src/lib.rs"
sed -i "s/strata = \"[^\"]*\"/strata = \"$PROGRAM_ID\"/" Anchor.toml
echo "  ✓ Anchor.toml"
echo ""

# ── Step 3: Build (cargo build-sbf, no anchor wrapper) ────────────────────
echo "=== Step 3: Building program (cargo build-sbf) ==="
cargo build-sbf --manifest-path programs/strata/Cargo.toml 2>&1
echo ""

# ── Step 4: Deploy ────────────────────────────────────────────────────────
echo "=== Step 4: Deploying to devnet ==="
solana program deploy \
  target/deploy/strata.so \
  --program-id target/deploy/strata-keypair.json \
  --url https://api.devnet.solana.com \
  2>&1
echo ""

# ── Step 5: Generate IDL ──────────────────────────────────────────────────
echo "=== Step 5: Generating IDL ==="
node scripts/generate-idl.js "$PROGRAM_ID"
echo ""

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║               DEPLOYMENT SUCCESSFUL ✓                                ║"
echo "╠═══════════════════════════════════════════════════════════════════════╣"
printf "║  Program ID : %-55s║\n" "$PROGRAM_ID"
printf "║  Explorer   : %-55s║\n" "https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "NEXT STEP: bash scripts/2-setup-community.sh $PROGRAM_ID"
