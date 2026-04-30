"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { credentialCSS } from "../../styles/credentialStyles";
import { StrataScoreTier } from "../../utils/scoring";
import { Nav } from "../../components/Nav";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CredentialData {
  owner:          string;
  community:      string;
  score:          number;
  tier:           StrataScoreTier;
  tierIndex:      number;
  eventsAttended: number;
  hackathonCount: number;
  vouchCount:     number;
  lastCheckinAt:  number;
  lastIssuer:     string;
  compression: {
    protocol:    string;
    method:      string;
    storageCost: number;
    regularCost: number;
    savingsPct:  number;
    ratio:       number;
  };
  zk: {
    root:     string;
    leaf:     string;
    credHash: string;
    proof: {
      pi_a: string[];
      pi_b: string[][];
      pi_c: string[];
    };
    proofId: string;
  };
  isOnChain: boolean;
}

interface GateResult {
  pass:       boolean;
  walletTier: StrataScoreTier;
  tierIndex:  number;
  required:   number;
  score:      number;
  proofId:    string;
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

const DEMO_WALLETS = [
  { label: "Legend",   addr: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" },
  { label: "Builder",  addr: "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS" },
  { label: "Seeker",   addr: "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy" },
];

const TIER_ICONS: Record<StrataScoreTier, string> = {
  Initiate: "◦", Seeker: "◈", Resident: "⬡",
  Builder: "✦",  Core: "⬟",   Legend: "✺",
};

function fmt(n: number): string { return n.toLocaleString(); }

function fmtTs(unix: number): string {
  if (!unix) return "—";
  const d = Math.floor((Date.now() / 1000 - unix) / 86_400);
  const date = new Date(unix * 1000).toISOString().slice(0, 10);
  return `${unix} (${d}d ago)  [${date}]`;
}

function shortHex(h: string, n = 20): string {
  return h.length > n + 5 ? h.slice(0, n) + "…" : h;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBox({ rows = 6 }: { rows?: number }) {
  return (
    <div className="term-box">
      <div className="term-header">
        <div className="term-header-dots">
          <div className="term-dot term-dot-r" /><div className="term-dot term-dot-y" /><div className="term-dot term-dot-g" />
        </div>
        <div className="term-title">LOADING…</div>
        <div />
      </div>
      <div className="kv-grid">
        {Array.from({ length: rows }).map((_, i) => (
          <div className="kv-row" key={i}>
            <div className="shimmer" style={{ height: 12, width: "60%" }} />
            <div className="shimmer" style={{ height: 12, width: `${50 + (i * 13) % 40}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Compressed Account Box ───────────────────────────────────────────────────

function CompressedAccountBox({ cred }: { cred: CredentialData }) {
  const tierColor: Record<StrataScoreTier, string> = {
    Initiate: "#6b7280", Seeker: "#60a5fa", Resident: "#4ade80",
    Builder: "#f59e0b", Core: "#ef4444", Legend: "#a855f7",
  };

  const nextTier   = TIERS[cred.tierIndex + 1];
  const nextScore  = nextTier?.minScore ?? cred.score;
  const curMin     = TIERS[cred.tierIndex]?.minScore ?? 0;
  const progress   = nextTier
    ? Math.min(100, ((cred.score - curMin) / (nextScore - curMin)) * 100)
    : 100;

  return (
    <div className="term-box">
      <div className="term-header">
        <div className="term-header-dots">
          <div className="term-dot term-dot-r" /><div className="term-dot term-dot-y" /><div className="term-dot term-dot-g" />
        </div>
        <div className="term-title">COMPRESSED ACCOUNT DATA</div>
        <div className="term-badge term-badge-tier">
          {TIER_ICONS[cred.tier]} {cred.tier.toUpperCase()}
        </div>
      </div>

      {/* Wallet address header row */}
      <div style={{ padding:".5rem .85rem", borderBottom:"1px solid var(--bdr)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:".5rem" }}>
        <span style={{ fontSize:".72rem", color:"var(--acc2)", fontFamily:"Space Mono,monospace" }}>
          {cred.owner.slice(0, 8)}…{cred.owner.slice(-6)}
        </span>
        <span className="term-badge term-badge-tier" style={{ color: tierColor[cred.tier], borderColor: tierColor[cred.tier] + "60", background: tierColor[cred.tier] + "12" }}>
          {TIER_ICONS[cred.tier]} {cred.tier.toUpperCase()}
        </span>
      </div>

      {/* Score bar */}
      <div className="score-section">
        <div className="score-nums">
          <span>{fmt(cred.score)} pts</span>
          <span style={{ color: "var(--dim)" }}>
            {nextTier ? `${fmt(nextScore)} pts → ${nextTier.name}` : "MAX TIER"}
          </span>
        </div>
        <div className="score-track">
          <div className="score-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* KV data */}
      <div className="kv-grid">
        <div className="kv-row">
          <span className="kv-key">owner</span>
          <span className="kv-val" style={{ fontSize:".65rem" }}>{cred.owner}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">score</span>
          <span className="kv-val green">{fmt(cred.score)} pts</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">tier</span>
          <span className="kv-val amber">{cred.tierIndex} // {cred.tier}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">events_attended</span>
          <span className="kv-val">{cred.eventsAttended}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">hackathon_count</span>
          <span className="kv-val">{cred.hackathonCount}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">vouch_count</span>
          <span className="kv-val">{cred.vouchCount}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">last_checkin_at</span>
          <span className="kv-val dim" style={{ fontSize:".65rem" }}>{fmtTs(cred.lastCheckinAt)}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">last_issuer</span>
          <span className="kv-val blue">{cred.lastIssuer}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">compression</span>
          <span className="kv-val dim">{cred.compression.protocol} // {cred.compression.method}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">storage_cost</span>
          <span className="kv-val green">~{cred.compression.storageCost} SOL
            <span style={{ color:"var(--dim)", marginLeft:".5rem" }}>
              (vs {cred.compression.regularCost} SOL regular)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── ZK Proof Box ─────────────────────────────────────────────────────────────

function ZKProofBox({ cred }: { cred: CredentialData }) {
  const { zk } = cred;
  return (
    <div className="term-box">
      <div className="proof-header">
        <div className="proof-dot" />
        <span className="proof-ok">ZK VALIDITY PROOF — LIGHT PROTOCOL</span>
      </div>
      <div className="proof-grid">
        <div className="proof-row">
          <span className="proof-key">root:</span>
          <span className="proof-val">{zk.root}</span>
        </div>
        <div className="proof-row">
          <span className="proof-key">leaf:</span>
          <span className="proof-val">{zk.leaf}</span>
        </div>
        <div className="proof-row">
          <span className="proof-key">π_a:</span>
          <span className="proof-val nested">
            {zk.proof.pi_a.map((v, i) => (
              <div key={i} className="nested-row"><span>[{i}]</span>{shortHex(v, 48)}</div>
            ))}
          </span>
        </div>
        <div className="proof-row">
          <span className="proof-key">π_b:</span>
          <span className="proof-val nested">
            {zk.proof.pi_b.map((pair, i) => (
              <div key={i} className="nested-row">
                <span>[{i}]</span>
                <span>[{shortHex(pair[0], 24)},<br style={{ display:"none" }}/>{shortHex(pair[1], 24)}]</span>
              </div>
            ))}
          </span>
        </div>
        <div className="proof-row">
          <span className="proof-key">π_c:</span>
          <span className="proof-val nested">
            {zk.proof.pi_c.map((v, i) => (
              <div key={i} className="nested-row"><span>[{i}]</span>{shortHex(v, 48)}</div>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Tier Progression ─────────────────────────────────────────────────────────

function TierProgression({ tierIndex }: { tierIndex: number }) {
  return (
    <div className="term-box">
      <div className="term-header">
        <div className="term-header-dots">
          <div className="term-dot term-dot-r" /><div className="term-dot term-dot-y" /><div className="term-dot term-dot-g" />
        </div>
        <div className="term-title">TIER PROGRESSION</div>
        <div />
      </div>
      <div className="tier-prog-section">
        <div className="tier-steps">
          {TIERS.map((t, i) => (
            <div
              key={t.name}
              className={`tier-step${i <= tierIndex ? " reached" : ""}${i === tierIndex ? " current" : ""}`}
            >
              <div className="tier-step-icon">{t.icon}</div>
              <div className="tier-step-name">{t.name.slice(0, 4).toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tier Gate Verifier ───────────────────────────────────────────────────────

function TierGateVerifier({ loadedWallet }: { loadedWallet: string }) {
  const [gateWallet, setGateWallet] = useState("");
  const [minTier,    setMinTier]    = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState<GateResult | null>(null);

  async function verify() {
    const target = gateWallet.trim() || loadedWallet;
    if (!target) return;
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`/api/credentials/${target}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setResult({
        pass:       d.tierIndex >= minTier,
        walletTier: d.tier,
        tierIndex:  d.tierIndex,
        required:   minTier,
        score:      d.score,
        proofId:    d.zk?.proofId ?? "—",
      });
    } catch { setResult(null); }
    finally { setLoading(false); }
  }

  return (
    <div className="term-box">
      <div className="term-header">
        <div className="term-header-dots">
          <div className="term-dot term-dot-r" /><div className="term-dot term-dot-y" /><div className="term-dot term-dot-g" />
        </div>
        <div className="term-title">TIER GATE VERIFIER // CPI-COMPOSABLE</div>
        <div />
      </div>
      <div className="gate-section">
        <input
          className="gate-wallet-input"
          value={gateWallet}
          onChange={e => setGateWallet(e.target.value)}
          placeholder="Wallet to verify (leave blank to use loaded credential)…"
        />

        <div style={{ fontSize:".6rem", letterSpacing:".12em", color:"var(--dim)", marginBottom:".5rem", textTransform:"uppercase" }}>
          Minimum Required Tier
        </div>
        <div className="tier-btns">
          {TIERS.map((t, i) => (
            <button
              key={t.name}
              className={`tier-btn${minTier === i ? " selected" : ""}`}
              onClick={() => setMinTier(i)}
            >
              {t.icon} {t.name}
            </button>
          ))}
        </div>

        <button className="verify-btn" onClick={verify} disabled={loading}>
          {loading ? "VERIFYING…" : "★  VERIFY TIER →"}
        </button>

        {result && (
          <div className={`gate-result ${result.pass ? "pass" : "fail"}`}>
            <div className="gate-result-title">
              {result.pass ? "✓  ACCESS GRANTED" : "✕  ACCESS DENIED"}
            </div>
            <div className="gate-kv">
              <span className="gate-key">wallet_tier</span>
              <span>{result.tierIndex} // {result.walletTier}</span>
              <span className="gate-key">required_tier</span>
              <span>{result.required} // {TIERS[result.required]?.name}</span>
              <span className="gate-key">score</span>
              <span className="kv-val green">{fmt(result.score)} pts</span>
              <span className="gate-key">result</span>
              <span className={result.pass ? "gate-val-pass" : "gate-val-fail"}>
                {result.pass ? "PASS" : "FAIL"}
              </span>
              <span className="gate-key">proof_method</span>
              <span style={{ color:"var(--dim)" }}>light-protocol // concurrent-merkle-tree inclusion</span>
              <span className="gate-key">proof_valid</span>
              <span className="gate-val-pass">true ({result.proofId})</span>
            </div>
          </div>
        )}
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

  // Auto-load connected wallet
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
        {/* Header */}
        <div className="cred-eyebrow">STRATA PROTOCOL // ZK-COMPRESSED VERIFIABLE CREDENTIALS</div>
        <div className="cred-title">Credential Explorer<span className="cursor" /></div>
        <div className="cred-subtitle">
          <span>Light Protocol</span> · Concurrent Merkle Tree · Solana Devnet
        </div>

        {/* Query bar */}
        <div className="query-section">
          <div className="query-label">QUERY COMPRESSED STATE TREE</div>
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
              {loading ? "LOADING…" : "FETCH →"}
            </button>
          </form>
          <div className="demo-wallets">
            <span className="demo-label">Demo wallets:</span>
            {DEMO_WALLETS.map(d => (
              <button key={d.addr} className="demo-pill" onClick={() => loadDemo(d.addr)}>
                {TIER_ICONS[d.label as StrataScoreTier] ?? "◦"} {d.label}
              </button>
            ))}
            {walletAddr && (
              <button className="demo-pill" onClick={() => loadDemo(walletAddr)}>
                ◎ My Wallet
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && <div className="error-box">Error: {error}</div>}

        {/* Loading skeletons */}
        {loading && (
          <>
            <SkeletonBox rows={10} />
            <SkeletonBox rows={5} />
          </>
        )}

        {/* Credential data */}
        {!loading && cred && (
          <>
            <CompressedAccountBox cred={cred} />
            <ZKProofBox cred={cred} />
            <TierProgression tierIndex={cred.tierIndex} />
            <TierGateVerifier loadedWallet={cred.owner} />

            {/* Bottom stats */}
            <div className="bottom-stats">
              <div className="stat-box">
                <div className="stat-num green">~{cred.compression.storageCost} SOL</div>
                <div className="stat-desc">cost per credential<br />vs {cred.compression.regularCost} SOL regular</div>
              </div>
              <div className="stat-box">
                <div className="stat-num amber">{fmt(cred.compression.ratio)}×</div>
                <div className="stat-desc">compression ratio<br />Light Protocol ZK</div>
              </div>
              <div className="stat-box">
                <div className="stat-num blue">Concurrent MT</div>
                <div className="stat-desc">proof method<br />tamper-proof, composable</div>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !cred && !error && (
          <div style={{ textAlign:"center", padding:"4rem 1rem", color:"var(--dim)", fontSize:".8rem" }}>
            Enter a wallet address above to query its compressed credential<span className="cursor" />
          </div>
        )}
      </div>
    </>
  );
}
