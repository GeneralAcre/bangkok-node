"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { StrataClient } from "../../utils/strata-client";
import { organizerCSS } from "../../styles/organizerStyles";
import { Nav } from "../../components/Nav";

const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

interface EventRow {
  title: string; location: string; country: string;
  status: string; attendeeCount: number; capacity: number;
  eventCode: string; eventDate: number;
}

type EventFilter = "all" | "live" | "upcoming" | "ended";

function formatEventDate(ts: number): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getMonthYear(ts: number): string {
  if (!ts) return "Undated";
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function randomCode() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}


export default function OrganizerPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;

  const [client,       setClient]       = useState<StrataClient | null>(null);
  const [idlLoaded,    setIdlLoaded]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [msg,          setMsg]          = useState<{ type:"ok"|"err"; text:string } | null>(null);
  const [allEvents,    setAllEvents]    = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsFilter, setEventsFilter] = useState<EventFilter>("all");
  const [showForm,     setShowForm]     = useState(false);

  const [title,        setTitle]        = useState("");
  const [description,  setDescription]  = useState("");
  const [location,     setLocation]     = useState("");
  const [country,      setCountry]      = useState("Thailand");
  const [eventDatePart, setEventDatePart] = useState("");
  const [eventTimePart, setEventTimePart] = useState("09:00");
  const [timeOpen,     setTimeOpen]      = useState(false);
  const timeRef = useRef<HTMLDivElement>(null);
  const [capacity,     setCapacity]     = useState("100");
  const [eventCode,    setEventCode]    = useState("");
  const [isHackathon,  setIsHackathon]  = useState(false);

  const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = (i % 2) * 30;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (timeRef.current && !timeRef.current.contains(e.target as Node)) setTimeOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setEventCode(randomCode()); }, []);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => setAllEvents(d.allEvents ?? []))
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  useEffect(() => {
    if (!connected || !publicKey) return;
    async function init() {
      try {
        const idl = await import("../../idl/strata.json").catch(() => null);
        if (!idl) { setMsg({ type:"err", text:"IDL not found." }); return; }
        const provider = new AnchorProvider(connection, wallet as any, { commitment:"confirmed" });
        setClient(new StrataClient(provider, idl));
        setIdlLoaded(true);
      } catch (e: any) { setMsg({ type:"err", text:e?.message }); }
    }
    init();
  }, [connected, publicKey, connection, wallet]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!client || !COMMUNITY_PDA_STR) return;
    setLoading(true); setMsg(null);
    const eventDate = eventDatePart && eventTimePart ? `${eventDatePart}T${eventTimePart}` : "";
    if (!eventDate) { setMsg({ type:"err", text:"Please select a date and time." }); setLoading(false); return; }
    try {
      const bal = await connection.getBalance(publicKey!);
      if (bal < 10_000_000) {
        setMsg({ type:"err", text:"Need devnet SOL — get free SOL at faucet.solana.com" });
        setLoading(false); return;
      }
      const community = new PublicKey(COMMUNITY_PDA_STR);
      const registered = await client.isMemberRegistered(community, publicKey!);
      if (!registered) await client.registerMember(community, publicKey!.toBase58().slice(0, 12));
      await client.createEvent({
        community, title, description: description || title,
        location, country, eventDate: Math.floor(new Date(eventDate).getTime() / 1000),
        capacity: parseInt(capacity, 10), entryFeeLamports: 0,
        eventCode: eventCode.toUpperCase().slice(0, 8),
        isHackathon,
      });
      setMsg({ type:"ok", text:`✓ "${title}" deployed on-chain!\n\nGo to your Profile → Organized tab to go live and share the QR.` });
      setTitle(""); setDescription(""); setLocation(""); setEventDatePart(""); setEventTimePart("09:00"); setEventCode(randomCode()); setIsHackathon(false);
    } catch (err: any) {
      const m = err?.message ?? "";
      if (m.includes("already been processed") || m.includes("already in use")) {
        setMsg({ type:"ok", text:"Event created! (already confirmed)" });
      } else if (m.includes("rejected") || m.includes("cancelled")) {
        setMsg({ type:"err", text:"Transaction cancelled — try again and Approve in Phantom." });
      } else if (m.includes("debit") || m.includes("insufficient") || m.includes("0x1")) {
        setMsg({ type:"err", text:"Insufficient SOL — get free devnet SOL at faucet.solana.com" });
      } else { setMsg({ type:"err", text: m || "Transaction failed" }); }
    } finally { setLoading(false); }
  }


  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: organizerCSS }} />
      <div className="grid-bg" />
      <div className="orb-wrap">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
      </div>
      <div className="scanline" />
      <Nav active="organizer" />

      <div className="page">
        <div className="page-header" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <h1 className="page-title">Organizer</h1>
            <p className="page-sub">On-chain events · QR check-ins · Proof of Presence</p>
          </div>
          <button
            className={`btn ${showForm ? "btn-primary" : "btn-demo"}`}
            onClick={() => { setShowForm(v => !v); setMsg(null); }}
            style={{ marginTop:".35rem", flexShrink:0 }}
          >
            {showForm ? "✕ Close" : "⬡ Host Event"}
          </button>
        </div>

        {/* ── Events listing ── */}
        {(() => {
          const filtered = allEvents.filter(ev => {
            if (eventsFilter === "all") return true;
            return ev.status.toLowerCase() === eventsFilter;
          });
          const monthMap = new Map<string, EventRow[]>();
          for (const ev of filtered) {
            const key = getMonthYear(ev.eventDate);
            if (!monthMap.has(key)) monthMap.set(key, []);
            monthMap.get(key)!.push(ev);
          }
          const groups = Array.from(monthMap.entries());

          return (
            <div className="card">
              <div className="card-title">Events</div>

              <div className="ev-filters">
                {(["all", "live", "upcoming", "ended"] as EventFilter[]).map(f => (
                  <button
                    key={f}
                    className={`ev-filter-btn${eventsFilter === f ? " active" : ""}`}
                    onClick={() => setEventsFilter(f)}
                  >
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                    {f !== "all" && (
                      <span className="ev-filter-count">
                        {allEvents.filter(ev => ev.status.toLowerCase() === f).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {eventsLoading ? (
                <div className="ev-empty">Loading events…</div>
              ) : filtered.length === 0 ? (
                <div className="ev-empty">
                  {eventsFilter === "all" ? `No events yet. Click "Host Event" to deploy your first.` : `No ${eventsFilter} events.`}
                </div>
              ) : (
                <div className="ev-list">
                  {groups.map(([month, evs]) => (
                    <div key={month} className="ev-month-group">
                      <div className="ev-month-label">{month}</div>
                      {evs.map((ev, i) => (
                        <div key={i} className="ev-row">
                          <div className={`ev-dot ev-dot-${ev.status.toLowerCase()}`} />
                          <div className="ev-main">
                            <div className="ev-title">{ev.title}</div>
                            <div className="ev-sub">
                              <span className="ev-code">#{ev.eventCode}</span>
                              <span className="ev-sep">·</span>
                              {ev.location}, {ev.country}
                            </div>
                          </div>
                          <div className="ev-date-col">{formatEventDate(ev.eventDate)}</div>
                          <div className="ev-stat-col">{ev.attendeeCount}/{ev.capacity}</div>
                          <div className="ev-cta-col">
                            {ev.status === "Live" ? (
                              <a href={`/checkin?code=${ev.eventCode}`} className="btn-checkin">
                                Check In →
                              </a>
                            ) : ev.status === "Upcoming" ? (
                              <span className="badge-upcoming">Upcoming</span>
                            ) : (
                              <span className="badge-ended">Ended</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {showForm && (
          <>
            {msg && (
              <div className={msg.type === "ok" ? "msg-ok" : "msg-err"}>
                {msg.text}
                {msg.type === "ok" && msg.text.includes("profile") && (
                  <div style={{ marginTop:".5rem" }}>
                    <a href="/profile" style={{ color:"var(--g)", fontWeight:600 }}>→ Go to Profile now ↗</a>
                  </div>
                )}
                {msg.type === "err" && msg.text.toLowerCase().includes("sol") && (
                  <div style={{ marginTop:".4rem" }}>
                    <a href="https://faucet.solana.com" target="_blank" rel="noreferrer" style={{ color:"#fbbf24" }}>→ faucet.solana.com ↗</a>
                  </div>
                )}
              </div>
            )}

            {!connected && (
              <div className="card connect-card">
                <p>Connect your wallet to host an event on-chain</p>
                <WalletMultiButton />
              </div>
            )}

            {/* How it works */}
            {connected && (
              <div className="card">
                <div className="card-title">How it works</div>
                <div className="how-grid">
                  {[
                    ["Step 1", "Fill the form & click Deploy Event"],
                    ["Step 2", "Click GO LIVE when your event starts"],
                    ["Step 3", "Share the QR code with attendees"],
                    ["Step 4", "Attendees scan with Phantom — one tap"],
                    ["Step 5", "Go to /profile → click CLAIM NFT"],
                  ].map(([n, t]) => (
                    <div className="how-step" key={n}>
                      <div className="how-num">{n}</div>
                      <div className="how-text">{t}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Launch Event form */}
            {connected && idlLoaded && (
              <div className="card">
                <div className="card-title">Launch Event</div>
                <form onSubmit={handleCreate}>
                  <label>Event Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Bangkok Web3 Meetup #1" required />

                  <label>Description <span style={{ color:"var(--text-muted)", fontWeight:400 }}>(optional)</span></label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this event about?" />

                  <div className="row">
                    <div><label>Venue / Location</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="Bangkok" required /></div>
                    <div><label>Country</label><input value={country} onChange={e => setCountry(e.target.value)} placeholder="Thailand" required /></div>
                  </div>
                  <div className="row">
                    <div>
                      <label>Date</label>
                      <input type="date" value={eventDatePart} onChange={e => setEventDatePart(e.target.value)} required />
                    </div>
                    <div>
                      <label>Time</label>
                      <div ref={timeRef} className="time-dropdown">
                        <button type="button" className="time-trigger" onClick={() => setTimeOpen(o => !o)}>
                          {eventTimePart}
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transition:"transform .2s", transform: timeOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                            <path d="M1 1l4 4 4-4" stroke="#5C7580" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                        {timeOpen && (
                          <div className="time-options">
                            {TIME_OPTIONS.map(t => (
                              <div key={t} className={`time-option${t === eventTimePart ? " active" : ""}`}
                                onClick={() => { setEventTimePart(t); setTimeOpen(false); }}>
                                {t}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <label>Capacity</label>
                  <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} min="1" required />

                  <label>Event Code (8 chars)</label>
                  <div className="code-row">
                    <input value={eventCode} onChange={e => setEventCode(e.target.value.toUpperCase().slice(0,8))} maxLength={8} style={{ flex:1, marginBottom:0 }} required />
                    <button type="button" className="btn btn-ghost" onClick={() => setEventCode(randomCode())}>Random</button>
                  </div>
                  <p className="field-note">Embedded in the QR — attendees use this to check in</p>

                  <label style={{ display:"flex", alignItems:"center", gap:".6rem", cursor:"pointer", marginTop:".25rem" }}>
                    <input
                      type="checkbox"
                      checked={isHackathon}
                      onChange={e => setIsHackathon(e.target.checked)}
                      style={{ width:16, height:16, accentColor:"#ffffff", cursor:"pointer" }}
                    />
                    <span style={{ fontSize:".85rem", color:"#1b2d4b", fontWeight:500 }}>
                      Hackathon event
                      <span style={{ marginLeft:".4rem", fontSize:".72rem", color:"#5d8ba2", fontFamily:"'Space Mono',monospace" }}>
                        (×3 score multiplier for attendees)
                      </span>
                    </span>
                  </label>

                  <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop:".75rem" }}>
                    {loading ? "Deploying…" : "⬡ Deploy Event"}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
