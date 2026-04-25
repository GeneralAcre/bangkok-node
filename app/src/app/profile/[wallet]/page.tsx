"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  StrataScoreTier, StrataScore,
  SCORE_TIER_COLOR, SCORE_TIER_BG, SCORE_TIER_ICON,
} from "../../../utils/scoring";
import { walletProfileCSS } from "../../../styles/walletProfileStyles";
import { Nav } from "../../../components/Nav";

const COMMUNITY_PDA  = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";
const PROGRAM_ID_STR = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "";

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
      <style dangerouslySetInnerHTML={{ __html: walletProfileCSS }} />
      <div className="orb orb1" /><div className="orb orb2" /><div className="grid-bg" /><div className="scan-line" />
      <Nav active="profile" />

      <div className="page">
        {/* Search bar */}
        <form className="search-bar" onSubmit={handleSearch}>
          <span style={{ color: "var(--muted)", fontSize: ".8rem", whiteSpace: "nowrap" }}>⌕</span>
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
                          {rec.event.location}, {rec.event.country} · {dateStr} · #{rec.event.eventCode}
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
