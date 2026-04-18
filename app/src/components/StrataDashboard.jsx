import { useState } from "react";

// ─── Mock Data — Proof of Presence Protocol ─────────────────────────

const generateId = () => Math.random().toString(36).slice(2, 10);

const INITIAL_MEMBERS = [
  { id: "m1", wallet: "7xKp...3nRq", username: "alice_dev",    reputation: 285, tier: "Core",     eventsAttended: 8,  lastActive: Date.now() - 120000 },
  { id: "m2", wallet: "9fBx...7mWe", username: "bob_builder",  reputation: 156, tier: "Builder",  eventsAttended: 5,  lastActive: Date.now() - 3600000 },
  { id: "m3", wallet: "3kLm...8pZa", username: "carol_ops",    reputation: 92,  tier: "Resident", eventsAttended: 3,  lastActive: Date.now() - 7200000 },
  { id: "m4", wallet: "5qNr...2vHi", username: "dave_defi",    reputation: 344, tier: "Legend",   eventsAttended: 14, lastActive: Date.now() - 60000 },
  { id: "m5", wallet: "8jTw...6cEo", username: "eve_design",   reputation: 48,  tier: "Seeker",   eventsAttended: 1,  lastActive: Date.now() - 86400000 },
];

const INITIAL_EVENTS = [
  {
    id: "e1", eventCode: "STRATA01",
    title: "Strata Genesis Gathering",
    description: "The first Strata DAO community meetup. Connect with builders, governance contributors, and early residents.",
    location: "Siam Paragon", country: "Thailand", city: "Bangkok",
    eventDate: Date.now() + 86400000 * 3,
    capacity: 200, attendeeCount: 47,
    entryFee: 0, organizer: "alice_dev",
    status: "live",
    copilotScore: 91,
    createdAt: Date.now() - 172800000,
  },
  {
    id: "e2", eventCode: "BKKHACK1",
    title: "Bangkok Web3 Hacker House",
    description: "48-hour on-site hacker house for Solana developers. Build, ship, and earn reputation.",
    location: "Hubba-TO Co-working", country: "Thailand", city: "Bangkok",
    eventDate: Date.now() + 86400000 * 10,
    capacity: 80, attendeeCount: 23,
    entryFee: 0.05, organizer: "dave_defi",
    status: "upcoming",
    copilotScore: null,
    createdAt: Date.now() - 86400000,
  },
  {
    id: "e3", eventCode: "CHIANGM1",
    title: "Chiang Mai DAO Summit",
    description: "Governance, treasury management, and community coordination masterclass in Northern Thailand.",
    location: "CAMP Coworking", country: "Thailand", city: "Chiang Mai",
    eventDate: Date.now() + 86400000 * 21,
    capacity: 120, attendeeCount: 0,
    entryFee: 0.1, organizer: "carol_ops",
    status: "upcoming",
    copilotScore: null,
    createdAt: Date.now() - 43200000,
  },
  {
    id: "e4", eventCode: "GENESIS0",
    title: "Strata Protocol Launch",
    description: "The founding event. All 34 attendees hold Edition #1 of the Genesis NFT collection.",
    location: "True Digital Park", country: "Thailand", city: "Bangkok",
    eventDate: Date.now() - 86400000 * 7,
    capacity: 50, attendeeCount: 34,
    entryFee: 0, organizer: "alice_dev",
    status: "ended",
    copilotScore: 96,
    createdAt: Date.now() - 86400000 * 10,
  },
];

// ─── Copilot Event Scoring ────────────────────────────────────────────

function simulateCopilotEventScore(event, members) {
  let score = 60;
  const reasons = [];
  const organizer = members.find((m) => m.username === event.organizer);
  if (organizer?.reputation >= 200) { score += 15; reasons.push("Organizer has strong reputation."); }
  else if (organizer?.reputation >= 80) { score += 8; reasons.push("Organizer is an established resident."); }
  const fillRate = event.attendeeCount / event.capacity;
  if (fillRate >= 0.8) { score += 15; reasons.push("Event is near capacity — high demand."); }
  else if (fillRate >= 0.4) { score += 8; reasons.push("Healthy attendance rate."); }
  if (event.entryFee > 0) { score += 5; reasons.push("Entry fee signals committed attendees."); }
  const approved = score >= 70;
  return {
    approved,
    confidence: Math.min(score, 100),
    reasoning: `[Copilot] ${approved ? "ENDORSED" : "NEEDS REVIEW"} (${Math.min(score, 100)}%). ${reasons.join(" ")}`,
  };
}

// ─── CSS Animations ─────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');

  * { box-sizing: border-box; }

  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes glitch {
    0%, 88%, 100% { transform: translate(0); filter: none; }
    89% { transform: translate(-3px, 1px); filter: grayscale(1) contrast(2); clip-path: polygon(0 15%, 100% 15%, 100% 35%, 0 35%); }
    90% { transform: translate(3px, -1px); clip-path: polygon(0 55%, 100% 55%, 100% 75%, 0 75%); }
    91% { transform: translate(0); filter: none; clip-path: none; }
  }
  @keyframes pulseBorder {
    0%, 100% { box-shadow: 0 0 0 1px #1e1e1e; }
    50%       { box-shadow: 0 0 0 1px #555555, 0 0 18px #ffffff0a; }
  }
  @keyframes flicker {
    0%, 94%, 100% { opacity: 1; }
    95% { opacity: 0.75; }
    96% { opacity: 1; }
    97% { opacity: 0.88; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes sigilRotate {
    0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.03; }
    50% { transform: rotate(180deg) scale(1.05); opacity: 0.06; }
  }
  @keyframes ornamentFlicker {
    0%, 90%, 100% { opacity: 1; }
    92% { opacity: 0.2; }
    94% { opacity: 1; }
  }
  @keyframes grain {
    0%, 100% { transform: translate(0, 0); }
    10% { transform: translate(-2%, -3%); }
    20% { transform: translate(3%, 2%); }
    30% { transform: translate(-1%, 4%); }
    40% { transform: translate(4%, -1%); }
    50% { transform: translate(-3%, 3%); }
    60% { transform: translate(2%, -4%); }
    70% { transform: translate(-4%, 1%); }
    80% { transform: translate(1%, -2%); }
    90% { transform: translate(3%, 3%); }
  }

  /* ── Panel ── */
  .necro-card {
    position: relative;
    background: #080808;
    border: 1px solid #1e1e1e;
    box-shadow: inset 1px 1px 0 #2a2a2a, inset -1px -1px 0 #111111;
    transition: border-color 0.2s;
    animation: fadeInUp 0.4s ease both;
    overflow: visible;
  }
  .necro-card:hover {
    border-color: #555555;
    box-shadow: inset 1px 1px 0 #444444, inset -1px -1px 0 #111111;
  }

  /* Top ornamental rule */
  .necro-card::before {
    content: '────────────────────────────────────────';
    position: absolute;
    top: -9px; left: 50%; transform: translateX(-50%);
    color: #2a2a2a;
    font-size: 11px;
    letter-spacing: 0;
    white-space: nowrap;
    overflow: hidden;
    width: calc(100% - 20px);
    text-align: center;
    pointer-events: none;
    animation: ornamentFlicker 14s infinite;
    font-family: 'Share Tech Mono', monospace;
  }
  /* Bottom ornamental rule */
  .necro-card::after {
    content: '────────────────────────────────────────';
    position: absolute;
    bottom: -9px; left: 50%; transform: translateX(-50%);
    color: #2a2a2a;
    font-size: 11px;
    letter-spacing: 0;
    white-space: nowrap;
    overflow: hidden;
    width: calc(100% - 20px);
    text-align: center;
    pointer-events: none;
    animation: ornamentFlicker 14s infinite 7s;
    font-family: 'Share Tech Mono', monospace;
  }

  /* Gothic corner marks */
  .gothic-corners {
    position: absolute;
    inset: -2px;
    pointer-events: none;
  }
  .gothic-corners span {
    position: absolute;
    font-size: 11px;
    line-height: 1;
    color: #333333;
    animation: ornamentFlicker 10s infinite;
  }
  .gothic-corners span:nth-child(1) { top: -6px; left: -3px; }
  .gothic-corners span:nth-child(2) { top: -6px; right: -3px; }
  .gothic-corners span:nth-child(3) { bottom: -6px; left: -3px; animation-delay: 1.2s; }
  .gothic-corners span:nth-child(4) { bottom: -6px; right: -3px; animation-delay: 2.4s; }

  /* Blood drips removed */
  .necro-card .blood-drip { display: none; }

  .glitch-title {
    animation: glitch 9s infinite, flicker 14s infinite;
  }

  .pulse-card {
    animation: pulseBorder 2.8s ease-in-out infinite !important;
  }

  /* ── Buttons — Y2K bevel ── */
  .btn-necro {
    position: relative;
    background: #0d0d0d;
    border: 1px solid #3a3a3a;
    color: #aaaaaa;
    cursor: pointer;
    font-family: 'Share Tech Mono', monospace;
    font-size: 13px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 10px 20px;
    transition: all 0.15s;
    box-shadow: inset 1px 1px 0 #3a3a3a, inset -1px -1px 0 #111111;
  }
  .btn-necro::before { content: none; }
  .btn-necro::after  { content: none; }
  .btn-necro:hover {
    border-color: #888888;
    color: #ffffff;
    box-shadow: inset 1px 1px 0 #888888, inset -1px -1px 0 #1a1a1a;
  }
  .btn-necro:active {
    box-shadow: inset -1px -1px 0 #444444, inset 1px 1px 0 #0a0a0a;
  }

  .btn-necro-primary {
    background: #1a1a1a;
    border-color: #888888;
    color: #f0f0f0;
    box-shadow: inset 1px 1px 0 #aaaaaa, inset -1px -1px 0 #111111;
  }
  .btn-necro-primary:hover {
    background: #222222;
    border-color: #ffffff;
    color: #ffffff;
    box-shadow: inset 1px 1px 0 #ffffff, inset -1px -1px 0 #333333;
  }

  /* ── Tabs ── */
  .tab-btn {
    position: relative;
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    color: #444444;
    cursor: pointer;
    font-family: 'Cinzel Decorative', serif;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 14px 22px;
    transition: color 0.2s;
  }
  .tab-btn::before {
    content: '';
    position: absolute;
    bottom: 0; left: 50%; transform: translateX(-50%);
    width: 0; height: 1px;
    background: #ffffff;
    transition: width 0.25s;
  }
  .tab-btn:hover { color: #aaaaaa; }
  .tab-btn:hover::before { width: 60%; }
  .tab-btn.active { color: #ffffff; }
  .tab-btn.active::before { width: 100%; }

  /* ── Inputs ── */
  .input-necro {
    width: 100%;
    padding: 10px 14px;
    background: #060606;
    border: 1px solid #222222;
    border-top-color: #444444;
    color: #f0f0f0;
    font-size: 14px;
    font-family: 'Share Tech Mono', monospace;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;
    box-shadow: inset 1px 1px 0 #111111;
  }
  .input-necro:focus {
    border-color: #666666;
    border-top-color: #aaaaaa;
  }
  .input-necro::placeholder { color: #2e2e2e; }

  /* ── Scrollbar ── */
  .scrollbar-necro::-webkit-scrollbar { width: 4px; }
  .scrollbar-necro::-webkit-scrollbar-track { background: #080808; }
  .scrollbar-necro::-webkit-scrollbar-thumb { background: #333333; border-radius: 0; }

  /* ── Section divider ── */
  .gothic-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
  }
  .gothic-divider::before, .gothic-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, #2a2a2a);
  }
  .gothic-divider::after {
    background: linear-gradient(to left, transparent, #2a2a2a);
  }

  /* ── Section heading ── */
  .gothic-heading {
    font-family: 'Cinzel Decorative', serif;
    font-size: 13px;
    color: #888888;
    letter-spacing: 3px;
    text-transform: uppercase;
  }
`;

// ─── Corner-bracket Panel ────────────────────────────────────────────

// Gothic corner symbols
const CORNER_SYMBOLS = ["⸸", "⸸", "⸸", "⸸"];

function NecroPanel({ children, style, className = "", pulse = false, drips = false }) {
  // Random drip positions
  const dripPositions = drips ? [15, 35, 55, 75] : [];
  return (
    <div className={`necro-card ${pulse ? "pulse-card" : ""} ${className}`} style={style}>
      {/* Gothic corner ornaments */}
      <div className="gothic-corners" aria-hidden>
        {CORNER_SYMBOLS.map((sym, i) => <span key={i}>{sym}</span>)}
      </div>
      {/* Blood drips on hover */}
      {dripPositions.map((pos, i) => (
        <div key={i} className="blood-drip" style={{ left: `${pos}%`, animationDelay: `${i * 0.8}s` }} aria-hidden />
      ))}
      {children}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const config = {
    upcoming:  { bg: "#111111", border: "#333333", text: "#888888", label: "UPCOMING" },
    live:      { bg: "#111111", border: "#666666", text: "#ffffff", label: "● LIVE" },
    ended:     { bg: "#0a0a0a", border: "#222222", text: "#444444", label: "ENDED" },
    cancelled: { bg: "#0a0a0a", border: "#1e1e1e", text: "#333333", label: "CANCELLED" },
  };
  const c = config[status] || config.upcoming;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px",
      fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase",
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      fontFamily: "'Share Tech Mono', monospace",
      clipPath: "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
    }}>
      {c.label}
    </span>
  );
}

// ─── Tier Badge ──────────────────────────────────────────────────────

function TierBadge({ tier }) {
  const config = {
    Initiate: { roman: "I",   color: "#444444" },
    Seeker:   { roman: "II",  color: "#666666" },
    Resident: { roman: "III", color: "#888888" },
    Builder:  { roman: "IV",  color: "#aaaaaa" },
    Core:     { roman: "V",   color: "#cccccc" },
    Legend:   { roman: "VI",  color: "#ffffff" },
  };
  const c = config[tier] || config.Initiate;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 8px", fontSize: "11px", fontWeight: 700,
      fontFamily: "'Share Tech Mono', monospace", letterSpacing: "1px",
      background: `${c.color}18`, color: c.color,
      border: `1px solid ${c.color}44`,
      textTransform: "uppercase",
    }}>
      {c.roman} · {tier}
    </span>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────

function StatCard({ label, value, accent }) {
  return (
    <NecroPanel drips style={{ padding: "18px 20px", flex: 1, minWidth: "130px" }}>
      <div style={{
        fontSize: "15px", textTransform: "uppercase", letterSpacing: "2px",
        color: "#999999", marginBottom: "8px", fontFamily: "'Share Tech Mono', monospace",
      }}>
        // {label}
      </div>
      <div style={{
        fontSize: "26px", fontWeight: 700, color: accent || "#cc4444",
        fontFamily: "'Share Tech Mono', monospace", letterSpacing: "-1px",
        textShadow: "none",
      }}>
        {value}
      </div>
    </NecroPanel>
  );
}

// ─── Create Event Modal ──────────────────────────────────────────────

function CreateEventModal({ onClose, onCreate }) {
  const [title, setTitle]       = useState("");
  const [description, setDesc]  = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry]   = useState("Thailand");
  const [city, setCity]         = useState("");
  const [eventDate, setDate]    = useState("");
  const [capacity, setCapacity] = useState("");
  const [entryFee, setFee]      = useState("0");

  const handleSubmit = () => {
    if (!title || !location || !eventDate || !capacity) return;
    const code = generateId().toUpperCase().slice(0, 8);
    onCreate({
      id: generateId(), eventCode: code,
      title, description, location, country, city,
      eventDate: new Date(eventDate).getTime(),
      capacity: parseInt(capacity), attendeeCount: 0,
      entryFee: parseFloat(entryFee) || 0,
      organizer: "you", status: "upcoming",
      copilotScore: null, createdAt: Date.now(),
    });
    onClose();
  };

  const F = ({ label, children }) => (
    <div>
      <label style={{ display: "block", fontSize: "11px", color: "#999999", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "2px", fontFamily: "'Share Tech Mono', monospace" }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000dd", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="necro-card scrollbar-necro" style={{ padding: "32px", width: "90%", maxWidth: "560px", maxHeight: "92vh", overflow: "auto", background: "#080508" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
          <div style={{ width: "3px", height: "24px", background: "linear-gradient(to bottom, #888888, #222222)" }} />
          <h2 style={{ margin: 0, fontSize: "14px", color: "#cc4444", fontFamily: "'Cinzel Decorative', serif", letterSpacing: "3px" }}>Host an Event</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <F label="Event Title"><input className="input-necro" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bangkok Web3 Hacker House" /></F>
          <F label="Description"><textarea className="input-necro" style={{ minHeight: "72px", resize: "vertical" }} value={description} onChange={(e) => setDesc(e.target.value)} placeholder="What's happening at this event..." /></F>
          <div style={{ display: "flex", gap: "12px" }}>
            <F label="Location / Venue"><input className="input-necro" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Hubba-TO Co-working" /></F>
            <F label="City"><input className="input-necro" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bangkok" /></F>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <F label="Country"><input className="input-necro" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Thailand" /></F>
            <F label="Date"><input className="input-necro" type="date" value={eventDate} onChange={(e) => setDate(e.target.value)} /></F>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <F label="Capacity"><input className="input-necro" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="100" /></F>
            <F label="Entry Fee (SOL)"><input className="input-necro" type="number" step="0.01" value={entryFee} onChange={(e) => setFee(e.target.value)} placeholder="0" /></F>
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button onClick={onClose} className="btn-necro" style={{ flex: 1 }}>Cancel</button>
            <button onClick={handleSubmit} className="btn-necro btn-necro-primary" style={{ flex: 1, opacity: title && location && eventDate && capacity ? 1 : 0.4 }}>
              Deploy Event On-Chain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Check-in QR Panel ───────────────────────────────────────────────

function CheckInPanel({ event, members }) {
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState(event.copilotScore);
  const blinkUrl = `/api/checkin/${event.eventCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`https://dial.to/?action=solana-action:${blinkUrl}`)}`;

  const runScore = () => {
    setScoring(true);
    setTimeout(() => {
      const result = simulateCopilotEventScore(event, members || []);
      setScore(result.confidence);
      setScoring(false);
    }, 1800);
  };

  return (
    <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e1e1e", display: "flex", gap: "20px", flexWrap: "wrap", animation: "fadeInUp 0.2s ease" }}>
      {/* QR Code */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <div style={{ padding: "8px", background: "#ffffff", lineHeight: 0 }}>
          <img src={qrUrl} width={140} height={140} alt="check-in QR" style={{ display: "block" }} />
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#666666", letterSpacing: "2px" }}>
          SCAN TO CHECK IN
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "13px", color: "#aaaaaa", letterSpacing: "3px" }}>
          {event.eventCode}
        </div>
      </div>

      {/* Info + Copilot */}
      <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", color: "#666666", lineHeight: 1.8 }}>
          <div><span style={{ color: "#444444" }}>EVENT_CODE:</span> <span style={{ color: "#cccccc" }}>{event.eventCode}</span></div>
          <div><span style={{ color: "#444444" }}>CAPACITY:</span> <span style={{ color: "#ffffff" }}>{event.attendeeCount} / {event.capacity}</span></div>
          <div><span style={{ color: "#444444" }}>BLINK_URL:</span> <span style={{ color: "#888888", fontSize: "11px" }}>{blinkUrl}</span></div>
        </div>

        {/* Fill bar */}
        <div style={{ height: "3px", background: "#1a1a1a", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.round((event.attendeeCount / event.capacity) * 100)}%`, background: "#ffffff", transition: "width 0.5s" }} />
        </div>

        {/* Copilot score */}
        {score ? (
          <div style={{ padding: "10px 14px", background: "#0a0a0a", border: "1px solid #333333", boxShadow: "inset 1px 1px 0 #1e1e1e" }}>
            <div style={{ fontSize: "11px", color: "#555555", fontFamily: "'Share Tech Mono', monospace", marginBottom: "4px" }}>// COPILOT ENDORSEMENT</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: score >= 80 ? "#ffffff" : "#aaaaaa", fontFamily: "'Share Tech Mono', monospace" }}>
              {score}% <span style={{ fontSize: "12px", color: "#666666" }}>{score >= 80 ? "ENDORSED" : "REVIEW SUGGESTED"}</span>
            </div>
          </div>
        ) : (
          <button onClick={runScore} disabled={scoring} className="btn-necro" style={{ opacity: scoring ? 0.6 : 1, display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            {scoring ? <><span style={{ display: "inline-block", width: "10px", height: "10px", border: "1px solid #aaaaaa", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Scoring...</> : "// Run Copilot Score"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────

export default function StrataDashboard({ onBack }) {
  const [activeTab, setActiveTab]         = useState("events");
  const [events, setEvents]               = useState(INITIAL_EVENTS);
  const [members]                         = useState(INITIAL_MEMBERS);
  const [showCreateModal, setShowCreate]  = useState(false);
  const [walletConnected, setWallet]      = useState(false);
  const [expandedEvent, setExpanded]      = useState(null);
  const [copilotLogs, setCopilotLogs]     = useState([
    { id: "l1", timestamp: Date.now() - 300000,  type: "checkin",    message: "Verified attendance: 47 check-ins at Strata Genesis Gathering · STRATA01", tx: "4xK2...9nBp" },
    { id: "l2", timestamp: Date.now() - 600000,  type: "reputation", message: "Tier upgrade: alice_dev → Core (8 events attended, rep +160)", tx: "7mPq...3rWe" },
    { id: "l3", timestamp: Date.now() - 1200000, type: "nft",        message: "Minted 34 Proof-of-Presence NFTs for Genesis Launch · edition #1–34", tx: "2vHi...8pZa" },
    { id: "l4", timestamp: Date.now() - 3600000, type: "event",      message: "Copilot endorsed Bangkok Web3 Hacker House — score 91%", tx: "9qNr...7cEo" },
  ]);

  const timeAgo = (ts) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const formatDate = (ts) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleCreateEvent = (ev) => {
    setEvents([ev, ...events]);
    setCopilotLogs((prev) => [
      { id: generateId(), timestamp: Date.now(), type: "event", message: `New event deployed: '${ev.title}' · code ${ev.eventCode}`, tx: `${generateId()}...${generateId()}` },
      ...prev,
    ]);
  };

  const stats = {
    members:       members.length,
    liveEvents:    events.filter((e) => e.status === "live").length,
    totalCheckins: events.reduce((s, e) => s + e.attendeeCount, 0),
    upcomingCount: events.filter((e) => e.status === "upcoming").length,
  };

  return (
    <>
      {/* Inject global styles + keyframes */}
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      <div
        className="scrollbar-necro"
        style={{
          minHeight: "100vh",
          background: "#000000",
          color: "#ffffff",
          fontFamily: "'Rajdhani', 'Segoe UI', sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Scan-line overlay ── */}
        <div
          aria-hidden
          style={{
            position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999,
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, #00000018 2px, #00000018 4px)",
          }}
        />
        {/* ── Moving scan line ── */}
        <div
          aria-hidden
          style={{
            position: "fixed", left: 0, right: 0, height: "2px",
            background: "linear-gradient(to right, transparent, #ffffff08, #ffffff14, #ffffff08, transparent)",
            pointerEvents: "none", zIndex: 998,
            animation: "scanline 8s linear infinite",
          }}
        />
        {/* ── Background grid ── */}
        <div
          aria-hidden
          style={{
            position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
            backgroundImage: "linear-gradient(#ffffff06 1px, transparent 1px), linear-gradient(90deg, #ffffff06 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* ── Giant background sigil ── */}
        <div aria-hidden style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "600px", lineHeight: 1,
          color: "#ffffff04",
          pointerEvents: "none", zIndex: 0,
          userSelect: "none",
          animation: "sigilRotate 30s ease-in-out infinite",
          fontFamily: "serif",
        }}>
          ✠
        </div>
        {/* ── Film grain overlay ── */}
        <div aria-hidden style={{
          position: "fixed", inset: "-50%", pointerEvents: "none", zIndex: 998,
          width: "200%", height: "200%",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
          opacity: 0.4,
          animation: "grain 0.5s steps(1) infinite",
          mixBlendMode: "overlay",
        }} />

        {/* ── Header ── */}
        <div style={{
          borderBottom: "1px solid #1e1e1e",
          padding: "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#000000f2",
          position: "sticky", top: 0, zIndex: 50,
          backdropFilter: "blur(12px)",
          boxShadow: "0 1px 0 #2a2a2a",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "36px", height: "36px",
              border: "1px solid #555555",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", fontWeight: 900, color: "#ffffff",
              fontFamily: "'Share Tech Mono', monospace",
              boxShadow: "inset 1px 1px 0 #888888, inset -1px -1px 0 #111111",
              clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              animation: "pulseBorder 3s ease-in-out infinite",
            }}>
              S
            </div>
            <div>
              <div
                className="glitch-title"
                style={{
                  fontSize: "26px", fontWeight: 400, color: "#ffffff",
                  fontFamily: "'UnifrakturMaguntia', cursive",
                  letterSpacing: "4px",
                }}
              >
                STRATA
              </div>
              <div style={{ fontSize: "10px", color: "#555555", letterSpacing: "4px", fontFamily: "'Cinzel Decorative', serif" }}>
                Proof of Presence Protocol · v0.1
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <a href="/organizer" style={{
              fontSize: "11px", color: "#9ca3af", textDecoration: "none", letterSpacing: "0.1em",
              padding: "5px 12px", border: "1px solid #374151", borderRadius: "2px",
              fontFamily: "'Share Tech Mono', monospace",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.target.style.color="#dc2626"; e.target.style.borderColor="#dc2626"; }}
              onMouseLeave={e => { e.target.style.color="#9ca3af"; e.target.style.borderColor="#374151"; }}
            >ORGANIZER</a>
            <a href="/profile" style={{
              fontSize: "11px", color: "#9ca3af", textDecoration: "none", letterSpacing: "0.1em",
              padding: "5px 12px", border: "1px solid #374151", borderRadius: "2px",
              fontFamily: "'Share Tech Mono', monospace",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.target.style.color="#dc2626"; e.target.style.borderColor="#dc2626"; }}
              onMouseLeave={e => { e.target.style.color="#9ca3af"; e.target.style.borderColor="#374151"; }}
            >PROFILE</a>
            <div style={{
              padding: "4px 12px", fontSize: "12px", fontWeight: 600,
              background: "#111111", color: "#aaaaaa", border: "1px solid #333333",
              fontFamily: "'Share Tech Mono', monospace", letterSpacing: "2px",
              display: "flex", alignItems: "center", gap: "6px",
              boxShadow: "inset 1px 1px 0 #2a2a2a, inset -1px -1px 0 #0a0a0a",
            }}>
              <span style={{ animation: "blink 1.2s infinite", color: "#ffffff" }}>●</span>
              DEVNET
            </div>
            <button
              onClick={() => setWallet(!walletConnected)}
              className={`btn-necro ${walletConnected ? "" : "btn-necro-primary"}`}
            >
              {walletConnected ? "7xKp...3nRq" : "// Connect Wallet"}
            </button>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div style={{ padding: "20px 24px", display: "flex", gap: "10px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          <StatCard label="Members" value={stats.members} accent="#ffffff" />
          <StatCard label="Live Events" value={stats.liveEvents} accent="#cccccc" />
          <StatCard label="Total Check-ins" value={stats.totalCheckins} accent="#aaaaaa" />
          <StatCard label="Upcoming" value={stats.upcomingCount} accent="#888888" />
        </div>

        {/* ── Tab Nav ── */}
        <div style={{ padding: "0 24px", display: "flex", gap: "0", borderBottom: "1px solid #1e1e1e", position: "relative", zIndex: 1 }}>
          {["events", "members", "copilot"].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "copilot" ? "// AI Copilot" : `// ${tab}`}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ padding: "24px", position: "relative", zIndex: 1 }}>

          {/* ── Events Tab ── */}
          {activeTab === "events" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "3px", height: "20px", background: "linear-gradient(to bottom, #888888, #222222)" }} />
                  <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f0f0f0", fontFamily: "'Cinzel Decorative', serif", letterSpacing: "3px", textShadow: "none" }}>
                    // EVENT_REGISTRY
                  </h2>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn-necro btn-necro-primary">
                  + Host Event
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {events.map((event, i) => (
                  <div
                    key={event.id}
                    className={`necro-card ${event.status === "live" ? "pulse-card" : ""}`}
                    onClick={() => setExpanded(expandedEvent === event.id ? null : event.id)}
                    style={{ padding: "16px 20px", cursor: "pointer", animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="gothic-corners" aria-hidden>
                      {CORNER_SYMBOLS.map((sym, ci) => <span key={ci}>{sym}</span>)}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.5px" }}>
                            {event.title}
                          </span>
                          <StatusBadge status={event.status} />
                        </div>
                        <div style={{ fontSize: "13px", color: "#999999", marginBottom: "8px", lineHeight: 1.5, fontFamily: "'Share Tech Mono', monospace" }}>
                          {event.description}
                        </div>
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "12px", color: "#888888", fontFamily: "'Share Tech Mono', monospace", display: "flex", alignItems: "center", gap: "5px" }}>
                            <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                              <path d="M5.5 0C3.015 0 1 2.015 1 4.5C1 7.8 5.5 13 5.5 13C5.5 13 10 7.8 10 4.5C10 2.015 7.985 0 5.5 0ZM5.5 6C4.672 6 4 5.328 4 4.5C4 3.672 4.672 3 5.5 3C6.328 3 7 3.672 7 4.5C7 5.328 6.328 6 5.5 6Z" fill="#888888"/>
                            </svg>
                            {event.location}, {event.city}, {event.country}
                          </span>
                          <span style={{ fontSize: "12px", color: "#666666", fontFamily: "'Share Tech Mono', monospace", display: "flex", alignItems: "center", gap: "5px" }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                              <rect x="0.5" y="1.5" width="11" height="10" rx="1" stroke="#666666" strokeWidth="1"/>
                              <path d="M0.5 4.5H11.5" stroke="#666666" strokeWidth="1"/>
                              <path d="M3 0.5V2.5M9 0.5V2.5" stroke="#666666" strokeWidth="1" strokeLinecap="round"/>
                              <rect x="2" y="6" width="2" height="1.5" rx="0.3" fill="#8888cc"/>
                              <rect x="5" y="6" width="2" height="1.5" rx="0.3" fill="#8888cc"/>
                              <rect x="8" y="6" width="2" height="1.5" rx="0.3" fill="#8888cc"/>
                            </svg>
                            {formatDate(event.eventDate)}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", minWidth: "110px" }}>
                        <div style={{
                          fontSize: "22px", fontWeight: 700, color: "#ffffff",
                          fontFamily: "'Share Tech Mono', monospace",
                        }}>
                          {event.attendeeCount}<span style={{ fontSize: "14px", color: "#555555" }}>/{event.capacity}</span>
                        </div>
                        <div style={{ fontSize: "10px", color: "#777777", textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: "'Share Tech Mono', monospace" }}>
                          attendees
                        </div>
                        {event.entryFee > 0 && (
                          <div style={{ fontSize: "13px", color: "#888888", fontFamily: "'Share Tech Mono', monospace", marginTop: "4px" }}>
                            {event.entryFee}◎ entry
                          </div>
                        )}
                        <div style={{ fontSize: "12px", color: "#666666", fontFamily: "'Share Tech Mono', monospace", marginTop: "4px" }}>
                          by {event.organizer}
                        </div>
                      </div>
                    </div>

                    {expandedEvent === event.id && (
                      <CheckInPanel event={event} members={members} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Members Tab ── */}
          {activeTab === "members" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ width: "3px", height: "20px", background: "linear-gradient(to bottom, #888888, #222222)" }} />
                <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f0f0f0", fontFamily: "'Cinzel Decorative', serif", letterSpacing: "3px", textShadow: "none" }}>
                  // COMMUNITY_ROSTER
                </h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[...members].sort((a, b) => b.reputation - a.reputation).map((member, i) => (
                  <NecroPanel
                    key={member.id}
                    style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", animationDelay: `${i * 0.05}s` }}
                  >
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "1px" }}>
                          {member.username}
                        </span>
                        <TierBadge tier={member.tier} />
                      </div>
                      <div style={{ fontSize: "12px", color: "#555555", fontFamily: "'Share Tech Mono', monospace" }}>
                        {member.wallet}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", fontFamily: "'Share Tech Mono', monospace" }}>
                          {member.reputation}
                        </div>
                        <div style={{ fontSize: "8px", color: "#555555", textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: "'Share Tech Mono', monospace" }}>REP</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "18px", fontWeight: 600, color: "#aaaaaa", fontFamily: "'Share Tech Mono', monospace" }}>
                          {member.eventsAttended}
                        </div>
                        <div style={{ fontSize: "8px", color: "#777777", textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: "'Share Tech Mono', monospace" }}>EVENTS</div>
                      </div>
                      <div style={{ fontSize: "14px", color: "#666666", fontFamily: "'Share Tech Mono', monospace" }}>
                        {timeAgo(member.lastActive)}
                      </div>
                    </div>
                  </NecroPanel>
                ))}
              </div>
            </div>
          )}

          {/* ── Copilot Tab ── */}
          {activeTab === "copilot" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
                <div style={{
                  width: "44px", height: "44px",
                  border: "1px solid #555555",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "18px",
                  clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                  background: "#111111",
                  boxShadow: "inset 1px 1px 0 #888888, inset -1px -1px 0 #111111",
                  animation: "pulseBorder 2s ease-in-out infinite",
                }}>
                  ⬡
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f0f0f0", fontFamily: "'Cinzel Decorative', serif", letterSpacing: "3px", textShadow: "none" }}>
                    // STRATA_COPILOT
                  </h2>
                  <div style={{ fontSize: "14px", color: "#777777", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "1px" }}>
                    AI presence agent — decisions logged on-chain via Memo
                  </div>
                </div>
                <div style={{
                  marginLeft: "auto", padding: "4px 12px",
                  fontSize: "12px", fontWeight: 600,
                  background: "#111111", color: "#aaaaaa", border: "1px solid #333333",
                  fontFamily: "'Share Tech Mono', monospace", letterSpacing: "2px",
                  display: "flex", alignItems: "center", gap: "6px",
                  boxShadow: "inset 1px 1px 0 #2a2a2a, inset -1px -1px 0 #0a0a0a",
                }}>
                  <span style={{ animation: "blink 1s infinite" }}>●</span> ACTIVE
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
                <StatCard label="Events Scored" value={events.filter((e) => e.copilotScore).length} accent="#ffffff" />
                <StatCard label="Endorsement Rate" value="87%" accent="#cccccc" />
                <StatCard label="Memos Logged" value={copilotLogs.length} accent="#aaaaaa" />
                <StatCard label="NFTs Minted" value={stats.totalCheckins} accent="#888888" />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ width: "3px", height: "16px", background: "linear-gradient(to bottom, #888888, #222222)" }} />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#999999", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "2px", textTransform: "uppercase" }}>
                  // On-Chain Decision Log
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {copilotLogs.map((log, i) => {
                  const typeColors = {
                    checkin:    { bg: "#111111", border: "#444444", text: "#ffffff" },
                    nft:        { bg: "#0d0d0d", border: "#333333", text: "#cccccc" },
                    event:      { bg: "#0a0a0a", border: "#2a2a2a", text: "#aaaaaa" },
                    reputation: { bg: "#0a0a0a", border: "#222222", text: "#888888" },
                  };
                  const tc = typeColors[log.type] || typeColors.event;
                  return (
                    <NecroPanel
                      key={log.id}
                      style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", animationDelay: `${i * 0.08}s` }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", color: "#dddddd", marginBottom: "4px", fontFamily: "'Share Tech Mono', monospace", lineHeight: 1.4 }}>
                          {log.message}
                        </div>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "#666666", fontFamily: "'Share Tech Mono', monospace" }}>{timeAgo(log.timestamp)}</span>
                          <span style={{ fontSize: "12px", color: "#555555", fontFamily: "'Share Tech Mono', monospace" }}>tx: {log.tx}</span>
                        </div>
                      </div>
                      <span style={{
                        padding: "2px 10px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.5px",
                        fontFamily: "'Share Tech Mono', monospace",
                        background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`,
                      }}>
                        {log.type}
                      </span>
                    </NecroPanel>
                  );
                })}
              </div>

              <NecroPanel style={{ marginTop: "20px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                  <div style={{ width: "3px", height: "14px", background: "#444444" }} />
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#999999", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "2px" }}>
                    // HOW_IT_WORKS
                  </h3>
                </div>
                {[
                  "Organizer creates an event on-chain → Copilot scores it based on organizer reputation, community demand, and fill rate",
                  "Attendees scan the QR code (Solana Blink) with any wallet → signs a check_in transaction that creates an Attendance PDA",
                  "Metaplex Bubblegum mints a compressed Proof-of-Presence NFT to the attendee's wallet — edition number tied to check-in order",
                  "Each check-in updates the member's tier (Initiate → Legend) and reputation score — logged on-chain via Solana Memo",
                ].map((text, i) => (
                  <div key={i} style={{ fontSize: "14px", color: "#999999", lineHeight: 1.8, fontFamily: "'Share Tech Mono', monospace", display: "flex", gap: "10px", marginBottom: "6px" }}>
                    <span style={{ color: "#555555", flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}.</span>
                    <span>{text}</span>
                  </div>
                ))}
              </NecroPanel>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: "1px solid #1e1e1e",
          padding: "14px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: "12px", color: "#666666",
          fontFamily: "'Share Tech Mono', monospace", letterSpacing: "1.5px",
          position: "relative", zIndex: 1,
        }}>
          <span>STRATA — COLOSSEUM FRONTIER HACKATHON 2026</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#444444", animation: "blink 1.5s infinite" }}>▮</span>
            SOLANA · ANCHOR · METAPLEX · BUBBLEGUM
          </span>
        </div>
      </div>

      {showCreateModal && <CreateEventModal onClose={() => setShowCreate(false)} onCreate={handleCreateEvent} />}
    </>
  );
}
