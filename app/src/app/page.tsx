"use client";

import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #000; color: #e2e8f0; font-family: 'Share Tech Mono', monospace; min-height: 100vh; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes glitch {
    0%,88%,100% { transform:translate(0); filter:none; }
    89% { transform:translate(-3px,1px); filter:grayscale(1) contrast(2); clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%); }
    90% { transform:translate(3px,-1px); clip-path:polygon(0 60%,100% 60%,100% 80%,0 80%); }
    91% { transform:translate(0); filter:none; clip-path:none; }
  }
  @keyframes scanline { 0%{top:-20px} 100%{top:100vh} }
  @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }

  .page { max-width:1000px; margin:0 auto; padding:2rem 1.5rem; }
  .scanline {
    position:fixed; top:0; left:0; right:0; height:2px;
    background:linear-gradient(transparent,rgba(220,38,38,.06),transparent);
    animation:scanline 10s linear infinite; pointer-events:none; z-index:999;
  }

  .top-nav {
    display:flex; align-items:center; justify-content:space-between;
    border-bottom:1px solid #111; padding-bottom:1.25rem; margin-bottom:3rem;
  }
  .nav-brand { font-family:'Cinzel Decorative',serif; font-size:1.1rem; color:#dc2626; letter-spacing:.15em; }
  .nav-links { display:flex; gap:.75rem; align-items:center; }
  .nav-link {
    font-size:.72rem; color:#6b7280; text-decoration:none; letter-spacing:.1em;
    padding:.3rem .7rem; border:1px solid #1a1a1a; border-radius:2px; transition:all .2s;
  }
  .nav-link:hover,.nav-link.active { color:#dc2626; border-color:#dc2626; }

  .hero { text-align:center; padding:3.5rem 0 2rem; animation:fadeUp .5s ease both; }
  .hero-eyebrow { font-size:.65rem; color:#7f1d1d; letter-spacing:.3em; margin-bottom:1.2rem; text-transform:uppercase; }
  .hero-title {
    font-family:'Cinzel Decorative',serif; font-size:clamp(2.5rem,7vw,4.5rem);
    color:#dc2626; letter-spacing:.1em; line-height:1; margin-bottom:.6rem;
    animation:glitch 9s infinite;
  }
  .hero-tagline { font-size:clamp(.75rem,2vw,.95rem); color:#9ca3af; letter-spacing:.08em; margin-bottom:.5rem; }
  .hero-sub { font-size:.78rem; color:#4b5563; max-width:500px; margin:.75rem auto 2.25rem; line-height:1.8; }
  .hero-ctas { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; }

  .cta-primary {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.9rem 2.2rem; background:#991b1b; border:1px solid #dc2626;
    color:#fff; font-family:'Rajdhani',sans-serif; font-size:1rem; font-weight:700;
    letter-spacing:.12em; text-transform:uppercase; text-decoration:none;
    border-radius:2px; transition:all .2s;
  }
  .cta-primary:hover { background:#dc2626; box-shadow:0 0 24px rgba(220,38,38,.25); }
  .cta-ghost {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.9rem 2.2rem; background:transparent; border:1px solid #374151;
    color:#9ca3af; font-family:'Rajdhani',sans-serif; font-size:1rem; font-weight:700;
    letter-spacing:.12em; text-transform:uppercase; text-decoration:none;
    border-radius:2px; transition:all .2s;
  }
  .cta-ghost:hover { border-color:#dc2626; color:#dc2626; }

  .divider { height:1px; background:linear-gradient(90deg,transparent,#1a1a1a 30%,#1a1a1a 70%,transparent); margin:2.5rem 0; }

  .stats-bar {
    display:grid; grid-template-columns:repeat(3,1fr); gap:1px;
    background:#111; border:1px solid #111; margin-bottom:3rem;
    animation:fadeUp .5s .1s ease both; opacity:0; animation-fill-mode:forwards;
  }
  .stat-item { background:#050505; text-align:center; padding:1.25rem 1rem; }
  .stat-val { font-size:2rem; font-weight:700; color:#dc2626; font-family:'Rajdhani',sans-serif; line-height:1; }
  .stat-lbl { font-size:.6rem; color:#374151; letter-spacing:.2em; margin-top:.3rem; text-transform:uppercase; }

  .section-title { font-size:.62rem; color:#374151; letter-spacing:.3em; text-align:center; margin-bottom:1.25rem; text-transform:uppercase; }

  .steps {
    display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1px;
    background:#111; border:1px solid #111; margin-bottom:3rem;
    animation:fadeUp .5s .2s ease both; opacity:0; animation-fill-mode:forwards;
  }
  .step { background:#050505; padding:1.75rem 1.5rem; }
  .step-num { font-size:2.5rem; color:#0d0000; font-family:'Rajdhani',sans-serif; font-weight:700; line-height:1; margin-bottom:.5rem; }
  .step-icon { font-size:1.5rem; margin-bottom:.6rem; color:#7f1d1d; }
  .step-title { font-size:.82rem; color:#f87171; margin-bottom:.5rem; letter-spacing:.08em; font-family:'Rajdhani',sans-serif; font-weight:700; text-transform:uppercase; }
  .step-desc { font-size:.72rem; color:#4b5563; line-height:1.7; }

  .features {
    display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1px;
    background:#111; border:1px solid #111; margin-bottom:3rem;
    animation:fadeUp .5s .3s ease both; opacity:0; animation-fill-mode:forwards;
  }
  .feature { background:#050505; padding:1.5rem; }
  .feature-icon { font-size:1.3rem; margin-bottom:.6rem; }
  .feature-title { font-size:.78rem; color:#e2e8f0; margin-bottom:.4rem; letter-spacing:.06em; font-family:'Rajdhani',sans-serif; font-weight:700; text-transform:uppercase; }
  .feature-desc { font-size:.7rem; color:#374151; line-height:1.7; }

  .events-section { animation:fadeUp .5s .4s ease both; opacity:0; animation-fill-mode:forwards; margin-bottom:3rem; }
  .event-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:.85rem 1.25rem; border:1px solid #111; background:#050505;
    margin-bottom:1px; gap:1rem; flex-wrap:wrap; transition:border-color .2s;
  }
  .event-row:hover { border-color:#7f1d1d; }
  .event-name { font-size:.85rem; color:#e2e8f0; font-family:'Rajdhani',sans-serif; font-weight:600; }
  .event-detail { font-size:.68rem; color:#374151; margin-top:.15rem; }
  .badge-live { font-size:.6rem; color:#34d399; border:1px solid #065f46; padding:2px 8px; border-radius:2px; animation:pulse 2s infinite; }
  .badge-upcoming { font-size:.6rem; color:#fbbf24; border:1px solid #78350f; padding:2px 8px; border-radius:2px; }
  .badge-ended { font-size:.6rem; color:#1f2937; border:1px solid #111; padding:2px 8px; border-radius:2px; }

  .footer {
    border-top:1px solid #0a0a0a; padding:2rem 0 3rem; text-align:center;
    animation:fadeUp .5s .5s ease both; opacity:0; animation-fill-mode:forwards;
  }
  .footer-links { display:flex; justify-content:center; gap:2rem; flex-wrap:wrap; }
  .footer-link { font-size:.65rem; color:#1f2937; letter-spacing:.1em; text-decoration:none; transition:color .2s; }
  .footer-link:hover { color:#dc2626; }

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

const PROGRAM_ID_STR = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "";
const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

interface OnChainEvent {
  title: string; location: string; country: string;
  status: string; attendeeCount: number; capacity: number; eventCode: string;
}

export default function HomePage() {
  const { connection } = useConnection();
  const [events, setEvents] = useState<OnChainEvent[]>([]);
  const [stats, setStats] = useState({ events: 0, members: 0, checkins: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadChainData() {
      if (!COMMUNITY_PDA_STR || !PROGRAM_ID_STR) return;
      try {
        const [{ default: idl }, { AnchorProvider }, { StrataClient, findEventPDA, parseEventStatus }] =
          await Promise.all([
            import("../idl/strata.json"),
            import("@coral-xyz/anchor"),
            import("../utils/strata-client"),
          ]);
        const dummy = {
          publicKey: PublicKey.default,
          signTransaction: async (t: any) => t,
          signAllTransactions: async (ts: any[]) => ts,
        };
        const provider = new AnchorProvider(connection, dummy as any, { commitment: "confirmed" });
        const client = new StrataClient(provider, idl);
        const community = new PublicKey(COMMUNITY_PDA_STR);
        const commAcc = await client.getCommunity(community);
        const count = commAcc.eventCount.toNumber();
        const memberCount = commAcc.memberCount.toNumber();
        const loaded: OnChainEvent[] = [];
        let totalCheckins = 0;
        for (let i = 0; i < count; i++) {
          const [ePDA] = findEventPDA(community, i);
          try {
            const acc = await client.getEvent(ePDA);
            totalCheckins += acc.attendeeCount.toNumber();
            loaded.push({
              title: acc.title, location: acc.location, country: acc.country,
              status: parseEventStatus(acc.status),
              attendeeCount: acc.attendeeCount.toNumber(),
              capacity: acc.capacity.toNumber(), eventCode: acc.eventCode,
            });
          } catch {}
        }
        setEvents(loaded.reverse().slice(0, 4));
        setStats({ events: count, members: memberCount, checkins: totalCheckins });
      } catch {}
      setLoaded(true);
    }
    loadChainData();
  }, [connection]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="scanline" />
      <div className="page">

        {/* Nav */}
        <nav className="top-nav">
          <span className="nav-brand">STRATA</span>
          <div className="nav-links">
            <a href="/" className="nav-link active">HOME</a>
            <a href="/organizer" className="nav-link">ORGANIZER</a>
            <a href="/profile" className="nav-link">PROFILE</a>
            <WalletMultiButton />
          </div>
        </nav>

        {/* Hero */}
        <div className="hero">
          <div className="hero-eyebrow">◈ &nbsp; PROOF OF PRESENCE PROTOCOL &nbsp; ◈</div>
          <h1 className="hero-title">STRATA</h1>
          <p className="hero-tagline">ON-CHAIN ATTENDANCE · PERMANENT REPUTATION · CLAIMABLE NFTS</p>
          <p className="hero-sub">
            Every event you attend becomes an on-chain record.<br />
            Scan a QR. One tap in Phantom. Mint your proof forever.
          </p>
          <div className="hero-ctas">
            <a href="/organizer" className="cta-primary">⬡ &nbsp;Host an Event</a>
            <a href="/profile" className="cta-ghost">My Profile &nbsp;→</a>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-val">{stats.events}</div>
            <div className="stat-lbl">Events On-Chain</div>
          </div>
          <div className="stat-item">
            <div className="stat-val">{stats.members}</div>
            <div className="stat-lbl">Registered Members</div>
          </div>
          <div className="stat-item">
            <div className="stat-val">{stats.checkins}</div>
            <div className="stat-lbl">Proof-of-Presence</div>
          </div>
        </div>

        {/* How it works */}
        <div className="section-title">— How It Works —</div>
        <div className="steps">
          {[
            { n:"01", icon:"◈", title:"Host an Event", desc:"Deploy your event on Solana with a unique code. One transaction — permanent record." },
            { n:"02", icon:"⬡", title:"Scan & Check In", desc:"Attendees scan your QR with Phantom. One tap builds, signs, and confirms the check-in on-chain." },
            { n:"03", icon:"✦", title:"Claim NFT", desc:"Every check-in unlocks a Metaplex NFT. Permanent proof of presence in your wallet." },
          ].map(s => (
            <div className="step" key={s.n}>
              <div className="step-num">{s.n}</div>
              <div className="step-icon">{s.icon}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="section-title">— Built on Solana —</div>
        <div className="features">
          {[
            { icon:"⛓", title:"Fully On-Chain", desc:"Every attendance is a Solana transaction. Immutable, tamper-proof, and verifiable by anyone." },
            { icon:"◎", title:"Metaplex NFTs", desc:"Each attendance mints a unique NFT with event metadata, date, edition number, and your wallet." },
            { icon:"◈", title:"Reputation Tiers", desc:"6 tiers from Initiate to Legend. Your tier compounds with each on-chain check-in." },
            { icon:"⬡", title:"Solana Blinks", desc:"QR codes are Solana Actions. Phantom opens them as native one-tap transactions — no app needed." },
          ].map(f => (
            <div className="feature" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Live events */}
        {events.length > 0 && (
          <div className="events-section">
            <div className="section-title">— On-Chain Events —</div>
            {events.map((ev, i) => (
              <div className="event-row" key={i}>
                <div>
                  <div className="event-name">{ev.title}</div>
                  <div className="event-detail">{ev.location}, {ev.country} · {ev.attendeeCount}/{ev.capacity} checked in · #{ev.eventCode}</div>
                </div>
                <div>
                  {ev.status === "Live"     && <span className="badge-live">● LIVE</span>}
                  {ev.status === "Upcoming" && <span className="badge-upcoming">UPCOMING</span>}
                  {ev.status === "Ended"    && <span className="badge-ended">ENDED</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <div style={{ fontSize:".62rem", color:"#111", letterSpacing:".15em", marginBottom:"1rem" }}>
            STRATA · PROOF OF PRESENCE · SOLANA DEVNET · {new Date().getFullYear()}
          </div>
          <div className="footer-links">
            <a href="/organizer" className="footer-link">ORGANIZER</a>
            <a href="/profile" className="footer-link">PROFILE</a>
            {PROGRAM_ID_STR && (
              <a href={`https://explorer.solana.com/address/${PROGRAM_ID_STR}?cluster=devnet`} target="_blank" rel="noreferrer" className="footer-link">PROGRAM ↗</a>
            )}
            <a href="https://github.com/GeneralAcre/bangkok-node" target="_blank" rel="noreferrer" className="footer-link">GITHUB ↗</a>
          </div>
        </div>
      </div>
    </>
  );
}
