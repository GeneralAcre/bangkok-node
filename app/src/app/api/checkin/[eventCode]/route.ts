/**
 * Strata — Proof of Presence Check-In
 * Solana Actions / Blinks endpoint
 *
 * GET  /api/checkin/[eventCode]  → ActionGetResponse  (shown in QR scanner UI)
 * POST /api/checkin/[eventCode]  → ActionPostResponse (returns signed tx)
 *
 * Flow:
 *   Organizer shows QR at venue
 *   Attendee scans → Blinks UI appears
 *   Attendee taps "Check In" → wallet signs
 *   check_in ix fired → Attendance PDA created on-chain
 *   Bubblegum cNFT minted → record_nft_mint ix updates the PDA
 */

import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";

// ─── Config ──────────────────────────────────────────────────────────────────

const PROGRAM_ID   = new PublicKey("StrataPresenceProtocol111111111111111111111");
const RPC_ENDPOINT = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const APP_URL      = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// CORS headers required by the Solana Actions spec
const ACTIONS_CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-action-version, x-blockchain-ids",
  "X-Action-Version":             "2.1.3",
  "X-Blockchain-Ids":             "solana:devnet",
};

// ─── Mock event registry (replace with on-chain fetch after deployment) ──────

const MOCK_EVENTS: Record<string, {
  title: string;
  location: string;
  country: string;
  date: string;
  capacity: number;
  attendeeCount: number;
  communityPda: string;
  eventIndex: number;
}> = {
  "STRATA01": {
    title: "Strata Genesis Gathering",
    location: "Siam Paragon, Bangkok",
    country: "Thailand",
    date: "2026-05-01",
    capacity: 200,
    attendeeCount: 47,
    communityPda: "11111111111111111111111111111111",
    eventIndex: 0,
  },
  "BKKHACK1": {
    title: "Bangkok Web3 Hacker House",
    location: "Hubba-TO, Bangkok",
    country: "Thailand",
    date: "2026-05-15",
    capacity: 80,
    attendeeCount: 23,
    communityPda: "11111111111111111111111111111111",
    eventIndex: 1,
  },
};

// ─── PDA derivation helpers ───────────────────────────────────────────────────

function deriveEventPda(communityPda: PublicKey, eventIndex: number): PublicKey {
  const indexBuffer = Buffer.alloc(8);
  indexBuffer.writeBigUInt64LE(BigInt(eventIndex), 0);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("event"), communityPda.toBuffer(), indexBuffer],
    PROGRAM_ID
  );
  return pda;
}

function deriveAttendancePda(eventPda: PublicKey, attendeeWallet: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("attendance"), eventPda.toBuffer(), attendeeWallet.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

function deriveMemberPda(communityPda: PublicKey, wallet: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("member"), communityPda.toBuffer(), wallet.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

// ─── OPTIONS (preflight) ─────────────────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ACTIONS_CORS });
}

// ─── GET — describe the action (shown in Blink UI) ───────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { eventCode: string } }
) {
  const { eventCode } = params;
  const event = MOCK_EVENTS[eventCode.toUpperCase()];

  if (!event) {
    return NextResponse.json(
      { error: "Event not found. Check your QR code." },
      { status: 404, headers: ACTIONS_CORS }
    );
  }

  const spotsLeft = event.capacity - event.attendeeCount;

  // ActionGetResponse — Solana Actions spec
  const payload = {
    type:        "action",
    icon:        `${APP_URL}/strata-icon.png`,
    title:       `[STRATA] ${event.title}`,
    description: [
      `LOCATION: ${event.location}, ${event.country}`,
      `DATE: ${new Date(event.date).toLocaleDateString("en-US", { dateStyle: "full" })}`,
      `ATTENDANCE: ${event.attendeeCount} checked in / ${spotsLeft} spots remaining`,
      ``,
      `Tap Check In to verify your attendance. A Strata Proof-of-Presence NFT will be minted to your wallet.`,
    ].join("\n"),
    label: "Check In",
    links: {
      actions: [
        {
          label:  "Check In + Mint NFT",
          href:   `/api/checkin/${eventCode}`,
          type:   "transaction",
        },
      ],
    },
  };

  return NextResponse.json(payload, { headers: ACTIONS_CORS });
}

// ─── POST — build and return the check-in transaction ────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { eventCode: string } }
) {
  const { eventCode } = params;
  const event = MOCK_EVENTS[eventCode.toUpperCase()];

  if (!event) {
    return NextResponse.json(
      { error: "Event not found" },
      { status: 404, headers: ACTIONS_CORS }
    );
  }

  let body: { account: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: ACTIONS_CORS }
    );
  }

  let attendeeWallet: PublicKey;
  try {
    attendeeWallet = new PublicKey(body.account);
  } catch {
    return NextResponse.json(
      { error: "Invalid wallet address" },
      { status: 400, headers: ACTIONS_CORS }
    );
  }

  try {
    const connection   = new Connection(RPC_ENDPOINT, "confirmed");
    const communityPda = new PublicKey(event.communityPda);
    const eventPda     = deriveEventPda(communityPda, event.eventIndex);
    const attendancePda = deriveAttendancePda(eventPda, attendeeWallet);
    const memberPda    = deriveMemberPda(communityPda, attendeeWallet);

    // Build the check_in instruction
    // Discriminator = first 8 bytes of sha256("global:check_in")
    const discriminator = new Uint8Array([
      0x85, 0xf6, 0x77, 0x3a, 0x2e, 0x6b, 0x9c, 0x14,
    ]);

    // Encode event_code as borsh string: 4-byte LE length + bytes
    const codeStr = eventCode.toUpperCase().slice(0, 8);
    const eventCodeBytes = new TextEncoder().encode(codeStr);
    const eventCodeLength = new Uint8Array(4);
    new DataView(eventCodeLength.buffer).setUint32(0, eventCodeBytes.length, true);

    const data = new Uint8Array(
      discriminator.length + eventCodeLength.length + eventCodeBytes.length
    );
    data.set(discriminator, 0);
    data.set(eventCodeLength, discriminator.length);
    data.set(eventCodeBytes, discriminator.length + eventCodeLength.length);

    const checkInIx = new TransactionInstruction({
      programId: PROGRAM_ID,
      data: Buffer.from(data),
      keys: [
        { pubkey: communityPda,  isSigner: false, isWritable: true  },
        { pubkey: eventPda,      isSigner: false, isWritable: true  },
        { pubkey: attendancePda, isSigner: false, isWritable: true  },
        { pubkey: memberPda,     isSigner: false, isWritable: true  },
        { pubkey: attendeeWallet,isSigner: true,  isWritable: true  },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
    });

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    const tx = new Transaction({
      feePayer:           attendeeWallet,
      blockhash,
      lastValidBlockHeight,
    }).add(checkInIx);

    const serialized = tx.serialize({ requireAllSignatures: false });

    // ActionPostResponse
    return NextResponse.json(
      {
        transaction: serialized.toString("base64"),
        message: `Welcome to ${event.title}! Your Proof-of-Presence NFT is being minted.`,
      },
      { headers: ACTIONS_CORS }
    );

  } catch (err: any) {
    console.error("[check-in] error:", err);
    return NextResponse.json(
      { error: "Failed to build transaction", detail: err?.message },
      { status: 500, headers: ACTIONS_CORS }
    );
  }
}
