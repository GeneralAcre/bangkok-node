"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { credentialCSS } from "../../styles/credentialStyles";
import { StrataScoreTier } from "../../utils/scoring";
import { Nav } from "../../components/Nav";

// ── Env ───────────────────────────────────────────────────────────────────────

const COMMUNITY_PDA  = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";
const PROGRAM_ID_STR = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "";

// ── Constants ─────────────────────────────────────────────────────────────────

const TIERS: Array<{ name: StrataScoreTier; icon: string; minScore: number; color: string }> = [
  { name: "Initiate", icon: "◦",  minScore: 0,    color: "#6b7280" },
  { name: "Seeker",   icon: "◈",  minScore: 100,  color: "#ffffff" },
  { name: "Resident", icon: "⬡",  minScore: 250,  color: "#059669" },
  { name: "Builder",  icon: "✦",  minScore: 500,  color: "#d97706" },
  { name: "Core",     icon: "⬟",  minScore: 1000, color: "#dc2626" },
  { name: "Legend",   icon: "✺",  minScore: 2000, color: "#7c3aed" },
];

const DEMO_WALLETS = [
  { label: "Legend",  addr: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" },
  { label: "Builder", addr: "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS" },
  { label: "Seeker",  addr: "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface ParsedEvent {
  title: string;
  location: string;
  country: string;
  eventDate: number;
  eventCode: string;
  isHackathon: boolean;
  organizer: string;
}

interface ParsedAttendance {
  checkedInAt: number;
  nftMint: string | null;
  edition: number;
}

interface AttendedEvent {
  eventPDA:   string;
  event:      ParsedEvent;
  attendance: ParsedAttendance;
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

// ── Borsh helpers ─────────────────────────────────────────────────────────────

function readStr(data: Buffer, off: number): { value: string; next: number } {
  const len = data.readUInt32LE(off);
  return { value: data.slice(off + 4, off + 4 + len).toString("utf-8"), next: off + 4 + len };
}

function communityEventCount(data: Buffer): number {
  let off = 8 + 32;
  off = readStr(data, off).next;
  off = readStr(data, off).next;
  off = readStr(data, off).next;
  off += 8;
  return Number(data.readBigUInt64LE(off));
}

function parseEvent(data: Buffer): ParsedEvent {
  let off = 8 + 32;
  const organizer = new PublicKey(data.slice(off, off + 32)).toBase58(); off += 32;
  const title     = readStr(data, off); off = title.next;
  off = readStr(data, off).next;
  const location  = readStr(data, off); off = location.next;
  const country   = readStr(data, off); off = country.next;
  const eventDate = Number(data.readBigInt64LE(off)); off += 8;
  off += 8 + 8 + 8;
  const eventCode = readStr(data, off); off = eventCode.next;
  off += 1 + 8 + 1 + 1 + 8;
  const isHackathon = data.length > off && data[off] !== 0;
  return { title: title.value, location: location.value, country: country.value, eventDate, eventCode: eventCode.value, isHackathon, organizer };
}

function parseAttendance(data: Buffer): ParsedAttendance {
  let off = 8 + 32 + 32;
  const edition     = Number(data.readBigUInt64LE(off)); off += 8;
  const checkedInAt = Number(data.readBigInt64LE(off));  off += 8;
  const hasNft = data[off] !== 0; off += 1;
  const nftMint = hasNft ? new PublicKey(data.slice(off, off + 32)).toBase58() : null;
  return { checkedInAt, nftMint, edition };
}

function makeEPDA(community: PublicKey, i: number, prog: PublicKey): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(i));
  return PublicKey.findProgramAddressSync([Buffer.from("event"), community.toBuffer(), buf], prog)[0];
}

function makeAPDA(event: PublicKey, attendee: PublicKey, prog: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("attendance"), event.toBuffer(), attendee.toBuffer()], prog)[0];
}

// ── Tier helpers ──────────────────────────────────────────────────────────────

function tierProgress(score: number, idx: number) {
  if (idx >= TIERS.length - 1) return { pct: 100, next: null as string | null, needed: 0 };
  const from  = TIERS[idx].minScore;
  const to    = TIERS[idx + 1].minScore;
  const pct   = Math.min(100, Math.round(((score - from) / (to - from)) * 100));
  return { pct, next: TIERS[idx + 1].name, needed: Math.max(0, to - score) };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatsBar({
  cred, rank, total, rankLoading,
  achievementCount, achievementPoints, achLoading,
}: {
  cred: CredentialData;
  rank: number | null;
  total: number;
  rankLoading: boolean;
  achievementCount: number;
  achievementPoints: number;
  achLoading: boolean;
}) {
  const tier = TIERS[cred.tierIndex] ?? TIERS[0];
  const prog = tierProgress(cred.score, cred.tierIndex);

  return (
    <div className="stats-bar">
      {/* Signal Level */}
      <div className="stat-card">
        <div className="stat-card-label">Signal Level</div>
        <div className="level-icon" style={{ color: tier.color }}>{tier.icon}</div>
        <div className="level-name" style={{ color: tier.color }}>{tier.name}</div>
        <div className="level-num">LVL {cred.tierIndex + 1} · {cred.score.toLocaleString()} XP</div>
        <div className="xp-bar-wrap">
          <div className="xp-bar" style={{ width: `${prog.pct}%` }} />
        </div>
        <div className="xp-next">
          {prog.next ? `${prog.needed} pts → ${prog.next}` : "Max tier reached"}
        </div>
      </div>

      {/* Events */}
      <div className="stat-card">
        <div className="stat-card-label">Events</div>
        <div className="stat-card-value">{cred.eventsAttended}</div>
        <div className="stat-card-sub">Attended</div>
        {cred.hackathonCount > 0 && (
          <div className="stat-card-sub" style={{ color: "#a78bfa" }}>
            {cred.hackathonCount} Hackathon{cred.hackathonCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Rank */}
      <div className="stat-card">
        <div className="stat-card-label">Rank</div>
        {rankLoading ? (
          <div className="shimmer" style={{ height: 32, width: 64, marginTop: ".25rem" }} />
        ) : (
          <div className="stat-card-value">{rank !== null ? `#${rank}` : "—"}</div>
        )}
        <div className="stat-card-sub">of {total || "—"} builders</div>
      </div>

      {/* Achievements */}
      <div className="stat-card">
        <div className="stat-card-label">Achievements</div>
        {achLoading ? (
          <div className="shimmer" style={{ height: 32, width: 48, marginTop: ".25rem" }} />
        ) : (
          <div className="stat-card-value">{achievementCount}</div>
        )}
        <div className="stat-card-sub">Verified NFTs</div>
        {achievementPoints > 0 && (
          <div className="stat-card-sub" style={{ color: "var(--teal)" }}>
            +{achievementPoints} pts boost
          </div>
        )}
      </div>
    </div>
  );
}

function StatsBarSkeleton() {
  return (
    <div className="stats-bar">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="stat-card" style={{ gap: ".55rem" }}>
          <div className="shimmer" style={{ height: 9, width: "55%" }} />
          <div className="shimmer" style={{ height: 32, width: "60%" }} />
          <div className="shimmer" style={{ height: 8, width: "75%" }} />
          <div className="shimmer" style={{ height: 4, borderRadius: 100 }} />
        </div>
      ))}
    </div>
  );
}

function EventCard({ rec }: { rec: AttendedEvent }) {
  const dateStr = new Date(rec.attendance.checkedInAt * 1000).toLocaleDateString("en-US", { dateStyle: "medium" });
  const pts     = rec.event.isHackathon ? 40 : 10;
  return (
    <div className="event-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".4rem", flexWrap: "wrap" }}>
          <div className="event-name">{rec.event.title}</div>
          {rec.event.isHackathon && <span className="badge-hackathon">Hackathon</span>}
        </div>
        <div className="event-meta">
          {rec.event.location}{rec.event.country ? `, ${rec.event.country}` : ""} · {dateStr} · #{rec.event.eventCode}
        </div>
      </div>
      <div className="event-pts">+{pts} pts</div>
    </div>
  );
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CredentialsPage() {
  const { publicKey }  = useWallet();
  const { connection } = useConnection();
  const walletAddr     = publicKey?.toBase58() ?? "";
  const inputRef       = useRef<HTMLInputElement>(null);

  const [query,  setQuery]  = useState("");
  const [target, setTarget] = useState("");

  const [cred,         setCred]         = useState<CredentialData | null>(null);
  const [rank,         setRank]         = useState<number | null>(null);
  const [leaderTotal,  setLeaderTotal]  = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievePts,   setAchievePts]   = useState(0);
  const [events,       setEvents]       = useState<AttendedEvent[]>([]);
  const [worldVerified, setWorldVerified] = useState(false);

  const [credLoading, setCredLoading] = useState(false);
  const [rankLoading, setRankLoading] = useState(false);
  const [achLoading,  setAchLoading]  = useState(false);
  const [evLoading,   setEvLoading]   = useState(false);
  const [error,       setError]       = useState("");

  const [claimOpen,    setClaimOpen]    = useState(false);
  const [claimForm,    setClaimForm]    = useState<ClaimForm>({ hackathonName: "", projectUrl: "", rank: "", description: "" });
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMsg,     setClaimMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  // Auto-load own wallet on connect
  useEffect(() => {
    if (walletAddr && !target) {
      setQuery(walletAddr);
      setTarget(walletAddr);
    }
  }, [walletAddr]);

  // Fetch credential + rank + achievements when target changes
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

  // Load on-chain event attendance
  const loadEvents = useCallback(async () => {
    if (!target || !COMMUNITY_PDA || !PROGRAM_ID_STR) { setEvLoading(false); return; }
    let walletKey: PublicKey;
    try { walletKey = new PublicKey(target); } catch { setEvLoading(false); return; }

    setEvLoading(true);
    try {
      const community = new PublicKey(COMMUNITY_PDA);
      const prog      = new PublicKey(PROGRAM_ID_STR);
      const commInfo  = await connection.getAccountInfo(community);
      if (!commInfo) { setEvLoading(false); return; }

      const count = communityEventCount(commInfo.data);
      const ePDAs = Array.from({ length: count }, (_, i) => makeEPDA(community, i, prog));
      const aPDAs = ePDAs.map(ep => makeAPDA(ep, walletKey, prog));

      const batchGet = async (keys: PublicKey[]) => {
        const out = [];
        for (let i = 0; i < keys.length; i += 100)
          out.push(...await connection.getMultipleAccountsInfo(keys.slice(i, i + 100)));
        return out;
      };

      const [evInfos, atInfos] = await Promise.all([batchGet(ePDAs), batchGet(aPDAs)]);
      const attended: AttendedEvent[] = [];
      for (let i = 0; i < count; i++) {
        if (!atInfos[i] || !evInfos[i]) continue;
        try {
          attended.push({
            eventPDA:   ePDAs[i].toBase58(),
            event:      parseEvent(evInfos[i]!.data),
            attendance: parseAttendance(atInfos[i]!.data),
          });
        } catch {}
      }
      attended.sort((a, b) => b.attendance.checkedInAt - a.attendance.checkedInAt);
      setEvents(attended);
    } catch {}
    setEvLoading(false);
  }, [target, connection]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  function doLookup(addr: string) {
    const t = addr.trim();
    if (!t) return;
    setQuery(t);
    setTarget(t);
    setEvents([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doLookup(query);
  }

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
        <div className="cred-eyebrow">Identity &amp; Reputation</div>
        <div className="cred-title">Builder Passport</div>
        <div className="cred-subtitle">Your portable on-chain identity, earned across every platform.</div>

        {/* Search bar */}
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
            <button className="query-btn" type="submit" disabled={credLoading}>
              {credLoading ? "Loading…" : "Fetch →"}
            </button>
          </form>
          <div className="demo-wallets">
            <span className="demo-label">Demo:</span>
            {DEMO_WALLETS.map(d => (
              <button key={d.addr} className="demo-pill" onClick={() => doLookup(d.addr)}>
                {TIERS.find(t => t.name === d.label)?.icon ?? "◦"} {d.label}
              </button>
            ))}
            {walletAddr && (
              <button className="demo-pill" onClick={() => doLookup(walletAddr)}>◎ My Wallet</button>
            )}
          </div>
        </div>

        {error && <div className="error-box">Error: {error}</div>}

        {/* Stats bar */}
        {credLoading && <StatsBarSkeleton />}

        {!credLoading && cred && (
          <>
            <StatsBar
              cred={cred}
              rank={rank}
              total={leaderTotal}
              rankLoading={rankLoading}
              achievementCount={achievements.length}
              achievementPoints={achievePts}
              achLoading={achLoading}
            />

            {worldVerified && (
              <div style={{
                display:"inline-flex", alignItems:"center", gap:".4rem",
                background:"rgba(0,180,255,.08)", border:"1px solid rgba(0,180,255,.22)",
                borderRadius:100, padding:".3rem .9rem",
                fontSize:".7rem", fontWeight:700, color:"#60c8f5",
                letterSpacing:".06em", marginBottom:"1.25rem",
              }}>
                🌐 World ID Verified
              </div>
            )}

            {/* Events gallery */}
            <div className="section-head">
              Events Attended
              {!evLoading && events.length > 0 && (
                <span className="section-count">{events.length}</span>
              )}
            </div>

            {evLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", marginBottom: "2rem" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="shimmer" style={{ height: 58, borderRadius: 12 }} />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="empty-small" style={{ marginBottom: "2rem" }}>
                {COMMUNITY_PDA ? "No attendance records found for this wallet." : "Configure RPC to see on-chain events."}
              </div>
            ) : (
              <div className="event-list">
                {events.map(rec => <EventCard key={rec.eventPDA} rec={rec} />)}
              </div>
            )}

            {/* Achievements gallery */}
            <div className="section-head">
              Achievements
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
              <div className="ach-grid">
                {achievements.map(a => <AchievementCard key={a.id} ach={a} />)}
              </div>
            )}
          </>
        )}

        {!credLoading && !cred && !error && (
          <div className="cred-empty">Enter a wallet address above to view your Builder Passport</div>
        )}

        {/* Claim Achievement NFT */}
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
              directly to your wallet. Points are added to your Signal Score only after admin signs the approval.
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
      </div>
    </>
  );
}
