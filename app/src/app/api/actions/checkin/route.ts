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

const CHECK_IN_DISC        = discriminator("check_in");
const REGISTER_MEMBER_DISC = discriminator("register_member");

// ── PDA helpers ─────────────────────────────────────────────────────────────

function eventPDA(community: PublicKey, index: number): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(index));
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

// ── Borsh helpers ────────────────────────────────────────────────────────────

function borshString(s: string): Buffer {
  const encoded = Buffer.from(s, "utf-8");
  const len     = Buffer.alloc(4);
  len.writeUInt32LE(encoded.length, 0);
  return Buffer.concat([len, encoded]);
}

// Read a variable-length Anchor string: u32 len + bytes
function readStr(data: Buffer, offset: number): { value: string; next: number } {
  const len   = data.readUInt32LE(offset);
  const value = data.slice(offset + 4, offset + 4 + len).toString("utf-8");
  return { value, next: offset + 4 + len };
}

// ── Community parser ─────────────────────────────────────────────────────────
// Layout: disc(8) + authority(32) + name(str) + description(str) + country(str)
//         + member_count(u64=8) + event_count(u64=8)

function parseCommunityEventCount(data: Buffer): number {
  let off = 8 + 32; // skip discriminator + authority pubkey
  off = readStr(data, off).next; // name
  off = readStr(data, off).next; // description
  off = readStr(data, off).next; // country
  off += 8;                      // member_count
  return Number(data.readBigUInt64LE(off)); // event_count
}

// ── Event parser ─────────────────────────────────────────────────────────────
// Layout: disc(8) + community(32) + organizer(32) + title(str) + description(str)
//         + location(str) + country(str) + event_date(i64=8) + capacity(u64=8)
//         + attendee_count(u64=8) + fee(u64=8) + event_code(str) + status(u8=1)

interface EventData {
  title:         string;
  location:      string;
  country:       string;
  eventDate:     number;
  capacity:      bigint;
  attendeeCount: bigint;
  eventIndex:    bigint;
  communityKey:  PublicKey;
}

// ── Full event parser (returns event_code too) ───────────────────────────────

function parseEventFull(data: Buffer, index: number, community: PublicKey): EventData & { eventCode: string } {
  let off = 8 + 32 + 32; // disc + community + organizer
  const title         = readStr(data, off); off = title.next;
  const _description  = readStr(data, off); off = _description.next;
  const location      = readStr(data, off); off = location.next;
  const country       = readStr(data, off); off = country.next;
  const eventDate     = Number(data.readBigInt64LE(off));  off += 8;
  const capacity      = data.readBigUInt64LE(off);         off += 8;
  const attendeeCount = data.readBigUInt64LE(off);         off += 8;
  /* fee */                                                 off += 8;
  const eventCode     = readStr(data, off);

  return {
    title:         title.value,
    location:      location.value,
    country:       country.value,
    eventDate,
    capacity,
    attendeeCount,
    eventIndex:    BigInt(index),
    communityKey:  community,
    eventCode:     eventCode.value,
  };
}

// ── Event fetcher (pure borsh — no Anchor dynamic imports) ───────────────────

async function fetchEventByCode(
  connection: Connection,
  community: PublicKey,
  eventCode: string
): Promise<{ pubkey: PublicKey; data: EventData } | null> {
  const commInfo = await connection.getAccountInfo(community);
  if (!commInfo) return null;

  const count = parseCommunityEventCount(commInfo.data);

  // Batch-fetch all event accounts
  const ePDAs    = Array.from({ length: count }, (_, i) => eventPDA(community, i));
  const accounts = await connection.getMultipleAccountsInfo(ePDAs);

  for (let i = 0; i < count; i++) {
    const acc = accounts[i];
    if (!acc) continue;
    try {
      const ev = parseEventFull(acc.data, i, community);
      if (ev.eventCode.toUpperCase() === eventCode.toUpperCase()) {
        return { pubkey: ePDAs[i], data: ev };
      }
    } catch (e) {
      console.error(`[fetchEventByCode] parse error at index ${i}:`, e);
    }
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
    const mPDA = memberPDA(communityKey, attendee);
    const aPDA = attendancePDA(ePDA, attendee);

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
