/**
 * Strata — On-chain community initializer
 * Run via:  PROGRAM_ID=<id> npx ts-node scripts/setup-community.ts
 */

import * as fs from "fs";
import * as path from "path";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program, web3 } from "@coral-xyz/anchor";

// ── Config from environment ────────────────────────────────────────────────
const PROGRAM_ID_STR   = process.env.PROGRAM_ID;
const WALLET_PATH      = process.env.WALLET_PATH ?? `${process.env.HOME}/.config/solana/id.json`;
const COMMUNITY_NAME   = process.env.COMMUNITY_NAME ?? "Strata Bangkok";
const RPC_URL          = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

if (!PROGRAM_ID_STR) {
  console.error("ERROR: PROGRAM_ID env var not set.");
  process.exit(1);
}

const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);

// ── Load wallet ────────────────────────────────────────────────────────────
if (!fs.existsSync(WALLET_PATH)) {
  console.error(`ERROR: Wallet not found at ${WALLET_PATH}`);
  console.error("Run: solana-keygen new --no-bip39-passphrase");
  process.exit(1);
}

const rawKey = JSON.parse(fs.readFileSync(WALLET_PATH, "utf-8")) as number[];
const payer  = Keypair.fromSecretKey(new Uint8Array(rawKey));
console.log("Wallet:", payer.publicKey.toBase58());

// ── Load IDL ───────────────────────────────────────────────────────────────
const IDL_PATH = path.join(__dirname, "..", "target", "idl", "strata.json");
if (!fs.existsSync(IDL_PATH)) {
  console.error("ERROR: IDL not found at", IDL_PATH);
  console.error("Run 'anchor build' first.");
  process.exit(1);
}
const idl = JSON.parse(fs.readFileSync(IDL_PATH, "utf-8"));

// ── Set up provider ────────────────────────────────────────────────────────
const connection = new Connection(RPC_URL, "confirmed");
const wallet     = new anchor.Wallet(payer);
const provider   = new AnchorProvider(connection, wallet, {
  commitment: "confirmed",
  preflightCommitment: "confirmed",
});
anchor.setProvider(provider);

const program = new Program(idl, provider);

// ── Derive Community PDA ───────────────────────────────────────────────────
function findCommunityPDA(authority: PublicKey, name: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("community"), authority.toBuffer(), Buffer.from(name)],
    PROGRAM_ID
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const [communityPDA] = findCommunityPDA(payer.publicKey, COMMUNITY_NAME);
  console.log("\nCommunity PDA:", communityPDA.toBase58());

  // Check if already exists
  const existing = await connection.getAccountInfo(communityPDA);
  if (existing) {
    console.log("Community already exists on-chain.");
    writeEnv(communityPDA);
    return;
  }

  console.log(`\nCreating community "${COMMUNITY_NAME}" on devnet...`);

  const tx = await (program.methods as any)
    .initializeCommunity(
      COMMUNITY_NAME,
      "The on-chain coordination layer for Solana builders in Bangkok and Southeast Asia.",
      "Thailand"
    )
    .accounts({
      community:     communityPDA,
      authority:     payer.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("✓ Transaction:", tx);
  console.log("✓ Explorer:", `https://explorer.solana.com/tx/${tx}?cluster=devnet`);

  writeEnv(communityPDA);
}

function writeEnv(communityPDA: PublicKey) {
  const envPath = path.join(__dirname, "..", "app", ".env.local");
  const envContent = [
    `NEXT_PUBLIC_PROGRAM_ID=${PROGRAM_ID_STR}`,
    `NEXT_PUBLIC_COMMUNITY_PDA=${communityPDA.toBase58()}`,
    `NEXT_PUBLIC_RPC_URL=${RPC_URL}`,
    `NEXT_PUBLIC_APP_URL=http://localhost:3000`,
    ``,
    `# Add your Anthropic key here if using the Copilot feature`,
    `# ANTHROPIC_API_KEY=sk-ant-...`,
  ].join("\n");

  fs.writeFileSync(envPath, envContent, "utf-8");
  console.log("\n✓ Wrote app/.env.local:");
  console.log(`  NEXT_PUBLIC_PROGRAM_ID    = ${PROGRAM_ID_STR}`);
  console.log(`  NEXT_PUBLIC_COMMUNITY_PDA = ${communityPDA.toBase58()}`);
  console.log(`  NEXT_PUBLIC_RPC_URL       = ${RPC_URL}`);
}

main().catch((err) => {
  console.error("\nERROR:", err);
  process.exit(1);
});
