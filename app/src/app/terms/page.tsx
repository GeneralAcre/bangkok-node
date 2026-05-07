"use client";

import { Nav } from "../../components/Nav";
import { Footer } from "../../components/Footer";
import { PageBackground } from "../../components/PageBackground";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Epilogue:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #0a0a0a; color: #e8e8e8; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes gradMove { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

  .page {
    max-width: 820px; margin: 0 auto;
    padding: 7rem 1.5rem 5rem;
    position: relative; z-index: 1;
    animation: fadeUp .5s ease both;
  }

  /* ── Header ── */
  .doc-eyebrow {
    font-family: 'Orbitron', sans-serif; font-size: .58rem; font-weight: 700;
    letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.4);
    margin-bottom: .75rem;
  }
  .doc-title {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(1.6rem, 4vw, 2.6rem); font-weight: 900;
    letter-spacing: .04em; margin-bottom: .6rem;
    background: linear-gradient(135deg, #ffffff 0%, #e8e8e8 60%, #aab0c4 100%);
    background-size: 200% auto; -webkit-background-clip: text;
    -webkit-text-fill-color: transparent; background-clip: text;
    animation: gradMove 6s ease infinite;
  }
  .doc-meta {
    font-size: .78rem; color: #555; font-family: 'Space Mono', monospace;
    margin-bottom: 3rem; padding-bottom: 2rem;
    border-bottom: 1px solid rgba(255,255,255,.07);
  }

  /* ── Table of Contents ── */
  .toc {
    background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
    border-radius: 14px; padding: 1.5rem 1.75rem; margin-bottom: 3rem;
  }
  .toc-title {
    font-family: 'Orbitron', sans-serif; font-size: .6rem; font-weight: 700;
    letter-spacing: .18em; text-transform: uppercase; color: rgba(255,255,255,.35);
    margin-bottom: 1rem;
  }
  .toc-list { display: flex; flex-direction: column; gap: .45rem; list-style: none; }
  .toc-list a {
    font-size: .82rem; color: rgba(255,255,255,.5); text-decoration: none;
    transition: color .15s; display: flex; align-items: center; gap: .6rem;
  }
  .toc-list a:hover { color: #ffffff; }
  .toc-num {
    font-family: 'Space Mono', monospace; font-size: .65rem;
    color: rgba(255,255,255,.2); width: 1.4rem; flex-shrink: 0;
  }

  /* ── Sections ── */
  .doc-section { margin-bottom: 3.5rem; }
  .section-anchor { scroll-margin-top: 100px; }
  .section-heading {
    font-family: 'Orbitron', sans-serif; font-size: clamp(.95rem, 2vw, 1.2rem);
    font-weight: 800; letter-spacing: .06em; color: #ffffff;
    margin-bottom: 1.25rem; padding-bottom: .75rem;
    border-bottom: 1px solid rgba(255,255,255,.08);
    display: flex; align-items: center; gap: .75rem;
  }
  .section-num {
    font-size: .65rem; color: rgba(255,255,255,.25);
    font-family: 'Space Mono', monospace; flex-shrink: 0;
  }
  .sub-heading {
    font-family: 'Epilogue', sans-serif; font-size: .88rem; font-weight: 800;
    color: #e8e8e8; margin: 1.5rem 0 .6rem; text-transform: uppercase;
    letter-spacing: .06em;
  }
  p {
    font-size: .88rem; color: #888; line-height: 1.85; margin-bottom: .85rem;
  }

  /* ── Tables ── */
  .data-table {
    width: 100%; border-collapse: collapse; margin: 1rem 0 1.5rem;
    font-size: .82rem;
  }
  .data-table th {
    font-family: 'Epilogue', sans-serif; font-size: .65rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.35);
    padding: .55rem .85rem; text-align: left;
    border-bottom: 1px solid rgba(255,255,255,.08);
  }
  .data-table td {
    padding: .65rem .85rem; color: #c9c9c9;
    border-bottom: 1px solid rgba(255,255,255,.05);
    vertical-align: middle;
  }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:hover td { background: rgba(255,255,255,.02); }

  /* ── Tier badges ── */
  .tier-pill {
    display: inline-flex; align-items: center; gap: .35rem;
    padding: .2rem .7rem; border-radius: 100px; font-size: .72rem;
    font-weight: 700; font-family: 'Epilogue', sans-serif;
    border: 1px solid currentColor;
  }

  /* ── NFT badge levels ── */
  .badge-grid {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: .75rem;
    margin: 1rem 0 1.5rem;
  }
  @media (max-width: 600px) { .badge-grid { grid-template-columns: repeat(3, 1fr); } }
  .badge-card {
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
    border-radius: 12px; padding: .75rem .5rem; text-align: center;
    transition: border-color .2s;
  }
  .badge-card:hover { border-color: rgba(255,255,255,.2); }
  .badge-img {
    width: 100%; aspect-ratio: 1; object-fit: contain; display: block;
    margin-bottom: .45rem; border-radius: 8px;
  }
  .badge-lv {
    font-family: 'Orbitron', sans-serif; font-size: .72rem; font-weight: 900;
    color: #ffffff; margin-bottom: .2rem;
  }
  .badge-req {
    font-size: .6rem; color: #555; font-family: 'Space Mono', monospace;
    line-height: 1.4;
  }

  /* ── Info boxes ── */
  .info-box {
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
    border-left: 3px solid rgba(255,255,255,.35);
    border-radius: 0 10px 10px 0; padding: 1rem 1.25rem;
    margin: 1rem 0; font-size: .82rem; color: #aaa; line-height: 1.7;
  }

  /* ── Formula box ── */
  .formula {
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
    border-radius: 10px; padding: 1rem 1.25rem; margin: 1rem 0;
    font-family: 'Space Mono', monospace; font-size: .8rem; color: #e8e8e8;
    line-height: 1.8;
  }
  .formula span { color: rgba(255,255,255,.35); }

  /* ── Divider ── */
  .doc-divider {
    height: 1px; margin: 3rem 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent);
  }
`;

const TIERS = [
  { tier: "Initiate", icon: "◦",  color: "#6b7280", min: 0,    max: 99,   bonus: 0,   desc: "New to Signal" },
  { tier: "Seeker",   icon: "◈",  color: "#3b82f6", min: 100,  max: 249,  bonus: 50,  desc: "Actively attending" },
  { tier: "Resident", icon: "⬡",  color: "#10b981", min: 250,  max: 499,  bonus: 100, desc: "Regular contributor" },
  { tier: "Builder",  icon: "✦",  color: "#f59e0b", min: 500,  max: 999,  bonus: 200, desc: "Core builder" },
  { tier: "Core",     icon: "⬟",  color: "#ef4444", min: 1000, max: 1999, bonus: 350, desc: "Community pillar" },
  { tier: "Legend",   icon: "✺",  color: "#a855f7", min: 2000, max: null, bonus: 500, desc: "Top-tier" },
];

const NFT_BADGES = [
  { lv: "LV1", events: "1+",  label: "First Presence", img: "/nft-badge/nft-signal-lv1.png" },
  { lv: "LV2", events: "3+",  label: "Regular",        img: "/nft-badge/nft-signal-lv2.png" },
  { lv: "LV3", events: "5+",  label: "Committed",      img: "/nft-badge/nft-signal-lv3.png" },
  { lv: "LV4", events: "10+", label: "Veteran",        img: "/nft-badge/nft-signal-lv4.png" },
  { lv: "LV5", events: "20+", label: "Legend",         img: "/nft-badge/nft-signal-lv5.png" },
];

export default function TermsPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PageBackground />
      <Nav active="home" />

      <div className="page">

        {/* Header */}
        <div className="doc-eyebrow">Signal Protocol · Documentation</div>
        <h1 className="doc-title">Terms of Use &amp; Protocol Whitepaper</h1>
        <div className="doc-meta">Version 1.0 · Solana Devnet · Last updated May 2026</div>

        {/* Table of Contents */}
        <div className="toc">
          <div className="toc-title">Contents</div>
          <ul className="toc-list">
            {[
              "Platform Overview",
              "Signal Score — How Points Are Calculated",
              "Membership Tiers",
              "NFT Badge System",
              "NFT Types & Point Values",
              "Check-In Protocol",
              "Sybil Resistance",
              "Platform Rules & Conduct",
              "Data & Privacy",
              "Disclaimer",
            ].map((item, i) => (
              <li key={i}>
                <a href={`#s${i + 1}`}>
                  <span className="toc-num">0{i + 1}</span>
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* S1 */}
        <div className="doc-section section-anchor" id="s1">
          <div className="section-heading">
            <span className="section-num">01</span>
            Platform Overview
          </div>
          <p>
            Signal is a decentralized, sybil-resistant verification layer for live events built on
            Solana. It turns real-world event attendance into on-chain identity — every check-in is
            a permanent, tamper-proof transaction on the blockchain.
          </p>
          <p>
            Organizers deploy an on-chain event account in a single transaction. Attendees scan a
            signed QR code using Phantom Wallet, verify their presence, and earn an NFT badge and
            Signal Score points automatically. No manual claiming, no self-reporting, no faking.
          </p>
          <div className="info-box">
            Signal operates on <strong style={{ color: "#e8e8e8" }}>Solana Devnet</strong> during
            the Colosseum Hackathon period. All transactions, NFTs, and scores are on devnet and may
            be migrated to mainnet in a future release.
          </div>
        </div>

        <div className="doc-divider" />

        {/* S2 */}
        <div className="doc-section section-anchor" id="s2">
          <div className="section-heading">
            <span className="section-num">02</span>
            Signal Score — How Points Are Calculated
          </div>
          <p>
            Your Signal Score is a single number that represents your verified on-chain reputation
            as a builder. It is calculated entirely from NFTs held in your wallet — nothing is
            self-reported or editable.
          </p>

          <div className="sub-heading">Base Score Formula</div>
          <div className="formula">
            <span>Base Score =</span> (Events Attended × 10) + (Hackathons × 30) + Achievement Points
            <br />
            <span>Final Score =</span> Base Score + Tier Bonus
          </div>

          <div className="sub-heading">Point Sources</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Points</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Event check-in (Attendance NFT)</td><td>+10 pts</td><td>Per unique event</td></tr>
              <tr><td>Hackathon participation</td><td>+30 pts</td><td>Per hackathon</td></tr>
              <tr><td>Participation NFT (organizer-awarded)</td><td>+50 pts</td><td>Awarded by event organizer</td></tr>
              <tr><td>Achievement NFT — Placement</td><td>+300 pts</td><td>Verified by Signal admin</td></tr>
              <tr><td>Achievement NFT — Grand Prize</td><td>+1,000 pts</td><td>Top award, verified by admin</td></tr>
            </tbody>
          </table>

          <div className="sub-heading">Tier Bonus</div>
          <p>
            Once your base score crosses a tier threshold, a one-time tier bonus is added to your
            final score. This bonus rewards consistent participation and cannot be earned without
            reaching the threshold first.
          </p>
          <table className="data-table">
            <thead>
              <tr><th>Tier</th><th>Score Threshold</th><th>Bonus Added</th></tr>
            </thead>
            <tbody>
              {TIERS.map(t => (
                <tr key={t.tier}>
                  <td>
                    <span className="tier-pill" style={{ color: t.color, borderColor: t.color }}>
                      {t.tier}
                    </span>
                  </td>
                  <td style={{ fontFamily: "'Space Mono', monospace", fontSize: ".78rem" }}>
                    {t.min.toLocaleString()}{t.max ? ` – ${t.max.toLocaleString()}` : "+"}
                  </td>
                  <td style={{ fontFamily: "'Space Mono', monospace", fontSize: ".78rem", color: t.bonus > 0 ? "#e8e8e8" : "#555" }}>
                    {t.bonus > 0 ? `+${t.bonus}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="info-box">
            <strong style={{ color: "#e8e8e8" }}>Example:</strong> A member who attended 12 events
            and placed in 1 hackathon has a base score of (12 × 10) + (1 × 30) = 150. This crosses
            the Seeker threshold (100), adding a +50 bonus for a final score of <strong style={{ color: "#e8e8e8" }}>200</strong>.
          </div>
        </div>

        <div className="doc-divider" />

        {/* S3 */}
        <div className="doc-section section-anchor" id="s3">
          <div className="section-heading">
            <span className="section-num">03</span>
            Membership Tiers
          </div>
          <p>
            Signal has six membership tiers. Your tier is determined by your final Signal Score and
            is recalculated automatically whenever your score changes. Tiers are displayed on your
            Builder Passport and the public leaderboard.
          </p>
          <table className="data-table">
            <thead>
              <tr><th>Tier</th><th>Min Score</th><th>Tier Bonus</th><th>Description</th></tr>
            </thead>
            <tbody>
              {TIERS.map(t => (
                <tr key={t.tier}>
                  <td style={{ fontWeight: 700, color: t.color }}>{t.tier}</td>
                  <td style={{ fontFamily: "'Space Mono',monospace", fontSize: ".78rem" }}>{t.min.toLocaleString()}</td>
                  <td style={{ fontFamily: "'Space Mono',monospace", fontSize: ".78rem", color: t.bonus > 0 ? "#e8e8e8" : "#555" }}>{t.bonus > 0 ? `+${t.bonus}` : "—"}</td>
                  <td style={{ color: "#888", fontSize: ".8rem" }}>{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="doc-divider" />

        {/* S4 */}
        <div className="doc-section section-anchor" id="s4">
          <div className="section-heading">
            <span className="section-num">04</span>
            NFT Badge System
          </div>
          <p>
            Every check-in mints a Metaplex NFT to your wallet. The badge level (LV1–LV5) is
            determined by your total events attended at the time of minting. Higher levels reflect
            a longer history of real-world presence.
          </p>

          <div className="badge-grid">
            {NFT_BADGES.map(b => (
              <div className="badge-card" key={b.lv}>
                <img src={b.img} alt={b.label} className="badge-img" />
                <div className="badge-lv">{b.lv}</div>
                <div className="badge-req">{b.events} events<br />{b.label}</div>
              </div>
            ))}
          </div>

          <table className="data-table">
            <thead>
              <tr><th>Badge Level</th><th>Events Required</th><th>Label</th></tr>
            </thead>
            <tbody>
              {NFT_BADGES.map(b => (
                <tr key={b.lv}>
                  <td style={{ fontFamily: "'Orbitron',sans-serif", fontSize: ".78rem", fontWeight: 700 }}>{b.lv}</td>
                  <td style={{ fontFamily: "'Space Mono',monospace", fontSize: ".78rem" }}>{b.events} events attended</td>
                  <td>{b.label}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="info-box">
            Badge level is calculated at mint time. If you attended 6 events before minting, you
            receive an LV3 badge. Future check-ins may qualify you for a higher badge on your next
            event attendance.
          </div>
        </div>

        <div className="doc-divider" />

        {/* S5 */}
        <div className="doc-section section-anchor" id="s5">
          <div className="section-heading">
            <span className="section-num">05</span>
            NFT Types &amp; Point Values
          </div>
          <p>Signal issues three distinct NFT types, each representing a different level of verified activity.</p>

          <div className="sub-heading">1. Attendance NFT</div>
          <p>
            Minted automatically when you check in to an event via the Signal QR code. Proves you
            were physically present at the event. Each attendance NFT is unique to the event and
            records the event code, organizer, timestamp, and your capacity slot number.
          </p>
          <div className="formula">
            Symbol: SIGNAL &nbsp;·&nbsp; Points: +10 &nbsp;·&nbsp; Type: attendance
          </div>

          <div className="sub-heading">2. Participation NFT</div>
          <p>
            Awarded directly by an event organizer to recognise verified participation — typically
            for speakers, panellists, workshop facilitators, or active contributors. Cannot be
            self-claimed; must be issued by the organizer wallet.
          </p>
          <div className="formula">
            Symbol: SIGNAL &nbsp;·&nbsp; Points: +50 &nbsp;·&nbsp; Type: participation
          </div>

          <div className="sub-heading">3. Achievement NFT</div>
          <p>
            Issued by Signal admins for verified hackathon or competition results. The rank field
            determines the point value. Grand Prize winners receive the maximum allocation.
          </p>
          <div className="formula">
            Symbol: SIGNAL &nbsp;·&nbsp; Points: +300 (placement) / +1,000 (grand prize) &nbsp;·&nbsp; Type: achievement
          </div>
        </div>

        <div className="doc-divider" />

        {/* S6 */}
        <div className="doc-section section-anchor" id="s6">
          <div className="section-heading">
            <span className="section-num">06</span>
            Check-In Protocol
          </div>
          <p>
            Signal uses Ed25519 co-signature verification to ensure only the event organizer can
            produce a valid check-in QR code. The protocol works as follows:
          </p>
          <table className="data-table">
            <thead>
              <tr><th>Step</th><th>Action</th><th>Actor</th></tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>Organizer creates event on-chain via the Organizer page</td><td>Organizer wallet</td></tr>
              <tr><td>2</td><td>Organizer signs message <code style={{ fontSize:".72rem", background:"rgba(255,255,255,.06)", padding:".1rem .4rem", borderRadius:4 }}>signal_checkin:&#123;code&#125;:&#123;expiry&#125;</code> with their wallet</td><td>Organizer wallet</td></tr>
              <tr><td>3</td><td>Signed URL with <code style={{ fontSize:".72rem", background:"rgba(255,255,255,.06)", padding:".1rem .4rem", borderRadius:4 }}>?event=&sig=&exp=</code> is embedded in QR code</td><td>Signal protocol</td></tr>
              <tr><td>4</td><td>Attendee scans QR, signature is verified on-chain by the program</td><td>Solana program</td></tr>
              <tr><td>5</td><td>Attendance PDA is created; attendee claims their NFT from their profile</td><td>Attendee wallet</td></tr>
            </tbody>
          </table>
          <p>
            QR codes expire at the event end time. Expired signatures are rejected by the Solana
            program and cannot produce a valid check-in.
          </p>
        </div>

        <div className="doc-divider" />

        {/* S7 */}
        <div className="doc-section section-anchor" id="s7">
          <div className="section-heading">
            <span className="section-num">07</span>
            Sybil Resistance
          </div>
          <p>
            Signal is designed from the ground up to prevent fake check-ins. The following
            mechanisms enforce one human, one check-in per event:
          </p>
          <table className="data-table">
            <thead>
              <tr><th>Mechanism</th><th>How it works</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>On-chain PDA uniqueness</td>
                <td>Each attendance record is a Program Derived Address (PDA) seeded by the event + wallet. A second check-in attempt from the same wallet on the same event fails at the Solana runtime level.</td>
              </tr>
              <tr>
                <td>Organizer signature</td>
                <td>The QR URL contains a cryptographic signature only the organizer can produce. The Solana program verifies it using the Ed25519 instruction sysvar — no valid QR means no check-in.</td>
              </tr>
              <tr>
                <td>Expiry timestamp</td>
                <td>Every QR has an expiry matching the event end time. The program checks the current Solana clock against the expiry and rejects stale signatures.</td>
              </tr>
              <tr>
                <td>Capacity enforcement</td>
                <td>Events have a maximum capacity set at creation. The program rejects check-ins once the attendee count reaches capacity.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="doc-divider" />

        {/* S8 */}
        <div className="doc-section section-anchor" id="s8">
          <div className="section-heading">
            <span className="section-num">08</span>
            Platform Rules &amp; Conduct
          </div>
          <p>By using Signal you agree to the following:</p>
          <table className="data-table">
            <thead><tr><th>#</th><th>Rule</th></tr></thead>
            <tbody>
              {[
                "You may only check in to events you physically attended. Fraudulent check-ins violate these terms and may result in removal from the community.",
                "You may not share QR codes publicly before or after an event in a way that allows others to check in without attending.",
                "Organizers are responsible for the accuracy of events they deploy. Fake or misleading events are prohibited.",
                "Signal Score and tier data are derived entirely from on-chain state. Signal cannot modify, reset, or reverse on-chain transactions.",
                "Achievement NFTs are issued solely at the discretion of Signal admins based on verified results. No purchase or payment guarantees an achievement NFT.",
                "You are responsible for the security of your wallet private keys. Signal does not have access to your keys and cannot recover lost wallets.",
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: "#555", width: "2.5rem" }}>{i + 1}</td>
                  <td style={{ fontSize: ".82rem", color: "#aaa", lineHeight: 1.7 }}>{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="doc-divider" />

        {/* S9 */}
        <div className="doc-section section-anchor" id="s9">
          <div className="section-heading">
            <span className="section-num">09</span>
            Data &amp; Privacy
          </div>
          <p>
            Signal stores all identity and reputation data on-chain via Solana accounts. Your wallet
            public key is your identifier — no email, name, or personal information is required or
            stored by Signal.
          </p>
          <p>
            Contact form submissions (name, email, message) are transmitted to the Signal team email
            via encrypted SMTP and are not stored in any database. They are used solely to respond
            to your inquiry.
          </p>
          <p>
            On-chain data (attendance records, scores, NFT metadata) is public and permanently
            stored on Solana. This is a feature of blockchain systems and cannot be reversed.
          </p>
        </div>

        <div className="doc-divider" />

        {/* S10 */}
        <div className="doc-section section-anchor" id="s10">
          <div className="section-heading">
            <span className="section-num">10</span>
            Disclaimer
          </div>
          <p>
            Signal is provided "as is" during the Colosseum Hackathon evaluation period. The
            platform operates on Solana Devnet and carries no monetary value. NFTs and scores
            on devnet are for demonstration purposes only.
          </p>
          <p>
            Signal is not responsible for loss of funds, wallet compromise, network downtime, or
            any other damages arising from use of the platform. By connecting your wallet and
            interacting with Signal, you acknowledge and accept these risks.
          </p>
          <p>
            Signal reserves the right to update these terms at any time. Continued use of the
            platform constitutes acceptance of the most recent version.
          </p>
          <div className="info-box">
            For questions or concerns, use the contact form in the footer or reach out on X at{" "}
            <a href="https://x.com/Signal_thailand" target="_blank" rel="noreferrer"
              style={{ color: "#e8e8e8", textDecoration: "underline" }}>
              @Signal_thailand
            </a>.
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}
