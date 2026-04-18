import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { createHash } from "crypto";

const RPC_URL       = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const COMMUNITY_PDA = process.env.NEXT_PUBLIC_COMMUNITY_PDA;
const PROGRAM_ID    = process.env.NEXT_PUBLIC_PROGRAM_ID;

// Cache for 60 seconds to avoid hammering devnet
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 60_000;

function discriminator(name: string) {
  return createHash("sha256").update(`account:${name}`).digest().slice(0, 8);
}

function eventPDA(community: PublicKey, index: bigint, programId: PublicKey): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(index);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("event"), community.toBuffer(), buf],
    programId
  )[0];
}

function parseStatus(data: Buffer, offset: number) {
  const variant = data[offset];
  if (variant === 0) return "Upcoming";
  if (variant === 1) return "Live";
  if (variant === 2) return "Ended";
  return "Upcoming";
}

export async function GET() {
  // Serve from cache
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  if (!COMMUNITY_PDA || !PROGRAM_ID) {
    return NextResponse.json({ events: 0, members: 0, checkins: 0, recentEvents: [] });
  }

  try {
    const connection = new Connection(RPC_URL, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const community  = new PublicKey(COMMUNITY_PDA);
    const programId  = new PublicKey(PROGRAM_ID);

    const commInfo = await connection.getAccountInfo(community);
    if (!commInfo) return NextResponse.json({ events: 0, members: 0, checkins: 0, recentEvents: [] });

    const eventCountOffset  = 8 + 32 + (4 + 64) + (4 + 256) + (4 + 64) + 8;
    const memberCountOffset = 8 + 32 + (4 + 64) + (4 + 256) + (4 + 64);

    const eventCount  = Number(commInfo.data.readBigUInt64LE(eventCountOffset));
    const memberCount = Number(commInfo.data.readBigUInt64LE(memberCountOffset));

    const recentEvents: any[] = [];
    let totalCheckins = 0;

    // Fetch all events in parallel
    const pdas = Array.from({ length: eventCount }, (_, i) => eventPDA(community, BigInt(i), programId));
    const infos = await connection.getMultipleAccountsInfo(pdas);

    for (const info of infos) {
      if (!info) continue;
      try {
        const d = info.data;
        const titleOffset = 8 + 32 + 32;
        const titleLen    = d.readUInt32LE(titleOffset);
        const title       = d.slice(titleOffset + 4, titleOffset + 4 + titleLen).toString("utf-8");

        const descOffset  = titleOffset + 4 + 64;
        const locOffset   = descOffset  + 4 + 512;
        const locLen      = d.readUInt32LE(locOffset);
        const location    = d.slice(locOffset + 4, locOffset + 4 + locLen).toString("utf-8");

        const countryOffset = locOffset + 4 + 128;
        const countryLen    = d.readUInt32LE(countryOffset);
        const country       = d.slice(countryOffset + 4, countryOffset + 4 + countryLen).toString("utf-8");

        const dateOffset     = countryOffset + 4 + 64;
        const capacity       = Number(d.readBigUInt64LE(dateOffset + 8));
        const attendeeCount  = Number(d.readBigUInt64LE(dateOffset + 16));

        const codeOffset = dateOffset + 8 + 8 + 8 + 8;
        const codeLen    = d.readUInt32LE(codeOffset);
        const eventCode  = d.slice(codeOffset + 4, codeOffset + 4 + codeLen).toString("utf-8");

        const statusOffset = codeOffset + 4 + 8;
        const status       = parseStatus(d, statusOffset);

        totalCheckins += attendeeCount;
        recentEvents.push({ title, location, country, status, attendeeCount, capacity, eventCode });
      } catch {}
    }

    const result = {
      events:       eventCount,
      members:      memberCount,
      checkins:     totalCheckins,
      recentEvents: recentEvents.reverse().slice(0, 4),
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);

  } catch (e: any) {
    return NextResponse.json({ events: 0, members: 0, checkins: 0, recentEvents: [], error: e?.message });
  }
}
