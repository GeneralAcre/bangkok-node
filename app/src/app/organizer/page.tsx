"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import { QRCodeSVG } from "qrcode.react";
import {
  StrataClient, findEventPDA, parseEventStatus, EventAccount,
} from "../../utils/strata-client";

const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "");

function randomCode() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #000; color: #e2e8f0; font-family: 'Share Tech Mono', monospace; }
  .page { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse  { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes scanline { 0%{top:-20px} 100%{top:100vh} }

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
    background:linear-gradient(90deg,transparent,#dc2626,transparent); opacity:.4;
  }
  .card-title {
    font-family:'Rajdhani',sans-serif; font-size:.72rem; color:#dc2626;
    letter-spacing:.2em; margin-bottom:1.25rem; text-transform:uppercase; font-weight:700;
  }

  label { display:block; font-size:.65rem; color:#4b5563; margin-bottom:.25rem; letter-spacing:.1em; text-transform:uppercase; }
  input, textarea, select {
    width:100%; padding:.6rem .8rem; background:#0a0a0a; border:1px solid #1a1a1a;
    border-radius:2px; color:#e2e8f0; font-family:'Share Tech Mono',monospace;
    font-size:.85rem; margin-bottom:.9rem; transition:border-color .2s; outline:none;
  }
  input:focus, textarea:focus { border-color:#dc2626; }
  textarea { resize:vertical; min-height:70px; }
  .row { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  .field-note { font-size:.65rem; color:#374151; margin-top:-.5rem; margin-bottom:.9rem; letter-spacing:.05em; }

  .btn {
    padding:.65rem 1.4rem; border:none; cursor:pointer; border-radius:2px;
    font-family:'Rajdhani',sans-serif; font-size:.88rem; font-weight:700;
    letter-spacing:.1em; text-transform:uppercase; transition:all .2s; display:inline-flex; align-items:center; gap:.4rem;
  }
  .btn-primary { background:#991b1b; color:#fff; border:1px solid #dc2626; }
  .btn-primary:hover { background:#dc2626; box-shadow:0 0 16px rgba(220,38,38,.2); }
  .btn-primary:disabled { background:#1a0000; color:#4b5563; border-color:#1a1a1a; cursor:not-allowed; }
  .btn-green  { background:#052e1c; color:#34d399; border:1px solid #065f46; }
  .btn-green:hover  { background:#065f46; }
  .btn-green:disabled { opacity:.5; cursor:not-allowed; }
  .btn-red    { background:#1a0000; color:#f87171; border:1px solid #7f1d1d; }
  .btn-red:hover    { background:#7f1d1d; }
  .btn-red:disabled { opacity:.5; cursor:not-allowed; }
  .btn-ghost  { background:transparent; color:#6b7280; border:1px solid #1f2937; }
  .btn-ghost:hover  { border-color:#6b7280; color:#e2e8f0; }
  .btn-yellow { background:#1c1200; color:#fbbf24; border:1px solid #78350f; }
  .btn-yellow:hover { background:#292000; border-color:#fbbf24; }
  .btn-yellow:disabled { opacity:.5; cursor:not-allowed; }

  .msg-ok  { background:#020f06; border:1px solid #14532d; color:#4ade80; padding:.75rem 1rem; margin-bottom:1rem; font-size:.78rem; word-break:break-all; border-radius:2px; }
  .msg-err { background:#0a0000; border:1px solid #7f1d1d; color:#f87171; padding:.75rem 1rem; margin-bottom:1rem; font-size:.78rem; border-radius:2px; }

  .event-card { border:1px solid #111; padding:1.1rem; margin-bottom:.75rem; border-radius:2px; transition:border-color .2s; }
  .event-card:hover { border-color:#1f2937; }
  .event-title { font-family:'Rajdhani',sans-serif; font-size:1.05rem; font-weight:700; color:#f87171; margin-bottom:.2rem; }
  .event-meta  { font-size:.68rem; color:#374151; margin-bottom:.5rem; }
  .event-actions { display:flex; gap:.5rem; flex-wrap:wrap; margin-top:.75rem; align-items:center; }

  .status-live     { color:#34d399; font-size:.72rem; }
  .status-upcoming { color:#fbbf24; font-size:.72rem; }
  .status-ended    { color:#374151; font-size:.72rem; }
  .status-cancelled{ color:#374151; font-size:.72rem; }

  .qr-panel { text-align:center; padding:.5rem 0 .25rem; }
  .code-badge {
    display:inline-block; font-size:2rem; font-weight:700; letter-spacing:.2em;
    color:#dc2626; background:#080000; padding:.5rem 1.5rem;
    border:1px solid #7f1d1d; margin-bottom:1rem; border-radius:2px;
  }
  .qr-wrap {
    display:inline-block; padding:1rem; background:#fff; border-radius:2px; margin-bottom:1rem;
  }
  .blink-url {
    font-size:.65rem; color:#374151; word-break:break-all; padding:.65rem .75rem;
    background:#0a0a0a; border:1px solid #111; margin-bottom:.75rem;
    cursor:pointer; transition:all .2s; border-radius:2px; text-align:left;
  }
  .blink-url:hover { border-color:#dc2626; color:#dc2626; }

  .how-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:.75rem; }
  .how-step {
    background:#0a0a0a; border:1px solid #111; padding:.75rem; border-radius:2px;
  }
  .how-num { color:#dc2626; font-weight:700; font-size:.72rem; margin-bottom:.2rem; }
  .how-text { font-size:.68rem; color:#4b5563; line-height:1.6; }

  .connect-box { text-align:center; padding:3.5rem 1rem; color:#4b5563; }
  .connect-box p { margin-bottom:1.5rem; font-size:.85rem; letter-spacing:.05em; }
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

interface LocalEvent { pubkey: string; account: EventAccount; }

export default function OrganizerPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;

  const [client,       setClient]       = useState<StrataClient | null>(null);
  const [idlLoaded,    setIdlLoaded]    = useState(false);
  const [events,       setEvents]       = useState<LocalEvent[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [msg,          setMsg]          = useState<{ type: "ok"|"err"; text: string } | null>(null);
  const [qrEvent,      setQrEvent]      = useState<LocalEvent | null>(null);
  const [copied,       setCopied]       = useState(false);
  const [demoChecking, setDemoChecking] = useState<string | null>(null);

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [location,    setLocation]    = useState("");
  const [country,     setCountry]     = useState("Thailand");
  const [eventDate,   setEventDate]   = useState("");
  const [capacity,    setCapacity]    = useState("100");
  const [eventCode,   setEventCode]   = useState("");

  useEffect(() => { setEventCode(randomCode()); }, []);

  useEffect(() => {
    if (!connected || !publicKey) return;
    async function init() {
      try {
        const idl = await import("../../idl/strata.json").catch(() => null);
        if (!idl) { setMsg({ type: "err", text: "IDL not found." }); return; }
        const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
        setClient(new StrataClient(provider, idl));
        setIdlLoaded(true);
      } catch (e: any) { setMsg({ type: "err", text: e?.message }); }
    }
    init();
  }, [connected, publicKey, connection, wallet]);

  const loadEvents = useCallback(async () => {
    if (!client || !COMMUNITY_PDA_STR) return;
    try {
      const community = new PublicKey(COMMUNITY_PDA_STR);
      const commAcc = await client.getCommunity(community);
      const count = commAcc.eventCount.toNumber();
      const loaded: LocalEvent[] = [];
      for (let i = 0; i < count; i++) {
        const [ePDA] = findEventPDA(community, i);
        try {
          const acc = await client.getEvent(ePDA);
          if (acc.organizer.toBase58() === publicKey!.toBase58())
            loaded.push({ pubkey: ePDA.toBase58(), account: acc });
        } catch {}
      }
      setEvents(loaded.reverse());
    } catch {}
  }, [client, publicKey]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!client || !COMMUNITY_PDA_STR) return;
    setLoading(true); setMsg(null);
    try {
      const bal = await connection.getBalance(publicKey!);
      if (bal < 10_000_000) {
        setMsg({ type: "err", text: "INSUFFICIENT SOL — get free devnet SOL at faucet.solana.com" });
        setLoading(false); return;
      }
      const community = new PublicKey(COMMUNITY_PDA_STR);
      const registered = await client.isMemberRegistered(community, publicKey!);
      if (!registered) await client.registerMember(community, publicKey!.toBase58().slice(0, 12));
      const unixDate = Math.floor(new Date(eventDate).getTime() / 1000);
      await client.createEvent({
        community, title, description: description || title,
        location, country, eventDate: unixDate,
        capacity: parseInt(capacity, 10), entryFeeLamports: 0,
        eventCode: eventCode.toUpperCase().slice(0, 8),
      });
      setMsg({ type: "ok", text: `✓ "${title}" deployed on-chain! Click GO LIVE when ready.` });
      setTitle(""); setDescription(""); setLocation(""); setEventCode(randomCode());
      await loadEvents();
    } catch (err: any) {
      const m = err?.message ?? "";
      if (m.includes("already been processed") || m.includes("already in use")) {
        setMsg({ type: "ok", text: "Event created! (already confirmed)" });
        await loadEvents();
      } else if (m.includes("rejected") || m.includes("cancelled") || m.includes("denied")) {
        setMsg({ type: "err", text: "Transaction cancelled — click DEPLOY again and Approve in Phantom." });
      } else if (m.includes("debit") || m.includes("insufficient") || m.includes("0x1")) {
        setMsg({ type: "err", text: "INSUFFICIENT SOL — get free devnet SOL at faucet.solana.com" });
      } else {
        setMsg({ type: "err", text: m || "Transaction failed" });
      }
    }
    finally { setLoading(false); }
  }

  async function handleStart(ev: LocalEvent) {
    if (!client) return;
    setLoading(true); setMsg(null);
    try {
      await client.startEvent(new PublicKey(ev.pubkey));
      setMsg({ type: "ok", text: "◉ Event is now LIVE — share the QR code below!" });
      const updated = { ...ev, account: { ...ev.account, status: { live: {} } as any } };
      setQrEvent(updated);
      await loadEvents();
    } catch (err: any) { setMsg({ type: "err", text: err?.message }); }
    finally { setLoading(false); }
  }

  async function handleEnd(ev: LocalEvent) {
    if (!client) return;
    setLoading(true); setMsg(null);
    try {
      await client.endEvent(new PublicKey(ev.pubkey));
      setMsg({ type: "ok", text: "Event ended." });
      setQrEvent(null); await loadEvents();
    } catch (err: any) { setMsg({ type: "err", text: err?.message }); }
    finally { setLoading(false); }
  }

  async function handleDemoCheckIn(ev: LocalEvent) {
    if (!publicKey || !wallet.signTransaction) return;
    setDemoChecking(ev.pubkey); setMsg(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : APP_URL;
      const res = await fetch(`${origin}/api/actions/checkin?eventCode=${ev.account.eventCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: publicKey.toBase58() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.detail ?? "Check-in failed");
      const txBytes = Buffer.from(data.transaction, "base64");
      const tx = Transaction.from(txBytes);
      const signed = await wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      setMsg({ type: "ok", text: `✓ Demo check-in confirmed! Now go to /profile to CLAIM your NFT.\nTx: ${sig}` });
      await loadEvents();
    } catch (err: any) {
      const m = err?.message ?? "";
      if (m.includes("already in use") || m.includes("already been processed")) {
        setMsg({ type: "ok", text: "Already checked in! Go to /profile → CLAIM NFT." });
      } else if (m.includes("rejected") || m.includes("cancelled")) {
        setMsg({ type: "err", text: "Transaction cancelled." });
      } else {
        setMsg({ type: "err", text: m || "Demo check-in failed" });
      }
    } finally { setDemoChecking(null); }
  }

  function blinkUrl(code: string) {
    const base = typeof window !== "undefined" ? window.location.origin : APP_URL;
    return `solana-action:${base}/api/actions/checkin?eventCode=${code}`;
  }

  function copyUrl(code: string) {
    navigator.clipboard.writeText(blinkUrl(code));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="scanline" />
      <div className="page">

        {/* Nav */}
        <nav className="top-nav">
          <a href="/" className="nav-brand" style={{ textDecoration: "none" }}>STRATA</a>
          <div className="nav-links">
            <a href="/" className="nav-link">HOME</a>
            <a href="/organizer" className="nav-link active">ORGANIZER</a>
            <a href="/profile" className="nav-link">PROFILE</a>
            <WalletMultiButton />
          </div>
        </nav>

        <h1>ORGANIZER</h1>
        <p className="sub">DEPLOY EVENTS · GENERATE QR · GET CHECK-INS ON-CHAIN</p>

        {/* Messages */}
        {msg && (
          <div className={msg.type === "ok" ? "msg-ok" : "msg-err"} style={{ whiteSpace: "pre-wrap" }}>
            {msg.text}
            {msg.type === "err" && msg.text.includes("SOL") && (
              <div style={{ marginTop: ".4rem" }}>
                <a href="https://faucet.solana.com" target="_blank" rel="noreferrer" style={{ color: "#fbbf24" }}>
                  → faucet.solana.com ↗
                </a>
              </div>
            )}
            {msg.type === "ok" && msg.text.includes("profile") && (
              <div style={{ marginTop: ".4rem" }}>
                <a href="/profile" style={{ color: "#4ade80" }}>→ Go to /profile now ↗</a>
              </div>
            )}
          </div>
        )}

        {!connected && (
          <div className="card connect-box">
            <p>CONNECT YOUR WALLET TO CREATE AND MANAGE EVENTS</p>
            <WalletMultiButton />
          </div>
        )}

        {/* LIVE QR Panel */}
        {qrEvent && (
          <div className="card" style={{ borderColor: "#065f46", animation: "none" }}>
            <div className="card-title" style={{ color: "#34d399" }}>◉ LIVE — SHARE THIS QR</div>
            <div className="qr-panel">
              <div className="code-badge">{qrEvent.account.eventCode}</div>
              <div style={{ marginBottom: ".5rem" }}>
                <div className="qr-wrap">
                  <QRCodeSVG
                    value={blinkUrl(qrEvent.account.eventCode)}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#0a0000"
                    level="H"
                  />
                </div>
              </div>
              <p style={{ fontSize: ".72rem", color: "#4b5563", marginBottom: ".6rem" }}>
                Attendees scan with Phantom → one-tap check-in on Solana
              </p>
              <div className="blink-url" onClick={() => copyUrl(qrEvent.account.eventCode)} title="Click to copy">
                {blinkUrl(qrEvent.account.eventCode)}
              </div>
              <div style={{ display: "flex", gap: ".5rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn btn-ghost" style={{ fontSize: ".75rem" }} onClick={() => copyUrl(qrEvent.account.eventCode)}>
                  {copied ? "✓ COPIED!" : "COPY BLINK URL"}
                </button>
                <button className="btn btn-ghost" style={{ fontSize: ".75rem" }} onClick={() => setQrEvent(null)}>
                  HIDE QR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        {connected && (
          <div className="card" style={{ borderColor: "#0a0a0a" }}>
            <div className="card-title" style={{ color: "#374151" }}>HOW IT WORKS</div>
            <div className="how-grid">
              {[
                ["STEP 1", "Fill the form & click DEPLOY EVENT ON-CHAIN"],
                ["STEP 2", "Click GO LIVE when you're ready to accept check-ins"],
                ["STEP 3", "Share QR code — attendees scan with Phantom"],
                ["STEP 4", "Attendees scan → one-tap check-in on Solana"],
                ["STEP 5", "Attendees go to /profile → click CLAIM NFT"],
              ].map(([n, t]) => (
                <div className="how-step" key={n}>
                  <div className="how-num">{n}</div>
                  <div className="how-text">{t}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Event Form */}
        {connected && idlLoaded && (
          <div className="card">
            <div className="card-title">+ CREATE EVENT ON-CHAIN</div>
            <form onSubmit={handleCreate}>
              <label>Event Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Strata Bangkok #1" required />

              <label>Description <span style={{ color: "#1f2937", textTransform: "lowercase", letterSpacing: 0 }}>(optional)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this event about?" />

              <div className="row">
                <div>
                  <label>Location / Venue *</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Hubba-TO, Bangkok" required />
                </div>
                <div>
                  <label>Country *</label>
                  <input value={country} onChange={e => setCountry(e.target.value)} placeholder="Thailand" required />
                </div>
              </div>

              <div className="row">
                <div>
                  <label>Date &amp; Time *</label>
                  <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
                </div>
                <div>
                  <label>Capacity *</label>
                  <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} min="1" required />
                </div>
              </div>

              <label>Event Code (8 chars)</label>
              <div style={{ display: "flex", gap: ".5rem" }}>
                <input
                  value={eventCode}
                  onChange={e => setEventCode(e.target.value.toUpperCase().slice(0, 8))}
                  maxLength={8} style={{ flex: 1, marginBottom: 0 }} required
                />
                <button type="button" className="btn btn-ghost" onClick={() => setEventCode(randomCode())}>RANDOM</button>
              </div>
              <p className="field-note" style={{ marginTop: ".4rem" }}>This code is embedded in the QR — attendees use it to check in</p>

              <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: ".5rem" }}>
                {loading ? "DEPLOYING…" : "⬡ DEPLOY EVENT ON-CHAIN"}
              </button>
            </form>
          </div>
        )}

        {/* My Events */}
        {events.length > 0 && (
          <div className="card">
            <div className="card-title">MY EVENTS ({events.length})</div>
            {events.map(ev => {
              const status = parseEventStatus(ev.account.status);
              return (
                <div className="event-card" key={ev.pubkey}>
                  <div className="event-title">{ev.account.title}</div>
                  <div className="event-meta">
                    {ev.account.location}, {ev.account.country} ·{" "}
                    {new Date(ev.account.eventDate.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle: "medium" })} ·{" "}
                    {ev.account.attendeeCount.toNumber()}/{ev.account.capacity.toNumber()} attendees ·{" "}
                    #{ev.account.eventCode}
                  </div>
                  <span className={`status-${status.toLowerCase()}`}>● {status.toUpperCase()}</span>
                  <div className="event-actions">
                    {status === "Upcoming" && (
                      <button className="btn btn-green" disabled={loading} onClick={() => handleStart(ev)}>
                        ▶ GO LIVE
                      </button>
                    )}
                    {status === "Live" && (<>
                      <button className="btn btn-ghost" onClick={() => setQrEvent(qrEvent?.pubkey === ev.pubkey ? null : ev)}>
                        {qrEvent?.pubkey === ev.pubkey ? "HIDE QR" : "⬡ SHOW QR"}
                      </button>
                      <button
                        className="btn btn-yellow"
                        disabled={!!demoChecking}
                        onClick={() => handleDemoCheckIn(ev)}
                        title="Check yourself in as a demo attendee — then go to /profile to CLAIM NFT"
                      >
                        {demoChecking === ev.pubkey ? "CHECKING IN…" : "✦ DEMO CHECK-IN"}
                      </button>
                      <button className="btn btn-red" disabled={loading} onClick={() => handleEnd(ev)}>
                        END EVENT
                      </button>
                    </>)}
                    <a
                      href={`https://explorer.solana.com/address/${ev.pubkey}?cluster=devnet`}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: ".68rem", color: "#374151", alignSelf: "center" }}
                    >
                      EXPLORER ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
