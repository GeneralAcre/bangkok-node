"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  StrataScoreTier, SCORE_TIER_COLOR, SCORE_TIER_BG, SCORE_TIER_ICON,
} from "../../utils/scoring";
import { Nav } from "../../components/Nav";
import { leaderboardCSS } from "../../styles/leaderboardStyles";

interface LbEntry {
  wallet:         string;
  score:          number;
  tier:           StrataScoreTier;
  eventCount:     number;
  hackathonCount: number;
}

type ViewTab = "active" | "hall_of_fame" | "geographic";

export default function LeaderboardPage() {
  const { publicKey } = useWallet();
  const [entries,   setEntries]   = useState<LbEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [view,      setView]      = useState<ViewTab>("active");
  const [error,     setError]     = useState<string | null>(null);

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

  const myWallet = publicKey?.toBase58();

  const TABS: { key: ViewTab; label: string }[] = [
    { key: "active",      label: "Active" },
    { key: "hall_of_fame", label: "Hall of Fame" },
    { key: "geographic",  label: "Geographic" },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: leaderboardCSS }} />
      <div className="orb orb1" /><div className="orb orb2" /><div className="grid-bg" /><div className="scan-line" />

      <Nav active="leaderboard" />

      <div className="page">
        <div className="page-header">
          <div className="eyebrow">On-Chain Ranking</div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-sub">Top builders ranked by Strata Score · Updated every 2 minutes</p>
        </div>

        {/* Tab toggle */}
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
        ) : (
          <>
            {/* ── Active: ranked table ── */}
            {view === "active" && (
              entries.length === 0 ? (
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
                    {entries.map((entry, idx) => {
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
                          <div className={`rank-num${rank <= 3 ? ` rank-${rank}` : ""}`}>{rank}</div>
                          <div className="wallet-col">
                            <span className="wallet-str">{entry.wallet.slice(0, 6)}…{entry.wallet.slice(-4)}</span>
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
                              <span style={{ color: "#c084fc", marginLeft: ".35rem" }}>#{entry.hackathonCount}</span>
                            )}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                  {updatedAt && (
                    <div className="updated-at">
                      Last updated {new Date(updatedAt).toLocaleTimeString()} · {entries.length} builder{entries.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </>
              )
            )}

            {/* ── Hall of Fame: top builder cards ── */}
            {view === "hall_of_fame" && (
              entries.length === 0 ? (
                <div className="empty-state">
                  <h3>No entries yet</h3>
                  <p>Be the first to check in and earn a spot in the Hall of Fame.</p>
                </div>
              ) : (
                <div className="hof-grid">
                  {entries.slice(0, 9).map((entry, idx) => {
                    const tc = SCORE_TIER_COLOR[entry.tier];
                    const tb = SCORE_TIER_BG[entry.tier];
                    const ti = SCORE_TIER_ICON[entry.tier];
                    const isMe = entry.wallet === myWallet;
                    return (
                      <a
                        key={entry.wallet}
                        href={`/profile/${entry.wallet}`}
                        className={`hof-card${isMe ? " is-me" : ""}`}
                        style={{ animationDelay: `${idx * 0.06}s` }}
                      >
                        <div className="hof-position">#{idx + 1}</div>
                        <div className="hof-wallet">
                          {entry.wallet.slice(0, 6)}…{entry.wallet.slice(-4)}
                          {isMe && <span className="you-badge" style={{ marginLeft: ".5rem" }}>you</span>}
                        </div>
                        <div className="hof-score">{entry.score.toLocaleString()}</div>
                        <div className="hof-score-lbl">Strata Score</div>
                        <div className="hof-tier" style={{ color: tc, background: tb, borderColor: tc + "50" }}>
                          {ti} {entry.tier}
                        </div>
                        <div className="hof-events">{entry.eventCount} event{entry.eventCount !== 1 ? "s" : ""}</div>
                      </a>
                    );
                  })}
                </div>
              )
            )}

            {/* ── Geographic: coming soon ── */}
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
    </>
  );
}
