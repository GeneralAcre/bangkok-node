import { useState, useEffect } from "react";

const LANDING_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cinzel+Decorative:wght@400;700&family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes grain {
    0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-3%)}
    20%{transform:translate(3%,2%)} 30%{transform:translate(-1%,4%)}
    40%{transform:translate(4%,-1%)} 50%{transform:translate(-3%,3%)}
    60%{transform:translate(2%,-4%)} 70%{transform:translate(-4%,1%)}
    80%{transform:translate(1%,-2%)} 90%{transform:translate(3%,3%)}
  }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes sigilSpin {
    0% { transform: translate(-50%,-50%) rotate(0deg) scale(1); opacity: 0.03; }
    50% { transform: translate(-50%,-50%) rotate(180deg) scale(1.04); opacity: 0.06; }
    100% { transform: translate(-50%,-50%) rotate(360deg) scale(1); opacity: 0.03; }
  }
  @keyframes titleReveal {
    0% { opacity: 0; letter-spacing: 30px; filter: blur(12px); }
    60% { opacity: 0.8; letter-spacing: 10px; filter: blur(2px); }
    100% { opacity: 1; letter-spacing: 8px; filter: blur(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes glitch {
    0%,88%,100% { transform: translate(0); clip-path: none; filter: none; }
    89% { transform: translate(-3px,1px); clip-path: polygon(0 20%,100% 20%,100% 40%,0 40%); filter: grayscale(1) contrast(2); }
    90% { transform: translate(3px,-1px); clip-path: polygon(0 60%,100% 60%,100% 78%,0 78%); }
    91% { transform: translate(0); clip-path: none; filter: none; }
  }
  @keyframes blink {
    0%,100% { opacity:1; } 50% { opacity:0; }
  }
  @keyframes flicker {
    0%,93%,100% { opacity:1; } 94% { opacity:0.7; } 95% { opacity:1; } 97% { opacity:0.85; }
  }
  @keyframes pulseBorder {
    0%,100% { box-shadow: inset 1px 1px 0 #2a2a2a, inset -1px -1px 0 #111111; }
    50%      { box-shadow: inset 1px 1px 0 #666666, inset -1px -1px 0 #111111, 0 0 16px #ffffff08; }
  }
  @keyframes ornamentFlicker {
    0%,90%,100% { opacity:1; }
    92% { opacity:0.2; }
    94% { opacity:1; }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .landing-enter-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 18px 48px;
    background: #111111;
    border: 1px solid #888888;
    color: #ffffff;
    font-family: 'Cinzel Decorative', serif;
    font-size: 15px;
    letter-spacing: 4px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: inset 1px 1px 0 #aaaaaa, inset -1px -1px 0 #111111;
    animation: pulseBorder 2.5s ease-in-out infinite;
  }
  .landing-enter-btn::before { content: none; }
  .landing-enter-btn::after  { content: none; }
  .landing-enter-btn:hover {
    background: #1e1e1e;
    border-color: #ffffff;
    box-shadow: inset 1px 1px 0 #ffffff, inset -1px -1px 0 #333333;
    transform: translateY(-1px);
  }
  .landing-enter-btn span { position: relative; z-index: 1; }

  .feature-card {
    position: relative;
    background: #080808;
    border: 1px solid #1e1e1e;
    padding: 28px 24px;
    transition: border-color 0.2s;
    animation: fadeUp 0.6s ease both;
    overflow: visible;
    box-shadow: inset 1px 1px 0 #2a2a2a, inset -1px -1px 0 #0d0d0d;
  }
  .feature-card::before {
    content: '────────────────────────';
    position: absolute;
    top: -9px; left: 50%; transform: translateX(-50%);
    color: #2a2a2a; font-size: 11px; letter-spacing: 0;
    white-space: nowrap; overflow: hidden; width: calc(100% - 20px);
    text-align: center; pointer-events: none;
    font-family: 'Share Tech Mono', monospace;
    animation: ornamentFlicker 12s infinite;
  }
  .feature-card::after {
    content: '────────────────────────';
    position: absolute;
    bottom: -9px; left: 50%; transform: translateX(-50%);
    color: #2a2a2a; font-size: 11px; letter-spacing: 0;
    white-space: nowrap; overflow: hidden; width: calc(100% - 20px);
    text-align: center; pointer-events: none;
    font-family: 'Share Tech Mono', monospace;
    animation: ornamentFlicker 12s infinite 5s;
  }
  .feature-card:hover {
    border-color: #555555;
    box-shadow: inset 1px 1px 0 #444444, inset -1px -1px 0 #0d0d0d;
  }
  .feature-card .corner {
    position: absolute;
    font-size: 11px;
    color: #333333;
    animation: ornamentFlicker 10s infinite;
  }
  .feature-card .corner.tl { top: -6px; left: -3px; }
  .feature-card .corner.tr { top: -6px; right: -3px; animation-delay: 2.5s; }
  .feature-card .corner.bl { bottom: -6px; left: -3px; animation-delay: 5s; }
  .feature-card .corner.br { bottom: -6px; right: -3px; animation-delay: 7.5s; }

  .stat-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 16px 24px;
    border: 1px solid #222222;
    background: #0a0a0a;
    animation: countUp 0.5s ease both;
    box-shadow: inset 1px 1px 0 #2a2a2a, inset -1px -1px 0 #0a0a0a;
  }

  .marquee-track {
    display: flex;
    gap: 48px;
    animation: marqueeScroll 18s linear infinite;
    white-space: nowrap;
  }
  @keyframes marqueeScroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
`;

// ─── Reusable gothic divider ─────────────────────────────────────────

function GothicDivider({ symbol = "⸸", text = "" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "0 auto", maxWidth: "600px" }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #2a2a2a)" }} />
      <span style={{ color: "#555555", fontFamily: "'Share Tech Mono', monospace", fontSize: "13px", letterSpacing: "4px" }}>
        {symbol}{text ? ` ${text} ` : ""}{symbol}
      </span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, #2a2a2a)" }} />
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────

function FeatureCard({ icon, title, description, delay = "0s" }) {
  return (
    <div className="feature-card" style={{ animationDelay: delay }}>
      <span className="corner tl">⸸</span>
      <span className="corner tr">⸸</span>
      <span className="corner bl">⸸</span>
      <span className="corner br">⸸</span>

      <div style={{
        width: "36px", height: "36px", marginBottom: "14px",
        color: "#888888",
      }}>
        {icon}
      </div>
      <div style={{
        fontFamily: "'Cinzel Decorative', serif",
        fontSize: "13px", fontWeight: 700,
        color: "#f0f0f0", letterSpacing: "2px",
        marginBottom: "10px",
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: "15px", color: "#aaaaaa",
        lineHeight: 1.7, fontWeight: 400,
      }}>
        {description}
      </div>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────

export default function LandingPage({ onEnter }) {
  const [loaded, setLoaded] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = () => {
    setEntering(true);
    setTimeout(onEnter, 700);
  };

  const MARQUEE_ITEMS = [
    "✠ Solana", "✠ Anchor Protocol", "✠ Proof of Contribution",
    "✠ On-Chain Bounties", "✠ Compressed NFT Identity", "✠ AI Copilot",
    "✠ Squads Multisig", "✠ Colosseum Frontier 2026", "✠ Reputation Engine",
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LANDING_STYLES }} />

      <div style={{
        minHeight: "100vh", background: "#000000",
        color: "#ffffff", overflow: "hidden",
        opacity: entering ? 0 : 1,
        transition: "opacity 0.6s ease",
        fontFamily: "'Rajdhani', sans-serif",
      }}>

        {/* ── Scan line ── */}
        <div aria-hidden style={{
          position: "fixed", left: 0, right: 0, height: "2px", zIndex: 999,
          background: "linear-gradient(to right,transparent,#ffffff08,#ffffff14,#ffffff08,transparent)",
          pointerEvents: "none", animation: "scanline 8s linear infinite",
        }} />

        {/* ── Scanline grid ── */}
        <div aria-hidden style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "repeating-linear-gradient(0deg,transparent,transparent 2px,#ffffff05 2px,#ffffff05 4px)",
        }} />

        {/* ── Grid lines ── */}
        <div aria-hidden style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "linear-gradient(#ffffff05 1px,transparent 1px),linear-gradient(90deg,#ffffff05 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        {/* ── Giant sigil ── */}
        <div aria-hidden style={{
          position: "fixed", top: "50%", left: "50%",
          fontSize: "700px", lineHeight: 1,
          color: "#ffffff03", pointerEvents: "none", zIndex: 0, userSelect: "none",
          animation: "sigilSpin 40s linear infinite", fontFamily: "serif",
        }}>✠</div>

        {/* ── Grain ── */}
        <div aria-hidden style={{
          position: "fixed", inset: "-50%", width: "200%", height: "200%",
          pointerEvents: "none", zIndex: 998,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat", backgroundSize: "256px 256px",
          opacity: 0.35, animation: "grain 0.5s steps(1) infinite",
          mixBlendMode: "overlay",
        }} />

        {/* ════════════════════════════════════════
            HERO
        ════════════════════════════════════════ */}
        <section style={{
          position: "relative", zIndex: 1,
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "60px 24px",
        }}>
          {/* Top ornament */}
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "12px", color: "#444444", letterSpacing: "3px",
            marginBottom: "32px",
            animation: loaded ? "fadeIn 1s ease 0.2s both" : "none",
          }}>
            ── COLOSSEUM FRONTIER HACKATHON 2026 ──
          </div>

          {/* Main Title */}
          <div style={{
            fontFamily: "'UnifrakturMaguntia', cursive",
            fontSize: "clamp(72px, 14vw, 160px)",
            lineHeight: 0.9,
            color: "#ffffff",
            animation: loaded ? "titleReveal 1.6s cubic-bezier(0.16,1,0.3,1) 0.3s both, glitch 10s 2s infinite" : "none",
            userSelect: "none",
          }}>
            Strata
          </div>

          {/* Subtitle gothic divider */}
          <div style={{
            marginTop: "24px",
            animation: loaded ? "fadeUp 0.8s ease 1.2s both" : "none",
            width: "100%", maxWidth: "700px",
          }}>
            <GothicDivider symbol="✠" />
          </div>

          {/* Tagline */}
          <div style={{
            marginTop: "20px",
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: "clamp(13px, 2.5vw, 20px)",
            color: "#aaaaaa",
            letterSpacing: "4px",
            textTransform: "uppercase",
            animation: loaded ? "fadeUp 0.8s ease 1.4s both" : "none",
          }}>
            Proof of Presence Protocol
            <br />
            <span style={{ color: "#555555", fontSize: "0.7em", letterSpacing: "6px" }}>
              IRL Communities · On-Chain Identity
            </span>
          </div>

          {/* Description */}
          <p style={{
            marginTop: "28px",
            maxWidth: "580px",
            fontSize: "17px",
            color: "#888888",
            lineHeight: 1.8,
            fontWeight: 400,
            animation: loaded ? "fadeUp 0.8s ease 1.6s both" : "none",
          }}>
            Show up. Scan in. Earn your place on-chain.
            Strata turns physical event attendance into a permanent Solana credential —
            a compressed NFT that proves you were there, builds your tier,
            and grows your governance weight over time.
          </p>

          {/* CTA */}
          <div style={{
            marginTop: "44px",
            animation: loaded ? "fadeUp 0.8s ease 1.9s both" : "none",
          }}>
            <button className="landing-enter-btn" onClick={handleEnter}>
              <span>Enter the Protocol</span>
            </button>
          </div>

          {/* Scroll indicator */}
          <div style={{
            position: "absolute", bottom: "32px",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "11px", color: "#333333", letterSpacing: "3px",
            animation: loaded ? "blink 2s infinite 2.4s" : "none",
            color: "#333333",
          }}>
            ▼ scroll ▼
          </div>
        </section>

        {/* ════════════════════════════════════════
            MARQUEE
        ════════════════════════════════════════ */}
        <div style={{
          position: "relative", zIndex: 1,
          borderTop: "1px solid #1e1e1e",
          borderBottom: "1px solid #1e1e1e",
          background: "#080808",
          padding: "14px 0",
          overflow: "hidden",
        }}>
          <div style={{ display: "flex", overflow: "hidden", maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
            <div className="marquee-track">
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                <span key={i} style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "12px", color: "#444444", letterSpacing: "2px",
                }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            STATS ROW
        ════════════════════════════════════════ */}
        <section style={{
          position: "relative", zIndex: 1,
          padding: "64px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "40px",
        }}>
          <GothicDivider symbol="⸸" text="PROTOCOL STATS" />

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { value: "47",    label: "Community Members", accent: "#ffffff" },
              { value: "4",     label: "Events Live",       accent: "#cccccc" },
              { value: "104",   label: "Check-ins",         accent: "#aaaaaa" },
              { value: "87%",   label: "Copilot Accuracy",  accent: "#888888" },
              { value: "100%",  label: "On-Chain",          accent: "#666666" },
            ].map(({ value, label, accent }, i) => (
              <div key={label} className="stat-pill" style={{ animationDelay: `${i * 0.1}s` }}>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "32px", fontWeight: 700, color: accent,
                }}>
                  {value}
                </div>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "11px", color: "#666666", letterSpacing: "2px",
                  textTransform: "uppercase",
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            FEATURES
        ════════════════════════════════════════ */}
        <section style={{
          position: "relative", zIndex: 1,
          padding: "0 24px 80px", maxWidth: "1100px", margin: "0 auto",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "40px",
        }}>
          <GothicDivider symbol="✠" text="CORE MODULES" />

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "32px", width: "100%",
          }}>
            <FeatureCard
              delay="0s"
              icon={
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 4L22 10H30L24 16L26 24L18 20L10 24L12 16L6 10H14L18 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="18" cy="18" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M18 2V6M18 30V34M2 18H6M30 18H34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                </svg>
              }
              title="IRL Event Protocol"
              description="Organizers deploy events on-chain. Attendees scan a Solana Blink QR code to register their physical presence — no app needed."
            />
            <FeatureCard
              delay="0.1s"
              icon={
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="18,3 33,12 33,24 18,33 3,24 3,12" stroke="currentColor" strokeWidth="1.5"/>
                  <polygon points="18,9 27,14 27,22 18,27 9,22 9,14" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
                  <circle cx="18" cy="18" r="3" fill="currentColor"/>
                  <path d="M18 9V12M18 24V27M9 14L11.5 15.5M24.5 20.5L27 22M9 22L11.5 20.5M24.5 15.5L27 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
                </svg>
              }
              title="Reputation Protocol"
              description="Proof-of-Presence scores grow with every verified attendance. Your tier — Initiate to Legend — lives on-chain forever."
            />
            <FeatureCard
              delay="0.2s"
              icon={
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="28" height="28" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M4 12H32" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 4V12" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M24 4V12" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 20H16M20 20H26M10 26H14M18 26H26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                </svg>
              }
              title="AI Copilot"
              description="An AI agent scores every event for quality and demand. Every endorsement is logged to the Solana Memo program — fully auditable."
            />
            <FeatureCard
              delay="0.3s"
              icon={
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="8" width="28" height="20" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 8V6M26 8V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M4 14H32" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 20L14 24L26 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="cNFT Attendance Pass"
              description="Metaplex Bubblegum mints a compressed Proof-of-Presence NFT to your wallet the moment you check in. Edition number tied to arrival order."
            />
            <FeatureCard
              delay="0.4s"
              icon={
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 4L6 10V20C6 26.627 11.373 32 18 32C24.627 32 30 26.627 30 20V10L18 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M13 18L16 21L23 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Solana Actions"
              description="Blinks let members check in from any wallet-connected surface. Scan once, sign once — the chain handles the rest."
            />
            <FeatureCard
              delay="0.5s"
              icon={
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="14" width="28" height="18" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 14V10C10 6.686 13.134 4 17 4H19C22.866 4 26 6.686 26 10V14" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="18" cy="22" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M18 25V28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
              title="Squads Treasury"
              description="Event entry fees and DAO funds route through Squads Protocol multisig. Community-controlled, cryptographically secured."
            />
          </div>
        </section>

        {/* ════════════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════════════ */}
        <section style={{
          position: "relative", zIndex: 1,
          padding: "0 24px 80px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "40px",
        }}>
          <GothicDivider symbol="⸸" text="THE RITUAL" />

          <div style={{
            display: "flex", flexDirection: "column", gap: "0",
            width: "100%", maxWidth: "680px",
          }}>
            {[
              { step: "I",   title: "Connect Your Wallet",    desc: "Link any Solana wallet. Your on-chain identity is created — Initiate tier, zero reputation, ready to earn." },
              { step: "II",  title: "Attend an IRL Event",    desc: "Find a Strata event near you. Organizer shows a QR code at the door. No app required." },
              { step: "III", title: "Scan & Sign",            desc: "Scan the Solana Blink QR with your wallet. One signature creates your Attendance PDA on-chain." },
              { step: "IV",  title: "NFT Minted · Tier Up",   desc: "A compressed Proof-of-Presence NFT is minted to your wallet. Your reputation grows. Your tier advances." },
            ].map(({ step, title, desc }, i) => (
              <div key={step} style={{
                display: "flex", gap: "24px", alignItems: "flex-start",
                padding: "28px 0",
                borderBottom: i < 3 ? "1px solid #1e1e1e" : "none",
                animation: `fadeUp 0.6s ease ${i * 0.15}s both`,
              }}>
                <div style={{
                  flexShrink: 0,
                  width: "52px", height: "52px",
                  border: "1px solid #555555",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Cinzel Decorative', serif",
                  fontSize: "16px", color: "#ffffff",
                  background: "#0d0d0d",
                  boxShadow: "inset 1px 1px 0 #888888, inset -1px -1px 0 #111111",
                }}>
                  {step}
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Cinzel Decorative', serif",
                    fontSize: "14px", color: "#ffffff",
                    letterSpacing: "2px", marginBottom: "8px",
                  }}>
                    {title}
                  </div>
                  <div style={{
                    fontSize: "15px", color: "#777777",
                    lineHeight: 1.7, fontWeight: 400,
                  }}>
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            TECH STACK
        ════════════════════════════════════════ */}
        <section style={{
          position: "relative", zIndex: 1,
          padding: "0 24px 80px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "32px",
        }}>
          <GothicDivider symbol="✠" text="BUILT WITH" />
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              "Solana", "Anchor", "Metaplex Bubblegum",
              "Squads Protocol", "Solana Actions", "Next.js",
              "TypeScript", "Memo Program", "Claude AI",
            ].map((tech) => (
              <span key={tech} style={{
                padding: "8px 18px",
                border: "1px solid #222222",
                background: "#0a0a0a",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "12px", color: "#666666",
                letterSpacing: "1px",
                transition: "all 0.2s",
                boxShadow: "inset 1px 1px 0 #1e1e1e, inset -1px -1px 0 #080808",
              }}>
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════════ */}
        <section style={{
          position: "relative", zIndex: 1,
          padding: "80px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "28px",
          borderTop: "1px solid #1e1e1e",
          background: "linear-gradient(to bottom, transparent, #080808)",
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: "'UnifrakturMaguntia', cursive",
            fontSize: "clamp(40px, 8vw, 80px)",
            color: "#ffffff",
            lineHeight: 1,
          }}>
            Join the Covenant
          </div>
          <p style={{ maxWidth: "480px", fontSize: "16px", color: "#777777", lineHeight: 1.8 }}>
            Presence is the new proof-of-work. Show up, sign in, build your on-chain
            identity one event at a time — permanently on Solana.
          </p>
          <button className="landing-enter-btn" onClick={handleEnter} style={{ fontSize: "16px", padding: "20px 56px" }}>
            <span>Enter Protocol</span>
          </button>
        </section>

        {/* ════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════ */}
        <footer style={{
          position: "relative", zIndex: 1,
          borderTop: "1px solid #1a1a1a",
          padding: "18px 32px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "8px",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "11px", color: "#444444",
          letterSpacing: "2px",
        }}>
          <span>STRATA — COLOSSEUM FRONTIER HACKATHON 2026</span>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#333333", animation: "blink 1.5s infinite" }}>▮</span>
            SOLANA · ANCHOR · METAPLEX · BUBBLEGUM
          </span>
        </footer>

      </div>
    </>
  );
}
