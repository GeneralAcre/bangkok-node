import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL       = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const COMMUNITY_PDA = process.env.NEXT_PUBLIC_COMMUNITY_PDA;
const PROGRAM_ID    = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "11111111111111111111111111111111";

function readStr(data: Buffer, off: number): { value: string; next: number } {
  const len = data.readUInt32LE(off);
  return { value: data.slice(off + 4, off + 4 + len).toString("utf-8"), next: off + 4 + len };
}

function eventPDA(community: PublicKey, index: number, programId: PublicKey): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(index));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("event"), community.toBuffer(), buf],
    programId
  )[0];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  if (!COMMUNITY_PDA) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  try {
    const conn      = new Connection(RPC_URL, { commitment: "confirmed", disableRetryOnRateLimit: true });
    const community = new PublicKey(COMMUNITY_PDA);
    const progId    = new PublicKey(PROGRAM_ID);

    const commInfo = await conn.getAccountInfo(community);
    if (!commInfo) return NextResponse.json({ error: "Community not found" }, { status: 404 });

    // Parse event_count from community account
    let off = 8 + 32;
    off = readStr(commInfo.data, off).next; // name
    off = readStr(commInfo.data, off).next; // description
    off = readStr(commInfo.data, off).next; // country
    off += 8;                               // member_count
    const eventCount = Number(commInfo.data.readBigUInt64LE(off));

    const pdas  = Array.from({ length: eventCount }, (_, i) => eventPDA(community, i, progId));
    const infos = await conn.getMultipleAccountsInfo(pdas);

    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      if (!info) continue;
      try {
        const d = info.data;
        // Event: disc(8) + community(32) + organizer(32) + title(str)
        //        + location(str) + country(str)
        //        + start_time(i64=8) + end_time(i64=8)
        //        + capacity(u64=8) + attendee_count(u64=8) + fee(u64=8)
        //        + event_code(str)
        let o = 8 + 32; // disc + community
        const organizer     = new PublicKey(d.slice(o, o + 32)).toBase58(); o += 32;
        const title         = readStr(d, o); o = title.next;
        const location      = readStr(d, o); o = location.next;
        const country       = readStr(d, o); o = country.next;
        const startTime     = Number(d.readBigInt64LE(o)); o += 8;
        const endTime       = Number(d.readBigInt64LE(o)); o += 8;
        const capacity      = Number(d.readBigUInt64LE(o)); o += 8;
        const attendeeCount = Number(d.readBigUInt64LE(o)); o += 8;
        o += 8; // fee
        const eventCode     = readStr(d, o); o = eventCode.next;
        const now    = Math.floor(Date.now() / 1000);
        const status = now < startTime ? "Upcoming" : now <= endTime ? "Live" : "Ended";

        if (eventCode.value.toUpperCase() !== code) continue;

        return NextResponse.json({
          title:        title.value,
          location:     location.value,
          country:      country.value,
          startTime,
          endTime,
          capacity,
          attendeeCount,
          status,
          organizer,
          eventCode:    eventCode.value,
          eventIndex:   i,
          eventPDA:     pdas[i].toBase58(),
        });
      } catch {}
    }

    return NextResponse.json({ error: `Event "${code}" not found` }, { status: 404 });

  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to load event" }, { status: 500 });
  }
}
