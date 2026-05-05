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
  Ed25519Program,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import { createHash } from "crypto";
import { pendingNullifiers, usedNullifiers, verifiedWallets } from "../../worldid/store";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const WLD_REQUIRED    = !!process.env.WLD_APP_ID;

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

function borshI64(n: number): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(n), 0);
  return buf;
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
// Layout: disc(8) + community(32) + organizer(32) + title(str)
//         + location(str) + country(str)
//         + start_time(i64=8) + end_time(i64=8)
//         + capacity(u64=8) + attendee_count(u64=8) + fee(u64=8)
//         + event_code(str)
//         + event_index(u64=8) + escrow_bump(u8=1) + bump(u8=1) + created_at(i64=8)
//         + external_url(str) + is_hackathon(bool=1)

interface EventData {
  title:         string;
  location:      string;
  country:       string;
  startTime:     number;
  endTime:       number;
  capacity:      bigint;
  attendeeCount: bigint;
  eventIndex:    bigint;
  communityKey:  PublicKey;
  organizer:     PublicKey;
}

// ── Full event parser (returns event_code too) ───────────────────────────────

function parseEventFull(data: Buffer, index: number, community: PublicKey): EventData & { eventCode: string } {
  let off = 8 + 32; // disc + community
  const organizer     = new PublicKey(data.slice(off, off + 32)); off += 32;
  const title         = readStr(data, off); off = title.next;
  const location      = readStr(data, off); off = location.next;
  const country       = readStr(data, off); off = country.next;
  const startTime     = Number(data.readBigInt64LE(off)); off += 8;
  const endTime       = Number(data.readBigInt64LE(off)); off += 8;
  const capacity      = data.readBigUInt64LE(off);        off += 8;
  const attendeeCount = data.readBigUInt64LE(off);        off += 8;
  /* fee */                                               off += 8;
  const eventCode     = readStr(data, off);

  return {
    title:         title.value,
    location:      location.value,
    country:       country.value,
    startTime,
    endTime,
    capacity,
    attendeeCount,
    eventIndex:    BigInt(index),
    communityKey:  community,
    organizer,
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
  const sig       = req.nextUrl.searchParams.get("sig") ?? "";
  const exp       = req.nextUrl.searchParams.get("exp") ?? "";

  if (!eventCode) {
    return NextResponse.json({ error: "Missing eventCode param" }, { status: 400, headers: CORS });
  }
  if (!COMMUNITY_PDA) {
    return NextResponse.json({ error: "Server not configured — COMMUNITY_PDA missing" }, { status: 500, headers: CORS });
  }
  if (!sig || !exp) {
    return NextResponse.json({ error: "Missing organizer signature — ask the organizer to go live again" }, { status: 400, headers: CORS });
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
    const dateStr   = new Date(data.startTime * 1000).toLocaleDateString("en-US", { dateStyle: "full" });
    const expiry    = parseInt(exp, 10);
    const expired   = Date.now() / 1000 > expiry;

    const payload = {
      type:        "action",
      icon:        `${APP_URL}/strata-icon.png`,
      title:       `[SIGNAL] ${data.title}`,
      description: [
        `${data.location}, ${data.country}`,
        `${dateStr}`,
        `${data.attendeeCount} checked in — ${spotsLeft} spots left`,
        expired ? `⚠ QR expired — ask organizer to refresh` : ``,
        ``,
        `Tap Check In to create your on-chain Proof-of-Presence.`,
        `New here? You'll be auto-registered in the community.`,
      ].join("\n"),
      label: "Check In",
      links: {
        actions: [
          {
            label: "Check In",
            href:  `${APP_URL}/api/actions/checkin?eventCode=${eventCode}&sig=${encodeURIComponent(sig)}&exp=${exp}`,
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
  const sigHex    = req.nextUrl.searchParams.get("sig");
  const expStr    = req.nextUrl.searchParams.get("exp");

  if (!eventCode) {
    return NextResponse.json({ error: "Missing eventCode param" }, { status: 400, headers: CORS });
  }
  if (!sigHex || !expStr) {
    return NextResponse.json({ error: "Missing organizer signature (sig/exp) — ask the organizer to go live again" }, { status: 400, headers: CORS });
  }
  if (!COMMUNITY_PDA) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500, headers: CORS });
  }

  const expiry = parseInt(expStr, 10);
  if (isNaN(expiry) || Date.now() / 1000 > expiry) {
    return NextResponse.json({ error: "QR code has expired — ask the organizer to go live again" }, { status: 400, headers: CORS });
  }

  let body: { account: string; nullifier_hash?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: CORS }); }

  // World ID nullifier deduplication
  const nullifierHash = body.nullifier_hash ?? null;
  if (WLD_REQUIRED && !nullifierHash) {
    return NextResponse.json(
      { error: "World ID verification required — verify your humanity before checking in" },
      { status: 403, headers: CORS }
    );
  }
  if (nullifierHash) {
    const nullifierKey = `${nullifierHash}:${eventCode}`;
    if (usedNullifiers.has(nullifierKey)) {
      return NextResponse.json(
        { error: "This World ID has already checked in to this event" },
        { status: 409, headers: CORS }
      );
    }
    // Must have been pre-validated by /api/worldid/verify
    const pending = pendingNullifiers.get(nullifierKey);
    if (WLD_REQUIRED && !pending) {
      return NextResponse.json(
        { error: "World ID proof not validated — call /api/worldid/verify first" },
        { status: 403, headers: CORS }
      );
    }
  }

  let attendee: PublicKey;
  try { attendee = new PublicKey(body.account); }
  catch { return NextResponse.json({ error: "Invalid wallet address" }, { status: 400, headers: CORS }); }

  let sigBytes: Buffer;
  try { sigBytes = Buffer.from(sigHex, "hex"); }
  catch { return NextResponse.json({ error: "Invalid signature encoding" }, { status: 400, headers: CORS }); }
  if (sigBytes.length !== 64) {
    return NextResponse.json({ error: "Signature must be 64 bytes" }, { status: 400, headers: CORS });
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

    // ix[0]: Ed25519 organizer co-signature — must be first in tx
    const message = Buffer.from(`signal_checkin:${eventCode}:${expiry}`, "utf-8");
    ixs.push(Ed25519Program.createInstructionWithPublicKey({
      publicKey:  data.organizer.toBytes(),
      message:    message,
      signature:  sigBytes,
    }));

    // Auto-register member if new
    const memberInfo = await connection.getAccountInfo(mPDA);
    if (!memberInfo) {
      ixs.push(new TransactionInstruction({
        programId: PROGRAM_ID,
        data: Buffer.concat([REGISTER_MEMBER_DISC, borshString(attendee.toBase58().slice(0, 8))]),
        keys: [
          { pubkey: communityKey,             isSigner: false, isWritable: true  },
          { pubkey: mPDA,                     isSigner: false, isWritable: true  },
          { pubkey: attendee,                 isSigner: true,  isWritable: true  },
          { pubkey: SystemProgram.programId,  isSigner: false, isWritable: false },
        ],
      }));
    }

    // check_in instruction: event_code + expiry (new param)
    const checkInData = Buffer.concat([
      CHECK_IN_DISC,
      borshString(eventCode.slice(0, 8)),
      borshI64(expiry),
    ]);
    ixs.push(new TransactionInstruction({
      programId: PROGRAM_ID,
      data: checkInData,
      keys: [
        { pubkey: communityKey,              isSigner: false, isWritable: true  },
        { pubkey: ePDA,                      isSigner: false, isWritable: true  },
        { pubkey: aPDA,                      isSigner: false, isWritable: true  },
        { pubkey: mPDA,                      isSigner: false, isWritable: true  },
        { pubkey: attendee,                  isSigner: true,  isWritable: true  },
        { pubkey: SystemProgram.programId,   isSigner: false, isWritable: false },
        { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
      ],
    }));

    // Memo ix: stamp nullifier hash on-chain if World ID was used
    if (nullifierHash) {
      ixs.push(new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        data:      Buffer.from(`signal:wid:${nullifierHash}`, "utf-8"),
        keys:      [{ pubkey: attendee, isSigner: true, isWritable: false }],
      }));
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    const tx = new Transaction({ feePayer: attendee, blockhash, lastValidBlockHeight });
    ixs.forEach(ix => tx.add(ix));

    // Commit nullifier — mark as spent so same World ID can't check in again
    if (nullifierHash) {
      const nullifierKey = `${nullifierHash}:${eventCode}`;
      usedNullifiers.add(nullifierKey);
      pendingNullifiers.delete(nullifierKey);
      verifiedWallets.add(attendee.toBase58());
    }

    return NextResponse.json(
      { transaction: tx.serialize({ requireAllSignatures: false }).toString("base64"),
        message: `Checked in to ${data.title}! Your Proof-of-Presence is now on-chain.` },
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
