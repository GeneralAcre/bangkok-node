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
      <style dangerouslySetInnerHTML={{ __html: leaderboardCSS }} />
      <div className="orb orb1" /><div className="orb orb2" /><div className="grid-bg" /><div className="scan-line" />

      <Nav active="leaderboard" />

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
              {f === "hackathon"&& "# Hackathons Only"}
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
                      {rank}
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
                        <span style={{ color: "#c084fc", marginLeft: ".35rem" }}>#{entry.hackathonCount}</span>
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
