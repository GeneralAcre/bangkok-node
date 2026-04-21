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

const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

interface AttendedEvent {
  eventPubkey: string;
  attendance:  AttendanceAccount;
  event:       EventAccount | null;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #000; color: #fff; font-family: 'Inter', sans-serif; min-height: 100vh; }

  :root {
    --g: #8CE9A4; --p: #7A57E9;
    --g-dim: #8CE9A415; --p-dim: #7A57E915;
    --g-border: #8CE9A440; --p-border: #7A57E940;
    --p-glow: #7A57E930; --g-glow: #8CE9A430;
    --surface: rgba(10,10,15,.7); --surface2: rgba(17,17,24,.8); --border: rgba(30,30,46,.8);
    --text-muted: #6b7280; --text-dim: #374151;
  }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse    { 0%,100%{opacity:.7} 50%{opacity:1} }
  @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes glow     { 0%,100%{box-shadow:0 0 16px #7A57E920} 50%{box-shadow:0 0 40px #7A57E960} }
  @keyframes scanline { 0%{top:-4px} 100%{top:100vh} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes orb1     { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.08)} 66%{transform:translate(-30px,30px) scale(.95)} }
  @keyframes orb2     { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,40px) scale(1.05)} 66%{transform:translate(40px,-30px) scale(.97)} }
  @keyframes gradMove { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes nftFloat { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-4px) rotate(.5deg)} }

  /* Ambient orbs */
  .orb-wrap { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
  .orb { position:absolute; border-radius:50%; filter:blur(80px); }
  .orb1 { width:500px; height:500px; background:#7A57E9; opacity:.1; top:-150px; right:-100px; animation:orb1 22s ease-in-out infinite; }
  .orb2 { width:400px; height:400px; background:#8CE9A4; opacity:.08; bottom:-100px; left:-50px; animation:orb2 28s ease-in-out infinite; }
  .orb3 { width:250px; height:250px; background:#7A57E9; opacity:.06; top:50%; left:50%; animation:orb1 35s ease-in-out infinite reverse; }

  /* Grid overlay */
  .grid-bg {
    position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:
      linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
    background-size:60px 60px;
  }

  .scanline {
    position:fixed; top:0; left:0; right:0; height:2px; z-index:999; pointer-events:none;
    background:linear-gradient(transparent,#7A57E918,transparent);
    animation:scanline 10s linear infinite;
  }

  .nav {
    position:sticky; top:0; z-index:100;
    background:rgba(0,0,0,.75); backdrop-filter:blur(24px);
    border-bottom:1px solid rgba(30,30,46,.6); padding:0 1.5rem;
  }
  .nav-inner {
    max-width:900px; margin:0 auto;
    display:flex; align-items:center; justify-content:space-between; height:60px;
  }
  .nav-brand {
    font-family:'Space Grotesk',sans-serif; font-size:1.2rem; font-weight:700;
    background:linear-gradient(135deg,var(--p),var(--g));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    text-decoration:none;
  }
  .nav-links { display:flex; gap:.4rem; align-items:center; }
  .nav-link {
    font-family:'Space Grotesk',sans-serif; font-size:.8rem; font-weight:500;
    color:var(--text-muted); text-decoration:none; padding:.4rem .8rem;
    border-radius:6px; transition:all .2s;
  }
  .nav-link:hover { color:#fff; background:var(--p-dim); }
  .nav-link.active { color:var(--p); }
  @media(max-width:600px){.nav-link:not(.active){display:none}}

  .page { max-width:900px; margin:0 auto; padding:2rem 1.5rem; position:relative; z-index:1; }

  .page-header { margin-bottom:2rem; animation:fadeUp .5s ease both; }
  .page-title {
    font-family:'Space Grotesk',sans-serif; font-size:2rem; font-weight:700; margin-bottom:.4rem;
    background:linear-gradient(135deg,#fff 0%,#c4b5fd 40%,var(--p) 65%,var(--g) 90%);
    background-size:200% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    animation:gradMove 6s ease infinite;
  }
  .page-sub { font-size:.85rem; color:var(--text-muted); }

  .card {
    background:rgba(10,10,15,.6); backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.06); border-radius:16px;
    padding:1.5rem; margin-bottom:1.25rem; animation:fadeUp .5s ease both;
    transition:border-color .3s, box-shadow .3s;
  }
  .card:hover { border-color:rgba(122,87,233,.2); box-shadow:0 8px 40px rgba(0,0,0,.4); }
  .card-title { font-family:'Space Grotesk',sans-serif; font-size:.78rem; font-weight:600; color:var(--text-muted); letter-spacing:.1em; text-transform:uppercase; margin-bottom:1.25rem; }

  /* Identity card */
  .identity-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
  .username {
    font-family:'Space Grotesk',sans-serif; font-size:1.5rem; font-weight:700;
    background:linear-gradient(135deg,#fff,var(--p));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .wallet-addr { font-family:'Space Mono',monospace; font-size:.62rem; color:var(--text-muted); margin-top:.3rem; word-break:break-all; }
  .sol-pill {
    display:inline-flex; align-items:center; gap:.35rem; font-size:.75rem; font-weight:600;
    padding:.3rem .8rem; border-radius:100px;
  }
  .sol-ok  { color:var(--g); background:var(--g-dim); border:1px solid var(--g-border); }
  .sol-low { color:#f87171; background:#f871710d; border:1px solid #7f1d1d; animation:pulse 2s infinite; }

  .tier-pill {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.4rem 1rem; border-radius:8px; font-family:'Space Grotesk',sans-serif;
    font-size:.85rem; font-weight:700; margin-bottom:1.25rem; letter-spacing:.04em;
  }
  .tier-dot { width:8px; height:8px; border-radius:50%; }

  .stat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.75rem; margin-bottom:1.25rem; }
  .stat-box {
    background:rgba(17,17,24,.5); backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,.05); border-radius:12px;
    padding:1rem; text-align:center; transition:all .25s;
  }
  .stat-box:hover { border-color:var(--p-border); transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.4); }
  .stat-val { font-family:'Space Grotesk',sans-serif; font-size:1.8rem; font-weight:700; color:#fff; line-height:1; margin-bottom:.3rem; }
  .stat-lbl { font-size:.65rem; font-weight:500; color:var(--text-muted); letter-spacing:.08em; text-transform:uppercase; }
  @media(max-width:400px){.stat-grid{grid-template-columns:1fr 1fr}}

  .prog-track { height:4px; background:rgba(17,17,24,.8); border-radius:4px; overflow:hidden; margin-bottom:.4rem; }
  .prog-fill  { height:100%; border-radius:4px; transition:width .8s ease; }
  .prog-labels{ display:flex; justify-content:space-between; font-size:.68rem; color:var(--text-muted); }

  /* Attendance */
  .attendance-row {
    border-bottom:1px solid rgba(13,13,20,.9); padding:1rem 0;
    display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap;
    transition:background .2s;
  }
  .attendance-row:hover { background:rgba(122,87,233,.03); }
  .attendance-row:last-child { border-bottom:none; }
  .att-name { font-family:'Space Grotesk',sans-serif; font-size:.92rem; font-weight:600; color:#fff; margin-bottom:.2rem; }
  .att-meta { font-size:.72rem; color:var(--text-muted); line-height:1.6; }
  .att-meta a { color:var(--p); text-decoration:none; }
  .att-meta a:hover { text-decoration:underline; }

  .btn-claim {
    display:inline-flex; align-items:center; gap:.4rem; white-space:nowrap;
    padding:.55rem 1.25rem; background:var(--p); color:#fff; border:none;
    font-family:'Space Grotesk',sans-serif; font-size:.82rem; font-weight:600;
    border-radius:8px; cursor:pointer; transition:all .2s;
    animation:glow 2.5s ease-in-out infinite;
    letter-spacing:.03em;
  }
  .btn-claim:hover { background:#8B6EF0; transform:translateY(-1px); box-shadow:0 8px 30px #7A57E950; animation:none; }
  .btn-claim:disabled { background:#2d2060; color:#6b7280; cursor:not-allowed; animation:none; transform:none; box-shadow:none; }

  .nft-minted {
    display:inline-flex; align-items:center; gap:.4rem; white-space:nowrap;
    padding:.45rem 1rem; background:var(--g-dim); color:var(--g);
    border:1px solid var(--g-border); border-radius:8px; font-size:.78rem;
    font-weight:600; text-decoration:none; font-family:'Space Grotesk',sans-serif;
    transition:all .2s;
  }
  .nft-minted:hover { background:#8CE9A425; border-color:var(--g); text-decoration:none; transform:translateY(-1px); }

  /* NFT Gallery */
  .nft-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:1rem; margin-top:1rem; }
  .nft-card {
    background:rgba(17,17,24,.6); backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,.06); border-radius:14px;
    overflow:hidden; transition:all .3s; cursor:pointer; text-decoration:none; display:block;
    animation:nftFloat 6s ease-in-out infinite;
  }
  .nft-card:nth-child(2n) { animation-delay:.8s; }
  .nft-card:nth-child(3n) { animation-delay:1.6s; }
  .nft-card:hover { border-color:var(--p-border); transform:translateY(-6px) !important; box-shadow:0 16px 40px rgba(122,87,233,.25); text-decoration:none; }
  .nft-img { width:100%; aspect-ratio:1; display:block; background:#111; }
  .nft-info { padding:.75rem; }
  .nft-name { font-family:'Space Grotesk',sans-serif; font-size:.78rem; font-weight:600; color:#fff; margin-bottom:.2rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .nft-edition { font-size:.68rem; color:var(--p); font-weight:600; }
  .nft-date { font-size:.65rem; color:var(--text-muted); margin-top:.15rem; }

  .msg-err { background:rgba(26,10,15,.8); backdrop-filter:blur(10px); border:1px solid #7f1d1d; color:#f87171; padding:.85rem 1.1rem; margin-bottom:1rem; font-size:.82rem; border-radius:10px; }
  .msg-ok  { background:rgba(10,31,15,.8); backdrop-filter:blur(10px); border:1px solid #166534; color:var(--g); padding:.85rem 1.1rem; margin-bottom:1rem; font-size:.82rem; border-radius:10px; }

  .connect-center { text-align:center; padding:4rem 1.5rem; }
  .connect-center p { font-size:.9rem; color:var(--text-muted); margin-bottom:1.5rem; }

  .empty-state { text-align:center; padding:2rem 0; }
  .empty-text { font-size:.88rem; color:var(--text-muted); margin-bottom:1.25rem; }
  .how-to-box {
    background:rgba(17,17,24,.5); backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,.05); border-radius:12px;
    padding:1.25rem 1.5rem; text-align:left;
  }
  .how-to-title { font-family:'Space Grotesk',sans-serif; font-size:.8rem; font-weight:700; color:var(--p); letter-spacing:.08em; text-transform:uppercase; margin-bottom:.75rem; }
  .how-to-step { font-size:.8rem; color:var(--text-muted); line-height:2; }
  .how-to-step strong { color:#fff; }
  .how-to-step a { color:var(--p); text-decoration:none; }
  .how-to-step a:hover { text-decoration:underline; }

  .btn {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.65rem 1.4rem; border:1px solid var(--p); background:transparent;
    color:var(--p); cursor:pointer; font-family:'Space Grotesk',sans-serif;
    font-size:.85rem; font-weight:600; border-radius:8px; transition:all .2s;
  }
  .btn:hover { background:var(--p); color:#fff; transform:translateY(-1px); box-shadow:0 6px 20px var(--p-glow); }
  .btn:disabled { opacity:.4; cursor:not-allowed; transform:none; box-shadow:none; }

  .wallet-adapter-button {
    background:var(--p) !important; color:#fff !important;
    font-family:'Space Grotesk',sans-serif !important; font-size:.8rem !important;
    font-weight:600 !important; border-radius:8px !important;
    padding:.45rem 1rem !important; height:auto !important; border:none !important;
  }
  .wallet-adapter-button:hover { background:#8B6EF0 !important; }
`;

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

      // Load member (may not exist yet for new wallets)
      let mem: MemberAccount | null = null;
      try { mem = await client.getMember(community, publicKey); } catch {}
      setMember(mem);

      // Scan all events to find attendance PDAs for this wallet
      // This is more reliable than getProgramAccounts memcmp filter on public RPCs
      const commInfo = await connection.getAccountInfo(community);
      if (commInfo) {
        const eventCountOffset = 8 + 32 + (4 + 64) + (4 + 256) + (4 + 64) + 8;
        const eventCount = Number(commInfo.data.readBigUInt64LE(eventCountOffset));

        const eventPDAs = Array.from({ length: eventCount }, (_, i) => findEventPDA(community, i)[0]);
        const attendancePDAs = eventPDAs.map(ep => findAttendancePDA(ep, publicKey)[0]);

        // Batch fetch all accounts
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
          if (!attendanceInfos[i]) continue; // no attendance for this event
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

  const Nav = () => (
    <nav className="nav">
      <div className="nav-inner">
        <a href="/" className="nav-brand"><img src="/Strata-logo.svg" alt="STRATA" style={{ height:"28px", display:"block" }} /></a>
        <div className="nav-links">
          <a href="/" className="nav-link">Home</a>
          <a href="/organizer" className="nav-link">Organizer</a>
          <a href="/profile" className="nav-link active">Profile</a>
          <WalletMultiButton />
        </div>
      </div>
    </nav>
  );

  if (!connected || !publicKey) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="scanline" />
        <Nav />
        <div className="page">
          <div className="page-header"><h1 className="page-title">Profile</h1><p className="page-sub">Your on-chain identity and reputation.</p></div>
          <div className="card connect-center">
            <p>Connect your wallet to view your Strata profile.</p>
            <WalletMultiButton />
          </div>
        </div>
      </>
    );
  }

  const tier     = member ? parseTier(member.tier) : null;
  const events   = member ? member.eventsAttended.toNumber() : 0;
  const rep      = member ? member.reputationScore.toNumber() : 0;
  const progress = tier ? tierProgress(tier, events) : null;
  const color    = tier ? TIER_COLOR[tier] : "#6b7280";
  const mintedCount = attended.filter(r => r.attendance.nftMint || minted[r.eventPubkey]).length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="grid-bg" />
      <div className="orb-wrap">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
      </div>
      <div className="scanline" />
      <Nav />

      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Profile</h1>
          <p className="page-sub">On-chain identity · Permanent reputation · Proof of presence</p>
        </div>

        {error && (
          <div className="msg-err">
            {error}
            {error.includes("SOL") && (
              <div style={{ marginTop:".4rem" }}>
                <a href="https://faucet.solana.com" target="_blank" rel="noreferrer" style={{ color:"#fbbf24" }}>→ faucet.solana.com ↗</a>
              </div>
            )}
          </div>
        )}
        {success && <div className="msg-ok">{success}</div>}

        {loading && !member && (
          <div className="card" style={{ textAlign:"center", padding:"2.5rem", color:"var(--text-muted)" }}>
            Loading chain data…
          </div>
        )}

        {/* Not registered */}
        {!loading && !member && (
          <div className="card">
            <div className="card-title">Identity</div>
            <div className="identity-top">
              <div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"1.1rem", fontWeight:600, color:"#fff", marginBottom:".35rem" }}>
                  New to Strata
                </div>
                <div className="wallet-addr">{publicKey.toBase58()}</div>
              </div>
              {balance !== null && (
                <span className={`sol-pill ${balance < 0.01 ? "sol-low" : "sol-ok"}`}>
                  {balance.toFixed(4)} SOL{balance < 0.01 ? " ⚠" : ""}
                </span>
              )}
            </div>
            <p style={{ fontSize:".85rem", color:"var(--text-muted)", lineHeight:1.7, marginBottom:"1.25rem" }}>
              Register to start building your on-chain reputation. Each event you attend earns you a higher tier.
            </p>
            {balance !== null && balance < 0.01 ? (
              <a href="https://faucet.solana.com" target="_blank" rel="noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:".4rem", padding:".65rem 1.4rem", border:"1px solid #fbbf24", color:"#fbbf24", fontSize:".85rem", fontWeight:600, borderRadius:8, textDecoration:"none" }}>
                Get Devnet SOL First ↗
              </a>
            ) : (
              <button className="btn" disabled={loading} onClick={handleRegister}>
                {loading ? "Registering…" : "Register as Member"}
              </button>
            )}
          </div>
        )}

        {/* Member */}
        {member && tier && (
          <>
            <div className="card">
              <div className="card-title">Identity</div>
              <div className="identity-top">
                <div>
                  <div className="username">@{member.username}</div>
                  <div className="wallet-addr">{publicKey.toBase58()}</div>
                </div>
                {balance !== null && (
                  <span className={`sol-pill ${balance < 0.01 ? "sol-low" : "sol-ok"}`}>
                    {balance.toFixed(4)} SOL
                  </span>
                )}
              </div>

              <div className="tier-pill" style={{ background:`${color}15`, border:`1px solid ${color}40`, color }}>
                <span className="tier-dot" style={{ background:color }} />
                {tier}
                <span style={{ fontSize:".68rem", opacity:.6, fontWeight:500 }}>· {TIER_THRESHOLD[tier]}</span>
              </div>

              <div className="stat-grid">
                <div className="stat-box">
                  <div className="stat-val" style={{ color:"var(--p)" }}>{events}</div>
                  <div className="stat-lbl">Events</div>
                </div>
                <div className="stat-box">
                  <div className="stat-val" style={{ color:"var(--g)" }}>{rep}</div>
                  <div className="stat-lbl">Rep Score</div>
                </div>
                <div className="stat-box">
                  <div className="stat-val" style={{ fontSize:"1rem", paddingTop:".4rem", color:"#fff" }}>
                    {new Date(member.joinedAt.toNumber() * 1000).toLocaleDateString("en-US", { month:"short", year:"numeric" })}
                  </div>
                  <div className="stat-lbl">Joined</div>
                </div>
              </div>

              {progress && (
                <>
                  <div className="prog-track">
                    <div className="prog-fill" style={{ width:`${progress.pct}%`, background:`linear-gradient(90deg,var(--p),var(--g))` }} />
                  </div>
                  <div className="prog-labels">
                    <span>{progress.pct}% progress</span>
                    <span>{progress.label}</span>
                  </div>
                </>
              )}
            </div>

            {/* NFT Gallery */}
            {mintedCount > 0 && (
              <div className="card">
                <div className="card-title">
                  My NFT Collection
                  <span style={{ marginLeft:".5rem", color:"var(--g)" }}>({mintedCount})</span>
                </div>
                <div className="nft-grid">
                  {attended.filter(r => r.attendance.nftMint || minted[r.eventPubkey]).map(rec => {
                    const mintAddr = rec.attendance.nftMint?.toBase58() ?? minted[rec.eventPubkey];
                    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
                    return (
                      <a
                        key={rec.eventPubkey}
                        className="nft-card"
                        href={`https://explorer.solana.com/address/${mintAddr}?cluster=devnet`}
                        target="_blank" rel="noreferrer"
                      >
                        <img
                          className="nft-img"
                          src={`${appUrl}/nft-badge.svg`}
                          alt={rec.event?.title ?? "Strata NFT"}
                        />
                        <div className="nft-info">
                          <div className="nft-name">{rec.event?.title ?? "Strata Event"}</div>
                          <div className="nft-edition">Edition #{rec.attendance.edition.toNumber()}</div>
                          <div className="nft-date">
                            {new Date(rec.attendance.checkedInAt.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle:"medium" })}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attendance + NFT claims */}
            <div className="card">
              <div className="card-title">
                Attendance History ({attended.length})
                {mintedCount > 0 && (
                  <span style={{ marginLeft:".75rem", color:"var(--g)" }}>
                    · {mintedCount} NFT{mintedCount > 1 ? "s" : ""} minted
                  </span>
                )}
              </div>

              {attended.length === 0 && (
                <div className="empty-state">
                  <p className="empty-text">No check-ins yet.</p>
                  <div className="how-to-box">
                    <div className="how-to-title">How to get your NFT</div>
                    <div className="how-to-step">
                      1. Organizer creates &amp; starts an event at <a href="/organizer">/organizer</a><br />
                      2. Attendees go to <a href="/checkin">/checkin?code=EVENTCODE</a> or scan the QR<br />
                      3. <strong>One tap</strong> → check-in confirmed on-chain<br />
                      4. Return here → glowing <strong style={{ color:"var(--p)" }}>Claim NFT</strong> button appears below
                    </div>
                  </div>
                </div>
              )}

              {attended.map((rec) => {
                const mintAddr = rec.attendance.nftMint?.toBase58() ?? minted[rec.eventPubkey];
                const hasMint  = !!(rec.attendance.nftMint || minted[rec.eventPubkey]);
                return (
                  <div className="attendance-row" key={rec.eventPubkey}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="att-name">{rec.event?.title ?? "Unknown Event"}</div>
                      <div className="att-meta">
                        {rec.event && `${rec.event.location}, ${rec.event.country} · `}
                        Checked in {new Date(rec.attendance.checkedInAt.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle:"medium" })}
                        {" "}· Edition #{rec.attendance.edition.toNumber()}
                        {" "}·{" "}
                        <a href={`https://explorer.solana.com/address/${rec.eventPubkey}?cluster=devnet`} target="_blank" rel="noreferrer">
                          Explorer ↗
                        </a>
                      </div>
                    </div>
                    <div style={{ flexShrink:0, paddingTop:".1rem" }}>
                      {hasMint ? (
                        <a className="nft-minted" href={`https://explorer.solana.com/address/${mintAddr}?cluster=devnet`} target="_blank" rel="noreferrer">
                          ✓ NFT Minted ↗
                        </a>
                      ) : (
                        <button className="btn-claim" onClick={() => handleClaimNft(rec)} disabled={claiming === rec.eventPubkey}>
                          {claiming === rec.eventPubkey
                            ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>◈</span> Minting…</>
                            : "✦ Claim NFT"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
