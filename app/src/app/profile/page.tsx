"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  StrataClient, parseTier, MemberAccount, EventAccount,
  AttendanceAccount, MemberTier,
  findEventPDA, findAttendancePDA, parseEventStatus,
} from "../../utils/strata-client";
import { computeStrataScore, SCORE_TIER_ICON } from "../../utils/scoring";
import { profileCSS } from "../../styles/profileStyles";
import { Nav } from "../../components/Nav";

const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

interface AttendedEvent {
  eventPubkey: string;
  attendance:  AttendanceAccount;
  event:       EventAccount | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (pure — no new data fetching)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { connection }           = useConnection();
  const wallet                   = useWallet();
  const { publicKey, connected } = wallet;

  // ── All original state (unchanged) ──
  const [client,   setClient]   = useState<StrataClient | null>(null);
  const [member,   setMember]   = useState<MemberAccount | null>(null);
  const [attended, setAttended] = useState<AttendedEvent[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);
  const [balance,  setBalance]  = useState<number | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [minted,   setMinted]   = useState<Record<string, string>>({});

  // ── UI-only state ──
  const [activeTab,    setActiveTab]    = useState<"all" | "hackathon" | "organized">("all");
  const [copiedAddr,   setCopiedAddr]   = useState(false);
  const [copiedLink,   setCopiedLink]   = useState(false);

  // ── Organized events ──
  const [organizedEvents, setOrganizedEvents] = useState<{ pubkey: string; account: EventAccount }[]>([]);
  const [orgQrEvent,      setOrgQrEvent]      = useState<{ pubkey: string; account: EventAccount } | null>(null);
  const [orgQrDataUrl,    setOrgQrDataUrl]    = useState("");
  const [orgCopied,       setOrgCopied]       = useState(false);

  // ── All original effects & callbacks (unchanged) ──
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
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / 1e9);
      const community = new PublicKey(COMMUNITY_PDA_STR);

      let mem: MemberAccount | null = null;
      try { mem = await client.getMember(community, publicKey); } catch {}
      setMember(mem);

      const commInfo = await connection.getAccountInfo(community);
      if (commInfo) {
        const eventCountOffset = 8 + 32 + (4 + 64) + (4 + 256) + (4 + 64) + 8;
        const eventCount = Number(commInfo.data.readBigUInt64LE(eventCountOffset));

        const eventPDAs = Array.from({ length: eventCount }, (_, i) => findEventPDA(community, i)[0]);
        const attendancePDAs = eventPDAs.map(ep => findAttendancePDA(ep, publicKey)[0]);

        const chunk = async (arr: PublicKey[]) => {
          const results = [];
          for (let i = 0; i < arr.length; i += 100) {
            const batch = await connection.getMultipleAccountsInfo(arr.slice(i, i + 100));
            results.push(...batch);
          }
          return results;
        };

        const [, attendanceInfos] = await Promise.all([
          chunk(eventPDAs),
          chunk(attendancePDAs),
        ]);

        const rich: AttendedEvent[] = [];
        for (let i = 0; i < eventCount; i++) {
          if (!attendanceInfos[i]) continue;
          let event: EventAccount | null = null;
          let attendance: AttendanceAccount | null = null;
          try { event = await client.getEvent(eventPDAs[i]); } catch {}
          try { attendance = await (client as any).program.account.attendance.fetch(attendancePDAs[i]); } catch {}
          if (attendance) {
            rich.push({ eventPubkey: eventPDAs[i].toBase58(), attendance, event });
          }
        }
        rich.sort((a, b) => b.attendance.checkedInAt.toNumber() - a.attendance.checkedInAt.toNumber());
        setAttended(rich);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load profile");
    } finally { setLoading(false); }
  }, [client, publicKey, connection]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const loadOrganizedEvents = useCallback(async () => {
    if (!client || !publicKey || !COMMUNITY_PDA_STR) return;
    try {
      const community = new PublicKey(COMMUNITY_PDA_STR);
      const commAcc   = await client.getCommunity(community);
      const count     = commAcc.eventCount.toNumber();
      const loaded: { pubkey: string; account: EventAccount }[] = [];
      for (let i = 0; i < count; i++) {
        const [ePDA] = findEventPDA(community, i);
        try {
          const acc = await client.getEvent(ePDA);
          if (acc.organizer.toBase58() === publicKey.toBase58())
            loaded.push({ pubkey: ePDA.toBase58(), account: acc });
        } catch {}
      }
      setOrganizedEvents(loaded.reverse());
    } catch {}
  }, [client, publicKey]);

  useEffect(() => { loadOrganizedEvents(); }, [loadOrganizedEvents]);

  async function generateOrgQr(code: string) {
    try {
      const QRCode = (await import("qrcode")).default;
      const base   = window.location.origin;
      const url    = `${base}/checkin?code=${code}`;
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
          eventTitle:  rec.event?.title ?? "Strata Event",
          eventCode:   rec.event?.eventCode ?? "",
          checkedInAt: rec.attendance.checkedInAt.toNumber(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Mint failed");
      setMinted(prev => ({ ...prev, [rec.eventPubkey]: data.mint }));
      setSuccess(`✓ NFT minted for "${rec.event?.title ?? "Strata Event"}"! It's now in your wallet.`);
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

  // ── Derived values (pure computation, no fetching) ──
  const tier       = member ? parseTier(member.tier) : null;
  const events     = member ? member.eventsAttended.toNumber() : 0;
  const progress   = tier ? tierProgress(tier, events) : null;
  const mintedCount = attended.filter(r => r.attendance.nftMint || minted[r.eventPubkey]).length;

  const hackathonCount  = attended.filter(r => (r.event as any)?.isHackathon === true).length;
  const streak          = computeStreak(attended);
  const strataScore     = computeStrataScore(attended.length, hackathonCount).score;
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
        if (cur.getDate() === 1) {
          monthLabel = cur.toLocaleString("default", { month: "short" });
        }
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
        <Nav active="profile" />
        <div className="center-wrap">
          <p>Connect your wallet to view your Strata profile.</p>
          <WalletMultiButton />
        </div>
      </>
    );
  }

  // ── Loading / not registered ──
  if (!loading && !member) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: profileCSS }} />
        <Nav active="profile" />
        <div className="page">
          {error && <div className="msg-err">{error}</div>}
          <div className="card register-card">
            <div className="register-title">New to Strata</div>
            <div className="wallet-row" style={{ margin:"6px 0 16px" }}>
              <span className="wallet-mono">{shortAddr}</span>
            </div>
            <p className="register-sub">
              Register to start building your on-chain reputation. Each event you attend earns you a higher tier.
            </p>
            {balance !== null && balance < 0.01 ? (
              <a href="https://faucet.solana.com" target="_blank" rel="noreferrer" className="btn-faucet">
                Get Devnet SOL ↗
              </a>
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
      <Nav active="profile" />

      <div className="page">
        {error && (
          <div className="msg-err">
            {error}
            {error.includes("SOL") && (
              <div style={{ marginTop:6 }}>
                <a href="https://faucet.solana.com" target="_blank" rel="noreferrer" style={{ color:"#f59e0b" }}>→ faucet.solana.com ↗</a>
              </div>
            )}
          </div>
        )}
        {success && <div className="msg-ok">{success}</div>}

        {/* ── 1+2+3. Profile top: identity (left) + score & stats (right) ── */}
        {member && tier && (
          <div className="profile-top">

            {/* Left: Address + Profile */}
            <div className="card profile-left">
              <div className="identity-row">
                <div className="avatar">
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div className="identity-body">
                  <div className="identity-name">
                    @{member.username}
                    <span className="tier-badge">
                      {SCORE_TIER_ICON[tier as keyof typeof SCORE_TIER_ICON] ?? "◦"} {tier} · Tier {TIER_NUM[tier]}
                    </span>
                  </div>
                  <div className="wallet-row">
                    <span className="wallet-mono">{shortAddr}</span>
                    <button
                      className={`copy-icon${copiedAddr ? " did-copy" : ""}`}
                      onClick={copyAddr}
                      title="Copy wallet address"
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
                <a
                  href={`/profile/${publicKey.toBase58()}`}
                  className="btn-secondary"
                  style={{ textDecoration:"none" }}
                >
                  Public view ↗
                </a>
              </div>
              <div className="inline-stats">
                <div className="inline-stat">
                  <span className="inline-stat-val">{events}</span>
                  <span className="inline-stat-lbl">Events</span>
                </div>
                <div className="inline-stat">
                  <span className="inline-stat-val" style={{ color: hackathonCount > 0 ? "#c084fc" : undefined }}>{hackathonCount}</span>
                  <span className="inline-stat-lbl">Hackathons</span>
                </div>
                <div className="inline-stat">
                  <span className="inline-stat-val" style={{ color: streak > 0 ? "#1D9E75" : undefined }}>{streak}</span>
                  <span className="inline-stat-lbl">Streak</span>
                </div>
                <div className="inline-stat">
                  <span className="inline-stat-val" style={{ color: mintedCount > 0 ? "#1D9E75" : undefined }}>{mintedCount}</span>
                  <span className="inline-stat-lbl">NFTs</span>
                </div>
              </div>
            </div>

            {/* Right: Strata Score + Stats */}
            <div className="card profile-right">
              <div className="score-num">{loading ? "…" : strataScore.toLocaleString()}</div>
              <div className="score-label">Strata Score</div>
              {progress && (
                <>
                  <div className="prog-wrap">
                    <div className="prog-track">
                      <div className="prog-fill" style={{ width:`${progress.pct}%` }} />
                    </div>
                  </div>
                  <div className="prog-label">{progress.label}</div>
                </>
              )}
            </div>

          </div>
        )}

        {/* ── 4. Activity heatmap (GitHub-style daily grid) ── */}
        {member && (
          <div className="heatmap section">
            <div className="eyebrow">Activity</div>
            <div className="card" style={{ padding:"16px 20px 14px", overflowX:"auto" }}>
              {/* Month labels row */}
              <div className="heatmap-months-row">
                <div style={{ width:28, flexShrink:0 }} />
                <div className="heatmap-weeks-labels">
                  {heatmapData.map((week, wi) => (
                    <div key={wi} className="heatmap-month-cell">
                      {week.monthLabel ?? ""}
                    </div>
                  ))}
                </div>
              </div>
              {/* Day labels + week grid */}
              <div className="heatmap-body-row">
                <div className="heatmap-day-labels">
                  {["", "Mon", "", "Wed", "", "Fri", ""].map((lbl, i) => (
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
                          title={day.isFuture ? "" : day.count > 0 ? `${day.dateStr}: ${day.count} event${day.count !== 1 ? "s" : ""}` : day.dateStr}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {/* Legend */}
              <div className="heatmap-legend">
                <span className="heatmap-legend-label">Less</span>
                {([
                  { bg:"#161616", border:"#1f1f1f" },
                  { bg:"#1D9E7530", border:"#1D9E7540" },
                  { bg:"#1D9E7555", border:"#1D9E7565" },
                  { bg:"#1D9E7580", border:"#1D9E7590" },
                  { bg:"#1D9E75",   border:"#1D9E75"   },
                ] as const).map((s, n) => (
                  <div key={n} className="heatmap-legend-cell" style={{ background:s.bg, border:`0.5px solid ${s.border}` }} />
                ))}
                <span className="heatmap-legend-label">More</span>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. Event history ── */}
        {member && (
          <div className="section">
            <div className="eyebrow">Event History</div>
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              {/* Tabs */}
              <div className="tabs" style={{ padding:"0 16px" }}>
                <button
                  className={`tab-btn${activeTab === "all" ? " active" : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  All Events
                  {attended.length > 0 && (
                    <span style={{ marginLeft:5, fontSize:11, color:"#555" }}>({attended.length})</span>
                  )}
                </button>
                <button
                  className={`tab-btn${activeTab === "hackathon" ? " active" : ""}`}
                  onClick={() => setActiveTab("hackathon")}
                >
                  Hackathons
                  {hackathonCount > 0 && (
                    <span style={{ marginLeft:5, fontSize:11, color:"#c084fc" }}>({hackathonCount})</span>
                  )}
                </button>
                <button
                  className={`tab-btn${activeTab === "organized" ? " active" : ""}`}
                  onClick={() => setActiveTab("organized")}
                >
                  Organized
                  {organizedEvents.length > 0 && (
                    <span style={{ marginLeft:5, fontSize:11, color:"#555" }}>({organizedEvents.length})</span>
                  )}
                </button>
              </div>

              {/* Event list */}
              <div style={{ padding:"0 16px 8px" }}>
                {activeTab === "organized" ? (
                  <div style={{ padding:"0 0 8px" }}>
                    {organizedEvents.length === 0 ? (
                      <div className="empty-text">No events created yet. <a href="/organizer" style={{ color:"#1D9E75" }}>Create one →</a></div>
                    ) : (
                      <div className="event-list">
                        {organizedEvents.map(ev => {
                          const status  = parseEventStatus(ev.account.status);
                          const isQrOpen = orgQrEvent?.pubkey === ev.pubkey;
                          return (
                            <div key={ev.pubkey}>
                              <div className="org-row">
                                <div className="org-left">
                                  <div className="event-name">{ev.account.title}</div>
                                  <div className="event-date">
                                    {ev.account.location}, {ev.account.country} ·{" "}
                                    {new Date(ev.account.eventDate.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle:"medium" })} ·{" "}
                                    {ev.account.attendeeCount.toNumber()}/{ev.account.capacity.toNumber()} checked in
                                  </div>
                                </div>
                                <div className="org-actions">
                                  <span className={`org-badge-${status.toLowerCase()}`}>{status}</span>
                                  {status === "Upcoming" && (
                                    <button className="btn-org" disabled={loading} onClick={() => handleOrgGoLive(ev)}>▶ Go Live</button>
                                  )}
                                  {status === "Live" && (<>
                                    <button className="btn-org" onClick={() => {
                                      const next = isQrOpen ? null : ev;
                                      setOrgQrEvent(next);
                                      if (next) generateOrgQr(ev.account.eventCode);
                                    }}>
                                      {isQrOpen ? "Hide QR" : "⬡ QR"}
                                    </button>
                                    <button className="btn-org-danger" disabled={loading} onClick={() => handleOrgEnd(ev)}>End</button>
                                  </>)}
                                </div>
                              </div>
                              {isQrOpen && orgQrDataUrl && (
                                <div className="org-qr-panel">
                                  <div className="org-qr-wrap">
                                    <img src={orgQrDataUrl} alt="QR" width={200} height={200} style={{ display:"block", borderRadius:4 }} />
                                  </div>
                                  <div
                                    className="org-qr-url"
                                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/checkin?code=${ev.account.eventCode}`); setOrgCopied(true); setTimeout(() => setOrgCopied(false), 2000); }}
                                    title="Click to copy"
                                  >
                                    {orgCopied ? "✓ Copied!" : `${window.location.origin}/checkin?code=${ev.account.eventCode}`}
                                  </div>
                                  <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                                    <a href={`/checkin?code=${ev.account.eventCode}`} target="_blank" rel="noreferrer" className="btn-org">Open Check-In ↗</a>
                                    <button className="btn-org" onClick={() => {
                                      const a = document.createElement("a");
                                      a.href = orgQrDataUrl;
                                      a.download = `strata-${ev.account.eventCode}.png`;
                                      a.click();
                                    }}>↓ Download QR</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : loading ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:12, padding:"12px 0" }}>
                    {[1,2,3].map(i => (
                      <div key={i} className="shimmer" style={{ height:52, borderRadius:8 }} />
                    ))}
                  </div>
                ) : filteredAttended.length === 0 ? (
                  <div className="empty-text">
                    {activeTab === "hackathon"
                      ? "No hackathon events yet."
                      : "No check-ins yet. Scan a QR at any Strata event to get started."}
                  </div>
                ) : (
                  <div className="event-list">
                    {filteredAttended.map(rec => {
                      const mintAddr = rec.attendance.nftMint?.toBase58() ?? minted[rec.eventPubkey];
                      const hasMint  = !!(rec.attendance.nftMint || minted[rec.eventPubkey]);
                      const isHack   = (rec.event as any)?.isHackathon === true;
                      return (
                        <div className="event-row" key={rec.eventPubkey}>
                          <div className="event-left">
                            <div className="event-name">{rec.event?.title ?? "Strata Event"}</div>
                            <div className="event-date">
                              {new Date(rec.attendance.checkedInAt.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle:"medium" })}
                              {rec.event && ` · ${rec.event.location}, ${rec.event.country}`}
                            </div>
                          </div>
                          <div className="event-tags">
                            {tier && (
                              <span className="tag">{tier}</span>
                            )}
                            {isHack && <span className="tag-hackathon"># Hackathon</span>}
                          </div>
                          {hasMint ? (
                            <a
                              className="nft-minted-link"
                              href={`https://explorer.solana.com/address/${mintAddr}?cluster=devnet`}
                              target="_blank" rel="noreferrer"
                            >
                              <div className="nft-thumb">
                                <img src="/nft-badge.svg" alt="NFT" />
                              </div>
                              ↗
                            </a>
                          ) : (
                            <div className="nft-thumb-placeholder">
                              <button
                                className="btn-claim"
                                onClick={() => handleClaimNft(rec)}
                                disabled={claiming === rec.eventPubkey}
                              >
                                {claiming === rec.eventPubkey
                                  ? <span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>◈</span>
                                  : "⬡ Claim NFT"}
                              </button>
                            </div>
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

        {/* ── 6. NFT gallery ── */}
        {mintedCount > 0 && (
          <div className="nft-gallery">
            <div className="eyebrow">My Strata NFTs</div>
            <div className="nft-grid">
              {attended
                .filter(r => r.attendance.nftMint || minted[r.eventPubkey])
                .map(rec => {
                  const mintAddr = rec.attendance.nftMint?.toBase58() ?? minted[rec.eventPubkey];
                  return (
                    <a
                      key={rec.eventPubkey}
                      className="nft-card"
                      href={`https://explorer.solana.com/address/${mintAddr}?cluster=devnet`}
                      target="_blank" rel="noreferrer"
                    >
                      <div className="nft-square">
                        <img src="/nft-badge.svg" alt={rec.event?.title ?? "Strata NFT"} />
                      </div>
                      <div className="nft-body">
                        <div className="nft-title">{rec.event?.title ?? "Strata Event"}</div>
                        <div className="nft-date2">
                          {new Date(rec.attendance.checkedInAt.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle:"medium" })}
                        </div>
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
