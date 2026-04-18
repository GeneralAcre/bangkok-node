"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
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
  body { background: #000; color: #e2e8f0; font-family: 'Share Tech Mono', monospace; }
  .page { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }

  .top-nav {
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #7f1d1d; padding-bottom: 1rem; margin-bottom: 2rem;
  }
  .nav-brand { font-family: 'Cinzel Decorative', serif; font-size: 1.1rem; color: #dc2626; letter-spacing: 0.1em; }
  .nav-links { display: flex; gap: 1rem; align-items: center; }
  .nav-link {
    font-size: 0.75rem; color: #9ca3af; text-decoration: none; letter-spacing: 0.1em;
    padding: 0.3rem 0.7rem; border: 1px solid #374151; border-radius: 2px;
    transition: all 0.2s;
  }
  .nav-link:hover, .nav-link.active { color: #dc2626; border-color: #dc2626; }

  h1 { font-family: 'Cinzel Decorative', serif; font-size: 1.4rem; color: #dc2626; margin-bottom: 0.2rem; letter-spacing: 0.05em; }
  .sub { font-size: 0.75rem; color: #6b7280; margin-bottom: 2rem; letter-spacing: 0.05em; }

  .card {
    background: #0a0a0a; border: 1px solid #7f1d1d;
    border-radius: 2px; padding: 1.5rem; margin-bottom: 1.5rem;
    position: relative;
  }
  .card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, #dc2626, transparent);
  }
  .card h2 {
    font-family: 'Rajdhani', sans-serif; font-size: 0.8rem; color: #dc2626;
    letter-spacing: 0.2em; margin-bottom: 1.25rem; text-transform: uppercase;
  }

  label { display: block; font-size: 0.7rem; color: #6b7280; margin-bottom: 0.3rem; letter-spacing: 0.1em; text-transform: uppercase; }
  input, textarea, select {
    width: 100%; padding: 0.6rem 0.8rem; background: #0d0d0d;
    border: 1px solid #374151; border-radius: 2px; color: #e2e8f0;
    font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; margin-bottom: 1rem;
    transition: border-color 0.2s;
  }
  input:focus, textarea:focus { outline: none; border-color: #dc2626; }
  textarea { resize: vertical; min-height: 70px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

  .btn {
    padding: 0.65rem 1.4rem; border: none; cursor: pointer; border-radius: 2px;
    font-family: 'Rajdhani', sans-serif; font-size: 0.85rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; transition: all 0.2s;
  }
  .btn-primary { background: #991b1b; color: #fff; border: 1px solid #dc2626; }
  .btn-primary:hover { background: #dc2626; }
  .btn-primary:disabled { background: #3d0000; color: #6b7280; border-color: #374151; cursor: not-allowed; }
  .btn-green { background: #064e3b; color: #34d399; border: 1px solid #059669; }
  .btn-green:hover { background: #065f46; }
  .btn-red { background: #450a0a; color: #f87171; border: 1px solid #dc2626; }
  .btn-red:hover { background: #7f1d1d; }
  .btn-ghost { background: transparent; color: #9ca3af; border: 1px solid #374151; }
  .btn-ghost:hover { border-color: #dc2626; color: #dc2626; }

  .msg-ok  { background: #052e16; border: 1px solid #166534; color: #4ade80; padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.8rem; word-break: break-all; }
  .msg-err { background: #1f0505; border: 1px solid #7f1d1d; color: #f87171; padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.8rem; }

  .event-card { border: 1px solid #1f1f1f; padding: 1rem; margin-bottom: 0.75rem; position: relative; }
  .event-card:hover { border-color: #7f1d1d; }
  .event-title { font-family: 'Rajdhani', sans-serif; font-size: 1rem; font-weight: 700; color: #f87171; margin-bottom: 0.25rem; }
  .event-meta { font-size: 0.72rem; color: #4b5563; margin-bottom: 0.5rem; }
  .event-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }

  .status-live     { color: #34d399; font-size: 0.75rem; }
  .status-upcoming { color: #fbbf24; font-size: 0.75rem; }
  .status-ended    { color: #4b5563; font-size: 0.75rem; }

  .qr-panel { text-align: center; padding: 1rem 0; }
  .code-badge {
    display: inline-block; font-size: 2rem; font-weight: 700; letter-spacing: 0.2em;
    color: #dc2626; background: #0a0000; padding: 0.5rem 1.5rem;
    border: 1px solid #7f1d1d; margin-bottom: 1rem;
  }
  .blink-url {
    font-size: 0.68rem; color: #6b7280; word-break: break-all; padding: 0.75rem;
    background: #050505; border: 1px solid #1f1f1f; margin-bottom: 0.75rem;
    cursor: pointer; transition: border-color 0.2s;
  }
  .blink-url:hover { border-color: #dc2626; color: #dc2626; }

  .connect-box { text-align: center; padding: 4rem 1rem; }
  .connect-box p { color: #4b5563; margin-bottom: 1.5rem; font-size: 0.85rem; letter-spacing: 0.05em; }

  a { color: #dc2626; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .code-note { font-size: 0.7rem; color: #4b5563; margin-top: -0.5rem; margin-bottom: 1rem; }
`;

interface LocalEvent { pubkey: string; account: EventAccount; }

export default function OrganizerPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;

  const [client,    setClient]    = useState<StrataClient | null>(null);
  const [idlLoaded, setIdlLoaded] = useState(false);
  const [events,    setEvents]    = useState<LocalEvent[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState<{ type: "ok"|"err"; text: string } | null>(null);
  const [qrEvent,   setQrEvent]   = useState<LocalEvent | null>(null);
  const [copied,    setCopied]    = useState(false);

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [location,    setLocation]    = useState("");
  const [country,     setCountry]     = useState("Thailand");
  const [eventDate,   setEventDate]   = useState("");
  const [capacity,    setCapacity]    = useState("100");
  const [eventCode,   setEventCode]   = useState("");

  useEffect(() => {
    setEventCode(randomCode());
  }, []);

  useEffect(() => {
    if (!connected || !publicKey) return;
    async function init() {
      try {
        const idl = await import("../../idl/strata.json").catch(() => null);
        if (!idl) { setMsg({ type: "err", text: "IDL not found. Run deploy script first." }); return; }
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
        setMsg({ type: "err", text: "INSUFFICIENT SOL — get free devnet SOL at faucet.solana.com then try again" });
        setLoading(false); return;
      }
      const community = new PublicKey(COMMUNITY_PDA_STR);
      const registered = await client.isMemberRegistered(community, publicKey!);
      if (!registered) await client.registerMember(community, publicKey!.toBase58().slice(0, 12));
      const unixDate = Math.floor(new Date(eventDate).getTime() / 1000);
      await client.createEvent({
        community, title, description, location, country,
        eventDate: unixDate, capacity: parseInt(capacity, 10),
        entryFeeLamports: 0, eventCode: eventCode.toUpperCase().slice(0, 8),
      });
      setMsg({ type: "ok", text: `Event "${title}" created on-chain!` });
      setTitle(""); setDescription(""); setLocation(""); setEventCode(randomCode());
      await loadEvents();
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("debit") || msg.includes("insufficient") || msg.includes("0x1")) {
        setMsg({ type: "err", text: "INSUFFICIENT SOL — get free devnet SOL at faucet.solana.com" });
      } else {
        setMsg({ type: "err", text: msg || "Transaction failed" });
      }
    }
    finally { setLoading(false); }
  }

  async function handleStart(ev: LocalEvent) {
    if (!client) return;
    setLoading(true); setMsg(null);
    try {
      await client.startEvent(new PublicKey(ev.pubkey));
      setMsg({ type: "ok", text: "Event is now LIVE. Share the QR code!" });
      setQrEvent({ ...ev, account: { ...ev.account, status: { live: {} } as any } });
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

  function blinkUrl(code: string) {
    return `solana-action:${APP_URL}/api/actions/checkin?eventCode=${code}`;
  }

  function copyUrl(code: string) {
    navigator.clipboard.writeText(blinkUrl(code));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="page">
        {/* Nav */}
        <div className="top-nav">
          <span className="nav-brand">STRATA</span>
          <div className="nav-links">
            <a href="/" className="nav-link">← MAIN</a>
            <a href="/organizer" className="nav-link active">ORGANIZER</a>
            <a href="/profile" className="nav-link">PROFILE</a>
            <WalletMultiButton style={{ height: "32px", fontSize: "0.75rem", padding: "0 0.75rem", background: "#991b1b" }} />
          </div>
        </div>

        <h1>ORGANIZER</h1>
        <p className="sub">CREATE EVENTS · GENERATE QR · GET CHECK-INS ON-CHAIN</p>

        {msg && (
          <div className={msg.type === "ok" ? "msg-ok" : "msg-err"}>
            {msg.text}
            {msg.type === "err" && msg.text.includes("SOL") && (
              <div style={{ marginTop: "0.5rem" }}>
                <a href="https://faucet.solana.com" target="_blank" rel="noreferrer"
                  style={{ color: "#fbbf24", textDecoration: "underline" }}>
                  → faucet.solana.com ↗
                </a>
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

        {/* Live QR Panel */}
        {qrEvent && (
          <div className="card">
            <h2>◉ LIVE EVENT — SHARE THIS QR</h2>
            <div className="qr-panel">
              <div className="code-badge">{qrEvent.account.eventCode}</div>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.75rem" }}>
                Share this Blink URL — opens as one-tap check-in in Phantom
              </p>
              <div className="blink-url" onClick={() => copyUrl(qrEvent.account.eventCode)} title="Click to copy">
                {blinkUrl(qrEvent.account.eventCode)}
              </div>
              <button className="btn btn-ghost" style={{ fontSize: "0.75rem" }} onClick={() => copyUrl(qrEvent.account.eventCode)}>
                {copied ? "✓ COPIED!" : "COPY BLINK URL"}
              </button>
              <p style={{ fontSize: "0.72rem", color: "#4b5563", marginTop: "0.75rem" }}>
                Paste into a QR generator (e.g. qr-code-generator.com) to print for your venue
              </p>
            </div>
          </div>
        )}

        {/* Create Event Form */}
        {connected && idlLoaded && (
          <div className="card">
            <h2>+ CREATE EVENT ON-CHAIN</h2>
            <form onSubmit={handleCreate}>
              <label>Event Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Strata Bangkok #1" required />

              <label>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this event about?" required />

              <div className="row">
                <div><label>Location / Venue</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="Hubba-TO Co-working" required /></div>
                <div><label>Country</label><input value={country} onChange={e => setCountry(e.target.value)} placeholder="Thailand" required /></div>
              </div>

              <div className="row">
                <div><label>Date &amp; Time</label><input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} required /></div>
                <div><label>Capacity</label><input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} min="1" required /></div>
              </div>

              <label>Event Code (8 chars — printed in QR)</label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0" }}>
                <input value={eventCode} onChange={e => setEventCode(e.target.value.toUpperCase().slice(0, 8))} maxLength={8} style={{ marginBottom: 0, flex: 1 }} required />
                <button type="button" className="btn btn-ghost" onClick={() => setEventCode(randomCode())}>RANDOM</button>
              </div>
              <p className="code-note">Attendees scan this QR → wallet auto-registers → check-in confirmed on-chain</p>

              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "DEPLOYING..." : "DEPLOY EVENT ON-CHAIN"}
              </button>
            </form>
          </div>
        )}

        {/* My Events */}
        {events.length > 0 && (
          <div className="card">
            <h2>MY EVENTS ({events.length})</h2>
            {events.map(ev => {
              const status = parseEventStatus(ev.account.status);
              return (
                <div className="event-card" key={ev.pubkey}>
                  <div className="event-title">{ev.account.title}</div>
                  <div className="event-meta">
                    {ev.account.location}, {ev.account.country} ·{" "}
                    {new Date(ev.account.eventDate.toNumber() * 1000).toLocaleDateString()} ·{" "}
                    {ev.account.attendeeCount.toNumber()}/{ev.account.capacity.toNumber()} attendees ·{" "}
                    CODE: {ev.account.eventCode}
                  </div>
                  <span className={`status-${status.toLowerCase()}`}>● {status.toUpperCase()}</span>
                  <div className="event-actions">
                    {status === "Upcoming" && <button className="btn btn-green" disabled={loading} onClick={() => handleStart(ev)}>GO LIVE</button>}
                    {status === "Live" && <>
                      <button className="btn btn-ghost" onClick={() => setQrEvent(ev)}>SHOW QR</button>
                      <button className="btn btn-red" disabled={loading} onClick={() => handleEnd(ev)}>END EVENT</button>
                    </>}
                    <a href={`https://explorer.solana.com/address/${ev.pubkey}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ fontSize: "0.72rem", alignSelf: "center" }}>EXPLORER ↗</a>
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
