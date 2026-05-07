"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  StrataScoreTier, SCORE_TIER_COLOR, SCORE_TIER_BG, SCORE_TIER_ICON,
} from "../../utils/scoring";
import { Nav } from "../../components/Nav";
import { Footer } from "../../components/Footer";
import { leaderboardCSS } from "../../styles/leaderboardStyles";

interface LbEntry {
  wallet:         string;
  username:       string;
  score:          number;
  tier:           StrataScoreTier;
  eventCount:     number;
  hackathonCount: number;
}

interface CommunityInfo { name: string; country: string; }

type ViewTab = "active" | "hall_of_fame" | "geographic";

const RANK_COLORS: Record<number, string> = {
  1: "linear-gradient(135deg,#f59e0b,#d97706)",
  2: "linear-gradient(135deg,#9ca3af,#6b7280)",
  3: "linear-gradient(135deg,#b45309,#92400e)",
};

export default function LeaderboardPage() {
  const { publicKey } = useWallet();
  const [entries,        setEntries]        = useState<LbEntry[]>([]);
  const [community,      setCommunity]      = useState<CommunityInfo | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [updatedAt,      setUpdatedAt]      = useState<number | null>(null);
  const [view,           setView]           = useState<ViewTab>("active");
  const [error,          setError]          = useState<string | null>(null);
  const [wldVerified,    setWldVerified]    = useState<Set<string>>(new Set());
  const [walletSearch,   setWalletSearch]   = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/leaderboard").then(r => r.json()),
      fetch("/api/worldid/verified").then(r => r.json()).catch(() => ({ wallets: [] })),
    ])
      .then(([lb, wld]) => {
        setEntries(lb.entries ?? []);
        setCommunity(lb.community ?? null);
        setUpdatedAt(lb.updatedAt ?? null);
        if (lb.error) setError(lb.error);
        setWldVerified(new Set<string>(wld.wallets ?? []));
      })
      .catch(e => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const myWallet = publicKey?.toBase58();

  function handleWalletSearch(e: React.FormEvent) {
    e.preventDefault();
    const addr = walletSearch.trim();
    if (addr) window.location.href = `/credentials`;
  }

  const TABS: { key: ViewTab; label: string }[] = [
    { key: "active",       label: "Active" },
    { key: "hall_of_fame", label: "Hall of Fame" },
    { key: "geographic",   label: "Geographic" },
  ];

  function RankBadge({ rank }: { rank: number }) {
    const bg = RANK_COLORS[rank] ?? "rgba(66,113,189,.12)";
    const color = rank <= 3 ? "#fff" : "#ffffff";
    return (
      <div className="rank-hex" style={{ background: bg }}>
        <span style={{ color, fontFamily: "'Space Mono',monospace", fontSize: ".75rem", fontWeight: 700 }}>
          {rank}
        </span>
      </div>
    );
  }

  function Avatar({ name, wallet }: { name: string; wallet: string }) {
    const ch = (name || wallet).charAt(0).toUpperCase();
    return (
      <div className="lb-avatar">
        <span>{ch}</span>
      </div>
    );
  }

  const sharedCardContent = (entry: LbEntry, idx: number) => {
    const tc   = SCORE_TIER_COLOR[entry.tier];
    const tb   = SCORE_TIER_BG[entry.tier];
    const ti   = SCORE_TIER_ICON[entry.tier];
    const isMe = entry.wallet === myWallet;
    const rank = idx + 1;
    const displayName = entry.username || `${entry.wallet.slice(0,6)}…${entry.wallet.slice(-4)}`;
    const shortAddr   = `${entry.wallet.slice(0,6)}…${entry.wallet.slice(-4)}`;

    return (
      <a
        key={entry.wallet}
        href={`/credentials`}
        className={`lb-card${isMe ? " is-me" : ""}`}
        data-rank={rank <= 3 ? rank : undefined}
        style={{ animationDelay: `${idx * 0.05}s` }}
      >
        {/* Rank badge top-right */}
        <div className="lb-card-rank">
          <RankBadge rank={rank} />
        </div>

        {/* Avatar + identity */}
        <div className="lb-card-header">
          <Avatar name={entry.username} wallet={entry.wallet} />
          <div className="lb-card-identity">
            <div className="lb-card-name">
              {displayName}
              {isMe && <span className="you-badge">you</span>}
              {wldVerified.has(entry.wallet) && (
                <span title="World ID Verified" style={{ fontSize:".75rem", marginLeft:".25rem", opacity:.85 }}>🌐</span>
              )}
            </div>
            {entry.username && (
              <div className="lb-card-addr">{shortAddr}</div>
            )}
          </div>
        </div>

        {/* Big score */}
        <div className="lb-card-score">
          <div className="lb-score-num">{entry.score.toLocaleString()}</div>
          <div className="lb-score-lbl">Signal Score</div>
        </div>

        {/* Tags */}
        <div className="lb-card-tags">
          <span className="lb-tag tier-tag" style={{ color: tc, background: tb, borderColor: tc + "50" }}>
            {ti} {entry.tier}
          </span>
          {community?.country && (
            <span className="lb-tag">{community.country}</span>
          )}
          {community?.name && (
            <span className="lb-tag">{community.name}</span>
          )}
        </div>

        {/* Bottom stats bar */}
        <div className="lb-card-stats">
          <div className="lb-stat">
            <span className="lb-stat-val">{entry.eventCount}</span>
            <span className="lb-stat-lbl">Event{entry.eventCount !== 1 ? "s" : ""}</span>
          </div>
          {entry.hackathonCount > 0 && (
            <>
              <div className="lb-stat-divider" />
              <div className="lb-stat">
                <span className="lb-stat-val" style={{ color: "#c084fc" }}>{entry.hackathonCount}</span>
                <span className="lb-stat-lbl">Hackathon{entry.hackathonCount !== 1 ? "s" : ""}</span>
              </div>
            </>
          )}
        </div>
      </a>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: leaderboardCSS }} />
      <div className="orb orb1" /><div className="orb orb2" /><div className="grid-bg" /><div className="scan-line" />

      <Nav active="leaderboard" />

      <div className="page">
        <div className="page-header">
          <div className="eyebrow">On-Chain Ranking</div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-sub">Top builders ranked by Signal Score · Updated every 2 minutes</p>
        </div>

        {/* Tabs */}
        <div className="filters">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              className={`filter-btn${view === key ? " active" : ""}`}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Wallet search */}
        <form onSubmit={handleWalletSearch} style={{ display:"flex", gap:".5rem", margin:"1.5rem 0" }}>
          <input
            value={walletSearch}
            onChange={e => setWalletSearch(e.target.value)}
            placeholder="Look up any wallet address…"
            style={{
              flex:1, padding:".6rem 1rem", borderRadius:10,
              background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)",
              color:"#e8e8e8", fontSize:".85rem", outline:"none",
              fontFamily:"'Space Mono',monospace",
            }}
          />
          <button
            type="submit"
            style={{
              padding:".6rem 1.2rem", borderRadius:10, border:"none",
              background:"#ffffff", color:"#0a0a0a",
              fontFamily:"'Epilogue',sans-serif", fontWeight:800,
              fontSize:".78rem", letterSpacing:".06em", textTransform:"uppercase",
              cursor:"pointer", whiteSpace:"nowrap",
            }}
          >
            View Profile
          </button>
        </form>

        {loading ? (
          <div className="lb-cards-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="shimmer" style={{ height: 200, borderRadius: 16, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        ) : error ? (
          <div className="empty-state">
            <h3>Failed to load leaderboard</h3>
            <p style={{ fontSize: ".82rem", marginTop: ".5rem", color: "#f87171" }}>{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <h3>No entries yet</h3>
            <p>Be the first to check in and claim a spot on the leaderboard.</p>
          </div>
        ) : (
          <>
            {/* ── Active: 3-col card grid ── */}
            {view === "active" && (
              <>
                <div className="lb-cards-grid">
                  {entries.map((entry, idx) => sharedCardContent(entry, idx))}
                </div>
                {updatedAt && (
                  <div className="updated-at">
                    Last updated {new Date(updatedAt).toLocaleTimeString()} · {entries.length} builder{entries.length !== 1 ? "s" : ""}
                  </div>
                )}
              </>
            )}

            {/* ── Hall of Fame: top 9 cards ── */}
            {view === "hall_of_fame" && (
              <div className="hof-grid">
                {entries.slice(0, 9).map((entry, idx) => {
                  const tc   = SCORE_TIER_COLOR[entry.tier];
                  const tb   = SCORE_TIER_BG[entry.tier];
                  const ti   = SCORE_TIER_ICON[entry.tier];
                  const isMe = entry.wallet === myWallet;
                  return (
                    <a
                      key={entry.wallet}
                      href={`/credentials`}
                      className={`hof-card${isMe ? " is-me" : ""}`}
                      style={{ animationDelay: `${idx * 0.06}s` }}
                    >
                      <div className="hof-position">#{idx + 1}</div>
                      <div className="hof-wallet">
                        {entry.username || `${entry.wallet.slice(0,6)}…${entry.wallet.slice(-4)}`}
                        {isMe && <span className="you-badge" style={{ marginLeft: ".5rem" }}>you</span>}
                        {wldVerified.has(entry.wallet) && (
                          <span title="World ID Verified" style={{ fontSize:".8rem", marginLeft:".3rem", opacity:.85 }}>🌐</span>
                        )}
                      </div>
                      <div className="hof-score">{entry.score.toLocaleString()}</div>
                      <div className="hof-score-lbl">Signal Score</div>
                      <div className="hof-tier" style={{ color: tc, background: tb, borderColor: tc + "50" }}>
                        {ti} {entry.tier}
                      </div>
                      <div className="hof-events">{entry.eventCount} event{entry.eventCount !== 1 ? "s" : ""}</div>
                    </a>
                  );
                })}
              </div>
            )}

            {/* ── Geographic ── */}
            {view === "geographic" && (
              <div className="empty-state">
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🌏</div>
                <h3>Geographic View</h3>
                <p>Country-level breakdowns coming soon.</p>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}