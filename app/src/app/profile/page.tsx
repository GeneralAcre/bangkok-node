"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  StrataClient, parseTier, MemberAccount, EventAccount,
  AttendanceAccount, TIER_COLOR, TIER_THRESHOLD, MemberTier,
} from "../../utils/strata-client";

const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

interface AttendedEvent {
  eventPubkey: string;
  attendance:  AttendanceAccount;
  event:       EventAccount | null;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #000; color: #e2e8f0; font-family: 'Share Tech Mono', monospace; min-height: 100vh; }
  .page { max-width: 820px; margin: 0 auto; padding: 2rem 1.5rem; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scanline{ 0%{top:-20px} 100%{top:100vh} }
  @keyframes pulse   { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes glow    { 0%,100%{box-shadow:0 0 6px rgba(220,38,38,0)} 50%{box-shadow:0 0 16px rgba(220,38,38,.25)} }

  .scanline {
    position:fixed; top:0; left:0; right:0; height:2px;
    background:linear-gradient(transparent,rgba(220,38,38,.06),transparent);
    animation:scanline 10s linear infinite; pointer-events:none; z-index:999;
  }

  .top-nav {
    display:flex; align-items:center; justify-content:space-between;
    border-bottom:1px solid #111; padding-bottom:1.25rem; margin-bottom:2rem;
  }
  .nav-brand { font-family:'Cinzel Decorative',serif; font-size:1.1rem; color:#dc2626; letter-spacing:.15em; text-decoration:none; }
  .nav-links { display:flex; gap:.75rem; align-items:center; }
  .nav-link {
    font-size:.72rem; color:#6b7280; text-decoration:none; letter-spacing:.1em;
    padding:.3rem .7rem; border:1px solid #1a1a1a; border-radius:2px; transition:all .2s;
  }
  .nav-link:hover,.nav-link.active { color:#dc2626; border-color:#dc2626; }

  h1 { font-family:'Cinzel Decorative',serif; font-size:1.4rem; color:#dc2626; margin-bottom:.2rem; }
  .sub { font-size:.72rem; color:#374151; margin-bottom:1.75rem; letter-spacing:.06em; }

  .card {
    background:#050505; border:1px solid #1a1a1a; border-radius:2px;
    padding:1.5rem; margin-bottom:1.25rem; animation:fadeUp .4s ease both;
    position:relative; overflow:hidden;
  }
  .card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,#dc2626,transparent); opacity:.3;
  }
  .card-title { font-size:.65rem; color:#4b5563; letter-spacing:.25em; margin-bottom:1.25rem; text-transform:uppercase; }

  .identity-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem; }
  .username { font-size:1.4rem; color:#f9fafb; font-family:'Rajdhani',sans-serif; font-weight:700; letter-spacing:.04em; }
  .wallet-addr { font-size:.62rem; color:#374151; margin-top:.2rem; letter-spacing:.04em; word-break:break-all; }
  .sol-balance { font-size:.72rem; padding:.2rem .6rem; border-radius:2px; letter-spacing:.06em; }
  .sol-ok  { color:#34d399; border:1px solid #065f46; background:#020f06; }
  .sol-low { color:#f87171; border:1px solid #7f1d1d; background:#0a0000; animation:pulse 2s infinite; }

  .tier-badge {
    display:inline-flex; align-items:center; gap:.5rem; padding:.4rem 1rem;
    border-radius:2px; font-size:.85rem; font-weight:700; margin-bottom:1.25rem;
    font-family:'Rajdhani',sans-serif; letter-spacing:.1em;
  }
  .tier-dot { width:8px; height:8px; border-radius:50%; }

  .stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:.75rem; margin-bottom:1.25rem; }
  .stat { text-align:center; background:#0a0a0a; border:1px solid #111; padding:1rem; border-radius:2px; }
  .stat-val { font-size:1.8rem; font-weight:700; color:#f9fafb; font-family:'Rajdhani',sans-serif; line-height:1; }
  .stat-lbl { font-size:.58rem; color:#374151; margin-top:.3rem; letter-spacing:.15em; text-transform:uppercase; }

  .prog-bar { height:3px; background:#0a0a0a; border-radius:0; overflow:hidden; margin-bottom:.35rem; }
  .prog-fill { height:100%; transition:width .8s ease; }
  .prog-labels { display:flex; justify-content:space-between; font-size:.6rem; color:#374151; letter-spacing:.05em; }

  .event-row { border-bottom:1px solid #0d0d0d; padding:1rem 0; }
  .event-row:last-child { border-bottom:none; }
  .event-row-header { display:flex; align-items:flex-start; justify-content:space-between; gap:.5rem; flex-wrap:wrap; margin-bottom:.4rem; }
  .event-name { font-size:.9rem; color:#e2e8f0; font-family:'Rajdhani',sans-serif; font-weight:600; }
  .event-meta { font-size:.68rem; color:#374151; line-height:1.6; }

  .nft-claimed {
    display:inline-flex; align-items:center; gap:.4rem; font-size:.68rem;
    color:#4ade80; border:1px solid #14532d; padding:4px 12px; border-radius:2px;
    background:#020f06; text-decoration:none; white-space:nowrap;
  }
  .nft-claimed:hover { border-color:#4ade80; text-decoration:none; }
  .btn-claim {
    display:inline-flex; align-items:center; gap:.4rem; font-size:.72rem;
    color:#fff; border:none; padding:6px 16px; border-radius:2px; cursor:pointer;
    background:#991b1b; border:1px solid #dc2626; font-family:'Rajdhani',sans-serif;
    font-weight:700; letter-spacing:.08em; text-transform:uppercase; transition:all .2s;
    animation:glow 2s ease-in-out infinite;
  }
  .btn-claim:hover { background:#dc2626; box-shadow:0 0 20px rgba(220,38,38,.3); }
  .btn-claim:disabled { background:#1a0000; color:#4b5563; border-color:#1a1a1a; cursor:not-allowed; animation:none; }

  .btn {
    padding:.6rem 1.4rem; border:1px solid #dc2626; background:transparent;
    color:#dc2626; cursor:pointer; font-family:'Share Tech Mono',monospace;
    font-size:.78rem; letter-spacing:.1em; border-radius:2px;
    transition:all .2s; text-transform:uppercase;
  }
  .btn:hover { background:#dc2626; color:#000; }
  .btn:disabled { opacity:.4; cursor:not-allowed; }

  .msg-err { background:#0a0000; border:1px solid #7f1d1d; color:#f87171; padding:.75rem 1rem; border-radius:2px; font-size:.78rem; margin-bottom:1rem; }
  .msg-ok  { background:#020f06; border:1px solid #14532d; color:#4ade80; padding:.75rem 1rem; border-radius:2px; font-size:.78rem; margin-bottom:1rem; }

  .connect-box { text-align:center; padding:4rem 1rem; color:#374151; }
  .connect-box p { margin-bottom:1.5rem; font-size:.85rem; }

  .empty { color:#374151; font-size:.82rem; text-align:center; padding:2rem 0; line-height:1.7; }
  .how-to-nft {
    background:#080808; border:1px solid #111; padding:1rem 1.25rem;
    border-radius:2px; font-size:.72rem; color:#4b5563; line-height:1.9; margin-top:.5rem;
  }
  .how-to-nft strong { color:#e2e8f0; }
  .how-to-nft a { color:#dc2626; }

  a { color:#dc2626; text-decoration:none; }
  a:hover { text-decoration:underline; }

  .wallet-adapter-button {
    background:transparent !important; border:1px solid #1a1a1a !important;
    color:#6b7280 !important; font-family:'Share Tech Mono',monospace !important;
    font-size:.72rem !important; letter-spacing:.08em !important; border-radius:2px !important;
    padding:.3rem .8rem !important; height:auto !important;
  }
  .wallet-adapter-button:hover { border-color:#dc2626 !important; color:#dc2626 !important; background:transparent !important; }
  .wallet-adapter-button-trigger { background:#991b1b !important; border-color:#dc2626 !important; color:#fff !important; }
  .wallet-adapter-button-trigger:hover { background:#dc2626 !important; }
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
        const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
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
      const mem = await client.getMember(community, publicKey);
      setMember(mem);
      if (mem) {
        const records = await client.getAllAttendanceByWallet(publicKey);
        const rich: AttendedEvent[] = await Promise.all(
          records.map(async ({ account }) => {
            let event: EventAccount | null = null;
            try { event = await client.getEvent(account.event); } catch {}
            return { eventPubkey: account.event.toBase58(), attendance: account, event };
          })
        );
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
      const community = new PublicKey(COMMUNITY_PDA_STR);
      await client.registerMember(community, publicKey!.toBase58().slice(0, 12));
      await loadProfile();
    } catch (e: any) {
      const m = e?.message ?? "";
      if (m.includes("already in use") || m.includes("already initialized")) {
        await loadProfile(); return;
      } else if (m.includes("rejected") || m.includes("cancelled")) {
        setError("Transaction cancelled — click Register again and Approve in Phantom.");
      } else {
        setError(m || "Registration failed");
      }
    } finally { setLoading(false); }
  }

  async function handleClaimNft(rec: AttendedEvent) {
    if (!publicKey) return;
    setClaiming(rec.eventPubkey); setError(null); setSuccess(null);
    try {
      const res = await fetch("/api/mint-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
    const th: Record<MemberTier, [number, number]> = {
      Initiate: [0,1], Seeker:[1,3], Resident:[3,6], Builder:[6,11], Core:[11,21], Legend:[21,21],
    };
    const [lo, hi] = th[tier];
    if (tier === "Legend") return { pct: 100, next: "MAX TIER — LEGEND" };
    const next: Record<MemberTier, MemberTier> = {
      Initiate:"Seeker", Seeker:"Resident", Resident:"Builder", Builder:"Core", Core:"Legend", Legend:"Legend",
    };
    return { pct: Math.min(100, Math.round(((events - lo) / (hi - lo)) * 100)), next: `${hi - events} events to ${next[tier]}` };
  }

  const Nav = () => (
    <nav className="top-nav">
      <a href="/" className="nav-brand" style={{ textDecoration: "none" }}>STRATA</a>
      <div className="nav-links">
        <a href="/" className="nav-link">HOME</a>
        <a href="/organizer" className="nav-link">ORGANIZER</a>
        <a href="/profile" className="nav-link active">PROFILE</a>
        <WalletMultiButton />
      </div>
    </nav>
  );

  if (!connected || !publicKey) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="scanline" />
        <div className="page">
          <Nav />
          <h1>PROFILE</h1>
          <p className="sub">Your on-chain identity and reputation.</p>
          <div className="card connect-box">
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="scanline" />
      <div className="page">
        <Nav />
        <h1>PROFILE</h1>
        <p className="sub">On-chain identity · Permanent reputation · Proof of presence.</p>

        {error && (
          <div className="msg-err">
            {error}
            {(error.includes("SOL") || error.includes("faucet")) && (
              <div style={{ marginTop: ".4rem" }}>
                <a href="https://faucet.solana.com" target="_blank" rel="noreferrer" style={{ color: "#fbbf24" }}>
                  → faucet.solana.com ↗
                </a>
              </div>
            )}
          </div>
        )}
        {success && <div className="msg-ok">{success}</div>}

        {loading && !member && (
          <div className="card">
            <div style={{ color: "#374151", textAlign: "center", padding: "2rem", fontSize: ".82rem" }}>
              Loading chain data…
            </div>
          </div>
        )}

        {/* Not registered */}
        {!loading && !member && (
          <div className="card">
            <div className="card-title">Identity</div>
            <div className="identity-header">
              <div>
                <div className="wallet-addr" style={{ fontSize: ".72rem", color: "#6b7280", marginBottom: ".5rem" }}>
                  {publicKey.toBase58()}
                </div>
                <p style={{ fontSize: ".82rem", color: "#6b7280", lineHeight: 1.7 }}>
                  Not yet a Strata member. Register to start building your on-chain reputation.
                </p>
              </div>
              {balance !== null && (
                <span className={`sol-balance ${balance < 0.01 ? "sol-low" : "sol-ok"}`}>
                  {balance.toFixed(4)} SOL{balance < 0.01 ? " ⚠" : ""}
                </span>
              )}
            </div>
            {balance !== null && balance < 0.01 ? (
              <a href="https://faucet.solana.com" target="_blank" rel="noreferrer"
                style={{ display:"inline-block", padding:".6rem 1.4rem", border:"1px solid #fbbf24",
                  color:"#fbbf24", fontSize:".8rem", letterSpacing:".1em", borderRadius:"2px" }}>
                GET DEVNET SOL FIRST ↗
              </a>
            ) : (
              <button className="btn" disabled={loading} onClick={handleRegister}>
                {loading ? "Registering…" : "Register as Member"}
              </button>
            )}
          </div>
        )}

        {/* Member identity */}
        {member && tier && (
          <>
            <div className="card">
              <div className="card-title">Identity</div>
              <div className="identity-header">
                <div>
                  <div className="username">@{member.username}</div>
                  <div className="wallet-addr">{publicKey.toBase58()}</div>
                </div>
                {balance !== null && (
                  <span className={`sol-balance ${balance < 0.01 ? "sol-low" : "sol-ok"}`}>
                    {balance.toFixed(4)} SOL
                  </span>
                )}
              </div>

              <div className="tier-badge" style={{ background: `${color}12`, border: `1px solid ${color}44`, color }}>
                <span className="tier-dot" style={{ background: color }} />
                {tier.toUpperCase()}
                <span style={{ fontSize: ".62rem", opacity: .6 }}>· {TIER_THRESHOLD[tier]}</span>
              </div>

              <div className="stat-row">
                <div className="stat">
                  <div className="stat-val">{events}</div>
                  <div className="stat-lbl">Events</div>
                </div>
                <div className="stat">
                  <div className="stat-val">{rep}</div>
                  <div className="stat-lbl">Rep Score</div>
                </div>
                <div className="stat">
                  <div className="stat-val" style={{ fontSize: "1rem", paddingTop: ".3rem" }}>
                    {new Date(member.joinedAt.toNumber() * 1000).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </div>
                  <div className="stat-lbl">Joined</div>
                </div>
              </div>

              {progress && (
                <>
                  <div className="prog-bar">
                    <div className="prog-fill" style={{ width: `${progress.pct}%`, background: color }} />
                  </div>
                  <div className="prog-labels">
                    <span>{progress.pct}% progress</span>
                    <span>{progress.next}</span>
                  </div>
                </>
              )}
            </div>

            {/* Attendance + NFT claims */}
            <div className="card">
              <div className="card-title">
                Attendance History ({attended.length})
                {attended.filter(r => r.attendance.nftMint || minted[r.eventPubkey]).length > 0 && (
                  <span style={{ marginLeft: ".75rem", color: "#34d399" }}>
                    · {attended.filter(r => r.attendance.nftMint || minted[r.eventPubkey]).length} NFT{attended.filter(r => r.attendance.nftMint || minted[r.eventPubkey]).length > 1 ? "s" : ""} minted
                  </span>
                )}
              </div>

              {attended.length === 0 && (
                <div>
                  <div className="empty">No check-ins yet.</div>
                  <div className="how-to-nft">
                    <strong>HOW TO GET YOUR NFT:</strong><br />
                    1. Organizer creates &amp; starts an event at <a href="/organizer">/organizer</a><br />
                    2. Organizer shares the QR Blink URL<br />
                    3. <strong>You scan the QR with Phantom</strong> → one-tap check-in on-chain<br />
                    4. Come back here → <strong style={{ color: "#dc2626" }}>CLAIM NFT</strong> button appears below<br />
                    <br />
                    <strong>Testing solo?</strong> Go to <a href="/organizer">/organizer</a> → GO LIVE → click <strong>DEMO CHECK-IN</strong>
                  </div>
                </div>
              )}

              {attended.map((rec) => {
                const mintAddr = rec.attendance.nftMint?.toBase58() ?? minted[rec.eventPubkey];
                const hasMint = !!(rec.attendance.nftMint || minted[rec.eventPubkey]);
                return (
                  <div className="event-row" key={rec.eventPubkey}>
                    <div className="event-row-header">
                      <div>
                        <div className="event-name">{rec.event?.title ?? "Unknown Event"}</div>
                        <div className="event-meta">
                          {rec.event && `${rec.event.location}, ${rec.event.country} · `}
                          Checked in {new Date(rec.attendance.checkedInAt.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle: "medium" })}
                          {" "}· Edition #{rec.attendance.edition.toNumber()}
                          {" "}·{" "}
                          <a href={`https://explorer.solana.com/address/${rec.eventPubkey}?cluster=devnet`} target="_blank" rel="noreferrer">
                            Explorer ↗
                          </a>
                        </div>
                      </div>
                      <div style={{ paddingTop: ".1rem", flexShrink: 0 }}>
                        {hasMint ? (
                          <a
                            className="nft-claimed"
                            href={`https://explorer.solana.com/address/${mintAddr}?cluster=devnet`}
                            target="_blank" rel="noreferrer"
                          >
                            ✓ NFT MINTED — VIEW ↗
                          </a>
                        ) : (
                          <button
                            className="btn-claim"
                            onClick={() => handleClaimNft(rec)}
                            disabled={claiming === rec.eventPubkey}
                          >
                            {claiming === rec.eventPubkey ? (
                              <>
                                <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: ".8rem" }}>◈</span>
                                MINTING…
                              </>
                            ) : "✦ CLAIM NFT"}
                          </button>
                        )}
                      </div>
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
