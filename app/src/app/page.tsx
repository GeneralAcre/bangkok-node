"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { PageBackground } from "../components/PageBackground";
import { StatBox } from "../components/StatBox";
import { homeCSS } from "../styles/homeStyles";
import type { LumaEvent } from "./api/luma-events/route";

const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

const STEPS = [
  { n: "1", t: "Attach to Event",  d: "Paste your Luma or Eventbrite URL. Signal deploys a check-in layer on Solana and generates a QR code — one transaction.", cta: "Attach Now",   href: "/organizer" },
  { n: "2", t: "Scan & Check In",  d: "Attendees scan the QR with Phantom Wallet. Verify humanity with World ID — one human, one check-in per event — then submit on-chain. Sybil-resistant by default.",  cta: "Check In",     href: "/events" },
  { n: "3", t: "NFT + Score",      d: "Every check-in mints a Metaplex NFT and updates the attendee's Signal Score. Permanent proof of presence, forever on-chain.", cta: "Builder Passport", href: "/credentials" },
];

const FAQ_ITEMS = [
  {
    q: "What is Signal?",
    a: "Signal turns event attendance into on-chain identity. Show up → scan QR → get verified proof on Solana. Forever.",
  },
  {
    q: "How does Signal work?",
    a: "Organizer creates event → gets a QR code. You scan with Phantom at the door. Solana transaction confirms → NFT mints to your wallet instantly.",
  },
  {
    q: "What do I get?",
    a: "Every check-in earns you an attendance NFT badge and Signal Score points. Win hackathons and claim verified Achievement NFTs. Your Builder Passport shows everything in one place.",
  },
  {
    q: "How does Signal Score work?",
    a: "You earn points for real verified actions — check-ins, hackathon wins, streaks. Score is calculated from NFTs in your wallet only. Nothing is self-reported. Nothing is editable.",
  },
  {
    q: "What is a Signal Score?",
    a: "Your reputation as a builder. One number that proves you actually show up and ship things. Can't be bought. Can't be faked. Every point is an on-chain transaction.",
  },
];

export default function HomePage() {
  const { connection } = useConnection();
  const [stats,       setStats]       = useState({ events: 0, members: 0, checkins: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [walletSearch, setWalletSearch] = useState("");
  const [openFaq,     setOpenFaq]     = useState<number | null>(null);
  const [lumaEvents,  setLumaEvents]  = useState<LumaEvent[]>([]);
  const [lumaLoaded,  setLumaLoaded]  = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/stats");
        if (r.ok) {
          const d = await r.json();
          setStats({ events: d.events ?? 0, members: d.members ?? 0, checkins: d.checkins ?? 0 });
          setStatsLoaded(true);
          return;
        }
      } catch {}
      if (!COMMUNITY_PDA_STR) { setStatsLoaded(true); return; }
      try {
        const [{ default: idl }, { AnchorProvider }, { StrataClient, findEventPDA }] = await Promise.all([
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
        let checkins = 0;
        for (let i = 0; i < count; i++) {
          const [ePDA] = findEventPDA(community, i);
          try {
            const acc = await client.getEvent(ePDA);
            checkins += acc.attendeeCount.toNumber();
          } catch {}
        }
        setStats({ events: count, members: commAcc.memberCount.toNumber(), checkins });
      } catch {}
      setStatsLoaded(true);
    }
    load();
  }, [connection]);


  useEffect(() => {
    fetch("/api/luma-events")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.events) { setLumaEvents(d.events); setLumaLoaded(true); } })
      .catch(() => setLumaLoaded(true));
  }, []);

  function handleWalletSearch(e: React.FormEvent) {
    e.preventDefault();
    const addr = walletSearch.trim();
    if (addr) window.location.href = `/credentials`;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: homeCSS }} />
      <PageBackground />
      <Nav active="home" />

      <div className="page">
        {/* Hero */}
        <div className="hero">
          <div className="hero-inner">
            <div className="hero-badge">
              <span className="badge-dot" /> Built for Colosseum Hackathon · Solana Devnet
            </div>
            <div style={{ margin: "0 auto 1.5rem", maxWidth: 680 }}>
              <svg width="100%" viewBox="0 0 900 130" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", overflow: "visible" }}>
                <defs>
                  <linearGradient id="hChrome" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stopColor="#ffffff" />
                    <stop offset="20%"  stopColor="#dfe7ff" />
                    <stop offset="45%"  stopColor="#aeb9d9" />
                    <stop offset="65%"  stopColor="#f7f9ff" />
                    <stop offset="100%" stopColor="#8b95b8" />
                  </linearGradient>
                  <filter id="hGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feColorMatrix in="blur" type="matrix"
                      values="1 0 0 0 0  0 0.9 0 0 0.1  0 0 1 0 0.4  0 0 0 1 0" result="colored"/>
                    <feMerge><feMergeNode in="colored"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="hVhs" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9 0.02" numOctaves="1" seed="7" result="noise"/>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="6">
                      <animate attributeName="scale" values="2;8;3;7;2" dur="5s" repeatCount="indefinite"/>
                    </feDisplacementMap>
                  </filter>
                  <filter id="hShadow">
                    <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#285B73" floodOpacity="0.45"/>
                  </filter>
                </defs>
                <g filter="url(#hVhs)">
                  <text x="50%" y="80%" textAnchor="middle" fontFamily="Times New Roman, Georgia, serif" fontSize="90" fontStyle="italic" fontWeight="700" fill="url(#hChrome)" stroke="#f8fbff" strokeWidth="1.5" filter="url(#hShadow)">
                    Proof of Presence
                    <animate attributeName="opacity" values="0.95;1;0.96;1" dur="2.8s" repeatCount="indefinite"/>
                  </text>
                  <text x="50.3%" y="80.5%" textAnchor="middle" fontFamily="Times New Roman, Georgia, serif" fontSize="90" fontStyle="italic" fontWeight="700" fill="none" stroke="#879989" strokeWidth="1" opacity="0.5" filter="url(#hGlow)">
                    Proof of Presence
                    <animateTransform attributeName="transform" type="translate" values="0 0;1 -1;-1 1;0 0" dur="0.15s" repeatCount="indefinite"/>
                  </text>
                </g>
              </svg>
            </div>
            <p className="hero-tagline">For Every Event, Everywhere.</p>
            <p className="hero-sub">
              Signal is the sybil-resistant verification layer for live events. Attach it to any Luma or
              Eventbrite event — attendees scan your QR, verify their humanity with World ID,
              check in on Solana, and earn a permanent NFT. One human, one score. No fakes.
            </p>
            <div className="hero-ctas">
              <a href="/organizer" className="btn-primary">Attach to Event</a>
              <a href="/events"    className="btn-glass">Check In</a>
            </div>
            <form className="wallet-search" onSubmit={handleWalletSearch}>
              <input
                value={walletSearch}
                onChange={e => setWalletSearch(e.target.value)}
                placeholder="Look up any wallet address…"
              />
              <button type="submit">Search</button>
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

        {/* How it works */}
        <div className="container section">
          <h2 className="steps-heading">Attach. Scan. Earn.<br />The full loop in 3 steps.</h2>
          <div className="steps">
            {STEPS.map(s => (
              <div className="step-card" key={s.n}>
                <div className="step-header">
                  <div className="step-num">{s.n}</div>
                  <div className="step-title">{s.t}</div>
                </div>
                <div className="step-desc">{s.d}</div>
                <a href={s.href} className="step-cta">{s.cta}</a>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="container events-section">
          <div className="events-header">
            <div>
              <div className="section-eyebrow">Upcoming Events</div>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Superteam Calendar</h2>
            </div>
            <div className="events-source">
              Powered by{" "}
              <a href="https://lu.ma/superteam" target="_blank" rel="noreferrer">lu.ma/superteam</a>
            </div>
          </div>

          {!lumaLoaded ? (
            <div className="events-grid">
              {[1,2,3,4].map(i => (
                <div key={i} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, overflow:"hidden" }}>
                  <div style={{ width:"100%", aspectRatio:"16/9", background:"rgba(255,255,255,.06)" }} />
                  <div style={{ padding:"1rem 1.1rem", display:"flex", flexDirection:"column", gap:".5rem" }}>
                    <div style={{ height:10, borderRadius:4, background:"rgba(255,255,255,.08)", width:"40%" }} />
                    <div style={{ height:14, borderRadius:4, background:"rgba(255,255,255,.08)", width:"80%" }} />
                    <div style={{ height:10, borderRadius:4, background:"rgba(255,255,255,.06)", width:"55%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="events-grid">
              {lumaEvents.map(ev => {
                const d = new Date(ev.startAt);
                const dateStr = d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
                const timeStr = d.toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });
                return (
                  <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer" className="event-card">
                    <div className="event-cover">
                      {ev.coverUrl
                        ? <img src={ev.coverUrl} alt={ev.title} />
                        : <div className="event-cover-placeholder"></div>
                      }
                    </div>
                    <div className="event-body">
                      <div className="event-date-line">{dateStr} · {timeStr}</div>
                      <div className="event-title-card">{ev.title}</div>
                      <div className="event-location">
                        {ev.location}
                      </div>
                      <span className="event-register">Register</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          <div className="events-cta">
            <a href="https://lu.ma/superteam" target="_blank" rel="noreferrer">
              View all Superteam events on Luma
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="container faq-section">
          <h2 className="faq-heading">Frequently Asked Questions</h2>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{item.q}</span>
                  <span className={`faq-chevron${openFaq === i ? " open" : ""}`}>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>
                <div className={`faq-answer${openFaq === i ? " open" : ""}`}>
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <Footer />
    </>
  );
}
