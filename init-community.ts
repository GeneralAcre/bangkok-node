/**
 * One-time script — initialize a Signal community under the current program.
 * Run: npx ts-node --project tsconfig.node.json init-community.ts
 *
 * Outputs the new NEXT_PUBLIC_COMMUNITY_PDA value to paste into Vercel.
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import fs from "fs";
import path from "path";

const PROGRAM_ID    = new PublicKey("CmStH6nDHyHtsG5PLj9yvKmAQsY9GjDW2Ap8asMZrz57");
const RPC_URL       = "https://api.devnet.solana.com";
const COMMUNITY_NAME = "Signal";
const DESCRIPTION    = "Signal Protocol — Builder Community";
const COUNTRY        = "Thailand";

// Load wallet — try Solana CLI keypair first, fall back to TREASURY_KEYPAIR in .env.local
function loadPayer(): Keypair {
  const solanaPath = path.join(
    process.env.HOME ?? process.env.USERPROFILE ?? "",
    ".config", "solana", "id.json"
  );
  if (fs.existsSync(solanaPath)) {
    const key = JSON.parse(fs.readFileSync(solanaPath, "utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(key));
  }
  // Fall back to TREASURY_KEYPAIR from .env.local
  const envPath = path.join(__dirname, "app", ".env.local");
  const envRaw  = fs.readFileSync(envPath, "utf-8");
  const match   = envRaw.match(/TREASURY_KEYPAIR=(\[[\d,\s]+\])/);
  if (!match) throw new Error("No wallet found — set TREASURY_KEYPAIR in app/.env.local or create ~/.config/solana/id.json");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(match[1])));
}
const payer = loadPayer();

// Load IDL
const idl = JSON.parse(
  fs.readFileSync(path.join(__dirname, "app/src/idl/strata.json"), "utf-8")
);

async function main() {
  const conn = new Connection(RPC_URL, "confirmed");
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(conn, wallet, { commitment: "confirmed" });

  const program = new anchor.Program(idl, provider);

  const [communityPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("community"),
      payer.publicKey.toBuffer(),
      Buffer.from(COMMUNITY_NAME),
    ],
    PROGRAM_ID
  );

  // Airdrop SOL if balance is too low
  const balance = await conn.getBalance(payer.publicKey);
  if (balance < 0.05 * 1e9) {
    console.log("Airdropping 2 SOL to", payer.publicKey.toBase58(), "...");
    const sig = await conn.requestAirdrop(payer.publicKey, 2e9);
    await conn.confirmTransaction(sig, "confirmed");
    console.log("  Airdrop confirmed.");
  }

  // Check if already initialized
  const existing = await conn.getAccountInfo(communityPDA);
  if (existing) {
    console.log("\n✓ Community already exists!");
    console.log("NEXT_PUBLIC_COMMUNITY_PDA =", communityPDA.toBase58());
    return;
  }

  console.log("Initializing community...");
  console.log("  Program:   ", PROGRAM_ID.toBase58());
  console.log("  Authority: ", payer.publicKey.toBase58());
  console.log("  Name:      ", COMMUNITY_NAME);

  const tx = await (program.methods as any)
    .initializeCommunity(COMMUNITY_NAME, DESCRIPTION, COUNTRY)
    .accounts({
      community:     communityPDA,
      authority:     payer.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("\n✓ Community initialized! Tx:", tx);
  console.log("\n══════════════════════════════════════════════");
  console.log("Paste this into Vercel environment variables:");
  console.log("NEXT_PUBLIC_PROGRAM_ID   =", PROGRAM_ID.toBase58());
  console.log("NEXT_PUBLIC_COMMUNITY_PDA =", communityPDA.toBase58());
  console.log("══════════════════════════════════════════════");
}

main().catch(e => { console.error(e); process.exit(1); });
