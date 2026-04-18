/**
 * Strata — Solana Actions / Blinks Check-In Endpoint
 *
 * URL:  /api/actions/checkin?eventCode=STRATA01
 * QR :  solana-action:https://yourapp.com/api/actions/checkin?eventCode=STRATA01
 *
 * Flow:
 *   1. GET  → returns ActionGetResponse shown in Phantom Blink UI
 *   2. POST → builds transaction: (register_member if new) + check_in
 *   3. Wallet signs → tx confirmed → Attendance PDA created on-chain
 */

import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import { createHash } from "crypto";

// ── Config ──────────────────────────────────────────────────────────────────

const PROGRAM_ID    = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID ?? "11111111111111111111111111111111");
const COMMUNITY_PDA = process.env.NEXT_PUBLIC_COMMUNITY_PDA;
const RPC_URL       = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const APP_URL       = process.env.NEXT_PUBLIC_APP_URL ?? "https://strata.vercel.app";

// Solana Actions spec CORS headers
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,x-action-version,x-blockchain-ids",
  "X-Action-Version":             "2.1.3",
  "X-Blockchain-Ids":             "solana:devnet",
};

// ── Anchor discriminator helper ─────────────────────────────────────────────

function discriminator(name: string): Buffer {
  return createHash("sha256").update(`global:${name}`).digest().slice(0, 8);
}

const CHECK_IN_DISC       = discriminator("check_in");
const REGISTER_MEMBER_DISC = discriminator("register_member");

// ── PDA helpers ─────────────────────────────────────────────────────────────

function eventPDA(community: PublicKey, index: bigint): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(index);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("event"), community.toBuffer(), buf],
    PROGRAM_ID
  )[0];
}

function attendancePDA(event: PublicKey, attendee: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("attendance"), event.toBuffer(), attendee.toBuffer()],
    PROGRAM_ID
  )[0];
}

function memberPDA(community: PublicKey, wallet: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("member"), community.toBuffer(), wallet.toBuffer()],
    PROGRAM_ID
  )[0];
}

// ── Borsh string encoder ─────────────────────────────────────────────────────

function borshString(s: string): Buffer {
  const encoded = Buffer.from(s, "utf-8");
  const len     = Buffer.alloc(4);
  len.writeUInt32LE(encoded.length, 0);
  return Buffer.concat([len, encoded]);
}

// ── Event data fetcher ───────────────────────────────────────────────────────

interface EventData {
  title:        string;
  location:     string;
  country:      string;
  eventDate:    number;
  capacity:     bigint;
  attendeeCount: bigint;
  eventIndex:   bigint;
  communityKey: PublicKey;
}

// Reads on-chain event account.
// Scans all events in the community to find one matching the eventCode.
async function fetchEventByCode(
  connection: Connection,
  community: PublicKey,
  eventCode: string
): Promise<{ pubkey: PublicKey; data: EventData } | null> {
  // Get community to learn event_count
  const commInfo = await connection.getAccountInfo(community);
  if (!commInfo) return null;

  // Parse event_count from community account
  // Layout: 8 disc + 32 authority + 4+64 name + 4+256 desc + 4+64 country + 8 member_count + 8 event_count
  const eventCountOffset = 8 + 32 + (4 + 64) + (4 + 256) + (4 + 64) + 8;
  const eventCount = commInfo.data.readBigUInt64LE(eventCountOffset);

  for (let i = BigInt(0); i < eventCount; i++) {
    const ePDA = eventPDA(community, i);
    const info = await connection.getAccountInfo(ePDA);
    if (!info) continue;

    // Parse event_code from account data
    // Layout offsets (approx): 8 disc + 32 comm + 32 org + 4+64 title + 4+512 desc + 4+128 loc + 4+64 country
    //   + 8 event_date + 8 capacity + 8 attendee_count + 8 fee + 4+8 event_code
    const offset = 8 + 32 + 32 + (4 + 64) + (4 + 512) + (4 + 128) + (4 + 64) + 8 + 8 + 8 + 8;
    const codeLen  = info.data.readUInt32LE(offset);
    const onChainCode = info.data.slice(offset + 4, offset + 4 + codeLen).toString("utf-8");

    if (onChainCode.toUpperCase() !== eventCode.toUpperCase()) continue;

    // Parse remaining fields
    const titleOffset = 8 + 32 + 32;
    const titleLen    = info.data.readUInt32LE(titleOffset);
    const title       = info.data.slice(titleOffset + 4, titleOffset + 4 + titleLen).toString("utf-8");

    const descOffset  = titleOffset + 4 + 64;
    const locOffset   = descOffset + 4 + 512;
    const locLen      = info.data.readUInt32LE(locOffset);
    const location    = info.data.slice(locOffset + 4, locOffset + 4 + locLen).toString("utf-8");

    const countryOffset = locOffset + 4 + 128;
    const countryLen    = info.data.readUInt32LE(countryOffset);
    const country       = info.data.slice(countryOffset + 4, countryOffset + 4 + countryLen).toString("utf-8");

    const dateOffset      = countryOffset + 4 + 64;
    const eventDate       = Number(info.data.readBigInt64LE(dateOffset));
    const capacity        = info.data.readBigUInt64LE(dateOffset + 8);
    const attendeeCount   = info.data.readBigUInt64LE(dateOffset + 16);

    return {
      pubkey: ePDA,
      data: { title, location, country, eventDate, capacity, attendeeCount, eventIndex: i, communityKey: community },
    };
  }
  return null;
}

// ── OPTIONS (preflight) ──────────────────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// ── GET — Blink metadata ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const eventCode = req.nextUrl.searchParams.get("eventCode")?.toUpperCase();
  if (!eventCode) {
    return NextResponse.json({ error: "Missing eventCode param" }, { status: 400, headers: CORS });
  }
  if (!COMMUNITY_PDA) {
    return NextResponse.json({ error: "Server not configured — COMMUNITY_PDA missing" }, { status: 500, headers: CORS });
  }

  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const community  = new PublicKey(COMMUNITY_PDA);
    const found      = await fetchEventByCode(connection, community, eventCode);

    if (!found) {
      return NextResponse.json({ error: `Event "${eventCode}" not found` }, { status: 404, headers: CORS });
    }

    const { data } = found;
    const spotsLeft = Number(data.capacity) - Number(data.attendeeCount);
    const dateStr   = new Date(data.eventDate * 1000).toLocaleDateString("en-US", { dateStyle: "full" });

    const payload = {
      type:        "action",
      icon:        `${APP_URL}/strata-icon.png`,
      title:       `[STRATA] ${data.title}`,
      description: [
        `📍 ${data.location}, ${data.country}`,
        `📅 ${dateStr}`,
        `👥 ${data.attendeeCount} checked in — ${spotsLeft} spots left`,
        ``,
        `Tap Check In to create your on-chain Proof-of-Presence.`,
        `New here? You'll be auto-registered in the community.`,
      ].join("\n"),
      label: "Check In",
      links: {
        actions: [
          {
            label: "Check In",
            href:  `${APP_URL}/api/actions/checkin?eventCode=${eventCode}`,
            type:  "transaction",
          },
        ],
      },
    };

    return NextResponse.json(payload, { headers: CORS });

  } catch (err: any) {
    console.error("[checkin GET]", err);
    return NextResponse.json({ error: "Failed to load event", detail: err?.message }, { status: 500, headers: CORS });
  }
}

// ── POST — build transaction ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const eventCode = req.nextUrl.searchParams.get("eventCode")?.toUpperCase();
  if (!eventCode) {
    return NextResponse.json({ error: "Missing eventCode param" }, { status: 400, headers: CORS });
  }
  if (!COMMUNITY_PDA) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500, headers: CORS });
  }

  let body: { account: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: CORS });
  }

  let attendee: PublicKey;
  try {
    attendee = new PublicKey(body.account);
  } catch {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400, headers: CORS });
  }

  try {
    const connection   = new Connection(RPC_URL, "confirmed");
    const communityKey = new PublicKey(COMMUNITY_PDA);
    const found        = await fetchEventByCode(connection, communityKey, eventCode);

    if (!found) {
      return NextResponse.json({ error: `Event "${eventCode}" not found` }, { status: 404, headers: CORS });
    }

    const { pubkey: ePDA, data } = found;
    const mPDA  = memberPDA(communityKey, attendee);
    const aPDA  = attendancePDA(ePDA, attendee);

    const ixs: TransactionInstruction[] = [];

    // Auto-register if member account doesn't exist
    const memberInfo = await connection.getAccountInfo(mPDA);
    if (!memberInfo) {
      const usernameDefault = attendee.toBase58().slice(0, 8);
      const ixData = Buffer.concat([
        REGISTER_MEMBER_DISC,
        borshString(usernameDefault),
      ]);
      ixs.push(new TransactionInstruction({
        programId: PROGRAM_ID,
        data: ixData,
        keys: [
          { pubkey: communityKey, isSigner: false, isWritable: true  },
          { pubkey: mPDA,         isSigner: false, isWritable: true  },
          { pubkey: attendee,     isSigner: true,  isWritable: true  },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
      }));
    }

    // check_in instruction
    const checkInData = Buffer.concat([
      CHECK_IN_DISC,
      borshString(eventCode.slice(0, 8)),
    ]);
    ixs.push(new TransactionInstruction({
      programId: PROGRAM_ID,
      data: checkInData,
      keys: [
        { pubkey: communityKey, isSigner: false, isWritable: true  },
        { pubkey: ePDA,         isSigner: false, isWritable: true  },
        { pubkey: aPDA,         isSigner: false, isWritable: true  },
        { pubkey: mPDA,         isSigner: false, isWritable: true  },
        { pubkey: attendee,     isSigner: true,  isWritable: true  },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
    }));

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    const tx = new Transaction({ feePayer: attendee, blockhash, lastValidBlockHeight });
    ixs.forEach((ix) => tx.add(ix));

    const serialized = tx.serialize({ requireAllSignatures: false });

    return NextResponse.json(
      {
        transaction: serialized.toString("base64"),
        message: `Checked in to ${data.title}! Your Proof-of-Presence is now on-chain.`,
      },
      { headers: CORS }
    );

  } catch (err: any) {
    console.error("[checkin POST]", err);
    return NextResponse.json(
      { error: "Failed to build transaction", detail: err?.message },
      { status: 500, headers: CORS }
    );
  }
}
