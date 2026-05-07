# Signal — On-Chain Builder Identity Protocol

> Built for the Solana Colosseum Frontier Hackathon 2026

**Signal turns event attendance into portable, verifiable on-chain identity.** Builders earn a persistent Signal Score across every event they attend — hackathons, hacker houses, pop-up cities — creating a reputation that cannot be faked, edited, or lost when communities disband.

---

## The Problem

Global builder communities (hackathon cohorts, hacker houses, pop-up cities) collapse after events end:

- Reputation earned during events is never recorded — it lives in organizer spreadsheets and disappears
- Discord servers go quiet; project momentum dies
- There's no portable proof of "I was there and I built"
- Sybil attacks let one person claim multiple identities across the same event

## The Solution

Signal provides three rails:

1. **Proof-of-Presence Check-In** — Organizers deploy on-chain events; attendees sign a QR transaction in Phantom. One human, one check-in, enforced by PDA uniqueness + World ID.

2. **Signal Score & Tier System** — Each check-in earns points. Hackathon placements add more. Your score determines your tier (Initiate → Seeker → Resident → Builder → Core → Legend), stored permanently on-chain.

3. **Builder Passport** — A live credential card showing your score, tier, NFT badges, and stats. Shareable to X as a generated image — your proof of work, wherever you go.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js Frontend                  │
│   Home · Events · Check-In · Credentials · Leaderboard │
└──────────────┬───────────────────┬──────────────────┘
               │                   │
    ┌──────────▼──────────┐  ┌─────▼──────────────────┐
    │   Anchor Program    │  │     Next.js API         │
    │   (Solana Devnet)   │  │     Routes              │
    │                     │  │                         │
    │ • Community PDA     │  │ • /api/mint-nft         │
    │ • Event PDAs        │  │ • /api/credentials      │
    │ • Attendance PDAs   │  │ • /api/leaderboard      │
    │ • Score on-chain    │  │ • /api/achievement/*    │
    └──────────┬──────────┘  └─────┬──────────────────┘
               │                   │
    ┌──────────▼───────────────────▼──────────────────┐
    │              Solana Devnet                        │
    │  Anchor PDAs · Metaplex UMI · World ID           │
    └──────────────────────────────────────────────────┘
```

---

## Features

### For Organizers
- **Deploy Events On-Chain** — Title, location, date/time, and capacity in one transaction
- **QR Code Generation** — Ed25519-signed QR links expire at event end time; only your wallet can produce them
- **Event Dashboard** — Live/Upcoming/Ended filters, attendee counts, downloadable QR PNG

### For Attendees
- **World ID Verification** — Prove you're human once per event (sybil resistance via nullifier hash)
- **QR Check-In** — Scan, sign in Phantom, receive attendance NFT
- **Automatic NFT Minting** — Badge level upgrades automatically as you attend more events
- **Signal Score** — Cumulative on-chain reputation across all events

### For Everyone
- **Builder Passport** — Live credential card with score, tier badge, earned NFTs, and rank; generates a shareable image
- **Public Leaderboard** — Ranked by Signal Score with Active and Hall of Fame views
- **Achievement Claims** — Submit hackathon placements for admin review; approved claims mint an Achievement NFT and add bonus points

---

## Signal Score Formula

```
Base Score  = (Events × 10) + (Hackathons × 30) + Achievement Points
Tier Bonus  = 0 / 10 / 25 / 50 / 150 / 500  (Initiate → Legend)
Final Score = Base Score + Tier Bonus
```

| Tier | Min Score | Color |
|------|-----------|-------|
| Initiate | 0 | Gray |
| Seeker | 100 | White |
| Resident | 250 | Green |
| Builder | 500 | Amber |
| Core | 1 000 | Red |
| Legend | 2 000 | Purple |

---

## NFT Badge Levels

| Badge | Events Required | Signal Score |
|-------|----------------|--------------|
| Signal Lv.1 | 1+ | 100 |
| Signal Lv.2 | 3+ | 300 |
| Signal Lv.3 | 5+ | 500 |
| Signal Lv.4 | 10+ | 1 000 |
| Signal Lv.5 | 20+ | 2 000 |

Badges are minted on Solana via Metaplex UMI and displayed on the Builder Passport.

---

## Project Structure

```
strata-project/
├── programs/strata/          # Anchor program (Rust)
│   └── src/lib.rs            # Community, Event, Attendance, Score instructions
├── app/                      # Next.js 14 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Home / landing
│   │   │   ├── events/             # Browse on-chain events
│   │   │   ├── checkin/[code]/     # QR check-in flow
│   │   │   ├── organizer/          # Event deployment dashboard
│   │   │   ├── credentials/        # Builder Passport + achievement claims
│   │   │   ├── leaderboard/        # Ranked builders
│   │   │   ├── terms/              # Protocol whitepaper
│   │   │   └── api/                # 18+ API routes
│   │   ├── components/             # Nav, Footer, PageBackground
│   │   ├── styles/                 # Per-page CSS-in-JS
│   │   └── utils/
│   │       ├── strata-client.ts    # TypeScript SDK for on-chain calls
│   │       └── scoring.ts          # Score + tier calculation
│   └── public/nft-badge/           # Badge images (lv1–lv5)
├── Anchor.toml
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Rust + Solana CLI + Anchor CLI
- A Phantom wallet funded on Devnet (`solana airdrop 2`)

### 1. Install Frontend Dependencies

```bash
cd app
npm install
```

### 2. Configure Environment

Create `app/.env.local`:

```env
NEXT_PUBLIC_PROGRAM_ID=CmStH6nDHyHtsG5PLj9yvKmAQsY9GjDW2Ap8asMZrz57
NEXT_PUBLIC_COMMUNITY_PDA=DY9eAKpdMYhrRuTn3JZJQ2F7gsFTtsBaJADHwr48xVL6
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# World ID (optional for local dev)
NEXT_PUBLIC_WLD_APP_ID=your_world_app_id
NEXT_PUBLIC_WLD_ACTION=signal-checkin

# NFT minting — Solana keypair array (devnet only)
TREASURY_KEYPAIR=[...]
TREASURY_PUBKEY=your_treasury_pubkey

# Admin wallet (leave blank to enable demo mode — any connected wallet is admin)
NEXT_PUBLIC_ADMIN_WALLET=
```

### 3. Run the Frontend

```bash
npm run dev
# → http://localhost:3000
```

### 4. Build & Deploy the Anchor Program (optional)

```bash
anchor build
anchor deploy --provider.cluster devnet
anchor test
```

---

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with live event calendar and protocol stats |
| `/events` | Browse all on-chain events (Live / Upcoming / Ended) |
| `/checkin/[code]` | Attendee check-in — World ID verify + sign transaction |
| `/organizer` | Deploy events and generate signed QR codes |
| `/credentials` | Your Builder Passport — score, tier, badges, achievements |
| `/leaderboard` | Public ranking of all builders by Signal Score |
| `/terms` | Full protocol whitepaper and NFT badge documentation |

---

## Solana Features Used

| Feature | Usage |
|---------|-------|
| **Anchor PDAs** | Unique (event, wallet) attendance records — duplicate prevention at chain level |
| **Metaplex UMI** | Server-side NFT minting for attendance and achievement badges |
| **Ed25519 Signatures** | Organizer-signed QR codes with on-chain expiry validation |
| **World ID** | Nullifier hash stored per event — one human, one check-in |
| **Solana Clock** | QR expiry checked against `clock.unix_timestamp` in the Anchor instruction |
| **Phantom Wallet Adapter** | Multi-wallet support via `@solana/wallet-adapter-react` |

---

## Admin & Demo Mode

If `NEXT_PUBLIC_ADMIN_WALLET` is not set, any connected wallet automatically gets admin privileges. This allows:

- Viewing all pending achievement claims on the Credentials page
- Approving/rejecting claims (triggers NFT mint on approval)
- No API key required in local dev

Set `SIGNAL_ADMIN_KEY` and `NEXT_PUBLIC_ADMIN_WALLET` in production to restrict access.

---

## Team

Built for the Solana Colosseum Frontier Hackathon (April 6 — May 11, 2026).

*"The builders were always there. Signal just makes sure the chain remembers."*
