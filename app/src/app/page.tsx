"use client";

import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #000; color: #fff; font-family: 'Inter', sans-serif; min-height: 100vh; overflow-x: hidden; }

  :root {
    --green:  #8CE9A4;
    --purple: #7A57E9;
    --white:  #FFFFFF;
    --black:  #000000;
    --green-dim:  #8CE9A420;
    --purple-dim: #7A57E920;
    --green-border:  #8CE9A440;
    --purple-border: #7A57E940;
    --surface: #0a0a0f;
    --surface2: #111118;
    --border: #1e1e2e;
    --text-muted: #6b7280;
    --text-dim: #374151;
  }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes pulse    { 0%,100%{opacity:.7} 50%{opacity:1} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes gradMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes scanline { 0%{top:-4px} 100%{top:100vh} }
  @keyframes glow     { 0%,100%{box-shadow:0 0 20px #7A57E930} 50%{box-shadow:0 0 40px #7A57E960} }

  .scanline {
    position:fixed; top:0; left:0; right:0; height:2px; z-index:999; pointer-events:none;
    background:linear-gradient(transparent, #7A57E915, transparent);
    animation:scanline 12s linear infinite;
  }

  /* ── NAV ── */
  .nav {
    position:sticky; top:0; z-index:100;
    background:rgba(0,0,0,.85); backdrop-filter:blur(20px);
    border-bottom:1px solid var(--border);
    padding:0 1.5rem;
  }
  .nav-inner {
    max-width:1100px; margin:0 auto;
    display:flex; align-items:center; justify-content:space-between;
    height:60px;
  }
  .nav-brand {
    font-family:'Space Grotesk',sans-serif; font-size:1.25rem; font-weight:700;
    background:linear-gradient(135deg,var(--purple),var(--green));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text; letter-spacing:.05em; text-decoration:none;
  }
  .nav-links { display:flex; gap:.5rem; align-items:center; }
  .nav-link {
    font-family:'Space Grotesk',sans-serif; font-size:.8rem; font-weight:500;
    color:var(--text-muted); text-decoration:none; padding:.4rem .8rem;
    border-radius:6px; transition:all .2s; letter-spacing:.03em;
  }
  .nav-link:hover { color:#fff; background:var(--purple-dim); }
  .nav-link.active { color:var(--purple); }
  @media(max-width:640px) { .nav-links .nav-link:not(.active) { display:none; } }

  /* ── LAYOUT ── */
  .page { max-width:1100px; margin:0 auto; padding:0 1.5rem; }

  /* ── HERO ── */
  .hero {
    padding:5rem 0 4rem; text-align:center;
    animation:fadeUp .6s ease both;
  }
  .hero-badge {
    display:inline-flex; align-items:center; gap:.5rem;
    background:var(--purple-dim); border:1px solid var(--purple-border);
    color:var(--purple); font-size:.75rem; font-weight:600; letter-spacing:.08em;
    padding:.35rem 1rem; border-radius:100px; margin-bottom:2rem;
    font-family:'Space Grotesk',sans-serif;
  }
  .hero-badge-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse 2s infinite; }
  .hero-title {
    font-family:'Space Grotesk',sans-serif; font-size:clamp(3rem,8vw,6rem);
    font-weight:700; letter-spacing:-.02em; line-height:1.05;
    margin-bottom:1.25rem;
  }
  .hero-title-main {
    background:linear-gradient(135deg,#fff 0%,var(--purple) 50%,var(--green) 100%);
    background-size:200% 200%; animation:gradMove 4s ease infinite;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .hero-sub {
    font-size:clamp(1rem,2.5vw,1.2rem); color:#9ca3af; max-width:560px;
    margin:0 auto 2.5rem; line-height:1.7; font-weight:400;
  }
  .hero-ctas { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; }

  .btn-primary {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.8rem 1.8rem; background:var(--purple); color:#fff;
    font-family:'Space Grotesk',sans-serif; font-size:.9rem; font-weight:600;
    border:none; border-radius:10px; cursor:pointer; text-decoration:none;
    transition:all .2s; letter-spacing:.02em;
    box-shadow:0 0 0 0 var(--purple);
  }
  .btn-primary:hover { background:#8B6EF0; transform:translateY(-1px); box-shadow:0 8px 25px #7A57E940; }

  .btn-outline {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.8rem 1.8rem; background:transparent; color:#fff;
    font-family:'Space Grotesk',sans-serif; font-size:.9rem; font-weight:600;
    border:1px solid var(--border); border-radius:10px; cursor:pointer; text-decoration:none;
    transition:all .2s; letter-spacing:.02em;
  }
  .btn-outline:hover { border-color:var(--purple); color:var(--purple); transform:translateY(-1px); }

  /* ── STATS ── */
  .stats {
    display:grid; grid-template-columns:repeat(3,1fr); gap:1px;
    background:var(--border); border:1px solid var(--border); border-radius:16px;
    overflow:hidden; margin:3rem 0;
    animation:fadeUp .6s .15s ease both; opacity:0; animation-fill-mode:forwards;
  }
  .stat { background:var(--surface); padding:1.75rem 1.5rem; text-align:center; }
  .stat-val {
    font-family:'Space Grotesk',sans-serif; font-size:2.5rem; font-weight:700;
    background:linear-gradient(135deg,var(--purple),var(--green));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    line-height:1; margin-bottom:.4rem;
  }
  .stat-lbl { font-size:.75rem; color:var(--text-muted); font-weight:500; letter-spacing:.05em; text-transform:uppercase; }
  @media(max-width:480px) { .stats { grid-template-columns:1fr; } .stat-val { font-size:2rem; } }

  /* ── SECTION ── */
  .section { padding:3rem 0; animation:fadeUp .6s .25s ease both; opacity:0; animation-fill-mode:forwards; }
  .section-eyebrow {
    font-family:'Space Grotesk',sans-serif; font-size:.72rem; font-weight:600;
    color:var(--purple); letter-spacing:.15em; text-transform:uppercase; margin-bottom:.75rem;
  }
  .section-title {
    font-family:'Space Grotesk',sans-serif; font-size:clamp(1.5rem,3vw,2rem);
    font-weight:700; color:#fff; margin-bottom:.75rem; letter-spacing:-.02em;
  }
  .section-sub { font-size:.95rem; color:#9ca3af; max-width:480px; line-height:1.7; }

  /* ── HOW IT WORKS ── */
  .steps {
    display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:1.5rem;
    margin-top:2rem;
  }
  .step {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    padding:1.75rem; transition:border-color .2s, transform .2s;
  }
  .step:hover { border-color:var(--purple-border); transform:translateY(-2px); }
  .step-num {
    width:36px; height:36px; border-radius:10px;
    background:var(--purple-dim); color:var(--purple);
    font-family:'Space Grotesk',sans-serif; font-size:.85rem; font-weight:700;
    display:flex; align-items:center; justify-content:center; margin-bottom:1rem;
  }
  .step-title { font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:600; color:#fff; margin-bottom:.5rem; }
  .step-desc { font-size:.85rem; color:#9ca3af; line-height:1.7; }

  /* ── FEATURES ── */
  .features { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1.5rem; margin-top:2rem; }
  .feature {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    padding:1.75rem; transition:border-color .2s, transform .2s;
  }
  .feature:hover { border-color:var(--green-border); transform:translateY(-2px); }
  .feature-icon {
    width:44px; height:44px; border-radius:12px;
    background:var(--green-dim); color:var(--green);
    font-size:1.1rem; display:flex; align-items:center; justify-content:center;
    margin-bottom:1rem;
  }
  .feature-title { font-family:'Space Grotesk',sans-serif; font-size:.95rem; font-weight:600; color:#fff; margin-bottom:.4rem; }
  .feature-desc { font-size:.82rem; color:#6b7280; line-height:1.7; }

  /* ── WIN SECTION ── */
  .win-section {
    background:linear-gradient(135deg,#0a0516 0%,#050d0a 100%);
    border:1px solid var(--border); border-radius:20px;
    padding:3rem 2rem; margin:3rem 0; text-align:center;
    position:relative; overflow:hidden;
    animation:fadeUp .6s .35s ease both; opacity:0; animation-fill-mode:forwards;
  }
  .win-section::before {
    content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%;
    background:radial-gradient(circle at center, #7A57E908 0%, transparent 60%);
    pointer-events:none;
  }
  .win-badge {
    display:inline-flex; align-items:center; gap:.5rem;
    background:linear-gradient(135deg,var(--purple-dim),var(--green-dim));
    border:1px solid var(--purple-border); border-radius:100px;
    padding:.4rem 1.1rem; font-size:.75rem; font-weight:600; letter-spacing:.05em;
    color:#fff; margin-bottom:1.5rem; font-family:'Space Grotesk',sans-serif;
  }
  .win-title {
    font-family:'Space Grotesk',sans-serif; font-size:clamp(1.4rem,3vw,1.9rem);
    font-weight:700; color:#fff; margin-bottom:1rem; letter-spacing:-.02em;
  }
  .win-points {
    display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem;
    margin-top:2rem; text-align:left;
  }
  .win-point {
    background:#ffffff08; border:1px solid #ffffff0d; border-radius:12px;
    padding:1.25rem;
  }
  .win-point-icon { font-size:1.2rem; margin-bottom:.5rem; }
  .win-point-title { font-family:'Space Grotesk',sans-serif; font-size:.88rem; font-weight:600; color:#fff; margin-bottom:.3rem; }
  .win-point-desc { font-size:.78rem; color:#6b7280; line-height:1.6; }

  /* ── LIVE EVENTS ── */
  .events-list { margin-top:1.5rem; display:flex; flex-direction:column; gap:.75rem; }
  .event-item {
    background:var(--surface); border:1px solid var(--border); border-radius:12px;
    padding:1rem 1.25rem; display:flex; align-items:center; justify-content:space-between;
    gap:1rem; flex-wrap:wrap; transition:border-color .2s;
  }
  .event-item:hover { border-color:var(--purple-border); }
  .event-name { font-family:'Space Grotesk',sans-serif; font-size:.9rem; font-weight:600; color:#fff; }
  .event-detail { font-size:.75rem; color:var(--text-muted); margin-top:.15rem; }
  .badge-live {
    display:inline-flex; align-items:center; gap:.35rem; font-size:.72rem; font-weight:600;
    color:var(--green); background:var(--green-dim); border:1px solid var(--green-border);
    padding:.25rem .75rem; border-radius:100px;
  }
  .badge-live::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse 2s infinite; }
  .badge-upcoming { display:inline-flex; font-size:.72rem; font-weight:600; color:#fbbf24; background:#fbbf2415; border:1px solid #fbbf2440; padding:.25rem .75rem; border-radius:100px; }
  .badge-ended { display:inline-flex; font-size:.72rem; font-weight:500; color:#374151; background:#11111a; border:1px solid #1e1e2e; padding:.25rem .75rem; border-radius:100px; }

  /* ── FOOTER ── */
  .footer {
    border-top:1px solid var(--border); padding:2.5rem 0;
    animation:fadeUp .6s .5s ease both; opacity:0; animation-fill-mode:forwards;
  }
  .footer-inner { max-width:1100px; margin:0 auto; padding:0 1.5rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; }
  .footer-brand { font-family:'Space Grotesk',sans-serif; font-size:.9rem; font-weight:700; color:#fff; }
  .footer-links { display:flex; gap:1.5rem; flex-wrap:wrap; }
  .footer-link { font-size:.8rem; color:var(--text-muted); text-decoration:none; transition:color .2s; }
  .footer-link:hover { color:#fff; }
  .footer-copy { font-size:.75rem; color:var(--text-dim); }

  /* ── WALLET ── */
  .wallet-adapter-button {
    background:var(--purple) !important; color:#fff !important;
    font-family:'Space Grotesk',sans-serif !important; font-size:.8rem !important;
    font-weight:600 !important; letter-spacing:.03em !important;
    border-radius:8px !important; padding:.45rem 1rem !important;
    height:auto !important; border:none !important;
  }
  .wallet-adapter-button:hover { background:#8B6EF0 !important; }
  .wallet-adapter-button-trigger { background:var(--purple) !important; }
`;

const PROGRAM_ID_STR = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "";
const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

interface OnChainEvent {
  title: string; location: string; country: string;
  status: string; attendeeCount: number; capacity: number; eventCode: string;
}

export default function HomePage() {
  const { connection } = useConnection();
  const [events,      setEvents]      = useState<OnChainEvent[]>([]);
  const [stats,       setStats]       = useState({ events: 0, members: 0, checkins: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      // Try server-side stats API first (faster, avoids devnet timeout)
      try {
        const r = await fetch("/api/stats");
        if (r.ok) {
          const d = await r.json();
          setStats({ events: d.events ?? 0, members: d.members ?? 0, checkins: d.checkins ?? 0 });
          setEvents((d.recentEvents ?? []).slice(0, 4));
          setStatsLoaded(true);
          return;
        }
      } catch {}

      // Fallback: client-side devnet fetch
      if (!COMMUNITY_PDA_STR || !PROGRAM_ID_STR) { setStatsLoaded(true); return; }
      try {
        const [{ default: idl }, { AnchorProvider }, { StrataClient, findEventPDA, parseEventStatus }] = await Promise.all([
          import("../idl/strata.json"),
          import("@coral-xyz/anchor"),
          import("../utils/strata-client"),
        ]);
        const dummy = { publicKey: PublicKey.default, signTransaction: async (t: any) => t, signAllTransactions: async (ts: any[]) => ts };
        const provider = new AnchorProvider(connection, dummy as any, { commitment: "confirmed" });
        const client = new StrataClient(provider, idl);
        const community = new PublicKey(COMMUNITY_PDA_STR);
        const commAcc = await client.getCommunity(community);
        const count = commAcc.eventCount.toNumber();
        const loaded: OnChainEvent[] = [];
        let checkins = 0;
        for (let i = 0; i < count; i++) {
          const [ePDA] = findEventPDA(community, i);
          try {
            const acc = await client.getEvent(ePDA);
            checkins += acc.attendeeCount.toNumber();
            loaded.push({ title: acc.title, location: acc.location, country: acc.country, status: parseEventStatus(acc.status), attendeeCount: acc.attendeeCount.toNumber(), capacity: acc.capacity.toNumber(), eventCode: acc.eventCode });
          } catch {}
        }
        setEvents(loaded.reverse().slice(0, 4));
        setStats({ events: count, members: commAcc.memberCount.toNumber(), checkins });
      } catch {}
      setStatsLoaded(true);
    }
    load();
  }, [connection]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="scanline" />

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-brand">STRATA</a>
          <div className="nav-links">
            <a href="/" className="nav-link active">Home</a>
            <a href="/organizer" className="nav-link">Organizer</a>
            <a href="/profile" className="nav-link">Profile</a>
            <WalletMultiButton />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="page">
        <div className="hero">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Built for Colosseum Hackathon · Solana Devnet
          </div>
          <h1 className="hero-title">
            <span className="hero-title-main">Proof of Presence</span><br />
            <span style={{ color: "#fff", fontSize: "clamp(1.8rem,5vw,3.5rem)", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>on Solana.</span>
          </h1>
          <p className="hero-sub">
            Every event. Every check-in. Permanently on-chain.<br />
            Scan a QR with Phantom — mint your NFT in one tap.
          </p>
          <div className="hero-ctas">
            <a href="/organizer" className="btn-primary">⬡ Host an Event</a>
            <a href="/profile" className="btn-outline">My Profile →</a>
          </div>
        </div>

        {/* Stats */}
        <div className="stats">
          {[
            { val: stats.events,   lbl: "Events On-Chain" },
            { val: stats.members,  lbl: "Registered Members" },
            { val: stats.checkins, lbl: "Proof-of-Presence" },
          ].map(s => (
            <div className="stat" key={s.lbl}>
              {!statsLoaded ? (
                <div style={{ height:"2.5rem", background:"linear-gradient(90deg,#1e1e2e 25%,#2d2d4e 50%,#1e1e2e 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite", borderRadius:8, marginBottom:".4rem" }} />
              ) : (
                <div className="stat-val">{s.val}</div>
              )}
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Why Strata Wins */}
        <div className="win-section">
          <div className="win-badge">🏆 Colosseum Hackathon · Strata Protocol</div>
          <h2 className="win-title">Why Strata wins the hackathon</h2>
          <p style={{ color: "#9ca3af", fontSize: ".9rem", maxWidth: 540, margin: "0 auto" }}>
            Real product. Real transactions. Real innovation — not a mock-up.
          </p>
          <div className="win-points">
            {[
              { icon: "⛓", title: "Fully On-Chain", desc: "Every check-in is a Solana transaction. Zero off-chain trust. Tamper-proof attendance forever." },
              { icon: "⬡", title: "Solana Blinks", desc: "QR codes are native Solana Actions. Phantom opens them as one-tap transactions — no app download." },
              { icon: "◎", title: "Metaplex NFTs", desc: "Each attendance mints a real Metaplex NFT. Edition numbers, event metadata, wallet-owned forever." },
              { icon: "✦", title: "Reputation Layer", desc: "6-tier on-chain reputation system. Initiate → Legend. Your attendance history is your on-chain identity." },
            ].map(p => (
              <div className="win-point" key={p.title}>
                <div className="win-point-icon">{p.icon}</div>
                <div className="win-point-title">{p.title}</div>
                <div className="win-point-desc">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="section">
          <div className="section-eyebrow">How it works</div>
          <h2 className="section-title">Three steps. Fully on-chain.</h2>
          <p className="section-sub">No app download, no centralized backend, no trust required.</p>
          <div className="steps">
            {[
              { n: "01", title: "Host an Event", desc: "Deploy your event on Solana with a unique 8-char code. One transaction — permanent record on-chain." },
              { n: "02", title: "Scan & Check In", desc: "Attendees scan your QR with Phantom. Auto-builds, signs, and confirms the check-in in one tap." },
              { n: "03", title: "Claim Your NFT", desc: "Every check-in unlocks a Metaplex NFT. Permanent proof of presence, forever in your wallet." },
            ].map(s => (
              <div className="step" key={s.n}>
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="section" style={{ paddingTop: 0 }}>
          <div className="section-eyebrow">Built on Solana</div>
          <h2 className="section-title">Protocol-grade infrastructure.</h2>
          <div className="features">
            {[
              { icon: "⛓", title: "100% On-Chain", desc: "Every attendance record is a Solana transaction. No server, no database, no trust." },
              { icon: "◎", title: "Metaplex NFTs", desc: "Real NFTs with event metadata, edition numbers, and on-chain provenance." },
              { icon: "✦", title: "6-Tier Reputation", desc: "Initiate → Legend. Your tier grows with every verified on-chain check-in." },
              { icon: "⬡", title: "Solana Blinks", desc: "QR codes are Solana Actions — Phantom opens them natively, no redirect needed." },
            ].map(f => (
              <div className="feature" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Events */}
        {events.length > 0 && (
          <div className="section" style={{ paddingTop: 0 }}>
            <div className="section-eyebrow">On-Chain Now</div>
            <h2 className="section-title">Recent events.</h2>
            <div className="events-list">
              {events.map((ev, i) => (
                <div className="event-item" key={i}>
                  <div>
                    <div className="event-name">{ev.title}</div>
                    <div className="event-detail">{ev.location}, {ev.country} · {ev.attendeeCount}/{ev.capacity} checked in · #{ev.eventCode}</div>
                  </div>
                  {ev.status === "Live"     && <span className="badge-live">LIVE</span>}
                  {ev.status === "Upcoming" && <span className="badge-upcoming">UPCOMING</span>}
                  {ev.status === "Ended"    && <span className="badge-ended">ENDED</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="footer-brand">STRATA</div>
            <div className="footer-copy" style={{ marginTop: ".25rem" }}>Proof of Presence Protocol · Solana Devnet</div>
          </div>
          <div className="footer-links">
            <a href="/organizer" className="footer-link">Organizer</a>
            <a href="/profile" className="footer-link">Profile</a>
            {PROGRAM_ID_STR && <a href={`https://explorer.solana.com/address/${PROGRAM_ID_STR}?cluster=devnet`} target="_blank" rel="noreferrer" className="footer-link">Program ↗</a>}
            <a href="https://github.com/GeneralAcre/bangkok-node" target="_blank" rel="noreferrer" className="footer-link">GitHub ↗</a>
          </div>
        </div>
      </footer>
    </>
  );
}
