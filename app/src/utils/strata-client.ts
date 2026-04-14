/**
 * Strata Client SDK
 * TypeScript client for interacting with the Strata on-chain program
 */

import {
  Connection,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, BN, web3 } from "@coral-xyz/anchor";

// ─── PDA Derivation Helpers ─────────────────────────────────────────

const PROGRAM_ID = new PublicKey("StrataHackBountyEscrow1111111111111111111111");

export function findCommunityPDA(
  authority: PublicKey,
  name: string
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("community"), authority.toBuffer(), Buffer.from(name)],
    PROGRAM_ID
  );
}

export function findMemberPDA(
  community: PublicKey,
  wallet: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("member"), community.toBuffer(), wallet.toBuffer()],
    PROGRAM_ID
  );
}

export function findBountyPDA(
  community: PublicKey,
  bountyIndex: number
): [PublicKey, number] {
  const indexBuffer = Buffer.alloc(8);
  indexBuffer.writeBigUInt64LE(BigInt(bountyIndex));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bounty"), community.toBuffer(), indexBuffer],
    PROGRAM_ID
  );
}

export function findEscrowPDA(
  community: PublicKey,
  bountyIndex: number
): [PublicKey, number] {
  const indexBuffer = Buffer.alloc(8);
  indexBuffer.writeBigUInt64LE(BigInt(bountyIndex));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), community.toBuffer(), indexBuffer],
    PROGRAM_ID
  );
}

// ─── Types ──────────────────────────────────────────────────────────

export interface CommunityAccount {
  authority: PublicKey;
  name: string;
  description: string;
  memberCount: BN;
  bountyCount: BN;
  totalFunded: BN;
  totalPaidOut: BN;
  bump: number;
  createdAt: BN;
}

export interface MemberAccount {
  wallet: PublicKey;
  community: PublicKey;
  username: string;
  skills: string[];
  reputationScore: BN;
  bountiesCompleted: BN;
  bountiesCreated: BN;
  totalEarned: BN;
  contributions: BN;
  bump: number;
  joinedAt: BN;
  lastActive: BN;
}

export interface BountyAccount {
  community: PublicKey;
  creator: PublicKey;
  title: string;
  description: string;
  requiredSkills: string[];
  amountLamports: BN;
  deadline: BN;
  status: any;
  claimant: PublicKey | null;
  submissionUri: string | null;
  copilotApproved: boolean;
  bountyIndex: BN;
  bump: number;
  escrowBump: number;
  createdAt: BN;
}

export type BountyStatus =
  | "open"
  | "inProgress"
  | "underReview"
  | "completed"
  | "cancelled"
  | "expired";

export function parseBountyStatus(status: any): BountyStatus {
  if (status.open) return "open";
  if (status.inProgress) return "inProgress";
  if (status.underReview) return "underReview";
  if (status.completed) return "completed";
  if (status.cancelled) return "cancelled";
  if (status.expired) return "expired";
  return "open";
}

// ─── Client Class ───────────────────────────────────────────────────

export class StrataClient {
  program: Program;
  provider: AnchorProvider;

  constructor(provider: AnchorProvider, idl: any) {
    this.provider = provider;
    this.program = new Program(idl, provider);
  }

  // ── Community ──

  async initializeCommunity(name: string, description: string) {
    const [communityPDA] = findCommunityPDA(
      this.provider.wallet.publicKey,
      name
    );

    const tx = await this.program.methods
      .initializeCommunity(name, description)
      .accounts({
        community: communityPDA,
        authority: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { tx, communityPDA };
  }

  // ── Members ──

  async registerMember(
    community: PublicKey,
    username: string,
    skills: string[]
  ) {
    const [memberPDA] = findMemberPDA(
      community,
      this.provider.wallet.publicKey
    );

    const tx = await this.program.methods
      .registerMember(username, skills)
      .accounts({
        community,
        member: memberPDA,
        wallet: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { tx, memberPDA };
  }

  async getMember(community: PublicKey, wallet: PublicKey): Promise<MemberAccount> {
    const [memberPDA] = findMemberPDA(community, wallet);
    return (await this.program.account.member.fetch(memberPDA)) as any;
  }

  // ── Bounties ──

  async createBounty(
    community: PublicKey,
    title: string,
    description: string,
    requiredSkills: string[],
    deadline: number,
    amountSol: number
  ) {
    const communityAccount = (await this.program.account.community.fetch(
      community
    )) as any;
    const bountyIndex = communityAccount.bountyCount.toNumber();

    const [bountyPDA] = findBountyPDA(community, bountyIndex);
    const [escrowPDA] = findEscrowPDA(community, bountyIndex);
    const [creatorMemberPDA] = findMemberPDA(
      community,
      this.provider.wallet.publicKey
    );

    const amountLamports = new BN(amountSol * LAMPORTS_PER_SOL);

    const tx = await this.program.methods
      .createBounty(
        title,
        description,
        requiredSkills,
        new BN(deadline),
        amountLamports
      )
      .accounts({
        community,
        bounty: bountyPDA,
        escrowVault: escrowPDA,
        creatorMember: creatorMemberPDA,
        creator: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { tx, bountyPDA, escrowPDA, bountyIndex };
  }

  async claimBounty(bounty: PublicKey, community: PublicKey) {
    const [claimantMemberPDA] = findMemberPDA(
      community,
      this.provider.wallet.publicKey
    );

    const tx = await this.program.methods
      .claimBounty()
      .accounts({
        bounty,
        claimantMember: claimantMemberPDA,
        claimant: this.provider.wallet.publicKey,
      })
      .rpc();

    return { tx };
  }

  async submitBounty(bounty: PublicKey, submissionUri: string) {
    const tx = await this.program.methods
      .submitBounty(submissionUri)
      .accounts({
        bounty,
        claimant: this.provider.wallet.publicKey,
      })
      .rpc();

    return { tx };
  }

  async approveBounty(
    bounty: PublicKey,
    community: PublicKey,
    claimant: PublicKey,
    bountyIndex: number
  ) {
    const [escrowPDA] = findEscrowPDA(community, bountyIndex);
    const [claimantMemberPDA] = findMemberPDA(community, claimant);

    const tx = await this.program.methods
      .approveBounty()
      .accounts({
        community,
        bounty,
        escrowVault: escrowPDA,
        claimant,
        claimantMember: claimantMemberPDA,
        approver: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { tx };
  }

  async getBounty(bountyPDA: PublicKey): Promise<BountyAccount> {
    return (await this.program.account.bounty.fetch(bountyPDA)) as any;
  }

  async getCommunity(communityPDA: PublicKey): Promise<CommunityAccount> {
    return (await this.program.account.community.fetch(communityPDA)) as any;
  }
}
