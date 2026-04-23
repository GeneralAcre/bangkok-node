"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Nav } from "../components/Nav";
import { PageBackground } from "../components/PageBackground";
import { StatBox } from "../components/StatBox";
import { SCORE_TIER_COLOR, SCORE_TIER_BG, SCORE_TIER_ICON, StrataScoreTier } from "../utils/scoring";

const PROGRAM_ID_STR    = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "";
const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

interface OnChainEvent {
  title: string; location: string; country: string;
  status: string; attendeeCount: number; capacity: number; eventCode: string;
}

interface LbEntry {
  wallet: string; score: number; tier: StrataScoreTier; eventCount: number;
}

const PAGE_CSS = `
  /* ── Hero ── */
  .hero {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    text-align: center; padding: 8rem 1.5rem 5rem; position: relative;
  }
  .hero-inner { position: relative; z-index: 1; animation: fadeUp .8s ease both; }
  .hero-badge {
    display: inline-flex; align-items: center; gap: .5rem;
    background: var(--p-dim); border: 1px solid rgba(122,87,233,.25);
    backdrop-filter: blur(10px); color: var(--p2);
    font-size: .75rem; font-weight: 600; letter-spacing: .1em;
    padding: .4rem 1.1rem; border-radius: 100px; margin-bottom: 2rem;
    font-family: 'Space Grotesk', sans-serif;
  }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--g); animation: pulse 2s infinite; }
  .hero-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(3.5rem,10vw,8rem); font-weight: 800; line-height: .95;
    letter-spacing: -.03em; margin-bottom: 1.5rem;
  }
  .hero-title-grad {
    background: linear-gradient(135deg,#fff 0%,#c4b5fd 35%,var(--p) 55%,var(--g) 80%,#fff 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: gradMove 5s ease infinite, textGlow 4s ease infinite;
  }
  .hero-sub {
    font-size: clamp(1rem,2vw,1.2rem); color: #9ca3af; max-width: 520px;
    margin: 0 auto 2.5rem; line-height: 1.7; font-weight: 300;
  }
  .hero-ctas { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

  /* ── Buttons ── */
  .btn-primary {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem; background: var(--p); color: #fff;
    font-family: 'Space Grotesk', sans-serif; font-size: .92rem; font-weight: 700;
    border: none; border-radius: 12px; cursor: pointer; text-decoration: none;
    transition: all .25s; position: relative; overflow: hidden;
  }
  .btn-primary::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,.1) 100%);
    opacity: 0; transition: opacity .2s;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px var(--p-glow), 0 0 0 1px var(--p); }
  .btn-primary:hover::before { opacity: 1; }
  .btn-glass {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem; background: var(--surface2); color: #fff;
    font-family: 'Space Grotesk', sans-serif; font-size: .92rem; font-weight: 600;
    border: 1px solid var(--border-bright); border-radius: 12px; cursor: pointer;
    text-decoration: none; transition: all .25s; backdrop-filter: blur(10px);
  }
  .btn-glass:hover { border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.08); transform: translateY(-2px); }

  /* ── Stats ── */
  .stats-section { padding: 2rem 0 5rem; }
  .stats-grid {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 1px;
    background: var(--border); border-radius: 20px; overflow: hidden;
    border: 1px solid var(--border);
    animation: fadeUp .6s .2s ease both; opacity: 0; animation-fill-mode: forwards;
  }
  .stat-box {
    background: #050508; padding: 2rem 1.5rem; text-align: center;
    position: relative; overflow: hidden; transition: background .2s;
  }
  .stat-box:hover { background: rgba(122,87,233,.05); }
  .stat-box::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--p), transparent);
    animation: borderGlow 3s ease-in-out infinite;
  }
  .stat-val {
    font-family: 'Space Grotesk', sans-serif; font-size: 3rem; font-weight: 800;
    line-height: 1; margin-bottom: .4rem;
    background: linear-gradient(135deg,#fff,var(--p2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .stat-lbl { font-size: .72rem; color: var(--muted); letter-spacing: .12em; text-transform: uppercase; font-weight: 500; }
  @media(max-width:540px){ .stats-grid{ grid-template-columns: 1fr; } .stat-val{ font-size: 2.2rem; } }

  /* ── Section ── */
  .section { padding: 5rem 0; }
  .section-eyebrow {
    font-family: 'Space Grotesk', sans-serif; font-size: .72rem; font-weight: 700;
    letter-spacing: .2em; text-transform: uppercase; margin-bottom: 1rem;
    background: linear-gradient(135deg,var(--p),var(--g));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    display: inline-block;
  }
  .section-title {
    font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.75rem,4vw,2.5rem);
    font-weight: 800; letter-spacing: -.03em; margin-bottom: .75rem;
  }
  .section-sub { font-size: 1rem; color: #9ca3af; max-width: 480px; line-height: 1.7; }

  /* ── Steps ── */
  .steps { display: grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap: 1.5rem; margin-top: 3rem; }
  .step-card {
    background: var(--surface); backdrop-filter: blur(20px);
    border: 1px solid var(--border); border-radius: 20px; padding: 2rem;
    transition: all .3s; position: relative; overflow: hidden;
    animation: float 6s ease-in-out infinite;
  }
  .step-card:nth-child(2) { animation-delay: -.8s; }
  .step-card:nth-child(3) { animation-delay: -1.6s; }
  .step-card::before {
    content: ''; position: absolute; inset: 0; border-radius: 20px;
    background: linear-gradient(135deg,var(--p-glow),transparent,var(--g-glow));
    opacity: 0; transition: opacity .3s;
  }
  .step-card:hover { border-color: rgba(122,87,233,.4); transform: translateY(-6px) !important; box-shadow: 0 20px 50px rgba(0,0,0,.5), 0 0 30px var(--p-glow); }
  .step-card:hover::before { opacity: 1; }
  .step-num {
    width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg,var(--p),var(--p2)); color: #fff;
    font-family: 'Space Grotesk', sans-serif; font-size: .9rem; font-weight: 800;
    margin-bottom: 1.25rem; position: relative; z-index: 1; box-shadow: 0 4px 15px var(--p-glow);
  }
  .step-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; font-weight: 700; color: #fff; margin-bottom: .5rem; position: relative; z-index: 1; }
  .step-desc { font-size: .85rem; color: #9ca3af; line-height: 1.7; position: relative; z-index: 1; }

  /* ── Features ── */
  .features { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 1.5rem; margin-top: 3rem; }
  .feature-card {
    background: var(--surface); backdrop-filter: blur(20px);
    border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem;
    transition: all .3s; position: relative; overflow: hidden;
  }
  .feature-card:hover { border-color: rgba(140,233,164,.3); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,.4), 0 0 20px var(--g-glow); }
  .feature-icon {
    width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
    background: var(--g-dim); border: 1px solid var(--g-glow); font-size: 1.2rem; margin-bottom: 1.1rem;
  }
  .feature-title { font-family: 'Space Grotesk', sans-serif; font-size: .95rem; font-weight: 700; color: #fff; margin-bottom: .4rem; }
  .feature-desc { font-size: .82rem; color: #6b7280; line-height: 1.7; }

  /* ── Win ── */
  .win-section {
    position: relative; margin: 3rem 0; padding: 4rem 2.5rem; border-radius: 28px; overflow: hidden;
    background: linear-gradient(135deg,rgba(122,87,233,.08) 0%,rgba(0,0,0,.5) 50%,rgba(140,233,164,.06) 100%);
    border: 1px solid rgba(122,87,233,.2);
    animation: fadeUp .6s .3s ease both; opacity: 0; animation-fill-mode: forwards;
  }
  .win-section::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg,transparent 0%,rgba(122,87,233,.05) 100%);
  }
  .win-inner { position: relative; z-index: 1; }
  .win-trophy { font-size: 2.5rem; margin-bottom: 1rem; animation: float 4s ease-in-out infinite; display: inline-block; }
  .win-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.3rem,3vw,1.9rem); font-weight: 800; color: #fff; margin-bottom: .75rem; letter-spacing: -.02em; }
  .win-sub { font-size: .9rem; color: #9ca3af; max-width: 520px; margin: 0 auto 2.5rem; line-height: 1.7; }
  .win-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 1rem; text-align: left; }
  .win-card {
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
    border-radius: 14px; padding: 1.25rem; transition: all .2s;
  }
  .win-card:hover { background: rgba(122,87,233,.08); border-color: rgba(122,87,233,.2); }
  .win-icon { font-size: 1.3rem; margin-bottom: .6rem; }
  .win-card-title { font-family: 'Space Grotesk', sans-serif; font-size: .88rem; font-weight: 700; color: #fff; margin-bottom: .3rem; }
  .win-card-desc { font-size: .78rem; color: #6b7280; line-height: 1.6; }

  /* ── Events ── */
  .events-list { display: flex; flex-direction: column; gap: .75rem; margin-top: 1.5rem; }
  .event-row {
    background: var(--surface); backdrop-filter: blur(10px);
    border: 1px solid var(--border); border-radius: 14px;
    padding: 1rem 1.25rem; display: flex; align-items: center;
    justify-content: space-between; gap: 1rem; flex-wrap: wrap; transition: all .2s;
  }
  .event-row:hover { border-color: rgba(122,87,233,.3); background: rgba(122,87,233,.04); }
  .event-name { font-family: 'Space Grotesk', sans-serif; font-size: .9rem; font-weight: 600; color: #fff; }
  .event-detail { font-size: .75rem; color: var(--muted); margin-top: .15rem; }
  .badge-live {
    display: inline-flex; align-items: center; gap: .35rem;
    font-size: .7rem; font-weight: 600; color: var(--g);
    background: var(--g-dim); border: 1px solid var(--g-glow); padding: .25rem .8rem; border-radius: 100px;
  }
  .badge-live::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--g); animation: pulse 2s infinite; flex-shrink: 0; }
  .badge-upcoming { font-size: .7rem; font-weight: 500; color: #fbbf24; background: #fbbf2410; border: 1px solid #fbbf2435; padding: .25rem .8rem; border-radius: 100px; }
  .badge-ended { font-size: .7rem; color: #374151; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05); padding: .25rem .8rem; border-radius: 100px; }

  /* ── Wallet search bar ── */
  .wallet-search {
    display: flex; gap: .5rem; max-width: 480px; margin: 2rem auto 0;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
    backdrop-filter: blur(12px); border-radius: 14px; padding: .4rem .4rem .4rem 1rem;
    align-items: center;
  }
  .wallet-search input {
    flex: 1; background: transparent; border: none; outline: none; color: #fff;
    font-family: 'Space Mono', monospace; font-size: .75rem;
  }
  .wallet-search input::placeholder { color: rgba(255,255,255,.3); }
  .wallet-search button {
    background: var(--p); color: #fff; border: none; border-radius: 9px; padding: .45rem 1rem;
    font-family: 'Space Grotesk', sans-serif; font-size: .78rem; font-weight: 700; cursor: pointer;
    transition: background .15s; white-space: nowrap;
  }
  .wallet-search button:hover { background: #8B6EF0; }

  /* ── Hall of Fame ── */
  .hof-section { padding: 3rem 0 0; }
  .hof-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-top: 1.5rem; }
  @media(max-width:600px) { .hof-grid { grid-template-columns: 1fr; } }
  .hof-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 1.25rem 1.25rem 1rem; text-decoration: none; color: #fff;
    transition: all .2s; display: block;
  }
  .hof-card:hover { border-color: rgba(122,87,233,.35); background: rgba(122,87,233,.05); transform: translateY(-3px); }
  .hof-rank { font-family: 'Space Mono', monospace; font-size: 1.1rem; margin-bottom: .6rem; }
  .hof-wallet { font-family: 'Space Mono', monospace; font-size: .72rem; color: var(--muted); margin-bottom: .5rem; }
  .hof-score { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; font-weight: 800; color: #fff; line-height: 1; }
  .hof-score-lbl { font-size: .62rem; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; margin-top: .1rem; }
  .hof-tier { display: inline-flex; align-items: center; gap: .35rem; font-family: 'Space Grotesk', sans-serif; font-size: .7rem; font-weight: 600; padding: .25rem .7rem; border-radius: 100px; border: 1px solid currentColor; margin-top: .6rem; }

  /* ── Footer ── */
  .footer { border-top: 1px solid var(--border); padding: 3rem 0; margin-top: 2rem; position: relative; z-index: 1; }
  .footer-inner { max-width: 1400px; margin: 0 auto; padding: 0 2.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem; }
  .footer-brand { font-family: 'Space Grotesk', sans-serif; font-size: 1rem; font-weight: 800; }
  .footer-brand span { background: linear-gradient(135deg,var(--p2),var(--g)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .footer-link { font-size: .8rem; color: var(--muted); text-decoration: none; transition: color .2s; }
  .footer-link:hover { color: #fff; }
`;

const STEPS = [
  { n: "01", t: "Host an Event",   d: "Deploy your event on Solana with a unique code. One transaction — permanent on-chain record." },
  { n: "02", t: "Scan & Check In", d: "Attendees scan your QR or visit /checkin. One tap builds, signs, and confirms on Solana." },
  { n: "03", t: "Claim Your NFT",  d: "Every check-in unlocks a Metaplex NFT. Permanent proof of presence, forever in your wallet." },
];

const FEATURES = [
  { icon: "⛓", t: "100% On-Chain",    d: "Every attendance record is a Solana transaction. No server, no database, no trust." },
  { icon: "◎", t: "Metaplex NFTs",    d: "Real NFTs with event metadata, edition numbers, and on-chain provenance." },
  { icon: "✦", t: "Reputation Layer", d: "6-tier on-chain reputation. Every check-in compounds your standing." },
  { icon: "⬡", t: "Solana Blinks",    d: "QR codes are Solana Actions — Phantom opens them natively as transactions." },
];

const WIN_CARDS = [
  { icon: "⛓", t: "Fully On-Chain",    d: "Every check-in is a real Solana transaction. Zero off-chain trust. Tamper-proof forever." },
  { icon: "⬡", t: "Solana Blinks",     d: "QR codes are native Solana Actions. Phantom opens them as one-tap transactions." },
  { icon: "◎", t: "Metaplex NFTs",     d: "Real NFTs minted server-side with edition numbers and on-chain metadata." },
  { icon: "✦", t: "6-Tier Reputation", d: "Initiate → Legend. Your on-chain attendance history builds your identity." },
];

export default function HomePage() {
  const { connection } = useConnection();
  const [events,      setEvents]      = useState<OnChainEvent[]>([]);
  const [stats,       setStats]       = useState({ events: 0, members: 0, checkins: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [hallOfFame,  setHallOfFame]  = useState<LbEntry[]>([]);
  const [walletSearch, setWalletSearch] = useState("");

  useEffect(() => {
    async function load() {
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
      if (!COMMUNITY_PDA_STR) { setStatsLoaded(true); return; }
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

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(d => setHallOfFame((d.entries ?? []).slice(0, 3)))
      .catch(() => {});
  }, []);

  function handleWalletSearch(e: React.FormEvent) {
    e.preventDefault();
    const addr = walletSearch.trim();
    if (addr) window.location.href = `/profile/${addr}`;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <PageBackground />
      <Nav active="home" />

      <div className="page">
        {/* Hero */}
        <div className="hero">
          <div className="hero-inner">
            <div className="hero-badge">
              <span className="badge-dot" /> Built for Colosseum Hackathon · Solana Devnet
            </div>
            <h1 className="hero-title">
              <span className="hero-title-grad">Proof of<br />Presence.</span>
            </h1>
            <p className="hero-sub">
              Your on-chain builder identity. Verified by Solana.<br />
              Every check-in is permanent. Every event builds your score.
            </p>
            <div className="hero-ctas">
              <a href="/organizer"   className="btn-primary">⬡ &nbsp;Host an Event</a>
              <a href="/leaderboard" className="btn-glass">Leaderboard →</a>
            </div>
            <form className="wallet-search" onSubmit={handleWalletSearch}>
              <input
                value={walletSearch}
                onChange={e => setWalletSearch(e.target.value)}
                placeholder="Look up any wallet address…"
              />
              <button type="submit">Search →</button>
            </form>
          </div>
        </div>

        {/* Stats */}
        <div className="container stats-section">
          <div className="stats-grid">
            <StatBox target={stats.events}   label="Events On-Chain"     loaded={statsLoaded} />
            <StatBox target={stats.members}  label="Registered Members"  loaded={statsLoaded} />
            <StatBox target={stats.checkins} label="Proof-of-Presence"   loaded={statsLoaded} />
          </div>
        </div>

        {/* Hall of Fame */}
        {hallOfFame.length > 0 && (
          <div className="container hof-section">
            <div className="section-eyebrow">Hall of Fame</div>
            <h2 className="section-title">Top builders.</h2>
            <div className="hof-grid">
              {hallOfFame.map((entry, idx) => {
                const tc = SCORE_TIER_COLOR[entry.tier];
                const tb = SCORE_TIER_BG[entry.tier];
                const ti = SCORE_TIER_ICON[entry.tier];
                return (
                  <a key={entry.wallet} href={`/profile/${entry.wallet}`} className="hof-card">
                    <div className="hof-rank">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</div>
                    <div className="hof-wallet">{entry.wallet.slice(0,6)}…{entry.wallet.slice(-4)}</div>
                    <div className="hof-score">{entry.score.toLocaleString()}</div>
                    <div className="hof-score-lbl">Strata Score</div>
                    <div className="hof-tier" style={{ color: tc, background: tb, borderColor: tc + "50" }}>
                      {ti} {entry.tier}
                    </div>
                  </a>
                );
              })}
            </div>
            <div style={{ textAlign: "right", marginTop: ".75rem" }}>
              <a href="/leaderboard" style={{ fontSize: ".78rem", color: "var(--muted)", textDecoration: "none" }}>
                Full leaderboard →
              </a>
            </div>
          </div>
        )}

        {/* Why we win */}
        <div className="container">
          <div className="win-section">
            <div className="win-inner" style={{ textAlign: "center" }}>
              <div className="win-grid">
                {WIN_CARDS.map(p => (
                  <div className="win-card" key={p.t}>
                    <div className="win-icon">{p.icon}</div>
                    <div className="win-card-title">{p.t}</div>
                    <div className="win-card-desc">{p.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="container section">
          <div className="section-eyebrow">How it works</div>
          <h2 className="section-title">Three steps. Fully on-chain.</h2>
          <p className="section-sub">No app download. No centralized backend. No trust required.</p>
          <div className="steps">
            {STEPS.map(s => (
              <div className="step-card" key={s.n}>
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.t}</div>
                <div className="step-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="container" style={{ paddingBottom: "5rem" }}>
          <div className="section-eyebrow">Protocol Stack</div>
          <h2 className="section-title">Built on Solana.</h2>
          <div className="features">
            {FEATURES.map(f => (
              <div className="feature-card" key={f.t}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.t}</div>
                <div className="feature-desc">{f.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live events */}
        {events.length > 0 && (
          <div className="container" style={{ paddingBottom: "5rem" }}>
            <div className="section-eyebrow">On-Chain Now</div>
            <h2 className="section-title">Recent events.</h2>
            <div className="events-list">
              {events.map((ev, i) => (
                <div className="event-row" key={i}>
                  <div>
                    <div className="event-name">{ev.title}</div>
                    <div className="event-detail">{ev.location}, {ev.country} · {ev.attendeeCount}/{ev.capacity} · #{ev.eventCode}</div>
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
            <div className="footer-brand">STR<span>ATA</span></div>
            <div style={{ fontSize: ".72rem", color: "#374151", marginTop: ".25rem" }}>Proof of Presence Protocol · Solana Devnet</div>
          </div>
          <div className="footer-links">
            <a href="/organizer"   className="footer-link">Organizer</a>
            <a href="/leaderboard" className="footer-link">Leaderboard</a>
            <a href="/profile"     className="footer-link">Profile</a>
            {PROGRAM_ID_STR && (
              <a href={`https://explorer.solana.com/address/${PROGRAM_ID_STR}?cluster=devnet`} target="_blank" rel="noreferrer" className="footer-link">Program ↗</a>
            )}
            <a href="https://github.com/GeneralAcre/bangkok-node" target="_blank" rel="noreferrer" className="footer-link">GitHub ↗</a>
          </div>
        </div>
      </footer>
    </>
  );
}
