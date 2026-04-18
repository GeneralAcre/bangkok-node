/**
 * Strata SDK — TypeScript client for the on-chain Proof-of-Presence program.
 * Aligned with programs/strata/src/lib.rs
 */

import {
  Connection,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";

// ── Program ID ───────────────────────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "11111111111111111111111111111111"
);

// ── PDA Helpers ──────────────────────────────────────────────────────────────

export function findCommunityPDA(authority: PublicKey, name: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("community"), authority.toBuffer(), Buffer.from(name)],
    PROGRAM_ID
  );
}

export function findMemberPDA(community: PublicKey, wallet: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("member"), community.toBuffer(), wallet.toBuffer()],
    PROGRAM_ID
  );
}

export function findEventPDA(community: PublicKey, eventIndex: number | bigint) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(eventIndex));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("event"), community.toBuffer(), buf],
    PROGRAM_ID
  );
}

export function findEventEscrowPDA(community: PublicKey, eventIndex: number | bigint) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(eventIndex));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("event_escrow"), community.toBuffer(), buf],
    PROGRAM_ID
  );
}

export function findAttendancePDA(event: PublicKey, attendee: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("attendance"), event.toBuffer(), attendee.toBuffer()],
    PROGRAM_ID
  );
}

// ── On-chain types ───────────────────────────────────────────────────────────

export type MemberTier =
  | "Initiate"
  | "Seeker"
  | "Resident"
  | "Builder"
  | "Core"
  | "Legend";

export type EventStatus = "Upcoming" | "Live" | "Ended" | "Cancelled";

export interface CommunityAccount {
  authority:     PublicKey;
  name:          string;
  description:   string;
  country:       string;
  memberCount:   BN;
  eventCount:    BN;
  totalCheckins: BN;
  bump:          number;
  createdAt:     BN;
}

export interface MemberAccount {
  wallet:           PublicKey;
  community:        PublicKey;
  username:         string;
  reputationScore:  BN;
  eventsAttended:   BN;
  tier:             Record<string, Record<string, never>>;
  bump:             number;
  joinedAt:         BN;
  lastActive:       BN;
}

export interface EventAccount {
  community:          PublicKey;
  organizer:          PublicKey;
  title:              string;
  description:        string;
  location:           string;
  country:            string;
  eventDate:          BN;
  capacity:           BN;
  attendeeCount:      BN;
  entryFeeLamports:   BN;
  eventCode:          string;
  status:             Record<string, Record<string, never>>;
  eventIndex:         BN;
  escrowBump:         number;
  bump:               number;
  createdAt:          BN;
}

export interface AttendanceAccount {
  event:        PublicKey;
  attendee:     PublicKey;
  edition:      BN;
  checkedInAt:  BN;
  nftMint:      PublicKey | null;
  bump:         number;
}

// ── Parsers ───────────────────────────────────────────────────────────────────

export function parseTier(tier: Record<string, Record<string, never>>): MemberTier {
  const key = Object.keys(tier ?? {})[0] ?? "";
  const map: Record<string, MemberTier> = {
    initiate: "Initiate",
    seeker:   "Seeker",
    resident: "Resident",
    builder:  "Builder",
    core:     "Core",
    legend:   "Legend",
  };
  return map[key.toLowerCase()] ?? "Initiate";
}

export function parseEventStatus(status: Record<string, Record<string, never>>): EventStatus {
  const key = Object.keys(status ?? {})[0] ?? "";
  const map: Record<string, EventStatus> = {
    upcoming:  "Upcoming",
    live:      "Live",
    ended:     "Ended",
    cancelled: "Cancelled",
  };
  return map[key.toLowerCase()] ?? "Upcoming";
}

export const TIER_COLOR: Record<MemberTier, string> = {
  Initiate: "#6b7280",
  Seeker:   "#3b82f6",
  Resident: "#10b981",
  Builder:  "#f59e0b",
  Core:     "#ef4444",
  Legend:   "#8b5cf6",
};

export const TIER_THRESHOLD: Record<MemberTier, string> = {
  Initiate: "0 events",
  Seeker:   "1–2 events",
  Resident: "3–5 events",
  Builder:  "6–10 events",
  Core:     "11–20 events",
  Legend:   "21+ events",
};

export const REPUTATION_BONUS: Record<string, number> = {
  "1-2":  10,
  "3-5":  15,
  "6-10": 20,
  "11+":  25,
};

// ── Strata Client ─────────────────────────────────────────────────────────────

export class StrataClient {
  program:  Program;
  provider: AnchorProvider;

  constructor(provider: AnchorProvider, idl: unknown) {
    this.provider = provider;
    this.program  = new Program(idl as anchor.Idl, provider);
  }

  get wallet()     { return this.provider.wallet.publicKey; }
  get connection() { return this.provider.connection; }

  // ── Community ─────────────────────────────────────────────────────────────

  async initializeCommunity(name: string, description: string, country: string) {
    const [communityPDA] = findCommunityPDA(this.wallet, name);
    const tx = await (this.program.methods as any)
      .initializeCommunity(name, description, country)
      .accounts({
        community:     communityPDA,
        authority:     this.wallet,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return { tx, communityPDA };
  }

  async getCommunity(communityPDA: PublicKey): Promise<CommunityAccount> {
    return (this.program.account as any).community.fetch(communityPDA);
  }

  // ── Members ───────────────────────────────────────────────────────────────

  async registerMember(community: PublicKey, username: string) {
    const [memberPDA] = findMemberPDA(community, this.wallet);
    const tx = await (this.program.methods as any)
      .registerMember(username)
      .accounts({
        community,
        member:        memberPDA,
        wallet:        this.wallet,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return { tx, memberPDA };
  }

  async getMember(community: PublicKey, wallet: PublicKey): Promise<MemberAccount | null> {
    try {
      const [memberPDA] = findMemberPDA(community, wallet);
      return await (this.program.account as any).member.fetch(memberPDA);
    } catch {
      return null;
    }
  }

  async isMemberRegistered(community: PublicKey, wallet: PublicKey): Promise<boolean> {
    const [memberPDA] = findMemberPDA(community, wallet);
    const info = await this.connection.getAccountInfo(memberPDA);
    return info !== null;
  }

  // ── Events ────────────────────────────────────────────────────────────────

  async createEvent(params: {
    community:          PublicKey;
    title:              string;
    description:        string;
    location:           string;
    country:            string;
    eventDate:          number;    // unix timestamp
    capacity:           number;
    entryFeeLamports:   number;
    eventCode:          string;    // exactly 8 chars
  }) {
    const communityAcc = await this.getCommunity(params.community);
    const idx          = communityAcc.eventCount.toNumber();
    const [eventPDA]   = findEventPDA(params.community, idx);
    const [escrowPDA]  = findEventEscrowPDA(params.community, idx);

    const tx = await (this.program.methods as any)
      .createEvent(
        params.title,
        params.description,
        params.location,
        params.country,
        new BN(params.eventDate),
        new BN(params.capacity),
        new BN(params.entryFeeLamports),
        params.eventCode
      )
      .accounts({
        community:     params.community,
        event:         eventPDA,
        escrowVault:   escrowPDA,
        organizer:     this.wallet,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { tx, eventPDA, eventIndex: idx };
  }

  async startEvent(eventPDA: PublicKey) {
    const tx = await (this.program.methods as any)
      .startEvent()
      .accounts({ event: eventPDA, organizer: this.wallet })
      .rpc();
    return { tx };
  }

  async endEvent(eventPDA: PublicKey) {
    const tx = await (this.program.methods as any)
      .endEvent()
      .accounts({ event: eventPDA, organizer: this.wallet })
      .rpc();
    return { tx };
  }

  async getEvent(eventPDA: PublicKey): Promise<EventAccount> {
    return (this.program.account as any).event.fetch(eventPDA);
  }

  async getAllMyEvents(): Promise<{ pubkey: PublicKey; account: EventAccount }[]> {
    return (this.program.account as any).event.all([
      {
        memcmp: {
          offset: 8 + 32,     // discriminator + community pubkey
          bytes:  this.wallet.toBase58(),
        },
      },
    ]);
  }

  // ── Attendance ────────────────────────────────────────────────────────────

  async getAttendance(
    eventPDA:  PublicKey,
    attendee:  PublicKey
  ): Promise<AttendanceAccount | null> {
    try {
      const [aPDA] = findAttendancePDA(eventPDA, attendee);
      return await (this.program.account as any).attendance.fetch(aPDA);
    } catch {
      return null;
    }
  }

  async getAllAttendanceByWallet(
    wallet: PublicKey
  ): Promise<{ pubkey: PublicKey; account: AttendanceAccount }[]> {
    // attendee is at offset 8 (disc) + 32 (event pubkey) = 40
    return (this.program.account as any).attendance.all([
      { memcmp: { offset: 8 + 32, bytes: wallet.toBase58() } },
    ]);
  }
}
