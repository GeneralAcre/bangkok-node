"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { credentialCSS } from "../../styles/credentialStyles";
import { StrataScoreTier } from "../../utils/scoring";
import { Nav } from "../../components/Nav";
import { Footer } from "../../components/Footer";

const COMMUNITY_PDA  = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";
const PROGRAM_ID_STR = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "";

const TIERS: Array<{ name: StrataScoreTier; icon: string; minScore: number; color: string }> = [
  { name: "Initiate", icon: "◦",  minScore: 0,    color: "#6b7280" },
  { name: "Seeker",   icon: "◈",  minScore: 100,  color: "#ffffff" },
  { name: "Resident", icon: "⬡",  minScore: 250,  color: "#059669" },
  { name: "Builder",  icon: "✦",  minScore: 500,  color: "#d97706" },
  { name: "Core",     icon: "⬟",  minScore: 1000, color: "#dc2626" },
  { name: "Legend",   icon: "✺",  minScore: 2000, color: "#7c3aed" },
];

const NFT_BADGES = [
  { level: 1, img: "/nft-badge/nft-signal-lv1.png", label: "Signal Lv.1", minEvents: 1,  xp: 100,  desc: "Attended your first event" },
  { level: 2, img: "/nft-badge/nft-signal-lv2.png", label: "Signal Lv.2", minEvents: 3,  xp: 300,  desc: "Attended 3 events" },
  { level: 3, img: "/nft-badge/nft-signal-lv3.png", label: "Signal Lv.3", minEvents: 5,  xp: 500,  desc: "Attended 5 events" },
  { level: 4, img: "/nft-badge/nft-signal-lv4.png", label: "Signal Lv.4", minEvents: 10, xp: 1000, desc: "Attended 10 events" },
  { level: 5, img: "/nft-badge/nft-signal-lv5.png", label: "Signal Lv.5", minEvents: 20, xp: 2000, desc: "Attended 20 events" },
];

interface CredentialData {
  owner: string;
  score: number;
  tier: StrataScoreTier;
  tierIndex: number;
  eventsAttended: number;
  hackathonCount: number;
  vouchCount: number;
  lastCheckinAt: number;
  lastIssuer: string;
  isOnChain: boolean;
}

interface Achievement {
  id: string;
  wallet: string;
  hackathonName: string;
  projectUrl: string;
  rank: string;
  description: string;
  submittedAt: number;
  status: string;
  points?: number;
  nftMint?: string;
}

interface ClaimForm {
  hackathonName: string;
  projectUrl:    string;
  rank:          string;
  description:   string;
}

function tierProgress(score: number, idx: number) {
  if (idx >= TIERS.length - 1) return { pct: 100, next: null as string | null, needed: 0 };
  const from = TIERS[idx].minScore;
  const to   = TIERS[idx + 1].minScore;
  const pct  = Math.min(100, Math.round(((score - from) / (to - from)) * 100));
  return { pct, next: TIERS[idx + 1].name, needed: Math.max(0, to - score) };
}

function AchievementCard({ ach }: { ach: Achievement }) {
  return (
    <div className="ach-card">
      <div className="ach-verified">✓ Verified by Signal</div>
      <div className="ach-name">{ach.hackathonName}</div>
      <div className="ach-rank">{ach.rank}</div>
      {ach.points != null && <div className="ach-pts">+{ach.points} pts</div>}
    </div>
  );
}

export default function CredentialsPage() {
  const { publicKey } = useWallet();
  const walletAddr    = publicKey?.toBase58() ?? "";
  const target        = walletAddr;

  const [cred,         setCred]         = useState<CredentialData | null>(null);
  const [rank,         setRank]         = useState<number | null>(null);
  const [leaderTotal,  setLeaderTotal]  = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievePts,   setAchievePts]   = useState(0);
  const [worldVerified, setWorldVerified] = useState(false);

  const [credLoading, setCredLoading] = useState(false);
  const [rankLoading, setRankLoading] = useState(false);
  const [achLoading,  setAchLoading]  = useState(false);
  const [error,       setError]       = useState("");

  const [selectedBadge, setSelectedBadge] = useState<typeof NFT_BADGES[0] | null>(null);
  const [badgeEarned,   setBadgeEarned]   = useState(false);

  const [claimOpen,    setClaimOpen]    = useState(false);
  const [claimForm,    setClaimForm]    = useState<ClaimForm>({ hackathonName: "", projectUrl: "", rank: "", description: "" });
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMsg,     setClaimMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET ?? "";
  const [adminKey,      setAdminKey]      = useState("");
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [adminKeyOpen,  setAdminKeyOpen]  = useState(false);
  const [myClaims,      setMyClaims]      = useState<any[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [actionMsg,     setActionMsg]     = useState<Record<string, { ok: boolean; text: string }>>({});
  const [actioning,     setActioning]     = useState<string | null>(null);

  const isAdminWallet = !!publicKey && !!ADMIN_WALLET && publicKey.toBase58() === ADMIN_WALLET;
  const isAdmin = isAdminWallet || !!adminKey;

  useEffect(() => {
    if (!target) return;
    setCred(null); setRank(null); setLeaderTotal(0); setAchievements([]); setAchievePts(0); setWorldVerified(false); setError("");

    setCredLoading(true);
    fetch(`/api/credentials/${target}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setCred(d); })
      .catch(e => setError(e?.message ?? "Failed to fetch credential"))
      .finally(() => setCredLoading(false));

    setRankLoading(true);
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(d => {
        const entries: Array<{ wallet: string }> = d.entries ?? [];
        setLeaderTotal(entries.length);
        const idx = entries.findIndex(e => e.wallet === target);
        setRank(idx >= 0 ? idx + 1 : null);
      })
      .catch(() => {})
      .finally(() => setRankLoading(false));

    setAchLoading(true);
    fetch(`/api/achievement/wallet/${target}`)
      .then(r => r.json())
      .then(d => { setAchievements(d.achievements ?? []); setAchievePts(d.totalPoints ?? 0); })
      .catch(() => {})
      .finally(() => setAchLoading(false));

    fetch(`/api/worldid/verified/${target}`)
      .then(r => r.json())
      .then(d => setWorldVerified(d.verified === true))
      .catch(() => {});
  }, [target]);

  useEffect(() => {
    if (!target) { setMyClaims([]); return; }
    setClaimsLoading(true);
    fetch(`/api/achievement/wallet/${target}`)
      .then(r => r.json())
      .then(d => setMyClaims(d.achievements ?? []))
      .catch(() => {})
      .finally(() => setClaimsLoading(false));
  }, [target]);

  useEffect(() => {
    if (!isAdmin) return;
    setClaimsLoading(true);
    fetch("/api/achievement/pending?status=pending", {
      headers: { "x-admin-key": adminKey },
    })
      .then(r => r.json())
      .then(d => {
        const adminPending = (d.claims ?? []) as any[];
        setMyClaims(prev => {
          const ownIds = new Set(prev.map((c: any) => c.id));
          const merged = [...prev];
          for (const c of adminPending) {
            if (!ownIds.has(c.id)) merged.push(c);
          }
          return merged;
        });
      })
      .catch(() => {})
      .finally(() => setClaimsLoading(false));
  }, [isAdmin, adminKey]);

  async function handleClaimSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!walletAddr) return;
    setClaimLoading(true); setClaimMsg(null);
    try {
      const res = await fetch("/api/achievement/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddr, ...claimForm }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Submission failed");
      setClaimMsg({ ok: true, text: "Claim submitted! Signal admin will review and mint your Achievement NFT." });
      setClaimForm({ hackathonName: "", projectUrl: "", rank: "", description: "" });
    } catch (err: any) {
      setClaimMsg({ ok: false, text: err?.message ?? "Submission failed" });
    } finally {
      setClaimLoading(false);
    }
  }

  async function handleAction(claimId: string, action: "approve" | "reject") {
    if (!publicKey) return;
    setActioning(claimId);
    setActionMsg(prev => ({ ...prev, [claimId]: { ok: true, text: action === "approve" ? "Approving…" : "Rejecting…" } }));
    try {
      const res = await fetch("/api/achievement/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ claimId, adminPubkey: publicKey.toBase58(), action }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Action failed");
      setActionMsg(prev => ({
        ...prev,
        [claimId]: { ok: true, text: action === "approve" ? "✓ Approved — NFT minted!" : "✕ Rejected" },
      }));
      setMyClaims(prev => prev.map((c: any) =>
        c.id === claimId ? { ...c, status: action === "approve" ? "approved" : "rejected" } : c
      ));
    } catch (e: any) {
      setActionMsg(prev => ({ ...prev, [claimId]: { ok: false, text: e?.message ?? "Failed" } }));
    } finally {
      setActioning(null);
    }
  }

  const tier = cred ? (TIERS[cred.tierIndex] ?? TIERS[0]) : TIERS[0];
  const prog = cred ? tierProgress(cred.score, cred.tierIndex) : { pct: 0, next: "Seeker", needed: 100 };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: credentialCSS }} />
      <div className="grid-bg" />
      <div className="orb-wrap">
        <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
      </div>
      <div className="scanline" />
      <Nav active="credentials" />

      <div className="page">
        <div className="cred-eyebrow">Identity &amp; Reputation</div>
        <div className="cred-title">Builder Passport</div>
        <div className="cred-subtitle">Your portable on-chain identity, earned across every platform.</div>

        {/* ── Not connected ── */}
        {!walletAddr && (
          <div style={{
            textAlign: "center", padding: "5rem 1rem",
            border: "1px dashed rgba(255,255,255,.1)", borderRadius: 20,
            marginTop: "2rem",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>◈</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: ".5rem" }}>Connect your wallet</div>
            <div style={{ color: "#888", fontSize: ".85rem" }}>Your Builder Passport is tied to your wallet address.</div>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {walletAddr && credLoading && (
          <div className="shimmer" style={{ height: 220, borderRadius: 20, marginTop: "1.5rem" }} />
        )}

        {error && <div className="error-box" style={{ marginTop: "1rem" }}>Error: {error}</div>}

        {/* ── Profile Banner ── */}
        {walletAddr && cred && (
          <div style={{
            position: "relative",
            background: "rgba(255,255,255,.03)",
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: 20, overflow: "hidden",
            marginTop: "1.5rem", marginBottom: "1.75rem",
          }}>
            {/* Cover strip */}
            <div style={{
              height: 80,
              background: "linear-gradient(120deg, rgba(255,255,255,.06) 0%, rgba(255,255,255,.02) 100%)",
              borderBottom: "1px solid rgba(255,255,255,.08)",
            }} />

            <div style={{ padding: "0 1.75rem 1.75rem" }}>
              {/* Avatar row */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", marginTop: -36, marginBottom: "1rem" }}>
                <div style={{
                  width: 72, height: 72, flexShrink: 0,
                  background: "#111",
                  border: "2px solid rgba(255,255,255,.3)",
                  borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "2rem", color: "#ffffff",
                }}>
                  {tier.icon}
                </div>
                <div style={{ paddingBottom: ".25rem" }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".82rem", color: "#e8e8e8", fontWeight: 700 }}>
                    {walletAddr.slice(0, 8)}…{walletAddr.slice(-6)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginTop: ".2rem", flexWrap: "wrap" }}>
                    <span style={{
                      color: "#fff", fontSize: ".72rem", fontWeight: 700,
                      fontFamily: "'Orbitron',sans-serif", letterSpacing: ".08em",
                      border: "1px solid rgba(255,255,255,.2)", borderRadius: 100,
                      padding: ".1rem .55rem",
                    }}>
                      {tier.icon} {tier.name}
                    </span>
                    {worldVerified && (
                      <span style={{
                        background: "rgba(0,180,255,.1)", border: "1px solid rgba(0,180,255,.3)",
                        color: "#60c8f5", borderRadius: 100, padding: ".1rem .5rem",
                        fontSize: ".58rem", fontWeight: 700, fontFamily: "'Orbitron',sans-serif",
                      }}>
                        🌐 World ID
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                gap: ".75rem",
              }}>
                {/* Level + XP */}
                <div style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,.14)",
                  borderRadius: 12, padding: ".9rem 1rem",
                }}>
                  <div style={{ fontSize: ".55rem", color: "#888", fontFamily: "'Orbitron',sans-serif", letterSpacing: ".12em", marginBottom: ".4rem" }}>SIGNAL LEVEL</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", lineHeight: 1, marginBottom: ".15rem" }}>
                    {cred.tierIndex + 1}
                    <span style={{ fontSize: ".7rem", color: "#888", fontWeight: 400, marginLeft: ".25rem" }}>LVL</span>
                  </div>
                  <div style={{ fontSize: ".65rem", color: "#888", marginBottom: ".5rem" }}>{cred.score.toLocaleString()} XP</div>
                  <div style={{ height: 3, background: "rgba(255,255,255,.1)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${prog.pct}%`, background: "#ffffff", borderRadius: 100, transition: "width .6s ease" }} />
                  </div>
                  {prog.next && (
                    <div style={{ fontSize: ".58rem", color: "#555", marginTop: ".3rem" }}>{prog.needed} pts → {prog.next}</div>
                  )}
                </div>

                {/* Rank */}
                <div style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,.14)",
                  borderRadius: 12, padding: ".9rem 1rem",
                }}>
                  <div style={{ fontSize: ".55rem", color: "#888", fontFamily: "'Orbitron',sans-serif", letterSpacing: ".12em", marginBottom: ".4rem" }}>RANK</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", lineHeight: 1, marginBottom: ".15rem" }}>
                    {rankLoading ? "—" : rank !== null ? `#${rank}` : "—"}
                  </div>
                  <div style={{ fontSize: ".65rem", color: "#888" }}>of {leaderTotal || "—"} builders</div>
                </div>

                {/* Events */}
                <div style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,.14)",
                  borderRadius: 12, padding: ".9rem 1rem",
                }}>
                  <div style={{ fontSize: ".55rem", color: "#888", fontFamily: "'Orbitron',sans-serif", letterSpacing: ".12em", marginBottom: ".4rem" }}>EVENTS</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", lineHeight: 1, marginBottom: ".15rem" }}>{cred.eventsAttended}</div>
                  <div style={{ fontSize: ".65rem", color: "#888" }}>Attended</div>
                </div>

                {/* Hackathons */}
                <div style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,.14)",
                  borderRadius: 12, padding: ".9rem 1rem",
                }}>
                  <div style={{ fontSize: ".55rem", color: "#888", fontFamily: "'Orbitron',sans-serif", letterSpacing: ".12em", marginBottom: ".4rem" }}>HACKATHONS</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", lineHeight: 1, marginBottom: ".15rem" }}>{cred.hackathonCount}</div>
                  <div style={{ fontSize: ".65rem", color: "#888" }}>Competed</div>
                  {achievePts > 0 && <div style={{ fontSize: ".58rem", color: "#00FFC2", marginTop: ".2rem" }}>+{achievePts} pts boost</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Signal Badges ── */}
        {walletAddr && cred && (
          <div style={{ marginBottom: "2rem" }}>
            <div className="section-head" style={{ marginBottom: "1rem" }}>
              Signal Badges
              <span style={{ fontFamily: "inherit", fontSize: ".72rem", color: "#555", fontWeight: 400, letterSpacing: 0, marginLeft: ".75rem" }}>
                earned by attending events
              </span>
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {NFT_BADGES.map(badge => {
                const earned = cred.eventsAttended >= badge.minEvents;
                return (
                  <div
                    key={badge.level}
                    onClick={() => { setSelectedBadge(badge); setBadgeEarned(earned); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: ".45rem",
                      opacity: earned ? 1 : 0.4,
                      transition: "opacity .2s, transform .15s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <div style={{
                      width: 88, height: 88, position: "relative",
                      background: "transparent",
                      border: `1.5px solid ${earned ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.1)"}`,
                      borderRadius: 16, overflow: "hidden",
                      boxShadow: earned ? "0 0 18px rgba(255,255,255,.08)" : "none",
                    }}>
                      <img
                        src={badge.img}
                        alt={badge.label}
                        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                      />
                      {!earned && (
                        <div style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(0,0,0,.5)", fontSize: "1.3rem",
                        }}>🔒</div>
                      )}
                    </div>
                    <div style={{
                      fontSize: ".6rem", fontFamily: "'Orbitron',sans-serif",
                      color: earned ? "#ffffff" : "#555", letterSpacing: ".06em",
                    }}>
                      {badge.label}
                    </div>
                    <div style={{ fontSize: ".58rem", color: earned ? "#888" : "#444" }}>
                      {earned ? "✓ Earned" : `${badge.minEvents} events`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── NFT Badge Modal ── */}
        {selectedBadge && (
          <div
            onClick={() => setSelectedBadge(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "1rem",
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: "relative", width: "100%", maxWidth: 340,
                background: "#111", border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 24, padding: "2rem 1.75rem 1.75rem",
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "1rem", textAlign: "center",
                boxShadow: "0 24px 80px rgba(0,0,0,.6)",
              }}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedBadge(null)}
                style={{
                  position: "absolute", top: 14, right: 16,
                  background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
                  color: "#888", borderRadius: 8, width: 28, height: 28,
                  cursor: "pointer", fontSize: ".85rem", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>

              {/* Header */}
              {badgeEarned ? (
                <div style={{
                  fontFamily: "'Orbitron',sans-serif", fontSize: ".65rem", fontWeight: 700,
                  letterSpacing: ".2em", color: "#00FFC2", textTransform: "uppercase",
                }}>Congratulations!</div>
              ) : (
                <div style={{
                  fontFamily: "'Orbitron',sans-serif", fontSize: ".65rem", fontWeight: 700,
                  letterSpacing: ".2em", color: "#888", textTransform: "uppercase",
                }}>Locked</div>
              )}

              {/* NFT image */}
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <img
                  src={selectedBadge.img}
                  alt={selectedBadge.label}
                  style={{
                    width: "100%", height: "100%", objectFit: "contain", display: "block",
                    opacity: badgeEarned ? 1 : 0.25,
                  }}
                />
                {!badgeEarned && (
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%,-50%)",
                    fontSize: "2.2rem", lineHeight: 1,
                  }}>🔒</div>
                )}
              </div>

              {/* Badge title */}
              <div style={{
                fontFamily: "'Orbitron',sans-serif", fontSize: ".95rem", fontWeight: 900,
                color: "#ffffff", letterSpacing: ".1em", textTransform: "uppercase",
              }}>
                {selectedBadge.label}
              </div>

              {/* Description */}
              <div style={{ fontSize: ".82rem", color: "#888", lineHeight: 1.5 }}>
                {badgeEarned
                  ? selectedBadge.desc
                  : `Attend ${selectedBadge.minEvents} event${selectedBadge.minEvents > 1 ? "s" : ""} to unlock this badge`
                }
              </div>

              {/* XP or progress */}
              {badgeEarned ? (
                <div style={{
                  background: "rgba(0,255,194,.1)", border: "1px solid rgba(0,255,194,.3)",
                  color: "#00FFC2", borderRadius: 100, padding: ".45rem 1.4rem",
                  fontFamily: "'Orbitron',sans-serif", fontSize: ".8rem", fontWeight: 700,
                  letterSpacing: ".08em",
                }}>
                  +{selectedBadge.xp.toLocaleString()} XP
                </div>
              ) : (
                <div style={{
                  background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
                  color: "#888", borderRadius: 100, padding: ".45rem 1.4rem",
                  fontFamily: "'Orbitron',sans-serif", fontSize: ".72rem", fontWeight: 700,
                  letterSpacing: ".08em",
                }}>
                  {Math.max(0, selectedBadge.minEvents - (cred?.eventsAttended ?? 0))} more event{selectedBadge.minEvents - (cred?.eventsAttended ?? 0) !== 1 ? "s" : ""} needed
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Hackathon Achievements ── */}
        {walletAddr && cred && (
          <>
            <div className="section-head">
              Hackathon Achievements
              {!achLoading && achievements.length > 0 && (
                <span className="section-count">{achievements.length}</span>
              )}
            </div>

            {achLoading ? (
              <div className="ach-grid" style={{ marginBottom: "2rem" }}>
                {[0, 1].map(i => (
                  <div key={i} className="shimmer" style={{ height: 90, borderRadius: 12 }} />
                ))}
              </div>
            ) : achievements.length === 0 ? (
              <div className="empty-small" style={{ marginBottom: "2rem" }}>No verified achievements yet.</div>
            ) : (
              <div className="ach-grid" style={{ marginBottom: "2rem" }}>
                {achievements.map(a => <AchievementCard key={a.id} ach={a} />)}
              </div>
            )}
          </>
        )}

        {/* ── Claim Achievement NFT ── */}
        {walletAddr && (
          <div className="claim-section">
            <div className="claim-head">
              <div>
                <div className="claim-eyebrow">Admin Verified</div>
                <div className="claim-title">Claim Achievement NFT</div>
              </div>
              <button
                className="query-btn"
                onClick={() => { setClaimOpen(v => !v); setClaimMsg(null); }}
                style={{ fontSize: ".7rem" }}
              >
                {claimOpen ? "Cancel" : "+ Claim"}
              </button>
            </div>
            <p style={{ fontSize: ".78rem", color: "#888", lineHeight: 1.6, marginBottom: ".5rem" }}>
              Won or placed in a hackathon? Submit your claim below. Signal admin will verify your result
              and mint a <strong style={{ color: "#e8e8e8" }}>Verified by Signal</strong> Achievement NFT
              directly to your wallet.
            </p>

            {claimOpen && (
              <form onSubmit={handleClaimSubmit} style={{ display: "flex", flexDirection: "column", gap: ".75rem", marginTop: "1rem" }}>
                {([
                  { key: "hackathonName", label: "Hackathon Name *", placeholder: "Colosseum Hackathon, ETH Bangkok…", type: "text" },
                  { key: "projectUrl",    label: "Your Project URL *", placeholder: "https://github.com/you/project", type: "url" },
                  { key: "rank",          label: "Finish / Rank *", placeholder: "1st Place, Grand Prize, Runner-Up, Finalist…", type: "text" },
                ] as const).map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: ".75rem", color: "#888", marginBottom: ".3rem" }}>{f.label}</label>
                    <input
                      type={f.type}
                      value={claimForm[f.key]}
                      onChange={e => setClaimForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      required
                      style={{
                        width: "100%", background: "rgba(255,255,255,.04)",
                        border: "1px solid rgba(255,255,255,.1)", borderRadius: 8,
                        padding: ".55rem .75rem", color: "#e8e8e8",
                        fontFamily: "'Space Mono',monospace", fontSize: ".82rem",
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", fontSize: ".75rem", color: "#888", marginBottom: ".3rem" }}>Notes (optional)</label>
                  <textarea
                    value={claimForm.description}
                    onChange={e => setClaimForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Any context that helps admin verify your result…"
                    rows={3}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.12)",
                      borderRadius: 8, color: "#e8e8e8", padding: ".55rem .75rem",
                      fontSize: ".82rem", resize: "vertical", fontFamily: "inherit", outline: "none",
                    }}
                  />
                </div>
                {claimMsg && (
                  <div style={{
                    padding: ".6rem .9rem", borderRadius: 8, fontSize: ".8rem",
                    background: claimMsg.ok ? "rgba(0,255,194,.08)" : "rgba(239,68,68,.12)",
                    color: claimMsg.ok ? "#00FFC2" : "#f87171",
                    border: `1px solid ${claimMsg.ok ? "rgba(0,255,194,.25)" : "rgba(239,68,68,.3)"}`,
                  }}>
                    {claimMsg.text}
                  </div>
                )}
                <button
                  className="query-btn"
                  type="submit"
                  disabled={claimLoading}
                  style={{ alignSelf: "flex-start", padding: ".55rem 1.4rem" }}
                >
                  {claimLoading ? "Submitting…" : "Submit Claim →"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── Claims Inbox ── */}
        {walletAddr && (
          <div style={{ marginTop: "2.5rem", borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: "1rem" }}>
              <div>
                <div style={{
                  fontFamily: "'Orbitron',sans-serif", fontSize: ".55rem", fontWeight: 700,
                  letterSpacing: ".14em", textTransform: "uppercase", color: "#888", marginBottom: ".25rem",
                }}>
                  Achievement Claims
                </div>
                <div style={{ fontSize: ".95rem", fontWeight: 700, color: "#e8e8e8" }}>
                  Claims Inbox
                  {myClaims.filter((c: any) => c.status === "pending").length > 0 && (
                    <span style={{
                      marginLeft: ".6rem", background: "rgba(251,191,36,.15)", color: "#fbbf24",
                      border: "1px solid rgba(251,191,36,.3)", borderRadius: 100,
                      fontSize: ".6rem", fontWeight: 700, padding: ".15rem .55rem",
                      fontFamily: "'Orbitron',sans-serif", letterSpacing: ".08em",
                    }}>
                      {myClaims.filter((c: any) => c.status === "pending").length} PENDING
                    </span>
                  )}
                </div>
              </div>

              {!isAdminWallet && (
                <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                  {adminKeyOpen ? (
                    <>
                      <input
                        type="password"
                        value={adminKeyInput}
                        onChange={e => setAdminKeyInput(e.target.value)}
                        placeholder="Admin key…"
                        onKeyDown={e => { if (e.key === "Enter") { setAdminKey(adminKeyInput); setAdminKeyOpen(false); } }}
                        style={{
                          background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)",
                          borderRadius: 8, padding: ".35rem .65rem", color: "#e8e8e8",
                          fontFamily: "'Space Mono',monospace", fontSize: ".75rem", outline: "none", width: 140,
                        }}
                      />
                      <button
                        onClick={() => { setAdminKey(adminKeyInput); setAdminKeyOpen(false); }}
                        style={{
                          background: "rgba(0,255,194,.1)", border: "1px solid rgba(0,255,194,.25)",
                          color: "#00FFC2", borderRadius: 8, padding: ".35rem .75rem",
                          fontSize: ".7rem", cursor: "pointer", fontFamily: "'Orbitron',sans-serif",
                          fontWeight: 700, letterSpacing: ".06em",
                        }}
                      >Unlock</button>
                      <button
                        onClick={() => { setAdminKeyOpen(false); setAdminKeyInput(""); }}
                        style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: ".8rem" }}
                      >✕</button>
                    </>
                  ) : (
                    <button
                      onClick={() => setAdminKeyOpen(true)}
                      style={{
                        background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)",
                        color: "#888", borderRadius: 8, padding: ".3rem .7rem",
                        fontSize: ".65rem", cursor: "pointer", fontFamily: "'Orbitron',sans-serif",
                        letterSpacing: ".06em",
                      }}
                    >
                      {adminKey ? "🔓 Admin" : "Admin →"}
                    </button>
                  )}
                </div>
              )}
              {isAdminWallet && (
                <span style={{
                  background: "rgba(0,255,194,.08)", border: "1px solid rgba(0,255,194,.2)",
                  color: "#00FFC2", borderRadius: 100, padding: ".25rem .75rem",
                  fontSize: ".6rem", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: ".1em",
                }}>
                  🔓 ADMIN
                </span>
              )}
            </div>

            {claimsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                {[0, 1].map(i => (
                  <div key={i} style={{
                    height: 72, borderRadius: 12,
                    background: "linear-gradient(90deg,#151515 25%,#1e1e1e 50%,#151515 75%)",
                    backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
                  }} />
                ))}
              </div>
            ) : myClaims.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "2rem 1rem",
                border: "1px dashed rgba(255,255,255,.08)", borderRadius: 12,
                color: "#555", fontSize: ".82rem",
              }}>
                No claims yet.{" "}
                <span style={{ color: "#888" }}>Use &quot;+ Claim&quot; above to submit a hackathon win.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                {myClaims.map((claim: any) => {
                  const statusColor  = claim.status === "approved" ? "#00FFC2" : claim.status === "rejected" ? "#f87171" : "#fbbf24";
                  const statusBg     = claim.status === "approved" ? "rgba(0,255,194,.08)" : claim.status === "rejected" ? "rgba(239,68,68,.08)" : "rgba(251,191,36,.08)";
                  const statusBorder = claim.status === "approved" ? "rgba(0,255,194,.2)" : claim.status === "rejected" ? "rgba(239,68,68,.2)" : "rgba(251,191,36,.2)";
                  const msg      = actionMsg[claim.id];
                  const isActing = actioning === claim.id;

                  return (
                    <div key={claim.id} style={{
                      background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)",
                      borderRadius: 12, padding: "1rem 1.1rem",
                      display: "flex", flexDirection: "column", gap: ".5rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: ".75rem" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: ".88rem", color: "#e8e8e8", marginBottom: ".15rem" }}>{claim.hackathonName}</div>
                          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: "#00FFC2" }}>{claim.rank}</div>
                        </div>
                        <span style={{
                          background: statusBg, border: `1px solid ${statusBorder}`,
                          color: statusColor, borderRadius: 100, padding: ".2rem .65rem",
                          fontSize: ".58rem", fontFamily: "'Orbitron',sans-serif",
                          fontWeight: 700, letterSpacing: ".1em", whiteSpace: "nowrap", flexShrink: 0,
                        }}>
                          {claim.status.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                        <a
                          href={claim.projectUrl} target="_blank" rel="noreferrer"
                          style={{ fontFamily: "'Space Mono',monospace", fontSize: ".68rem", color: "#888", textDecoration: "none" }}
                          onMouseOver={e => (e.currentTarget.style.color = "#e8e8e8")}
                          onMouseOut={e => (e.currentTarget.style.color = "#888")}
                        >
                          {claim.projectUrl.replace(/^https?:\/\//, "").slice(0, 40)}{claim.projectUrl.length > 46 ? "…" : ""} ↗
                        </a>
                        <span style={{ fontSize: ".65rem", color: "#555" }}>
                          {new Date(claim.submittedAt * 1000).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        </span>
                        {isAdmin && claim.wallet !== target && (
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".65rem", color: "#666" }}>
                            {claim.wallet.slice(0, 8)}…{claim.wallet.slice(-4)}
                          </span>
                        )}
                        {claim.points && claim.status === "approved" && (
                          <span style={{
                            background: "rgba(0,255,194,.08)", border: "1px solid rgba(0,255,194,.2)",
                            color: "#00FFC2", borderRadius: 100, padding: ".12rem .5rem",
                            fontSize: ".6rem", fontFamily: "'Orbitron',sans-serif", fontWeight: 700,
                          }}>
                            +{claim.points} pts
                          </span>
                        )}
                      </div>

                      {isAdmin && claim.status === "pending" && (
                        <div style={{ display: "flex", gap: ".5rem", alignItems: "center", marginTop: ".25rem", flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleAction(claim.id, "approve")}
                            disabled={isActing}
                            style={{
                              background: "rgba(0,255,194,.1)", border: "1px solid rgba(0,255,194,.25)",
                              color: "#00FFC2", borderRadius: 8, padding: ".35rem .9rem",
                              fontSize: ".72rem", cursor: isActing ? "not-allowed" : "pointer",
                              fontFamily: "'Orbitron',sans-serif", fontWeight: 700,
                              letterSpacing: ".06em", opacity: isActing ? .5 : 1,
                            }}
                          >
                            {isActing ? "…" : "✓ Approve"}
                          </button>
                          <button
                            onClick={() => handleAction(claim.id, "reject")}
                            disabled={isActing}
                            style={{
                              background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)",
                              color: "#f87171", borderRadius: 8, padding: ".35rem .9rem",
                              fontSize: ".72rem", cursor: isActing ? "not-allowed" : "pointer",
                              fontFamily: "'Orbitron',sans-serif", fontWeight: 700,
                              letterSpacing: ".06em", opacity: isActing ? .5 : 1,
                            }}
                          >
                            ✕ Reject
                          </button>
                          {msg && (
                            <span style={{ fontSize: ".72rem", color: msg.ok ? "#00FFC2" : "#f87171" }}>{msg.text}</span>
                          )}
                        </div>
                      )}

                      {msg && claim.status !== "pending" && (
                        <div style={{ fontSize: ".72rem", color: msg.ok ? "#00FFC2" : "#f87171", marginTop: ".1rem" }}>{msg.text}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
