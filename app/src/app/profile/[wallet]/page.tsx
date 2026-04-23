"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {
  StrataScoreTier, StrataScore,
  SCORE_TIER_COLOR, SCORE_TIER_BG, SCORE_TIER_ICON,
} from "../../../utils/scoring";

const COMMUNITY_PDA  = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";
const PROGRAM_ID_STR = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "";

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
  @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes orb1    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(80px,-60px) scale(1.1)} 66%{transform:translate(-40px,40px) scale(.95)} }
  @keyframes orb2    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-60px,40px) scale(1.05)} 66%{transform:translate(60px,-30px) scale(.9)} }
  @keyframes scanLine{ 0%{top:-2px} 100%{top:100vh} }

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

  .page { position:relative; z-index:1; max-width:860px; margin:0 auto; padding:100px 1.5rem 5rem; }

  .search-bar {
    display:flex; gap:.5rem; margin-bottom:2rem;
    background:var(--surface); border:1px solid var(--border); border-radius:12px;
    padding:.4rem .4rem .4rem .9rem; align-items:center;
  }
  .search-bar input {
    flex:1; background:transparent; border:none; outline:none; color:#fff;
    font-family:'Inter',sans-serif; font-size:.85rem;
  }
  .search-bar input::placeholder { color:var(--muted); }
  .search-bar button {
    background:var(--p); color:#fff; border:none; border-radius:8px; padding:.4rem .9rem;
    font-family:'Space Grotesk',sans-serif; font-size:.78rem; font-weight:600; cursor:pointer;
    white-space:nowrap; transition:background .15s;
  }
  .search-bar button:hover { background:#8B6EF0; }

  .score-card {
    background:var(--surface); border:1px solid var(--border); border-radius:20px;
    padding:2rem; margin-bottom:1.5rem; animation:fadeUp .5s ease both;
    display:flex; gap:1.5rem; align-items:center; flex-wrap:wrap;
  }
  .score-left { flex:1; min-width:200px; }
  .wallet-addr {
    font-family:'Space Mono',monospace; font-size:.75rem; color:var(--muted);
    margin-bottom:.5rem; word-break:break-all;
  }
  .score-num {
    font-family:'Space Grotesk',sans-serif; font-size:3.5rem; font-weight:800; line-height:1;
    background:linear-gradient(135deg,#fff,var(--p2));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .score-label { font-size:.7rem; color:var(--muted); text-transform:uppercase; letter-spacing:.12em; margin-top:.25rem; }
  .score-right { display:flex; flex-direction:column; gap:.75rem; align-items:flex-start; }
  .tier-badge {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.45rem 1.1rem; border-radius:100px;
    font-family:'Space Grotesk',sans-serif; font-size:.82rem; font-weight:700;
    border:1px solid currentColor;
  }
  .score-stats { display:flex; gap:1.5rem; flex-wrap:wrap; }
  .score-stat { text-align:center; }
  .score-stat-val { font-family:'Space Grotesk',sans-serif; font-size:1.4rem; font-weight:700; color:#fff; }
  .score-stat-lbl { font-size:.65rem; color:var(--muted); text-transform:uppercase; letter-spacing:.1em; }
  .copy-btn {
    background:var(--surface2); border:1px solid var(--border); color:rgba(255,255,255,.6);
    font-family:'Space Grotesk',sans-serif; font-size:.72rem; font-weight:600;
    padding:.3rem .75rem; border-radius:8px; cursor:pointer; transition:all .15s; white-space:nowrap;
  }
  .copy-btn:hover { border-color:rgba(255,255,255,.2); color:#fff; }
  .copy-btn.copied { border-color:var(--g); color:var(--g); }

  .section-title { font-family:'Space Grotesk',sans-serif; font-size:1.05rem; font-weight:700; color:#fff; margin-bottom:1rem; }

  .event-list { display:flex; flex-direction:column; gap:.6rem; }
  .event-row {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    padding:.9rem 1.1rem; display:flex; align-items:center; justify-content:space-between;
    gap:1rem; flex-wrap:wrap; transition:border-color .2s;
  }
  .event-row:hover { border-color:rgba(122,87,233,.25); }
  .event-name { font-family:'Space Grotesk',sans-serif; font-size:.88rem; font-weight:600; color:#fff; }
  .event-meta { font-size:.73rem; color:var(--muted); margin-top:.15rem; }
  .event-right { display:flex; gap:.5rem; align-items:center; flex-shrink:0; }
  .badge-nft {
    font-size:.65rem; font-weight:600; padding:.2rem .65rem; border-radius:100px;
    background:rgba(140,233,164,.12); border:1px solid rgba(140,233,164,.3); color:var(--g);
  }
  .badge-unclaimed {
    font-size:.65rem; font-weight:600; padding:.2rem .65rem; border-radius:100px;
    background:rgba(122,87,233,.1); border:1px solid rgba(122,87,233,.25); color:var(--p2);
    cursor:pointer;
  }
  .badge-unclaimed:hover { background:rgba(122,87,233,.2); }
  .badge-hackathon {
    font-size:.6rem; font-weight:600; padding:.15rem .55rem; border-radius:100px;
    background:rgba(168,85,247,.15); border:1px solid rgba(168,85,247,.3); color:#c084fc;
  }

  .shimmer {
    background:linear-gradient(90deg,#1a1a2e 25%,#2d2d4e 50%,#1a1a2e 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:8px;
  }

  .empty-state { text-align:center; padding:3rem 1rem; color:var(--muted); font-size:.9rem; }

  .progress-bar-wrap {
    background:rgba(255,255,255,.06); border-radius:100px; height:6px;
    overflow:hidden; margin-top:.75rem; max-width:300px;
  }
  .progress-bar { height:100%; border-radius:100px; transition:width .8s ease; }

  .tier-next { font-size:.7rem; color:var(--muted); margin-top:.3rem; }

  @media(max-width:600px) { .score-num { font-size:2.5rem; } .score-card { flex-direction:column; } }
`;

// ── Borsh helpers ────────────────────────────────────────────────────────────

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

interface ParsedEvent {
  title: string; location: string; country: string;
  eventDate: number; capacity: number; attendeeCount: number;
  eventCode: string; isHackathon: boolean;
}

function parseEvent(data: Buffer): ParsedEvent {
  let off = 8 + 32 + 32;
  const title   = readStr(data, off); off = title.next;
  off = readStr(data, off).next;       // description
  const location = readStr(data, off); off = location.next;
  const country  = readStr(data, off); off = country.next;
  const eventDate     = Number(data.readBigInt64LE(off));  off += 8;
  const capacity      = Number(data.readBigUInt64LE(off)); off += 8;
  const attendeeCount = Number(data.readBigUInt64LE(off)); off += 8;
  off += 8; // fee
  const eventCode = readStr(data, off); off = eventCode.next;
  off += 1 + 8 + 1 + 1 + 8; // status + eventIndex + escrowBump + bump + createdAt
  const isHackathon = data.length > off && data[off] !== 0;
  return { title: title.value, location: location.value, country: country.value, eventDate, capacity, attendeeCount, eventCode: eventCode.value, isHackathon };
}

interface ParsedAttendance {
  checkedInAt: number;
  nftMint: string | null;
}

function parseAttendance(data: Buffer): ParsedAttendance {
  let off = 8 + 32 + 32 + 8; // disc + event + attendee + edition
  const checkedInAt = Number(data.readBigInt64LE(off)); off += 8;
  const hasNft = data[off] !== 0; off += 1;
  const nftMint = hasNft ? new PublicKey(data.slice(off, off + 32)).toBase58() : null;
  return { checkedInAt, nftMint };
}

function makeEPDA(community: PublicKey, i: number, prog: PublicKey): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(i));
  return PublicKey.findProgramAddressSync([Buffer.from("event"), community.toBuffer(), buf], prog)[0];
}

function makeAPDA(event: PublicKey, attendee: PublicKey, prog: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("attendance"), event.toBuffer(), attendee.toBuffer()], prog)[0];
}

// ── Tier progress helper ──────────────────────────────────────────────────────

const TIER_ORDER: StrataScoreTier[] = ["Initiate", "Seeker", "Resident", "Builder", "Core", "Legend"];
const TIER_SCORE_MIN: Record<StrataScoreTier, number> = {
  Initiate: 0, Seeker: 100, Resident: 250, Builder: 500, Core: 1000, Legend: 2000,
};

function tierProgress(score: number, tier: StrataScoreTier): { pct: number; nextTier: StrataScoreTier | null; needed: number } {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx === TIER_ORDER.length - 1) return { pct: 100, nextTier: null, needed: 0 };
  const next    = TIER_ORDER[idx + 1];
  const from    = TIER_SCORE_MIN[tier];
  const to      = TIER_SCORE_MIN[next];
  const pct     = Math.min(100, Math.round(((score - from) / (to - from)) * 100));
  return { pct, nextTier: next, needed: Math.max(0, to - score) };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface AttendedEvent {
  eventPDA:   string;
  event:      ParsedEvent;
  attendance: ParsedAttendance;
}

export default function WalletProfilePage() {
  const params    = useParams();
  const walletStr = (params?.wallet as string) ?? "";
  const { connection }         = useConnection();
  const { publicKey: myKey }   = useWallet();

  const [scoreData,  setScoreData]  = useState<(StrataScore & { isVerified: boolean }) | null>(null);
  const [events,     setEvents]     = useState<AttendedEvent[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [evLoading,  setEvLoading]  = useState(true);
  const [copied,     setCopied]     = useState(false);
  const [search,     setSearch]     = useState("");
  const [mintingKey, setMintingKey] = useState<string | null>(null);
  const [claimed,    setClaimed]    = useState<Record<string, string>>({});

  const isOwnProfile = myKey?.toBase58() === walletStr;

  // Load score from API
  useEffect(() => {
    if (!walletStr) return;
    setLoading(true);
    fetch(`/api/score/${walletStr}`)
      .then(r => r.json())
      .then(d => setScoreData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [walletStr]);

  // Load event history client-side
  const loadEvents = useCallback(async () => {
    if (!walletStr || !COMMUNITY_PDA || !PROGRAM_ID_STR) { setEvLoading(false); return; }
    let walletKey: PublicKey;
    try { walletKey = new PublicKey(walletStr); } catch { setEvLoading(false); return; }

    setEvLoading(true);
    try {
      const community = new PublicKey(COMMUNITY_PDA);
      const prog      = new PublicKey(PROGRAM_ID_STR);
      const commInfo  = await connection.getAccountInfo(community);
      if (!commInfo) { setEvLoading(false); return; }

      const count  = communityEventCount(commInfo.data);
      const ePDAs  = Array.from({ length: count }, (_, i) => makeEPDA(community, i, prog));
      const aPDAs  = ePDAs.map(ep => makeAPDA(ep, walletKey, prog));

      const batchFetch = async (keys: PublicKey[]) => {
        const out = [];
        for (let i = 0; i < keys.length; i += 100) {
          out.push(...await connection.getMultipleAccountsInfo(keys.slice(i, i + 100)));
        }
        return out;
      };

      const [evInfos, atInfos] = await Promise.all([batchFetch(ePDAs), batchFetch(aPDAs)]);

      const attended: AttendedEvent[] = [];
      for (let i = 0; i < count; i++) {
        if (!atInfos[i] || !evInfos[i]) continue;
        try {
          const ev = parseEvent(evInfos[i]!.data);
          const at = parseAttendance(atInfos[i]!.data);
          attended.push({ eventPDA: ePDAs[i].toBase58(), event: ev, attendance: at });
        } catch {}
      }
      attended.sort((a, b) => b.attendance.checkedInAt - a.attendance.checkedInAt);
      setEvents(attended);
    } catch {}
    setEvLoading(false);
  }, [walletStr, connection]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = search.trim();
    if (!trimmed) return;
    window.location.href = `/profile/${trimmed}`;
  }

  async function handleClaimNft(rec: AttendedEvent) {
    if (!myKey || !isOwnProfile) return;
    setMintingKey(rec.eventPDA);
    try {
      const res = await fetch("/api/mint-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userWallet:  walletStr,
          eventTitle:  rec.event.title,
          eventCode:   rec.event.eventCode,
          checkedInAt: rec.attendance.checkedInAt,
        }),
      });
      const d = await res.json();
      if (d.mint) {
        setClaimed(prev => ({ ...prev, [rec.eventPDA]: d.mint }));
        await loadEvents();
      }
    } catch {}
    setMintingKey(null);
  }

  const tier       = scoreData?.tier ?? "Initiate";
  const tierColor  = SCORE_TIER_COLOR[tier as StrataScoreTier];
  const tierBg     = SCORE_TIER_BG[tier as StrataScoreTier];
  const tierIcon   = SCORE_TIER_ICON[tier as StrataScoreTier];
  const progress   = scoreData ? tierProgress(scoreData.score, tier as StrataScoreTier) : null;

  const shortWallet = walletStr
    ? `${walletStr.slice(0, 6)}…${walletStr.slice(-4)}`
    : "";

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
            <a href="/leaderboard" className="nav-link">Leaderboard</a>
            <a href="/profile"     className="nav-link active">Profile</a>
            <WalletMultiButton />
          </div>
        </div>
      </nav>

      <div className="page">
        {/* Search bar */}
        <form className="search-bar" onSubmit={handleSearch}>
          <span style={{ color: "var(--muted)", fontSize: ".8rem", whiteSpace: "nowrap" }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search any wallet address…"
          />
          <button type="submit">Look Up →</button>
        </form>

        {!walletStr ? (
          <div className="empty-state">No wallet address in URL.</div>
        ) : (
          <>
            {/* Score card */}
            <div className="score-card">
              <div className="score-left">
                <div className="wallet-addr">
                  {walletStr}
                  {isOwnProfile && (
                    <span style={{ marginLeft: ".5rem", color: "var(--g)", fontSize: ".65rem" }}>· You</span>
                  )}
                </div>
                {loading ? (
                  <div className="shimmer" style={{ height: "3.5rem", width: 160, marginBottom: ".5rem" }} />
                ) : (
                  <>
                    <div className="score-num">{scoreData?.score ?? 0}</div>
                    <div className="score-label">Strata Score</div>
                    {progress && (
                      <>
                        <div className="progress-bar-wrap">
                          <div className="progress-bar" style={{ width: `${progress.pct}%`, background: `linear-gradient(90deg, ${tierColor}, var(--g))` }} />
                        </div>
                        {progress.nextTier ? (
                          <div className="tier-next">{progress.needed} pts to {progress.nextTier}</div>
                        ) : (
                          <div className="tier-next" style={{ color: tierColor }}>Max tier reached</div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="score-right">
                {loading ? (
                  <div className="shimmer" style={{ height: 36, width: 120, borderRadius: 100 }} />
                ) : (
                  <div className="tier-badge" style={{ color: tierColor, background: tierBg, borderColor: tierColor + "50" }}>
                    {tierIcon} {tier}
                  </div>
                )}
                <div className="score-stats">
                  <div className="score-stat">
                    <div className="score-stat-val">{scoreData?.eventCount ?? 0}</div>
                    <div className="score-stat-lbl">Events</div>
                  </div>
                  {(scoreData?.hackathonCount ?? 0) > 0 && (
                    <div className="score-stat">
                      <div className="score-stat-val" style={{ color: "#c084fc" }}>{scoreData!.hackathonCount}</div>
                      <div className="score-stat-lbl">Hackathons</div>
                    </div>
                  )}
                </div>
                <button className={`copy-btn${copied ? " copied" : ""}`} onClick={copyLink}>
                  {copied ? "✓ Copied!" : "⎘ Copy Profile Link"}
                </button>
              </div>
            </div>

            {/* Event history */}
            <div className="section-title">
              Attended Events
              {!evLoading && events.length > 0 && (
                <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: ".8rem", marginLeft: ".5rem" }}>
                  ({events.length})
                </span>
              )}
            </div>

            {evLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="shimmer" style={{ height: 64, borderRadius: 14 }} />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                {walletStr === myKey?.toBase58()
                  ? "No events yet — check in to earn your first Proof of Presence."
                  : "No attendance records found for this wallet."}
              </div>
            ) : (
              <div className="event-list">
                {events.map(rec => {
                  const hasClaimed  = !!rec.attendance.nftMint || !!claimed[rec.eventPDA];
                  const mintAddr    = rec.attendance.nftMint ?? claimed[rec.eventPDA];
                  const isMinting   = mintingKey === rec.eventPDA;
                  const dateStr     = new Date(rec.attendance.checkedInAt * 1000).toLocaleDateString("en-US", { dateStyle: "medium" });
                  return (
                    <div className="event-row" key={rec.eventPDA}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                          <div className="event-name">{rec.event.title}</div>
                          {rec.event.isHackathon && <span className="badge-hackathon">HACKATHON</span>}
                        </div>
                        <div className="event-meta">
                          📍 {rec.event.location}, {rec.event.country} · Checked in {dateStr} · #{rec.event.eventCode}
                        </div>
                      </div>
                      <div className="event-right">
                        {hasClaimed ? (
                          mintAddr ? (
                            <a
                              href={`https://explorer.solana.com/address/${mintAddr}?cluster=devnet`}
                              target="_blank" rel="noreferrer"
                              className="badge-nft"
                            >
                              ✓ NFT
                            </a>
                          ) : (
                            <span className="badge-nft">✓ Claimed</span>
                          )
                        ) : isOwnProfile ? (
                          <button
                            className="badge-unclaimed"
                            onClick={() => handleClaimNft(rec)}
                            disabled={isMinting}
                          >
                            {isMinting
                              ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◈</span>
                              : "◎ Claim NFT"}
                          </button>
                        ) : (
                          <span className="badge-unclaimed" style={{ cursor: "default" }}>Unclaimed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
