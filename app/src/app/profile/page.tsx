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

const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

// Minimal CSS: only what Tailwind can't do (data-attr selectors + shimmer animation)
const PROFILE_CSS = `
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes glow    { 0%,100%{box-shadow:0 0 0 0 #1D9E7500} 50%{box-shadow:0 0 14px 2px #1D9E7530} }
  .shimmer { background:linear-gradient(90deg,#111 25%,#1a1a1a 50%,#111 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
  .claim-glow { animation:glow 3s ease-in-out infinite; }
  .claim-glow:hover,.claim-glow:disabled { animation:none; }
  .hm-day[data-count="1"]{ background:#1D9E7530; border-color:#1D9E7540; }
  .hm-day[data-count="2"]{ background:#1D9E7555; border-color:#1D9E7565; }
  .hm-day[data-count="3"]{ background:#1D9E7580; border-color:#1D9E7590; }
  .hm-day[data-count="4"]{ background:#1D9E75;   border-color:#1D9E75;   }
  .hm-day:not(.hm-future):hover{ border-color:#555; }
  .hm-day.hm-future{ opacity:0; pointer-events:none; }
`;

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

// Reusable Tailwind card class
const CARD = "rounded-xl border border-white/[0.10] bg-white/[0.04]";
const SG   = { fontFamily: "'Space Grotesk', sans-serif" };
const SM   = { fontFamily: "'Space Mono', monospace" };

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

  const tier          = member ? parseTier(member.tier) : null;
  const events        = member ? member.eventsAttended.toNumber() : 0;
  const progress      = tier ? tierProgress(tier, events) : null;
  const mintedCount   = attended.filter(r => r.attendance.nftMint || minted[r.eventPubkey]).length;
  const hackathonCount = attended.filter(r => (r.event as any)?.isHackathon === true).length;
  const streak        = computeStreak(attended);
  const strataScore   = computeStrataScore(attended.length, hackathonCount).score;
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
        <style dangerouslySetInnerHTML={{ __html: PROFILE_CSS }} />
        <Nav active="profile" />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-[14px] text-white/40">Connect your wallet to view your Strata profile.</p>
          <WalletMultiButton />
        </div>
      </>
    );
  }

  // ── Not registered ──
  if (!loading && !member) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: PROFILE_CSS }} />
        <Nav active="profile" />
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20">
          {error && (
            <div className="mb-6 rounded-xl bg-red-950/50 border border-red-900/60 text-red-400 px-4 py-3 text-sm">{error}</div>
          )}
          <div className={`${CARD} p-6`}>
            <div className="text-[16px] font-semibold text-white mb-1.5" style={SG}>New to Strata</div>
            <div className="font-mono text-[11px] text-white/40 mb-4" style={SM}>{shortAddr}</div>
            <p className="text-[13px] text-white/40 leading-relaxed mb-5">
              Register to start building your on-chain reputation. Each event you attend earns you a higher tier.
            </p>
            {balance !== null && balance < 0.01 ? (
              <a href="https://faucet.solana.com" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-amber-500 border border-amber-500/30 px-4 py-2 rounded-lg text-[13px] font-semibold no-underline hover:bg-amber-500/10 transition-colors"
                style={SG}>
                Get Devnet SOL ↗
              </a>
            ) : (
              <button
                className="inline-flex items-center gap-1.5 bg-[#1D9E75] text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#18876a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={SG} disabled={loading} onClick={handleRegister}>
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
      <style dangerouslySetInnerHTML={{ __html: PROFILE_CSS }} />
      <Nav active="profile" />

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-20">

        {/* Notices */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-950/50 border border-red-900/60 text-red-400 px-4 py-3 text-sm">
            {error}
            {error.includes("SOL") && (
              <div className="mt-1.5">
                <a href="https://faucet.solana.com" target="_blank" rel="noreferrer" className="text-amber-500">→ faucet.solana.com ↗</a>
              </div>
            )}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-xl bg-[#1D9E75]/10 border border-[#1D9E75]/30 text-[#1D9E75] px-4 py-3 text-sm">{success}</div>
        )}

        {/* ── Profile header: 2-column grid ── */}
        {member && tier && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Left: Identity */}
            <div className={`${CARD} p-6`}>
              {/* Avatar + name row */}
              <div className="flex items-start gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-full bg-[#1D9E75]/10 border border-[#1D9E75]/25 flex items-center justify-center text-[#1D9E75] font-bold text-base shrink-0" style={SG}>
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-white text-[15px]" style={SG}>@{member.username}</span>
                    <span className="inline-flex items-center gap-1 bg-[#1D9E75]/10 text-[#1D9E75] rounded-full text-[11px] font-semibold px-2.5 py-0.5 border border-[#1D9E75]/25" style={SG}>
                      {SCORE_TIER_ICON[tier as keyof typeof SCORE_TIER_ICON] ?? "◦"} {tier} · {TIER_NUM[tier]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/40" style={SM}>{shortAddr}</span>
                    <button
                      className={`text-[12px] leading-none transition-colors ${copiedAddr ? "text-[#1D9E75]" : "text-white/30 hover:text-white"}`}
                      style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}
                      onClick={copyAddr} title="Copy address"
                    >
                      {copiedAddr ? "✓" : "⎘"}
                    </button>
                  </div>
                </div>
                {balance !== null && (
                  <span className={`shrink-0 inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                    balance < 0.01
                      ? "text-red-400 bg-red-950/30 border-red-900/50"
                      : "text-[#1D9E75] bg-[#1D9E75]/10 border-[#1D9E75]/25"
                  }`}>
                    {balance.toFixed(3)} SOL{balance < 0.01 ? " ⚠" : ""}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap mb-5">
                <button
                  className={`text-[12px] font-medium px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    copiedLink ? "border-[#1D9E75]/40 text-[#1D9E75]" : "border-white/10 text-white/50 hover:border-white/20 hover:text-white"
                  }`}
                  style={{ ...SG, background:"transparent" }}
                  onClick={copyLink}
                >
                  {copiedLink ? "✓ Copied!" : "⬡ Copy profile link"}
                </button>
                <a
                  href={`/profile/${publicKey.toBase58()}`}
                  className="text-[12px] font-medium px-3.5 py-1.5 rounded-lg border border-white/10 text-white/50 hover:border-white/20 hover:text-white transition-all no-underline"
                  style={SG}
                >
                  Public view ↗
                </a>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3 pt-5 border-t border-white/[0.06]">
                {[
                  { val: events,        lbl: "Events",     color: undefined },
                  { val: hackathonCount,lbl: "Hackathons", color: hackathonCount > 0 ? "#c084fc" : undefined },
                  { val: streak,        lbl: "Streak",     color: streak > 0        ? "#1D9E75" : undefined },
                  { val: mintedCount,   lbl: "NFTs",       color: mintedCount > 0   ? "#1D9E75" : undefined },
                ].map(({ val, lbl, color }) => (
                  <div key={lbl}>
                    <div className="text-[20px] font-semibold leading-none mb-1" style={{ ...SG, color: color ?? "#fff" }}>{val}</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-[0.08em]">{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Score */}
            <div className={`${CARD} p-6 flex flex-col items-center justify-center text-center`}>
              <div className="text-[54px] font-medium text-[#1D9E75] leading-none tracking-tight mb-2" style={SG}>
                {loading ? "…" : strataScore.toLocaleString()}
              </div>
              <div className="text-[11px] text-white/30 uppercase tracking-[0.08em] mb-5">Strata Score</div>
              {progress && (
                <>
                  <div className="w-full max-w-[260px] mb-2">
                    <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1D9E75] rounded-full transition-[width] duration-700" style={{ width:`${progress.pct}%` }} />
                    </div>
                  </div>
                  <div className="text-[11px] text-white/30">{progress.label}</div>
                </>
              )}
            </div>

          </div>
        )}

        {/* ── Activity heatmap ── */}
        {member && (
          <div className="mb-6">
            <div className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.1em] mb-3">Activity</div>
            <div className={`${CARD} p-6 overflow-x-auto`}>
              {/* Month labels */}
              <div className="flex mb-[3px]">
                <div style={{ width:28, flexShrink:0 }} />
                <div className="flex">
                  {heatmapData.map((week, wi) => (
                    <div key={wi} style={{ width:13, fontSize:9, color:"#555", ...SM, flexShrink:0, overflow:"visible", whiteSpace:"nowrap" }}>
                      {week.monthLabel ?? ""}
                    </div>
                  ))}
                </div>
              </div>
              {/* Grid */}
              <div className="flex gap-1.5 items-start">
                <div className="flex flex-col gap-0.5 shrink-0 pt-px" style={{ width:22 }}>
                  {["","Mon","","Wed","","Fri",""].map((lbl, i) => (
                    <span key={i} style={{ height:11, fontSize:9, color:"#444", ...SM, display:"flex", alignItems:"center", lineHeight:1 }}>{lbl}</span>
                  ))}
                </div>
                <div className="flex gap-0.5 overflow-x-auto">
                  {heatmapData.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-0.5 shrink-0">
                      {week.days.map((day, di) => (
                        <div
                          key={di}
                          className={`hm-day${day.isFuture ? " hm-future" : ""}`}
                          data-count={Math.min(day.count, 4)}
                          title={day.isFuture ? "" : day.count > 0 ? `${day.dateStr}: ${day.count} event${day.count !== 1 ? "s" : ""}` : day.dateStr}
                          style={{ width:11, height:11, borderRadius:2, flexShrink:0, background:"#161616", border:"0.5px solid #1f1f1f", cursor:"default" }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-1 mt-2 justify-end">
                <span style={{ fontSize:9, color:"#444", ...SM }}>Less</span>
                {(["#161616","#1D9E7530","#1D9E7555","#1D9E7580","#1D9E75"] as const).map((bg, n) => (
                  <div key={n} style={{ width:10, height:10, borderRadius:2, background:bg, border:`0.5px solid ${n===0?"#1f1f1f":"#1D9E7560"}` }} />
                ))}
                <span style={{ fontSize:9, color:"#444", ...SM }}>More</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Event history ── */}
        {member && (
          <div className="mb-6">
            <div className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.1em] mb-3">Event History</div>
            <div className={`${CARD} overflow-hidden`}>
              {/* Tabs */}
              <div className="flex border-b border-white/[0.05] px-6">
                {([
                  { key:"all",       label:"All Events",  badge: attended.length,        badgeColor:"text-white/30" },
                  { key:"hackathon", label:"Hackathons",  badge: hackathonCount,          badgeColor:"text-purple-400" },
                  { key:"organized", label:"Organized",   badge: organizedEvents.length,  badgeColor:"text-white/30" },
                ] as const).map(({ key, label, badge, badgeColor }) => (
                  <button
                    key={key}
                    className={`py-3.5 mr-5 text-[13px] font-medium border-b-[1.5px] -mb-px transition-colors cursor-pointer ${
                      activeTab === key ? "text-white border-[#1D9E75]" : "text-white/30 border-transparent hover:text-white/60"
                    }`}
                    style={{ background:"none", fontFamily:"'Inter',sans-serif" }}
                    onClick={() => setActiveTab(key)}
                  >
                    {label}
                    {badge > 0 && <span className={`ml-1.5 text-[11px] ${badgeColor}`}>({badge})</span>}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="px-6 pb-2">
                {activeTab === "organized" ? (
                  organizedEvents.length === 0 ? (
                    <div className="py-6 text-center text-[13px] text-white/30">
                      No events created yet.{" "}
                      <a href="/organizer" className="text-[#1D9E75] no-underline hover:underline">Create one →</a>
                    </div>
                  ) : (
                    <>
                      {organizedEvents.map(ev => {
                        const status   = parseEventStatus(ev.account.status);
                        const isQrOpen = orgQrEvent?.pubkey === ev.pubkey;
                        return (
                          <div key={ev.pubkey} className="border-b border-white/[0.04] last:border-0">
                            <div className="flex items-center gap-3 py-3.5 flex-wrap">
                              <div className="flex-1 min-w-0">
                                <div className="text-[14px] text-white font-medium truncate mb-0.5" style={SG}>{ev.account.title}</div>
                                <div className="text-[12px] text-white/30">
                                  {ev.account.location}, {ev.account.country} · {new Date(ev.account.eventDate.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle:"medium" })} · {ev.account.attendeeCount.toNumber()}/{ev.account.capacity.toNumber()} checked in
                                </div>
                              </div>
                              <div className="flex gap-2 items-center shrink-0 flex-wrap">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  status === "Live"     ? "text-[#1D9E75] bg-[#1D9E75]/10 border-[#1D9E75]/30" :
                                  status === "Upcoming" ? "text-amber-400 bg-amber-400/10 border-amber-400/30" :
                                                          "text-white/30 bg-white/[0.03] border-white/[0.07]"
                                }`}>{status}</span>
                                {status === "Upcoming" && (
                                  <button className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/30 hover:bg-[#1D9E75]/20 transition-colors disabled:opacity-40 cursor-pointer" style={SG} disabled={loading} onClick={() => handleOrgGoLive(ev)}>▶ Go Live</button>
                                )}
                                {status === "Live" && (
                                  <>
                                    <button className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/30 hover:bg-[#1D9E75]/20 transition-colors cursor-pointer" style={SG}
                                      onClick={() => { const next = isQrOpen ? null : ev; setOrgQrEvent(next); if (next) generateOrgQr(ev.account.eventCode); }}>
                                      {isQrOpen ? "Hide QR" : "⬡ QR"}
                                    </button>
                                    <button className="text-[11px] font-semibold px-2.5 py-1 rounded-md text-red-400 border border-red-900/50 hover:bg-red-950/30 transition-colors disabled:opacity-40 cursor-pointer" style={{ ...SG, background:"transparent" }} disabled={loading} onClick={() => handleOrgEnd(ev)}>End</button>
                                  </>
                                )}
                              </div>
                            </div>
                            {isQrOpen && orgQrDataUrl && (
                              <div className="mb-4 rounded-xl bg-[#0f0f0f] border border-[#1D9E75]/20 p-5 text-center">
                                <div className="inline-block p-3 bg-white rounded-xl mb-3">
                                  <img src={orgQrDataUrl} alt="QR" width={200} height={200} className="block rounded" />
                                </div>
                                <div
                                  className="font-mono text-[10px] text-white/30 break-all bg-[#0a0a0a] border border-white/[0.07] rounded-md px-3 py-2 mb-3 cursor-pointer hover:text-[#1D9E75] transition-colors block"
                                  style={SM}
                                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/checkin?code=${ev.account.eventCode}`); setOrgCopied(true); setTimeout(() => setOrgCopied(false), 2000); }}
                                >
                                  {orgCopied ? "✓ Copied!" : `${window.location.origin}/checkin?code=${ev.account.eventCode}`}
                                </div>
                                <div className="flex gap-2 justify-center flex-wrap">
                                  <a href={`/checkin?code=${ev.account.eventCode}`} target="_blank" rel="noreferrer" className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/30 hover:bg-[#1D9E75]/20 no-underline transition-colors" style={SG}>Open Check-In ↗</a>
                                  <button className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/30 hover:bg-[#1D9E75]/20 transition-colors cursor-pointer" style={SG}
                                    onClick={() => { const a = document.createElement("a"); a.href = orgQrDataUrl; a.download = `strata-${ev.account.eventCode}.png`; a.click(); }}>↓ Download QR</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )
                ) : loading ? (
                  <div className="flex flex-col gap-3 py-3">
                    {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height:52 }} />)}
                  </div>
                ) : filteredAttended.length === 0 ? (
                  <div className="py-6 text-center text-[13px] text-white/30">
                    {activeTab === "hackathon" ? "No hackathon events yet." : "No check-ins yet. Scan a QR at any Strata event to get started."}
                  </div>
                ) : (
                  <>
                    {filteredAttended.map(rec => {
                      const mintAddr = rec.attendance.nftMint?.toBase58() ?? minted[rec.eventPubkey];
                      const hasMint  = !!(rec.attendance.nftMint || minted[rec.eventPubkey]);
                      const isHack   = (rec.event as any)?.isHackathon === true;
                      return (
                        <div key={rec.eventPubkey} className="flex items-center gap-3 py-3.5 border-b border-white/[0.04] last:border-0 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] text-white font-medium truncate mb-0.5" style={SG}>{rec.event?.title ?? "Strata Event"}</div>
                            <div className="text-[12px] text-white/30">
                              {new Date(rec.attendance.checkedInAt.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle:"medium" })}
                              {rec.event && ` · ${rec.event.location}, ${rec.event.country}`}
                            </div>
                          </div>
                          <div className="flex gap-1.5 items-center shrink-0 flex-wrap">
                            {tier && <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/25" style={SG}>{tier}</span>}
                            {isHack && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400"># Hackathon</span>}
                          </div>
                          {hasMint ? (
                            <a href={`https://explorer.solana.com/address/${mintAddr}?cluster=devnet`} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-[#1D9E75] no-underline hover:text-white transition-colors shrink-0">
                              <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] overflow-hidden shrink-0">
                                <img src="/nft-badge.svg" alt="NFT" className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[11px] font-semibold">↗</span>
                            </a>
                          ) : (
                            <button
                              className="claim-glow inline-flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/30 hover:bg-[#1D9E75]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                              style={SG}
                              onClick={() => handleClaimNft(rec)}
                              disabled={claiming === rec.eventPubkey}
                            >
                              {claiming === rec.eventPubkey
                                ? <span className="animate-spin inline-block">◈</span>
                                : "⬡ Claim NFT"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── NFT gallery ── */}
        {mintedCount > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.1em] mb-3">My Strata NFTs</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {attended.filter(r => r.attendance.nftMint || minted[r.eventPubkey]).map(rec => {
                const mintAddr = rec.attendance.nftMint?.toBase58() ?? minted[rec.eventPubkey];
                return (
                  <a key={rec.eventPubkey} href={`https://explorer.solana.com/address/${mintAddr}?cluster=devnet`} target="_blank" rel="noreferrer"
                    className={`${CARD} overflow-hidden no-underline hover:border-[#1D9E75]/30 transition-colors block`}>
                    <div className="w-full aspect-square bg-[#1a1a1a] overflow-hidden">
                      <img src="/nft-badge.svg" alt={rec.event?.title ?? "NFT"} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <div className="text-[13px] text-white font-medium mb-1 truncate" style={SG}>{rec.event?.title ?? "Strata Event"}</div>
                      <div className="text-[11px] text-white/30 mb-1">{new Date(rec.attendance.checkedInAt.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle:"medium" })}</div>
                      <div className="text-[11px] text-[#1D9E75] font-semibold">Edition #{rec.attendance.edition.toNumber()}</div>
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
