"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { credentialCSS } from "../../styles/credentialStyles";
import { StrataScoreTier } from "../../utils/scoring";
import { Nav } from "../../components/Nav";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CredentialData {
  owner:          string;
  score:          number;
  tier:           StrataScoreTier;
  tierIndex:      number;
  eventsAttended: number;
  hackathonCount: number;
  vouchCount:     number;
  lastCheckinAt:  number;
  lastIssuer:     string;
  isOnChain:      boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIERS: Array<{ name: StrataScoreTier; icon: string; minScore: number }> = [
  { name: "Initiate", icon: "◦",  minScore: 0    },
  { name: "Seeker",   icon: "◈",  minScore: 100  },
  { name: "Resident", icon: "⬡",  minScore: 250  },
  { name: "Builder",  icon: "✦",  minScore: 500  },
  { name: "Core",     icon: "⬟",  minScore: 1000 },
  { name: "Legend",   icon: "✺",  minScore: 2000 },
];

const TIER_COLORS: Record<StrataScoreTier, string> = {
  Initiate: "#6b7280",
  Seeker:   "#ffffff",
  Resident: "#059669",
  Builder:  "#d97706",
  Core:     "#dc2626",
  Legend:   "#7c3aed",
};

const DEMO_WALLETS = [
  { label: "Legend",   addr: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" },
  { label: "Builder",  addr: "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS" },
  { label: "Seeker",   addr: "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy" },
];

function fmt(n: number): string { return n.toLocaleString(); }

function fmtAgo(unix: number): string {
  if (!unix) return "Never";
  const days = Math.floor((Date.now() / 1000 - unix) / 86_400);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Credential Card ──────────────────────────────────────────────────────────

function CredCard({ cred }: { cred: CredentialData }) {
  const color    = TIER_COLORS[cred.tier];
  const nextTier = TIERS[cred.tierIndex + 1];
  const curMin   = TIERS[cred.tierIndex]?.minScore ?? 0;
  const nextMin  = nextTier?.minScore ?? cred.score;
  const progress = nextTier
    ? Math.min(100, ((cred.score - curMin) / (nextMin - curMin)) * 100)
    : 100;

  return (
    <div className="cred-card">
      <div className="cred-card-tier" style={{ color, borderColor: color + "55", background: color + "12" }}>
        {TIERS[cred.tierIndex].icon} {cred.tier.toUpperCase()}
      </div>

      <div className="cred-score-row">
        <div>
          <div className="cred-score-num">{fmt(cred.score)}</div>
          <div className="cred-score-lbl">Reputation Score</div>
        </div>
        <div className="cred-wallet-addr">
          {cred.owner.slice(0, 6)}…{cred.owner.slice(-4)}
        </div>
      </div>

      <div className="cred-progress-wrap">
        <div className="cred-progress-track">
          <div
            className="cred-progress-fill"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg,${color}88,${color})` }}
          />
        </div>
        <div className="cred-progress-labels">
          <span>{fmt(curMin)} pts</span>
          <span>{nextTier ? `${fmt(nextMin)} pts → ${nextTier.name}` : "Max tier reached"}</span>
        </div>
      </div>

      <div className="cred-stats-row">
        <div className="cred-stat">
          <div className="cred-stat-val">{cred.eventsAttended}</div>
          <div className="cred-stat-lbl">Events</div>
        </div>
        <div className="cred-stat-divider" />
        <div className="cred-stat">
          <div className="cred-stat-val">{cred.hackathonCount}</div>
          <div className="cred-stat-lbl">Hackathons</div>
        </div>
        <div className="cred-stat-divider" />
        <div className="cred-stat">
          <div className="cred-stat-val">{cred.vouchCount}</div>
          <div className="cred-stat-lbl">Vouches</div>
        </div>
        <div className="cred-stat-divider" />
        <div className="cred-stat">
          <div className="cred-stat-val">{fmtAgo(cred.lastCheckinAt)}</div>
          <div className="cred-stat-lbl">Last Check-in</div>
        </div>
      </div>

      {cred.lastIssuer && cred.lastIssuer !== "—" && (
        <div className="cred-last-event">
          Last event: <span>{cred.lastIssuer}</span>
        </div>
      )}
    </div>
  );
}

// ─── Tier Ladder ──────────────────────────────────────────────────────────────

function TierLadder({ tierIndex }: { tierIndex: number }) {
  return (
    <div className="tier-ladder">
      <div className="tier-ladder-title">Tier Progression</div>
      <div className="tier-steps">
        {TIERS.map((t, i) => {
          const isReached = i <= tierIndex;
          const isCurrent = i === tierIndex;
          const color     = TIER_COLORS[t.name];
          return (
            <div
              key={t.name}
              className={`tier-step${isReached ? " reached" : ""}${isCurrent ? " current" : ""}`}
              style={
                isCurrent ? { borderColor: color, background: color + "12" } :
                isReached  ? { borderColor: color + "55" } : {}
              }
            >
              <div className="tier-step-icon" style={isReached ? { color } : {}}>{t.icon}</div>
              <div className="tier-step-name" style={isReached ? { color } : {}}>{t.name}</div>
              <div className="tier-step-score">{t.minScore === 0 ? "0+" : fmt(t.minScore) + "+"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="cred-card">
      <div className="shimmer" style={{ height: 24, width: 100, borderRadius: 100 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", marginTop: ".5rem" }}>
        <div className="shimmer" style={{ height: 52, width: "35%" }} />
        <div className="shimmer" style={{ height: 14, width: "25%" }} />
      </div>
      <div className="shimmer" style={{ height: 8, borderRadius: 100 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: ".75rem" }}>
        {[0, 1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: 56 }} />)}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CredentialsPage() {
  const { publicKey } = useWallet();
  const walletAddr    = publicKey?.toBase58() ?? "";

  const [query,   setQuery]   = useState("");
  const [cred,    setCred]    = useState<CredentialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (walletAddr && !cred) {
      setQuery(walletAddr);
      fetchCredential(walletAddr);
    }
  }, [walletAddr]);

  async function fetchCredential(addr?: string) {
    const target = (addr ?? query).trim();
    if (!target) return;
    setLoading(true); setError(""); setCred(null);
    try {
      const r = await fetch(`/api/credentials/${target}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setCred(d);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch credential");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchCredential();
  }

  function loadDemo(addr: string) {
    setQuery(addr);
    fetchCredential(addr);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: credentialCSS }} />
      <div className="grid-bg" />
      <div className="orb-wrap">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
      </div>
      <div className="scanline" />
      <Nav active="credentials" />

      <div className="page">
        <div className="cred-eyebrow">On-Chain Reputation</div>
        <div className="cred-title">Credentials</div>
        <div className="cred-subtitle">
          Track your Strata reputation score and community standing
        </div>

        <div className="query-section">
          <div className="query-label">Wallet Address</div>
          <form className="query-bar" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="query-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter wallet address…"
              spellCheck={false}
            />
            <button className="query-btn" type="submit" disabled={loading}>
              {loading ? "Loading…" : "Fetch →"}
            </button>
          </form>
          <div className="demo-wallets">
            <span className="demo-label">Demo:</span>
            {DEMO_WALLETS.map(d => (
              <button key={d.addr} className="demo-pill" onClick={() => loadDemo(d.addr)}>
                {TIERS.find(t => t.name === d.label)?.icon ?? "◦"} {d.label}
              </button>
            ))}
            {walletAddr && (
              <button className="demo-pill" onClick={() => loadDemo(walletAddr)}>
                ◎ My Wallet
              </button>
            )}
          </div>
        </div>

        {error && <div className="error-box">Error: {error}</div>}

        {loading && <LoadingSkeleton />}

        {!loading && cred && (
          <>
            <CredCard cred={cred} />
            <TierLadder tierIndex={cred.tierIndex} />
          </>
        )}

        {!loading && !cred && !error && (
          <div className="cred-empty">
            Enter a wallet address above to view credentials
          </div>
        )}
      </div>
    </>
  );
}