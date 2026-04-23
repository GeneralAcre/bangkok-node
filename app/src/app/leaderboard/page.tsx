"use client";

import { useState, useEffect } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  StrataScoreTier, SCORE_TIER_COLOR, SCORE_TIER_BG, SCORE_TIER_ICON,
} from "../../utils/scoring";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Space+Mono&family=Inter:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#000; color:#fff; font-family:'Inter',sans-serif; min-height:100vh; }
  :root {
    --g:#8CE9A4; --p:#7A57E9; --p2:#9B7CF4;
    --g-dim:#8CE9A410; --p-dim:#7A57E910;
    --g-glow:#8CE9A430; --p-glow:#7A57E930;
    --surface:rgba(255,255,255,.03); --surface2:rgba(255,255,255,.05);
    --border:rgba(255,255,255,.07); --border-bright:rgba(255,255,255,.12);
    --muted:#6b7280;
  }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes orb1    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(80px,-60px) scale(1.1)} 66%{transform:translate(-40px,40px) scale(.95)} }
  @keyframes orb2    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-60px,40px) scale(1.05)} 66%{transform:translate(60px,-30px) scale(.9)} }
  @keyframes scanLine{ 0%{top:-2px} 100%{top:100vh} }
  @keyframes gradMove{ 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

  .orb { position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; }
  .orb1 { width:700px; height:700px; background:#7A57E9; opacity:.12; top:-200px; left:-150px; animation:orb1 25s ease-in-out infinite; }
  .orb2 { width:600px; height:600px; background:#8CE9A4; opacity:.08; bottom:-150px; right:-100px; animation:orb2 30s ease-in-out infinite; }
  .grid-bg {
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
    background-size:60px 60px;
    mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%);
  }
  .scan-line {
    position:fixed; top:0; left:0; right:0; height:1px; z-index:50; pointer-events:none;
    background:linear-gradient(90deg,transparent 0%,var(--p) 40%,var(--g) 60%,transparent 100%);
    opacity:.3; animation:scanLine 15s linear infinite;
  }

  .nav { position:fixed; top:0; left:0; right:0; z-index:100; background:transparent; }
  .nav-inner { max-width:1400px; margin:0 auto; padding:0 2.5rem; display:flex; align-items:center; justify-content:space-between; height:80px; }
  .nav-brand { text-decoration:none; display:flex; align-items:center; }
  .nav-brand img { height:56px; display:block; }
  .nav-links { display:flex; gap:.3rem; align-items:center; }
  .nav-link { font-family:'Space Grotesk',sans-serif; font-size:.78rem; font-weight:500; color:rgba(255,255,255,.5); text-decoration:none; padding:.3rem .7rem; border-radius:6px; transition:all .2s; }
  .nav-link:hover, .nav-link.active { color:#fff; }
  .wallet-adapter-button { background:rgba(122,87,233,.25) !important; color:#fff !important; font-family:'Space Grotesk',sans-serif !important; font-size:.72rem !important; font-weight:600 !important; border-radius:20px !important; padding:.3rem .85rem !important; height:auto !important; border:1px solid rgba(122,87,233,.4) !important; min-width:0 !important; }
  .wallet-adapter-button:hover { background:rgba(122,87,233,.45) !important; }
  .wallet-adapter-button-start-icon { width:16px !important; height:16px !important; margin-right:6px !important; }

  .page { position:relative; z-index:1; max-width:960px; margin:0 auto; padding:100px 1.5rem 5rem; }

  .page-header { margin-bottom:2rem; animation:fadeUp .5s ease both; }
  .eyebrow {
    font-family:'Space Grotesk',sans-serif; font-size:.72rem; font-weight:700;
    letter-spacing:.2em; text-transform:uppercase; margin-bottom:.75rem;
    background:linear-gradient(135deg,var(--p),var(--g));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    display:inline-block;
  }
  .page-title {
    font-family:'Space Grotesk',sans-serif; font-size:clamp(1.8rem,4vw,2.8rem);
    font-weight:800; letter-spacing:-.03em; margin-bottom:.5rem;
    background:linear-gradient(135deg,#fff 0%,var(--p2) 60%,var(--g) 100%);
    background-size:200% 200%; -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text; animation:gradMove 5s ease infinite;
  }
  .page-sub { font-size:.9rem; color:var(--muted); }

  .filters { display:flex; gap:.5rem; margin-bottom:1.5rem; flex-wrap:wrap; }
  .filter-btn {
    background:var(--surface); border:1px solid var(--border); color:rgba(255,255,255,.5);
    font-family:'Space Grotesk',sans-serif; font-size:.75rem; font-weight:600;
    padding:.35rem .9rem; border-radius:100px; cursor:pointer; transition:all .2s;
  }
  .filter-btn:hover { border-color:rgba(255,255,255,.2); color:#fff; }
  .filter-btn.active { background:rgba(122,87,233,.2); border-color:rgba(122,87,233,.5); color:#fff; }

  .lb-table { display:flex; flex-direction:column; gap:.5rem; }

  .lb-header {
    display:grid; grid-template-columns:48px 1fr auto auto auto;
    gap:.75rem; padding:.5rem 1.25rem; align-items:center;
    font-size:.65rem; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.1em;
  }

  .lb-row {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    display:grid; grid-template-columns:48px 1fr auto auto auto;
    gap:.75rem; padding:.9rem 1.25rem; align-items:center;
    transition:all .2s; text-decoration:none; color:#fff;
    animation:fadeUp .4s ease both;
  }
  .lb-row:hover { border-color:rgba(122,87,233,.3); background:rgba(122,87,233,.04); transform:translateX(2px); }
  .lb-row.is-me { border-color:rgba(140,233,164,.3); background:rgba(140,233,164,.04); }

  .rank-num {
    font-family:'Space Mono',monospace; font-size:.85rem; font-weight:700;
    text-align:center; color:var(--muted);
  }
  .rank-1 { color:#fbbf24; }
  .rank-2 { color:#9ca3af; }
  .rank-3 { color:#d97706; }

  .wallet-col { min-width:0; }
  .wallet-str { font-family:'Space Mono',monospace; font-size:.78rem; color:#fff; }
  .you-badge { font-size:.6rem; font-weight:600; color:var(--g); background:var(--g-dim); border:1px solid rgba(140,233,164,.3); padding:.1rem .45rem; border-radius:100px; margin-left:.5rem; }

  .tier-badge {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.3rem .8rem; border-radius:100px;
    font-family:'Space Grotesk',sans-serif; font-size:.7rem; font-weight:600;
    border:1px solid currentColor; white-space:nowrap;
  }

  .score-col {
    font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:700;
    text-align:right; white-space:nowrap;
  }
  .events-col { font-size:.75rem; color:var(--muted); text-align:right; white-space:nowrap; }

  .shimmer {
    background:linear-gradient(90deg,#1a1a2e 25%,#2d2d4e 50%,#1a1a2e 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:8px;
  }

  .empty-state { text-align:center; padding:4rem 1rem; color:var(--muted); }
  .empty-state h3 { font-family:'Space Grotesk',sans-serif; font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:.5rem; }

  .updated-at { font-size:.65rem; color:var(--muted); text-align:right; margin-top:1rem; }

  @media(max-width:600px){
    .lb-header, .lb-row { grid-template-columns:36px 1fr auto auto; }
    .lb-header > :last-child, .lb-row > :last-child { display:none; }
  }
`;

interface LbEntry {
  wallet:         string;
  score:          number;
  tier:           StrataScoreTier;
  eventCount:     number;
  hackathonCount: number;
}

type FilterTab = "all" | "hackathon" | "recent";

export default function LeaderboardPage() {
  const { publicKey } = useWallet();
  const [entries,    setEntries]    = useState<LbEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [updatedAt,  setUpdatedAt]  = useState<number | null>(null);
  const [filter,     setFilter]     = useState<FilterTab>("all");
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(d => {
        setEntries(d.entries ?? []);
        setUpdatedAt(d.updatedAt ?? null);
        if (d.error) setError(d.error);
      })
      .catch(e => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter(e => {
    if (filter === "hackathon") return e.hackathonCount > 0;
    return true;
  });

  const myWallet = publicKey?.toBase58();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="orb orb1" /><div className="orb orb2" /><div className="grid-bg" /><div className="scan-line" />

      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-brand"><img src="/Strata-logo.svg" alt="STRATA" /></a>
          <div className="nav-links">
            <a href="/"            className="nav-link">Home</a>
            <a href="/organizer"   className="nav-link">Organizer</a>
            <a href="/leaderboard" className="nav-link active">Leaderboard</a>
            <a href="/profile"     className="nav-link">Profile</a>
            <WalletMultiButton />
          </div>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <div className="eyebrow">On-Chain Rankings</div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-sub">Top builders ranked by Strata Score · Updated every 2 minutes</p>
        </div>

        <div className="filters">
          {(["all", "hackathon"] as FilterTab[]).map(f => (
            <button
              key={f}
              className={`filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all"      && "All Events"}
              {f === "hackathon"&& "⚡ Hackathons Only"}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="shimmer" style={{ height: 56, borderRadius: 14, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        ) : error ? (
          <div className="empty-state">
            <h3>Failed to load leaderboard</h3>
            <p style={{ fontSize: ".82rem", marginTop: ".5rem", color: "#f87171" }}>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No entries yet</h3>
            <p>Be the first to check in and claim a spot on the leaderboard.</p>
          </div>
        ) : (
          <>
            <div className="lb-table">
              <div className="lb-header">
                <div style={{ textAlign: "center" }}>#</div>
                <div>Builder</div>
                <div>Tier</div>
                <div style={{ textAlign: "right" }}>Score</div>
                <div style={{ textAlign: "right" }}>Events</div>
              </div>
              {filtered.map((entry, idx) => {
                const tierColor = SCORE_TIER_COLOR[entry.tier];
                const tierBg    = SCORE_TIER_BG[entry.tier];
                const tierIcon  = SCORE_TIER_ICON[entry.tier];
                const isMe      = entry.wallet === myWallet;
                const rank      = idx + 1;
                return (
                  <a
                    key={entry.wallet}
                    href={`/profile/${entry.wallet}`}
                    className={`lb-row${isMe ? " is-me" : ""}`}
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    <div className={`rank-num${rank <= 3 ? ` rank-${rank}` : ""}`}>
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                    </div>
                    <div className="wallet-col">
                      <span className="wallet-str">
                        {entry.wallet.slice(0, 6)}…{entry.wallet.slice(-4)}
                      </span>
                      {isMe && <span className="you-badge">you</span>}
                    </div>
                    <div>
                      <span className="tier-badge" style={{ color: tierColor, background: tierBg, borderColor: tierColor + "50" }}>
                        {tierIcon} {entry.tier}
                      </span>
                    </div>
                    <div className="score-col">{entry.score.toLocaleString()}</div>
                    <div className="events-col">
                      {entry.eventCount} event{entry.eventCount !== 1 ? "s" : ""}
                      {entry.hackathonCount > 0 && (
                        <span style={{ color: "#c084fc", marginLeft: ".35rem" }}>⚡{entry.hackathonCount}</span>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
            {updatedAt && (
              <div className="updated-at">
                Last updated {new Date(updatedAt).toLocaleTimeString()} ·&nbsp;
                {filtered.length} builder{filtered.length !== 1 ? "s" : ""}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
