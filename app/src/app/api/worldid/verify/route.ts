import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { pendingNullifiers, verifiedWallets } from "../store";

const WLD_APP_ID    = process.env.WLD_APP_ID ?? "";
const WLD_ACTION    = process.env.NEXT_PUBLIC_WLD_ACTION ?? "signal-checkin";
const DEVNET_MODE   = !WLD_APP_ID;

// World ID verification endpoint
const WLD_VERIFY_URL = `https://developer.worldcoin.org/api/v2/verify/${WLD_APP_ID}`;

function hashSignal(signal: string): string {
  return "0x" + createHash("sha256").update(signal).digest("hex");
}

export async function POST(req: NextRequest) {
  let body: {
    proof: string;
    merkle_root: string;
    nullifier_hash: string;
    verification_level: string;
    eventCode: string;
    wallet: string;
  };

  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { proof, merkle_root, nullifier_hash, verification_level, eventCode, wallet } = body;

  if (!nullifier_hash || !eventCode || !wallet) {
    return NextResponse.json({ error: "nullifier_hash, eventCode, and wallet are required" }, { status: 400 });
  }

  const key = `${nullifier_hash}:${eventCode}`;

  // Check if this nullifier has already been used for this event
  if (pendingNullifiers.has(key)) {
    const existing = pendingNullifiers.get(key)!;
    if (existing.wallet !== wallet) {
      return NextResponse.json(
        { error: "This World ID has already verified for this event with a different wallet" },
        { status: 409 }
      );
    }
    // Same wallet re-verifying — allow (idempotent)
    return NextResponse.json({ success: true, nullifier_hash, devnet: DEVNET_MODE });
  }

  // Devnet mode: skip cryptographic proof verification
  if (DEVNET_MODE) {
    pendingNullifiers.set(key, { wallet, eventCode, ts: Date.now() });
    verifiedWallets.add(wallet);
    console.log(`[worldid] devnet verify — nullifier=${nullifier_hash.slice(0, 16)}… wallet=${wallet.slice(0, 8)}…`);
    return NextResponse.json({ success: true, nullifier_hash, devnet: true });
  }

  // Production: verify with World ID developer portal
  if (!proof || !merkle_root) {
    return NextResponse.json({ error: "proof and merkle_root required for production verify" }, { status: 400 });
  }

  try {
    const verifyRes = await fetch(WLD_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nullifier_hash,
        merkle_root,
        proof,
        verification_level,
        action:      WLD_ACTION,
        signal_hash: hashSignal(eventCode),
      }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || verifyData.code === "invalid_proof") {
      return NextResponse.json(
        { error: verifyData.detail ?? "World ID proof verification failed" },
        { status: 400 }
      );
    }

    pendingNullifiers.set(key, { wallet, eventCode, ts: Date.now() });
    verifiedWallets.add(wallet);
    return NextResponse.json({ success: true, nullifier_hash });

  } catch (e: any) {
    console.error("[worldid verify]", e);
    return NextResponse.json({ error: "World ID verification service unavailable" }, { status: 502 });
  }
}
