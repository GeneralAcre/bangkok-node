#!/bin/bash
# Full sync: Windows → WSL, regenerate IDL, clear cache, start dev
set -e

WIN="/mnt/c/Users/ACRESANPAPHAT/Desktop/strata-project"
WSL="$HOME/strata"
PROGRAM_ID="49u7b39dxetV3Jojzx5b1zgfb2XiYEYPdmxnhBJK8VWG"

echo "=== Syncing source files ==="
cp "$WIN/app/src/app/page.tsx"                    "$WSL/app/src/app/page.tsx"
cp "$WIN/app/src/app/organizer/page.tsx"          "$WSL/app/src/app/organizer/page.tsx"
cp "$WIN/app/src/app/profile/page.tsx"            "$WSL/app/src/app/profile/page.tsx"
cp "$WIN/app/src/app/layout.tsx"                  "$WSL/app/src/app/layout.tsx"
cp "$WIN/app/src/components/StrataDashboard.jsx"  "$WSL/app/src/components/StrataDashboard.jsx"
cp "$WIN/app/src/components/LandingPage.jsx"      "$WSL/app/src/components/LandingPage.jsx"
cp "$WIN/app/src/components/WalletProvider.tsx"   "$WSL/app/src/components/WalletProvider.tsx"
cp "$WIN/app/src/utils/strata-client.ts"          "$WSL/app/src/utils/strata-client.ts"
echo "  ✓ Source files synced"

echo ""
echo "=== Regenerating IDL with real program ID ==="
mkdir -p "$WSL/app/src/idl"
node "$WSL/scripts/generate-idl.js" "$PROGRAM_ID"
echo "  ✓ IDL written to app/src/idl/strata.json"

echo ""
echo "=== Setting up .env.local ==="
cp "$WIN/app/.env.local" "$WSL/app/.env.local"
echo "  ✓ .env.local synced"
echo ""
cat "$WSL/app/.env.local"

echo ""
echo "=== Verifying isMemberRegistered ==="
count=$(grep -c "isMemberRegistered" "$WSL/app/src/utils/strata-client.ts")
echo "  occurrences: $count"

echo ""
echo "=== Clearing .next cache ==="
rm -rf "$WSL/app/.next"
echo "  ✓ Cache cleared"

echo ""
echo "=== Starting dev server ==="
cd "$WSL/app" && npm run dev
