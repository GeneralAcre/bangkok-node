"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  StrataClient, parseTier, MemberAccount, EventAccount,
  AttendanceAccount, MemberTier,
  parseEventStatus,
} from "../../utils/strata-client";
import { computeStrataScore, SCORE_TIER_ICON } from "../../utils/scoring";
import { Nav } from "../../components/Nav";
import { PageBackground } from "../../components/PageBackground";
import { profileCSS } from "../../styles/profileStyles";

const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

interface AttendedEvent {
  eventPubkey: string;
  attendance:  AttendanceAccount;
  event:       EventAccount | null;
}

function computeStreak(attended: AttendedEvent[]): number {
  if (!attended.length) return 0;
  const monthNums = new Set(
    attended.map(r => {
      const d = new Date(r.attendance.checkedInAt.toNumber() * 1000);
      return d.getFullYear() * 12 + d.getMonth();
    })
  );
  const sorted = Array.from(monthNums).sort((a, b) => b - a);
  const now = new Date();
  const cur = now.getFullYear() * 12 + now.getMonth();
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] === cur - i) streak++;
    else break;
  }
  return streak;
}

const TIER_NUM: Record<MemberTier, number> = {
  Initiate:1, Seeker:2, Resident:3, Builder:4, Core:5, Legend:6,
};

export default function ProfilePage() {
  const { connection }           = useConnection();
  const wallet                   = useWallet();
  const { publicKey, connected } = wallet;

  const [client,   setClient]   = useState<StrataClient | null>(null);
  const [member,   setMember]   = useState<MemberAccount | null>(null);
  const [attended, setAttended] = useState<AttendedEvent[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);
  const [balance,  setBalance]  = useState<number | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [minted,   setMinted]   = useState<Record<string, string>>({});

  const [activeTab,    setActiveTab]    = useState<"all" | "hackathon" | "organized">("all");
  const [copiedAddr,   setCopiedAddr]   = useState(false);
  const [copiedLink,   setCopiedLink]   = useState(false);

  const [organizedEvents, setOrganizedEvents] = useState<{ pubkey: string; account: EventAccount }[]>([]);
  const [orgQrEvent,      setOrgQrEvent]      = useState<{ pubkey: string; account: EventAccount } | null>(null);
  const [orgQrDataUrl,    setOrgQrDataUrl]    = useState("");
  const [orgCopied,       setOrgCopied]       = useState(false);

  useEffect(() => {
    if (!connected || !publicKey) return;
    async function init() {
      try {
        const idl = await import("../../idl/strata.json").catch(() => null);
        if (!idl) return;
        const provider = new AnchorProvider(connection, wallet as any, { commitment:"confirmed" });
        setClient(new StrataClient(provider, idl));
      } catch (e: any) { setError(e?.message); }
    }
    init();
  }, [connected, publicKey, connection, wallet]);

  const loadProfile = useCallback(async () => {
    if (!client || !publicKey || !COMMUNITY_PDA_STR) return;
    setLoading(true); setError(null);
    try {
      const community = new PublicKey(COMMUNITY_PDA_STR);
      const [bal, mem, attendanceRecords] = await Promise.all([
        connection.getBalance(publicKey),
        client.getMember(community, publicKey).catch(() => null),
        client.getAllAttendanceByWallet(publicKey),
      ]);
      setBalance(bal / 1e9);
      setMember(mem);
      const eventAccounts = await Promise.all(
        attendanceRecords.map(r =>
          client.getEvent(new PublicKey(r.account.event)).catch(() => null)
        )
      );
      const rich: AttendedEvent[] = attendanceRecords.map((rec, i) => ({
        eventPubkey: rec.account.event.toBase58(),
        attendance:  rec.account,
        event:       eventAccounts[i] ?? null,
      }));
      rich.sort((a, b) => b.attendance.checkedInAt.toNumber() - a.attendance.checkedInAt.toNumber());
      setAttended(rich);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load profile");
    } finally { setLoading(false); }
  }, [client, publicKey, connection]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const loadOrganizedEvents = useCallback(async () => {
    if (!client || !publicKey) return;
    try {
      const events = await client.getAllMyEvents();
      setOrganizedEvents(
        events.map(e => ({ pubkey: e.pubkey.toBase58(), account: e.account })).reverse()
      );
    } catch {}
  }, [client, publicKey]);

  useEffect(() => { loadOrganizedEvents(); }, [loadOrganizedEvents]);

  async function generateOrgQr(code: string) {
    try {
      const QRCode = (await import("qrcode")).default;
      const url = `${window.location.origin}/checkin?code=${code}`;
      const dataUrl = await QRCode.toDataURL(url, { width:220, margin:2, color:{ dark:"#000", light:"#fff" } });
      setOrgQrDataUrl(dataUrl);
    } catch {}
  }

  async function handleOrgGoLive(ev: { pubkey: string; account: EventAccount }) {
    if (!client) return;
    setLoading(true); setError(null);
    try {
      await client.startEvent(new PublicKey(ev.pubkey));
      const updated = { ...ev, account: { ...ev.account, status: { live: {} } as any } };
      setOrgQrEvent(updated);
      await generateOrgQr(ev.account.eventCode);
      setSuccess("✓ Event is now LIVE — share the QR below!");
      await loadOrganizedEvents();
    } catch (e: any) { setError(e?.message); }
    finally { setLoading(false); }
  }

  async function handleOrgEnd(ev: { pubkey: string; account: EventAccount }) {
    if (!client) return;
    setLoading(true); setError(null);
    try {
      await client.endEvent(new PublicKey(ev.pubkey));
      setOrgQrEvent(null);
      setSuccess("Event ended.");
      await loadOrganizedEvents();
    } catch (e: any) { setError(e?.message); }
    finally { setLoading(false); }
  }

  async function handleRegister() {
    if (!client || !COMMUNITY_PDA_STR) return;
    setLoading(true); setError(null);
    try {
      const bal = await connection.getBalance(publicKey!);
      if (bal < 10_000_000) {
        setError("Need devnet SOL to register. Get some free at faucet.solana.com");
        setLoading(false); return;
      }
      await client.registerMember(new PublicKey(COMMUNITY_PDA_STR), publicKey!.toBase58().slice(0, 12));
      await loadProfile();
    } catch (e: any) {
      const m = e?.message ?? "";
      if (m.includes("already in use") || m.includes("already initialized")) { await loadProfile(); return; }
      else if (m.includes("rejected") || m.includes("cancelled")) { setError("Transaction cancelled — try again and Approve in Phantom."); }
      else { setError(m || "Registration failed"); }
    } finally { setLoading(false); }
  }

  async function handleClaimNft(rec: AttendedEvent) {
    if (!publicKey) return;
    setClaiming(rec.eventPubkey); setError(null); setSuccess(null);
    try {
      const res = await fetch("/api/mint-nft", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          userWallet:  publicKey.toBase58(),
          eventTitle:  rec.event?.title ?? "Signal Event",
          eventCode:   rec.event?.eventCode ?? "",
          checkedInAt: rec.attendance.checkedInAt.toNumber(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Mint failed");
      setMinted(prev => ({ ...prev, [rec.eventPubkey]: data.mint }));
      setSuccess(`✓ NFT minted for "${rec.event?.title ?? "Signal Event"}"! It's now in your wallet.`);
    } catch (e: any) {
      setError(e?.message ?? "NFT mint failed");
    } finally { setClaiming(null); }
  }

  function tierProgress(tier: MemberTier, events: number) {
    const th: Record<MemberTier,[number,number]> = {
      Initiate:[0,1], Seeker:[1,3], Resident:[3,6], Builder:[6,11], Core:[11,21], Legend:[21,21],
    };
    const next: Record<MemberTier,MemberTier> = {
      Initiate:"Seeker", Seeker:"Resident", Resident:"Builder", Builder:"Core", Core:"Legend", Legend:"Legend",
    };
    const [lo, hi] = th[tier];
    if (tier === "Legend") return { pct:100, label:"MAX TIER" };
    return { pct:Math.min(100, Math.round(((events-lo)/(hi-lo))*100)), label:`${hi-events} events to ${next[tier]}` };
  }

  const tier           = member ? parseTier(member.tier) : null;
  const events         = member ? member.eventsAttended.toNumber() : 0;
  const progress       = tier ? tierProgress(tier, events) : null;
  const mintedCount    = attended.filter(r => r.attendance.nftMint || minted[r.eventPubkey]).length;
  const hackathonCount = attended.filter(r => (r.event as any)?.isHackathon === true).length;
  const streak         = computeStreak(attended);
  const strataScore    = computeStrataScore(attended.length, hackathonCount).score;
  const filteredAttended = activeTab === "hackathon"
    ? attended.filter(r => (r.event as any)?.isHackathon === true)
    : attended;
  const shortAddr = publicKey
    ? `${publicKey.toBase58().slice(0,6)}…${publicKey.toBase58().slice(-4)}`
    : "";

  const dayActivity = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of attended) {
      const d = new Date(r.attendance.checkedInAt.toNumber() * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [attended]);

  const heatmapData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - 51 * 7);
    type DayCell = { dateStr: string; count: number; isFuture: boolean };
    const weeks: { days: DayCell[]; monthLabel: string | null }[] = [];
    const cur = new Date(start);
    for (let w = 0; w < 52; w++) {
      const days: DayCell[] = [];
      let monthLabel: string | null = null;
      for (let d = 0; d < 7; d++) {
        if (cur.getDate() === 1) monthLabel = cur.toLocaleString("default", { month: "short" });
        const dateStr = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,"0")}-${String(cur.getDate()).padStart(2,"0")}`;
        days.push({ dateStr, count: dayActivity[dateStr] ?? 0, isFuture: cur > today });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push({ days, monthLabel });
    }
    return weeks;
  }, [dayActivity]);

  function copyAddr() {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toBase58());
    setCopiedAddr(true); setTimeout(() => setCopiedAddr(false), 2000);
  }
  function copyLink() {
    if (!publicKey) return;
    navigator.clipboard.writeText(`${window.location.origin}/profile/${publicKey.toBase58()}`);
    setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
  }

  // ── Disconnected ──
  if (!connected || !publicKey) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: profileCSS }} />
        <PageBackground />
        <Nav active="profile" />
        <div className="center-wrap">
          <p>Connect your wallet to view your Signal profile.</p>
          <WalletMultiButton />
        </div>
      </>
    );
  }

  // ── Not registered ──
  if (!loading && !member) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: profileCSS }} />
        <PageBackground />
        <Nav active="profile" />
        <div className="page">
          {error && <div className="msg-err">{error}</div>}
          <div className="card register-card">
            <div className="register-title">New to Signal</div>
            <div className="wallet-mono" style={{ marginBottom: "1rem" }}>{shortAddr}</div>
            <p className="register-sub">Register to start building your on-chain reputation. Each event you attend earns you a higher tier.</p>
            {balance !== null && balance < 0.01 ? (
              <a href="https://faucet.solana.com" target="_blank" rel="noreferrer" className="btn-faucet">Get Devnet SOL ↗</a>
            ) : (
              <button className="btn-primary" disabled={loading} onClick={handleRegister}>
                {loading ? "Registering…" : "Register as Member"}
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Full profile ──
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: profileCSS }} />
      <PageBackground />
      <Nav active="profile" />

      <div className="page">

        {/* Notices */}
        {error && (
          <div className="msg-err section">
            {error}
            {error.includes("SOL") && (
              <div style={{ marginTop: ".5rem" }}>
                <a href="https://faucet.solana.com" target="_blank" rel="noreferrer" style={{ color: "#f59e0b" }}>→ faucet.solana.com ↗</a>
              </div>
            )}
          </div>
        )}
        {success && <div className="msg-ok section">{success}</div>}

        {/* ── Profile header ── */}
        {member && tier && (
          <div className="profile-top">

            {/* Left: Identity */}
            <div className="card profile-left">
              <div className="identity-row">
                <div className="avatar">{member.username.charAt(0).toUpperCase()}</div>
                <div className="identity-body">
                  <div className="identity-name">
                    @{member.username}
                    <span className="tier-badge">
                      {SCORE_TIER_ICON[tier as keyof typeof SCORE_TIER_ICON] ?? "◦"} {tier}
                    </span>
                  </div>
                  <div className="wallet-row">
                    <span className="wallet-mono">{shortAddr}</span>
                    <button
                      className={`copy-icon${copiedAddr ? " did-copy" : ""}`}
                      onClick={copyAddr} title="Copy address"
                    >
                      {copiedAddr ? "✓" : "⎘"}
                    </button>
                  </div>
                </div>
                {balance !== null && (
                  <span className={`sol-chip ${balance < 0.01 ? "sol-low" : "sol-ok"}`}>
                    {balance.toFixed(3)} SOL{balance < 0.01 ? " ⚠" : ""}
                  </span>
                )}
              </div>

              <div className="identity-actions">
                <button
                  className={`btn-secondary${copiedLink ? " did-copy" : ""}`}
                  onClick={copyLink}
                >
                  {copiedLink ? "✓ Copied!" : "⬡ Copy profile link"}
                </button>
                <a href={`/profile/${publicKey.toBase58()}`} className="btn-secondary">
                  Public view ↗
                </a>
              </div>

              <div className="inline-stats">
                {[
                  { val: events,        lbl: "Events" },
                  { val: hackathonCount, lbl: "Hackathons" },
                  { val: streak,        lbl: "Streak" },
                  { val: mintedCount,   lbl: "NFTs" },
                ].map(({ val, lbl }) => (
                  <div key={lbl} className="inline-stat">
                    <div className="inline-stat-val">{val}</div>
                    <div className="inline-stat-lbl">{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Score */}
            <div className="card profile-right" style={{ padding: "2rem", gap: ".75rem" }}>
              <div className="eyebrow">Signal Score</div>
              <div className="score-num">{loading ? "…" : strataScore.toLocaleString()}</div>
              <span className="tier-badge">
                {SCORE_TIER_ICON[tier as keyof typeof SCORE_TIER_ICON] ?? "◦"} {tier} · {TIER_NUM[tier]}
              </span>
              {progress && (
                <div className="prog-wrap" style={{ marginTop: ".5rem" }}>
                  <div className="prog-track">
                    <div className="prog-fill" style={{ width: `${progress.pct}%` }} />
                  </div>
                  <div className="prog-label">{progress.label}</div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Activity heatmap ── */}
        {member && (
          <div className="section heatmap">
            <div className="eyebrow">Activity</div>
            <div className="card" style={{ overflowX: "auto" }}>
              <div className="heatmap-months-row">
                <div style={{ width: 28, flexShrink: 0 }} />
                <div className="heatmap-weeks-labels">
                  {heatmapData.map((week, wi) => (
                    <div key={wi} className="heatmap-month-cell">{week.monthLabel ?? ""}</div>
                  ))}
                </div>
              </div>
              <div className="heatmap-body-row">
                <div className="heatmap-day-labels">
                  {["","Mon","","Wed","","Fri",""].map((lbl, i) => (
                    <span key={i}>{lbl}</span>
                  ))}
                </div>
                <div className="heatmap-weeks-grid">
                  {heatmapData.map((week, wi) => (
                    <div key={wi} className="heatmap-week">
                      {week.days.map((day, di) => (
                        <div
                          key={di}
                          className={`heatmap-day${day.isFuture ? " future" : ""}`}
                          data-count={Math.min(day.count, 4)}
                          title={day.isFuture ? "" : day.count > 0
                            ? `${day.dateStr}: ${day.count} event${day.count !== 1 ? "s" : ""}`
                            : day.dateStr}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="heatmap-legend">
                <span className="heatmap-legend-label">Less</span>
                {(["#1a1a1a","rgba(255,255,255,.2)","rgba(255,255,255,.4)","rgba(255,255,255,.65)","#ffffff"] as const).map((bg, n) => (
                  <div key={n} className="heatmap-legend-cell" style={{ background: bg }} />
                ))}
                <span className="heatmap-legend-label">More</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Event history ── */}
        {member && (
          <div className="section">
            <div className="eyebrow">Event History</div>
            <div className="card" style={{ padding: 0 }}>
              <div className="tabs" style={{ padding: "0 1.25rem" }}>
                {([
                  { key:"all",       label:"All Events", badge: attended.length },
                  { key:"hackathon", label:"Hackathons", badge: hackathonCount },
                  { key:"organized", label:"Organized",  badge: organizedEvents.length },
                ] as const).map(({ key, label, badge }) => (
                  <button
                    key={key}
                    className={`tab-btn${activeTab === key ? " active" : ""}`}
                    onClick={() => setActiveTab(key)}
                  >
                    {label}
                    {badge > 0 && <span style={{ marginLeft: ".4rem", opacity: .65 }}>({badge})</span>}
                  </button>
                ))}
              </div>

              <div style={{ padding: "0 1.25rem .75rem" }}>
                {activeTab === "organized" ? (
                  organizedEvents.length === 0 ? (
                    <div className="empty-text">
                      No events created yet.{" "}
                      <a href="/organizer" style={{ color: "#e8e8e8" }}>Create one →</a>
                    </div>
                  ) : (
                    organizedEvents.map(ev => {
                      const status   = parseEventStatus(ev.account.status);
                      const isQrOpen = orgQrEvent?.pubkey === ev.pubkey;
                      return (
                        <div key={ev.pubkey} className="org-row" style={{ flexWrap: "wrap" }}>
                          <div className="org-left">
                            <div className="event-name">{ev.account.title}</div>
                            <div className="event-date">
                              {ev.account.location}, {ev.account.country} · {new Date(ev.account.eventDate.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle:"medium" })} · {ev.account.attendeeCount.toNumber()}/{ev.account.capacity.toNumber()} checked in
                            </div>
                          </div>
                          <div className="org-actions">
                            <span className={
                              status === "Live"     ? "org-badge-live" :
                              status === "Upcoming" ? "org-badge-upcoming" : "org-badge-ended"
                            }>{status}</span>
                            {status === "Upcoming" && (
                              <button className="btn-org" disabled={loading} onClick={() => handleOrgGoLive(ev)}>▶ Go Live</button>
                            )}
                            {status === "Live" && (
                              <>
                                <button className="btn-org" onClick={() => {
                                  const next = isQrOpen ? null : ev;
                                  setOrgQrEvent(next);
                                  if (next) generateOrgQr(ev.account.eventCode);
                                }}>
                                  {isQrOpen ? "Hide QR" : "⬡ QR"}
                                </button>
                                <button className="btn-org-danger" disabled={loading} onClick={() => handleOrgEnd(ev)}>End</button>
                              </>
                            )}
                          </div>
                          {isQrOpen && orgQrDataUrl && (
                            <div className="org-qr-panel" style={{ width: "100%" }}>
                              <div className="org-qr-wrap">
                                <img src={orgQrDataUrl} alt="QR" width={200} height={200} />
                              </div>
                              <div
                                className="org-qr-url"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/checkin?code=${ev.account.eventCode}`);
                                  setOrgCopied(true);
                                  setTimeout(() => setOrgCopied(false), 2000);
                                }}
                              >
                                {orgCopied ? "✓ Copied!" : `${window.location.origin}/checkin?code=${ev.account.eventCode}`}
                              </div>
                              <div style={{ display: "flex", gap: ".5rem", justifyContent: "center", flexWrap: "wrap" }}>
                                <a href={`/checkin?code=${ev.account.eventCode}`} target="_blank" rel="noreferrer" className="btn-org">Open Check-In ↗</a>
                                <button className="btn-org" onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = orgQrDataUrl;
                                  a.download = `signal-${ev.account.eventCode}.png`;
                                  a.click();
                                }}>↓ Download QR</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )
                ) : loading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 0" }}>
                    {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 52 }} />)}
                  </div>
                ) : filteredAttended.length === 0 ? (
                  <div className="empty-text">
                    {activeTab === "hackathon"
                      ? "No hackathon events yet."
                      : "No check-ins yet. Scan a QR at any Signal event to get started."}
                  </div>
                ) : (
                  <div className="event-list">
                    {filteredAttended.map(rec => {
                      const mintAddr = rec.attendance.nftMint?.toBase58() ?? minted[rec.eventPubkey];
                      const hasMint  = !!(rec.attendance.nftMint || minted[rec.eventPubkey]);
                      const isHack   = (rec.event as any)?.isHackathon === true;
                      return (
                        <div key={rec.eventPubkey} className="event-row">
                          <div className="event-left">
                            <div className="event-name">{rec.event?.title ?? "Signal Event"}</div>
                            <div className="event-date">
                              {new Date(rec.attendance.checkedInAt.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle:"medium" })}
                              {rec.event && ` · ${rec.event.location}, ${rec.event.country}`}
                            </div>
                          </div>
                          <div className="event-tags">
                            {tier && <span className="tag">{tier}</span>}
                            {isHack && <span className="tag-hackathon"># Hackathon</span>}
                          </div>
                          {hasMint ? (
                            <a
                              href={`https://explorer.solana.com/address/${mintAddr}?cluster=devnet`}
                              target="_blank" rel="noreferrer"
                              className="nft-minted-link"
                            >
                              <div className="nft-thumb">
                                <img src="/nft-badge.svg" alt="NFT" />
                              </div>
                              <span>↗</span>
                            </a>
                          ) : (
                            <button
                              className="btn-claim"
                              onClick={() => handleClaimNft(rec)}
                              disabled={claiming === rec.eventPubkey}
                            >
                              {claiming === rec.eventPubkey ? "…" : "⬡ Claim NFT"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── NFT gallery ── */}
        {mintedCount > 0 && (
          <div className="nft-gallery section">
            <div className="eyebrow">My Signal NFTs</div>
            <div className="nft-grid">
              {attended.filter(r => r.attendance.nftMint || minted[r.eventPubkey]).map(rec => {
                const mintAddr = rec.attendance.nftMint?.toBase58() ?? minted[rec.eventPubkey];
                return (
                  <a
                    key={rec.eventPubkey}
                    href={`https://explorer.solana.com/address/${mintAddr}?cluster=devnet`}
                    target="_blank" rel="noreferrer"
                    className="nft-card"
                  >
                    <div className="nft-square">
                      <img src="/nft-badge.svg" alt={rec.event?.title ?? "NFT"} />
                    </div>
                    <div className="nft-body">
                      <div className="nft-title">{rec.event?.title ?? "Signal Event"}</div>
                      <div className="nft-date2">{new Date(rec.attendance.checkedInAt.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle:"medium" })}</div>
                      <div className="nft-edition">Edition #{rec.attendance.edition.toNumber()}</div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
