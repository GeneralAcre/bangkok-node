"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  StrataClient, parseTier, MemberAccount, EventAccount,
  AttendanceAccount, TIER_COLOR, TIER_THRESHOLD, MemberTier,
  findEventPDA, findAttendancePDA,
} from "../../utils/strata-client";
import { computeStrataScore, SCORE_TIER_ICON } from "../../utils/scoring";

const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

interface AttendedEvent {
  eventPubkey: string;
  attendance:  AttendanceAccount;
  event:       EventAccount | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#0a0a0a; color:#fff; font-family:'Inter',sans-serif; min-height:100vh; }

  @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes fadeIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow     { 0%,100%{box-shadow:0 0 0 0 #1D9E7500} 50%{box-shadow:0 0 16px 2px #1D9E7530} }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

  /* ── Nav ── */
  .nav {
    position:sticky; top:0; z-index:100; background:#0a0a0a;
    border-bottom:0.5px solid #1a1a1a; padding:0 24px;
  }
  .nav-inner {
    max-width:860px; margin:0 auto;
    display:flex; align-items:center; justify-content:space-between; height:60px;
  }
  .nav-brand { text-decoration:none; display:flex; align-items:center; }
  .nav-brand img { height:44px; display:block; }
  .nav-links { display:flex; gap:.25rem; align-items:center; }
  .nav-link {
    font-family:'Space Grotesk',sans-serif; font-size:.75rem; font-weight:500;
    color:#555; text-decoration:none; padding:.3rem .65rem; border-radius:6px; transition:color .15s;
  }
  .nav-link:hover { color:#fff; }
  .nav-link.active { color:#fff; }
  @media(max-width:600px){ .nav-link:not(.active){ display:none; } }
  .wallet-adapter-button {
    background:rgba(29,158,117,.15) !important; color:#fff !important;
    font-family:'Space Grotesk',sans-serif !important; font-size:.72rem !important;
    font-weight:600 !important; border-radius:20px !important;
    padding:.28rem .8rem !important; height:auto !important;
    border:0.5px solid rgba(29,158,117,.35) !important; min-width:0 !important;
  }
  .wallet-adapter-button:hover { background:rgba(29,158,117,.28) !important; }
  .wallet-adapter-button-start-icon { width:14px !important; height:14px !important; margin-right:5px !important; }

  /* ── Page shell ── */
  .page {
    max-width:860px; margin:0 auto;
    padding:48px 24px 80px;
    animation:fadeIn .35s ease both;
  }
  .section { margin-bottom:32px; }

  /* ── Cards ── */
  .card {
    background:#111; border:0.5px solid #222; border-radius:12px; padding:20px;
  }
  .card-sm { background:#111; border:0.5px solid #222; border-radius:12px; padding:16px; }

  /* ── Eyebrow labels ── */
  .eyebrow {
    font-size:11px; font-weight:600; color:#555; letter-spacing:.1em;
    text-transform:uppercase; margin-bottom:14px;
  }

  /* ── Identity header ── */
  .identity-row {
    display:flex; align-items:center; gap:14px; margin-bottom:14px; flex-wrap:wrap;
  }
  .avatar {
    width:48px; height:48px; border-radius:50%; flex-shrink:0;
    background:#1D9E7520; border:0.5px solid #1D9E7540;
    display:flex; align-items:center; justify-content:center;
    font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:700; color:#1D9E75;
  }
  .identity-body { flex:1; min-width:0; }
  .identity-name {
    font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:600; color:#fff;
    margin-bottom:3px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;
  }
  .tier-badge {
    display:inline-flex; align-items:center; gap:5px;
    background:#1D9E7520; color:#1D9E75; border-radius:20px;
    font-size:11px; font-weight:600; padding:3px 10px; white-space:nowrap;
    border:0.5px solid #1D9E7540;
  }
  .wallet-row {
    display:flex; align-items:center; gap:6px; margin-top:2px;
  }
  .wallet-mono {
    font-family:'Space Mono',monospace; font-size:11px; color:#555;
  }
  .copy-icon {
    background:none; border:none; color:#555; cursor:pointer; padding:0; font-size:12px;
    line-height:1; transition:color .15s; display:flex; align-items:center;
  }
  .copy-icon:hover { color:#fff; }
  .copy-icon.did-copy { color:#1D9E75; }
  .identity-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:12px; }
  .btn-secondary {
    background:transparent; border:0.5px solid #333; color:#888; border-radius:8px;
    font-family:'Space Grotesk',sans-serif; font-size:12px; font-weight:500;
    padding:6px 14px; cursor:pointer; transition:all .15s; display:inline-flex; align-items:center; gap:5px;
  }
  .btn-secondary:hover { border-color:#555; color:#fff; }
  .btn-secondary.did-copy { border-color:#1D9E7540; color:#1D9E75; }
  .sol-chip {
    display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:500;
    padding:4px 10px; border-radius:20px;
  }
  .sol-ok  { color:#1D9E75; background:#1D9E7515; border:0.5px solid #1D9E7535; }
  .sol-low { color:#f87171; background:#f8717110; border:0.5px solid #7f1d1d; }

  /* ── Score hero ── */
  .score-hero {
    display:flex; flex-direction:column; align-items:center;
    padding:32px 20px 28px; background:#111; border:0.5px solid #222; border-radius:12px;
    margin-bottom:32px;
  }
  .score-num {
    font-family:'Space Grotesk',sans-serif; font-size:56px; font-weight:500;
    color:#1D9E75; line-height:1; margin-bottom:8px; letter-spacing:-1px;
  }
  .score-label {
    font-size:12px; color:#555; letter-spacing:.08em; text-transform:uppercase;
    margin-bottom:20px;
  }
  .prog-wrap { width:100%; max-width:320px; margin-bottom:8px; }
  .prog-track {
    height:3px; background:#1a1a1a; border-radius:2px; overflow:hidden; width:100%;
  }
  .prog-fill { height:100%; background:#1D9E75; border-radius:2px; transition:width .8s ease; }
  .prog-label { font-size:11px; color:#555; text-align:center; margin-top:6px; }

  /* ── Stat grid ── */
  .stat-grid {
    display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:32px;
  }
  @media(max-width:540px){ .stat-grid{ grid-template-columns:repeat(2,1fr); } }
  .stat-card {
    background:#111; border:0.5px solid #222; border-radius:12px; padding:16px;
  }
  .stat-val {
    font-family:'Space Grotesk',sans-serif; font-size:24px; font-weight:500;
    color:#fff; line-height:1; margin-bottom:6px;
  }
  .stat-lbl { font-size:11px; color:#555; font-weight:500; }

  /* ── Tabs ── */
  .tabs { display:flex; gap:0; border-bottom:0.5px solid #1a1a1a; margin-bottom:16px; }
  .tab-btn {
    background:none; border:none; padding:10px 16px; font-family:'Inter',sans-serif;
    font-size:13px; font-weight:500; cursor:pointer; transition:color .15s;
    border-bottom:1.5px solid transparent; margin-bottom:-0.5px;
  }
  .tab-btn.active { color:#fff; border-bottom-color:#1D9E75; }
  .tab-btn:not(.active) { color:#555; }
  .tab-btn:not(.active):hover { color:#888; }

  /* ── Event rows ── */
  .event-list { display:flex; flex-direction:column; gap:0; }
  .event-row {
    display:flex; align-items:center; gap:12px; padding:14px 0;
    border-bottom:0.5px solid #1a1a1a;
  }
  .event-row:last-child { border-bottom:none; }
  .event-left { flex:1; min-width:0; }
  .event-name {
    font-size:14px; color:#fff; font-weight:500; white-space:nowrap;
    overflow:hidden; text-overflow:ellipsis; margin-bottom:3px;
  }
  .event-date { font-size:12px; color:#555; }
  .event-tags { display:flex; gap:5px; align-items:center; flex-shrink:0; flex-wrap:wrap; }
  .tag {
    display:inline-flex; align-items:center;
    background:#1D9E7520; color:#1D9E75; border-radius:20px;
    font-size:11px; font-weight:600; padding:3px 10px; white-space:nowrap;
  }
  .tag-hackathon { background:rgba(168,85,247,.15); color:#c084fc; border-radius:20px; font-size:10px; font-weight:600; padding:2px 8px; }
  .nft-thumb {
    width:36px; height:36px; border-radius:6px; background:#1a1a1a;
    flex-shrink:0; display:flex; align-items:center; justify-content:center;
    overflow:hidden;
  }
  .nft-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
  .nft-thumb-placeholder { width:36px; height:36px; border-radius:6px; background:#1a1a1a; flex-shrink:0; }

  /* ── Claim button ── */
  .btn-claim {
    display:inline-flex; align-items:center; gap:5px; white-space:nowrap;
    padding:5px 12px; background:#1D9E7518; color:#1D9E75;
    border:0.5px solid #1D9E7540; font-family:'Space Grotesk',sans-serif;
    font-size:12px; font-weight:600; border-radius:8px; cursor:pointer; transition:all .2s;
    animation:glow 3s ease-in-out infinite;
  }
  .btn-claim:hover { background:#1D9E7530; border-color:#1D9E75; animation:none; }
  .btn-claim:disabled { background:#1a1a1a; color:#555; border-color:#222; cursor:not-allowed; animation:none; }
  .nft-minted-link {
    display:inline-flex; align-items:center; gap:4px; white-space:nowrap;
    padding:5px 10px; background:transparent; color:#1D9E75;
    font-size:11px; font-weight:600; text-decoration:none; border-radius:6px; transition:color .15s;
  }
  .nft-minted-link:hover { color:#fff; text-decoration:none; }

  /* ── NFT gallery ── */
  .nft-gallery { margin-bottom:32px; }
  .nft-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  @media(max-width:480px){ .nft-grid{ grid-template-columns:repeat(2,1fr); } }
  .nft-card {
    background:#111; border:0.5px solid #222; border-radius:12px; overflow:hidden;
    text-decoration:none; display:block; transition:border-color .2s;
  }
  .nft-card:hover { border-color:#1D9E7540; text-decoration:none; }
  .nft-square {
    width:100%; aspect-ratio:1; background:#1a1a1a; display:flex;
    align-items:center; justify-content:center; overflow:hidden;
  }
  .nft-square img { width:100%; height:100%; object-fit:cover; display:block; }
  .nft-square-placeholder {
    width:100%; height:100%; display:flex; align-items:center; justify-content:center;
    font-size:24px; color:#333;
  }
  .nft-body { padding:12px; }
  .nft-title { font-size:13px; color:#fff; font-weight:500; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .nft-date2 { font-size:11px; color:#555; margin-bottom:3px; }
  .nft-edition { font-size:11px; color:#1D9E75; font-weight:600; }

  /* ── Notices ── */
  .msg-err { background:#110a0a; border:0.5px solid #3f1010; color:#f87171; padding:12px 14px; margin-bottom:16px; font-size:13px; border-radius:10px; }
  .msg-ok  { background:#0a1410; border:0.5px solid #103f2a; color:#1D9E75; padding:12px 14px; margin-bottom:16px; font-size:13px; border-radius:10px; }

  /* ── Empty / connect ── */
  .center-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:16px; text-align:center; padding:0 24px; }
  .center-wrap p { font-size:14px; color:#555; }
  .empty-text { font-size:13px; color:#555; text-align:center; padding:24px 0; }

  /* ── Not registered card ── */
  .register-card { padding:24px; }
  .register-title { font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:600; color:#fff; margin-bottom:6px; }
  .register-sub   { font-size:13px; color:#555; line-height:1.6; margin-bottom:20px; }
  .btn-primary {
    display:inline-flex; align-items:center; gap:5px;
    padding:9px 18px; background:#1D9E75; color:#fff; border:none;
    font-family:'Space Grotesk',sans-serif; font-size:13px; font-weight:600;
    border-radius:8px; cursor:pointer; transition:background .15s;
  }
  .btn-primary:hover { background:#18876a; }
  .btn-primary:disabled { background:#1a1a1a; color:#555; cursor:not-allowed; }
  .btn-faucet {
    display:inline-flex; align-items:center; gap:5px;
    padding:9px 18px; background:transparent; color:#f59e0b; border:0.5px solid #f59e0b50;
    font-family:'Space Grotesk',sans-serif; font-size:13px; font-weight:600;
    border-radius:8px; cursor:pointer; text-decoration:none; transition:all .15s;
  }
  .btn-faucet:hover { background:#f59e0b15; }

  /* ── Loading shimmer ── */
  .shimmer {
    background:linear-gradient(90deg,#111 25%,#1a1a1a 50%,#111 75%);
    background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px;
  }
`;

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
  const [activeTab,    setActiveTab]    = useState<"all" | "hackathon">("all");
  const [copiedAddr,   setCopiedAddr]   = useState(false);
  const [copiedLink,   setCopiedLink]   = useState(false);

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
  const rep        = member ? member.reputationScore.toNumber() : 0;
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // ── Nav ──
  const Nav = () => (
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
  );

  // ── Disconnected ──
  if (!connected || !publicKey) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <Nav />
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
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <Nav />
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
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Nav />

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

        {/* ── 1. Identity header ── */}
        {member && tier && (
          <div className="section">
            <div className="card">
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
            </div>
          </div>
        )}

        {/* ── 2. Strata Score hero ── */}
        {member && progress && (
          <div className="score-hero">
            <div className="score-num">{loading ? "…" : strataScore.toLocaleString()}</div>
            <div className="score-label">Strata Score</div>
            <div className="prog-wrap">
              <div className="prog-track">
                <div className="prog-fill" style={{ width:`${progress.pct}%` }} />
              </div>
            </div>
            <div className="prog-label">{progress.label}</div>
          </div>
        )}

        {/* ── 3. Stats row ── */}
        {member && (
          <div className="stat-grid section">
            <div className="stat-card">
              <div className="stat-val">{events}</div>
              <div className="stat-lbl">Events Attended</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: hackathonCount > 0 ? "#c084fc" : undefined }}>
                {hackathonCount}
              </div>
              <div className="stat-lbl">Hackathon Events</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: streak > 0 ? "#1D9E75" : undefined }}>
                {streak}
              </div>
              <div className="stat-lbl">Month Streak</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: mintedCount > 0 ? "#1D9E75" : undefined }}>
                {mintedCount}
              </div>
              <div className="stat-lbl">NFTs Minted</div>
            </div>
          </div>
        )}

        {/* ── 4. Event history ── */}
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
              </div>

              {/* Event list */}
              <div style={{ padding:"0 16px 8px" }}>
                {loading ? (
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
                            {isHack && <span className="tag-hackathon">⚡ Hackathon</span>}
                          </div>
                          {hasMint ? (
                            <a
                              className="nft-minted-link"
                              href={`https://explorer.solana.com/address/${mintAddr}?cluster=devnet`}
                              target="_blank" rel="noreferrer"
                            >
                              <div className="nft-thumb">
                                <img
                                  src={`${appUrl}/nft-badge.svg`}
                                  alt="NFT"
                                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              </div>
                            </a>
                          ) : (
                            <div className="nft-thumb-placeholder">
                              <button
                                className="btn-claim"
                                onClick={() => handleClaimNft(rec)}
                                disabled={claiming === rec.eventPubkey}
                                style={{ fontSize:11 }}
                              >
                                {claiming === rec.eventPubkey
                                  ? <span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>◈</span>
                                  : "Claim"}
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

        {/* ── 5. NFT gallery ── */}
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
                        <img
                          src={`${appUrl}/nft-badge.svg`}
                          alt={rec.event?.title ?? "Strata NFT"}
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        {!appUrl && (
                          <div className="nft-square-placeholder">◎</div>
                        )}
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
