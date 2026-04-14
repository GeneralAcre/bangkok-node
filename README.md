# Strata — On-Chain Coordination OS

> Built for the Solana Colosseum Frontier Hackathon 2026

**Strata turns temporary builder communities into persistent, high-output digital organizations** using Solana's speed, compressed NFTs, and an AI coordination agent.

---

## The Problem

Global builder communities (hackathon cohorts, hacker houses, pop-up cities) collapse after events end:
- Project momentum dies in Discord channels
- Reputation earned during events is lost — never recorded on-chain
- Funding is centralized and slow, failing to reward micro-contributions

## The Solana Solution

Strata provides three coordination rails:

1. **Dynamic Identity (cNFT Resident Passes)** — Compressed NFTs via Bubblegum that evolve as members contribute. Living resumes, not static JPEGs.

2. **Bounty Protocol with AI Copilot** — Anchor escrow program for the full bounty lifecycle. An AI agent (Strata Copilot) reviews submissions, computes reputation scores, and logs all decisions on-chain via Memo.

3. **Social-Layer Governance** — Solana Blinks integration for one-click governance from X/Twitter. Squads multisig for trustless treasury management.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React Frontend                    │
│         Dashboard · Bounties · Members · Copilot     │
└──────────────┬───────────────────┬──────────────────┘
               │                   │
    ┌──────────▼──────────┐  ┌─────▼──────────────┐
    │   Anchor Program    │  │   Strata Copilot   │
    │   (Solana Devnet)   │  │   (AI Agent)       │
    │                     │  │                     │
    │ • Community mgmt    │  │ • PoC scoring       │
    │ • Member identity   │  │ • Bounty review     │
    │ • Bounty escrow     │  │ • Reputation calc   │
    │ • Reputation state  │  │ • Memo logging      │
    └──────────┬──────────┘  └─────┬──────────────┘
               │                   │
    ┌──────────▼───────────────────▼──────────────────┐
    │              Solana Blockchain                    │
    │  Programs · Memo · Bubblegum · Squads (future)   │
    └──────────────────────────────────────────────────┘
```

---

## Project Structure

```
strata/
├── programs/strata/src/
│   └── lib.rs              # Anchor program (bounty escrow, identity, reputation)
├── app/src/
│   └── utils/
│       └── strata-client.ts  # TypeScript SDK for on-chain interactions
├── copilot/
│   └── strata-copilot.ts    # AI agent: scoring, review, memo logging
├── tests/
│   └── strata.ts             # Integration tests (full bounty lifecycle)
├── strata-dashboard.jsx      # React frontend dashboard
├── Anchor.toml
└── README.md
```

---

## How to Test

### Prerequisites
- Rust + Solana CLI + Anchor CLI installed
- Node.js 18+
- A Solana devnet wallet with SOL (`solana airdrop 5`)

### 1. Build & Deploy the Program
```bash
cd strata/
anchor build
anchor deploy --provider.cluster devnet
```

### 2. Run Tests
```bash
anchor test
```

This runs the full lifecycle:
- Initialize community
- Register Alice and Bob as members
- Alice creates a bounty with 1 SOL escrow
- Bob claims, completes, and submits
- Copilot reviews the submission
- Alice approves → Bob receives SOL + reputation boost
- Verifies error cases (self-claim rejection)

### 3. Run the Frontend
The React dashboard (`strata-dashboard.jsx`) renders as a standalone artifact. It includes:
- Bounty board with create/claim/submit/approve flow
- Member leaderboard with reputation tiers
- Copilot panel showing AI reviews and on-chain memo logs
- Simulated wallet connection

### 4. Test the Copilot
```typescript
import { computeReputationScore, reviewBountySubmission } from "./copilot/strata-copilot";

// Compute reputation
const score = computeReputationScore({
  walletAddress: "7xKp...3nRq",
  bountiesCompleted: 5,
  bountiesCreated: 2,
  totalEarned: 3_000_000_000, // 3 SOL in lamports
  governanceVotes: 8,
  codeReviews: 3,
  daysActive: 14,
  lastActiveTimestamp: Date.now() / 1000 - 3600,
});
// → { totalScore: 178, tier: "builder", ... }

// Review a submission
const review = reviewBountySubmission({
  bountyTitle: "Build Frontend",
  bountyDescription: "React dashboard",
  requiredSkills: ["React"],
  amountLamports: 1_000_000_000,
  submissionUri: "https://github.com/user/repo/pull/1",
  claimantReputation: 156,
  claimantBountiesCompleted: 5,
});
// → { approved: true, confidence: 85, reasoning: "..." }
```

---

## Solana-Native Features Used

| Feature | Usage |
|---------|-------|
| **State Compression (cNFTs)** | Resident Pass identity NFTs via Bubblegum — fractions of a cent per mint |
| **Solana Blinks/Actions** | One-click governance from social feeds |
| **Memo Program** | Copilot audit trail — every AI decision logged on-chain |
| **PDA Escrow** | Trustless bounty funds held by program-owned accounts |
| **Versioned Transactions + LUTs** | Efficient multi-instruction transactions |
| **Priority Fees** | Reliable inclusion via Helius fee estimation |

---

## Judging Criteria Alignment

- **Technical Prowess**: Full Anchor program with PDA escrow, security checks, event emission. AI agent with weighted scoring algorithm.
- **Design & UX**: Dark-mode dashboard with real-time state updates. One-click bounty lifecycle.
- **Business Potential**: Infrastructure for 1000+ network cities. University cohorts → pop-up cities → global builder marketplace.
- **Novelty**: On-chain AI coordination agent with auditable reasoning ledger. Dynamic cNFT identity that evolves with contributions.

---

## Team

Built for the Solana Colosseum Frontier Hackathon (April 6 — May 11, 2026).

*"Edge City proved builders want to live together. Strata provides the rails to ensure they actually build together."*
