/**
 * Strata Copilot — AI Coordination Agent
 *
 * This service:
 * 1. Monitors on-chain bounty events (completions, submissions, votes)
 * 2. Computes weighted Proof-of-Contribution (PoC) reputation scores
 * 3. Recommends bounty approval/rejection with reasoning
 * 4. Logs all decisions on-chain via Solana Memo program
 *
 * For the hackathon MVP, this runs as a standalone Node.js service.
 * Production would use a Clockwork/cron trigger or Helius webhooks.
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// ─── Configuration ──────────────────────────────────────────────────

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

interface CopilotConfig {
  rpcUrl: string;
  agentKeypair: Keypair;
  communityPDA: PublicKey;
  programId: PublicKey;
}

// ─── Reputation Scoring Engine ──────────────────────────────────────

interface ContributionData {
  walletAddress: string;
  bountiesCompleted: number;
  bountiesCreated: number;
  totalEarned: number;          // in lamports
  governanceVotes: number;
  codeReviews: number;
  daysActive: number;
  lastActiveTimestamp: number;
}

interface ReputationBreakdown {
  totalScore: number;
  components: {
    bountyExecution: number;    // 40% weight
    communityBuilding: number;  // 20% weight
    governance: number;         // 15% weight
    consistency: number;        // 15% weight
    mentorship: number;         // 10% weight
  };
  tier: "newcomer" | "contributor" | "builder" | "core" | "legend";
  reasoning: string;
}

export function computeReputationScore(
  data: ContributionData
): ReputationBreakdown {
  // ── Bounty Execution (40%) ──
  // Rewards completing high-value bounties
  const bountyBase = Math.min(data.bountiesCompleted * 15, 150);
  const valueBonus = Math.min(
    Math.floor(data.totalEarned / (0.1 * LAMPORTS_PER_SOL)) * 2,
    50
  );
  const bountyExecution = Math.min(bountyBase + valueBonus, 200);

  // ── Community Building (20%) ──
  // Rewards creating bounties for others (investing in the community)
  const creationScore = Math.min(data.bountiesCreated * 10, 80);
  const communityBuilding = Math.min(creationScore, 100);

  // ── Governance Participation (15%) ──
  const govScore = Math.min(data.governanceVotes * 5, 75);
  const governance = Math.min(govScore, 75);

  // ── Consistency (15%) ──
  // Rewards regular activity over time
  const activeDaysScore = Math.min(data.daysActive * 2, 50);
  const recencyBonus =
    Date.now() / 1000 - data.lastActiveTimestamp < 7 * 86400 ? 25 : 0;
  const consistency = Math.min(activeDaysScore + recencyBonus, 75);

  // ── Mentorship / Code Reviews (10%) ──
  const mentorship = Math.min(data.codeReviews * 8, 50);

  // ── Total ──
  const totalScore =
    bountyExecution + communityBuilding + governance + consistency + mentorship;

  // ── Tier Assignment ──
  let tier: ReputationBreakdown["tier"];
  if (totalScore >= 400) tier = "legend";
  else if (totalScore >= 250) tier = "core";
  else if (totalScore >= 120) tier = "builder";
  else if (totalScore >= 40) tier = "contributor";
  else tier = "newcomer";

  // ── Generate Reasoning ──
  const reasoning = generateReasoning(
    data,
    { bountyExecution, communityBuilding, governance, consistency, mentorship },
    totalScore,
    tier
  );

  return {
    totalScore,
    components: {
      bountyExecution,
      communityBuilding,
      governance,
      consistency,
      mentorship,
    },
    tier,
    reasoning,
  };
}

function generateReasoning(
  data: ContributionData,
  components: ReputationBreakdown["components"],
  total: number,
  tier: string
): string {
  const parts: string[] = [];

  parts.push(`PoC Score: ${total} (${tier} tier).`);

  if (components.bountyExecution > 100) {
    parts.push(
      `Strong executor: ${data.bountiesCompleted} bounties completed worth ${(data.totalEarned / LAMPORTS_PER_SOL).toFixed(2)} SOL.`
    );
  }

  if (components.communityBuilding > 50) {
    parts.push(
      `Active community builder: created ${data.bountiesCreated} bounties for others.`
    );
  }

  if (components.consistency > 50) {
    parts.push(`Highly consistent: active ${data.daysActive} days.`);
  }

  if (components.governance < 20) {
    parts.push("Recommendation: participate in more governance votes.");
  }

  if (components.mentorship < 15) {
    parts.push("Recommendation: contribute code reviews to boost score.");
  }

  return parts.join(" ");
}

// ─── Bounty Review Engine ───────────────────────────────────────────

interface BountySubmission {
  bountyTitle: string;
  bountyDescription: string;
  requiredSkills: string[];
  amountLamports: number;
  submissionUri: string;
  claimantReputation: number;
  claimantBountiesCompleted: number;
}

interface CopilotReviewResult {
  approved: boolean;
  confidence: number;        // 0-100
  reasoning: string;
  reputationDelta: number;   // suggested reputation change
}

export function reviewBountySubmission(
  submission: BountySubmission
): CopilotReviewResult {
  let score = 50; // neutral start
  const reasons: string[] = [];

  // ── Claimant track record ──
  if (submission.claimantReputation >= 120) {
    score += 20;
    reasons.push("Claimant has strong reputation history.");
  } else if (submission.claimantReputation >= 40) {
    score += 10;
    reasons.push("Claimant has moderate reputation.");
  } else {
    reasons.push("Claimant is relatively new — recommend manual review.");
  }

  // ── Submission completeness ──
  if (submission.submissionUri && submission.submissionUri.includes("github.com")) {
    score += 15;
    reasons.push("Submission includes GitHub link (verifiable).");
  } else if (submission.submissionUri && submission.submissionUri.length > 10) {
    score += 5;
    reasons.push("Submission URI provided but not a code repository.");
  } else {
    score -= 10;
    reasons.push("No meaningful submission URI — flag for manual review.");
  }

  // ── Completion history bonus ──
  if (submission.claimantBountiesCompleted >= 5) {
    score += 10;
    reasons.push("Claimant has completed 5+ bounties successfully.");
  }

  // ── High-value bounty caution ──
  if (submission.amountLamports >= 5 * LAMPORTS_PER_SOL) {
    score -= 5;
    reasons.push(
      "High-value bounty (>5 SOL) — recommend additional verification."
    );
  }

  const approved = score >= 65;
  const confidence = Math.min(Math.max(score, 0), 100);

  // Calculate reputation delta
  const reputationDelta = approved
    ? 10 + Math.floor(submission.amountLamports / (0.01 * LAMPORTS_PER_SOL))
    : 0;

  return {
    approved,
    confidence,
    reasoning: `[Copilot Review] ${approved ? "APPROVED" : "NEEDS MANUAL REVIEW"} (confidence: ${confidence}%). ${reasons.join(" ")}`,
    reputationDelta,
  };
}

// ─── On-Chain Memo Logger ───────────────────────────────────────────

export async function logMemoOnChain(
  connection: Connection,
  payer: Keypair,
  message: string
): Promise<string> {
  // Truncate to fit in a transaction (max ~800 bytes for memo)
  const truncated =
    message.length > 500 ? message.substring(0, 497) + "..." : message;

  const memoIx = new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: false }],
    data: Buffer.from(truncated, "utf-8"),
  });

  const tx = new Transaction().add(memoIx);

  const signature = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: "confirmed",
  });

  return signature;
}

// ─── Main Copilot Agent Loop ────────────────────────────────────────

export class StrataCopilot {
  connection: Connection;
  agentKeypair: Keypair;
  communityPDA: PublicKey;

  constructor(config: CopilotConfig) {
    this.connection = new Connection(config.rpcUrl, "confirmed");
    this.agentKeypair = config.agentKeypair;
    this.communityPDA = config.communityPDA;
  }

  /**
   * Process a bounty submission: review + log memo + return result
   */
  async processBountyReview(
    submission: BountySubmission
  ): Promise<CopilotReviewResult & { memoSignature: string }> {
    // 1. Run AI review
    const review = reviewBountySubmission(submission);

    // 2. Log reasoning on-chain via Memo
    const memoMessage = JSON.stringify({
      type: "copilot_review",
      bountyTitle: submission.bountyTitle,
      approved: review.approved,
      confidence: review.confidence,
      reasoning: review.reasoning,
      reputationDelta: review.reputationDelta,
      timestamp: new Date().toISOString(),
    });

    const memoSignature = await logMemoOnChain(
      this.connection,
      this.agentKeypair,
      memoMessage
    );

    console.log(`📝 Copilot memo logged: ${memoSignature}`);
    console.log(`   Decision: ${review.approved ? "✅ APPROVED" : "🔍 NEEDS REVIEW"}`);
    console.log(`   Confidence: ${review.confidence}%`);
    console.log(`   Reasoning: ${review.reasoning}`);

    return { ...review, memoSignature };
  }

  /**
   * Compute and update a member's reputation score
   */
  async computeAndLogReputation(
    data: ContributionData
  ): Promise<ReputationBreakdown & { memoSignature: string }> {
    const breakdown = computeReputationScore(data);

    const memoMessage = JSON.stringify({
      type: "reputation_update",
      wallet: data.walletAddress,
      score: breakdown.totalScore,
      tier: breakdown.tier,
      components: breakdown.components,
      reasoning: breakdown.reasoning,
      timestamp: new Date().toISOString(),
    });

    const memoSignature = await logMemoOnChain(
      this.connection,
      this.agentKeypair,
      memoMessage
    );

    console.log(`🏅 Reputation computed for ${data.walletAddress.slice(0, 8)}...`);
    console.log(`   Score: ${breakdown.totalScore} (${breakdown.tier})`);
    console.log(`   Memo: ${memoSignature}`);

    return { ...breakdown, memoSignature };
  }
}

// ─── REST API (Express) ─────────────────────────────────────────────
// For the hackathon demo, the copilot exposes a simple HTTP API
// that the frontend calls to trigger reviews and score computation.

/*
Usage:
  POST /api/copilot/review
  Body: BountySubmission JSON

  POST /api/copilot/reputation
  Body: ContributionData JSON

  GET /api/copilot/health
*/

export function createCopilotAPI(copilot: StrataCopilot) {
  // This would be an Express app in production. For the hackathon,
  // the frontend calls the functions directly via a shared module.
  return {
    async reviewBounty(submission: BountySubmission) {
      return copilot.processBountyReview(submission);
    },
    async computeReputation(data: ContributionData) {
      return copilot.computeAndLogReputation(data);
    },
    health() {
      return {
        status: "ok",
        agent: copilot.agentKeypair.publicKey.toBase58(),
        community: copilot.communityPDA.toBase58(),
      };
    },
  };
}

// ─── Exports for Frontend ───────────────────────────────────────────

export type { ContributionData, BountySubmission };
