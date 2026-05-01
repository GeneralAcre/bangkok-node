"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Nav } from "../components/Nav";
import { PageBackground } from "../components/PageBackground";
import { StatBox } from "../components/StatBox";
import { homeCSS } from "../styles/homeStyles";

const PROGRAM_ID_STR    = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "";
const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

interface OnChainEvent {
  title: string; location: string; country: string;
  status: string; attendeeCount: number; capacity: number; eventCode: string;
}

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


  function handleWalletSearch(e: React.FormEvent) {
    e.preventDefault();
    const addr = walletSearch.trim();
    if (addr) window.location.href = `/profile/${addr}`;
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
            <div style={{ margin: "0 auto 1.5rem", maxWidth: 900 }}>
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
