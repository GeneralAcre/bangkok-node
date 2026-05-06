"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { StrataClient, findEventPDA } from "../../utils/strata-client";
import { organizerCSS } from "../../styles/organizerStyles";
import { Nav } from "../../components/Nav";

const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

interface EventRow {
  title: string; location: string; country: string;
  status: string; attendeeCount: number; capacity: number;
  eventCode: string; eventDate: number; endTime: number;
  eventIndex: number; organizer: string;
}

interface QrData {
  code: string;
  url: string;
  eventName: string;
}

type DeployStep = "idle" | "creating" | "signing" | "done" | "error";
type EventFilter = "all" | "live" | "upcoming" | "ended";

function formatEventDate(ts: number): string {
  if (!ts || ts <= 0) return "—";
  const d = new Date(ts * 1000);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getMonthYear(ts: number): string {
  if (!ts || ts <= 0 || ts > 9_999_999_999) return "Undated";
  const d = new Date(ts * 1000);
  if (isNaN(d.getTime())) return "Undated";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function randomCode() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

function DeploySteps({ step }: { step: DeployStep }) {
  const steps: Array<{ key: DeployStep; label: string }> = [
    { key: "creating", label: "Creating event account on-chain" },
    { key: "signing",  label: "Signing check-in QR" },
  ];
  const order: Record<string, number> = { creating: 0, signing: 1, done: 2 };
  const current = order[step] ?? -1;
  return (
    <div className="deploy-steps">
      {steps.map((s, i) => {
        const done   = current > i;
        const active = current === i;
        return (
          <div key={s.key} className={`deploy-step${active ? " active" : ""}${done ? " done" : ""}`}>
            <span className="step-icon">
              {done   ? "✓"
               : active ? <span className="step-spin">◈</span>
               : "○"}
            </span>
            <span>{s.label}{active ? "…" : ""}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function OrganizerPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;

  const [client,        setClient]        = useState<StrataClient | null>(null);
  const [idlLoaded,     setIdlLoaded]     = useState(false);
  const [msg,           setMsg]           = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [allEvents,     setAllEvents]     = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsFilter,  setEventsFilter]  = useState<EventFilter>("all");
  const [activeView,    setActiveView]    = useState<"events" | "form">("events");

  // Deploy flow
  const [deployStep, setDeployStep] = useState<DeployStep>("idle");
  const [qrData,     setQrData]     = useState<QrData | null>(null);
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  // Form fields
  const [title,         setTitle]         = useState("");
  const [location,      setLocation]      = useState("");
  const [country,       setCountry]       = useState("Global");
  const [startDatePart, setStartDatePart] = useState("");
  const [startTimePart, setStartTimePart] = useState("09:00");
  const [endDatePart,   setEndDatePart]   = useState("");
  const [endTimePart,   setEndTimePart]   = useState("21:00");
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen,   setEndTimeOpen]   = useState(false);
  const startTimeRef = useRef<HTMLDivElement>(null);
  const endTimeRef   = useRef<HTMLDivElement>(null);
  const [capacity,      setCapacity]      = useState("50");
  const [eventCode,     setEventCode]     = useState("");

  const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = (i % 2) * 30;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (startTimeRef.current && !startTimeRef.current.contains(e.target as Node)) setStartTimeOpen(false);
      if (endTimeRef.current   && !endTimeRef.current.contains(e.target as Node))   setEndTimeOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setEventCode(randomCode()); }, []);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => setAllEvents(
        (d.allEvents ?? []).filter((ev: EventRow) =>
          ev.eventDate > 0 && ev.capacity > 0 && ev.capacity < 1_000_000
        )
      ))
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

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

  // ── Get / refresh QR for an existing event ────────────────────────────────

  async function handleGetQR(ev: EventRow) {
    if (!wallet.signMessage || !publicKey || !COMMUNITY_PDA_STR) return;
    try {
      const [ePDA]   = findEventPDA(new PublicKey(COMMUNITY_PDA_STR), ev.eventIndex);
      const expiry   = ev.endTime || Math.floor(Date.now() / 1000) + 86_400;
      const message  = new TextEncoder().encode(`signal_checkin:${ev.eventCode}:${expiry}`);
      const sigBytes = await wallet.signMessage(message);
      const sigHex   = Buffer.from(sigBytes).toString("hex");
      const url = `${window.location.origin}/checkin?event=${ePDA.toBase58()}&sig=${sigHex}&exp=${expiry}`;
      setQrData({ code: ev.eventCode, url, eventName: ev.title });
    } catch (err: any) {
      const m = err?.message ?? "";
      if (!m.includes("rejected") && !m.includes("cancelled")) {
        setMsg({ type: "err", text: m || "Failed to generate QR" });
      }
    }
  }

  // ── Deploy + Sign ────────────────────────────────────────────────────────

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault();
    if (!client || !COMMUNITY_PDA_STR || !publicKey) return;
    setMsg(null);

    const startTs = new Date(`${startDatePart}T${startTimePart}`).getTime() / 1000;
    const endTs   = new Date(`${endDatePart}T${endTimePart}`).getTime() / 1000;

    if (isNaN(startTs) || isNaN(endTs)) {
      setMsg({ type: "err", text: "Please select valid start and end date/time." });
      return;
    }
    if (endTs <= startTs) {
      setMsg({ type: "err", text: "End time must be after start time." });
      return;
    }
    if (startTs <= Date.now() / 1000) {
      setMsg({ type: "err", text: "Start time must be in the future." });
      return;
    }

    const cap = Number(capacity);
    if (!cap || cap <= 0 || !Number.isInteger(cap)) {
      setMsg({ type: "err", text: "Please enter a valid capacity (minimum 1)." });
      return;
    }

    const code = eventCode.toUpperCase().slice(0, 8);
    setDeployStep("creating");

    try {
      const bal = await connection.getBalance(publicKey);
      if (bal < 10_000_000) {
        setMsg({ type: "err", text: "Need devnet SOL — get free SOL at faucet.solana.com" });
        setDeployStep("error"); return;
      }

      const community  = new PublicKey(COMMUNITY_PDA_STR);
      const registered = await client.isMemberRegistered(community, publicKey);
      if (!registered) await client.registerMember(community, publicKey.toBase58().slice(0, 8));

      const { eventPDA } = await client.createEvent({
        community,
        title,
        location,
        country:          country || "Global",
        startTime:        Math.floor(startTs),
        endTime:          Math.floor(endTs),
        capacity:         cap,
        entryFeeLamports: 0,
        eventCode:        code,
        externalUrl:      "",
        isHackathon:      false,
      });

      setDeployStep("signing");
      const expiry   = Math.floor(endTs);
      const message  = new TextEncoder().encode(`signal_checkin:${code}:${expiry}`);
      const sigBytes = await wallet.signMessage!(message);
      const sigHex   = Buffer.from(sigBytes).toString("hex");

      const checkinUrl = `${window.location.origin}/checkin?event=${eventPDA.toBase58()}&sig=${sigHex}&exp=${expiry}`;
      setQrData({ code, url: checkinUrl, eventName: title });
      setDeployStep("done");

      // Reset form
      setTitle(""); setLocation(""); setCountry("Global");
      setStartDatePart(""); setStartTimePart("09:00");
      setEndDatePart(""); setEndTimePart("21:00");
      setCapacity("50"); setEventCode(randomCode());

      // Refresh events list
      const r = await fetch("/api/stats");
      const d = await r.json();
      setAllEvents(
        (d.allEvents ?? []).filter((ev: EventRow) =>
          ev.eventDate > 0 && ev.capacity > 0 && ev.capacity < 1_000_000
        )
      );

    } catch (err: any) {
      setDeployStep("error");
      const m = err?.message ?? "";
      if (m.includes("rejected") || m.includes("cancelled")) {
        setMsg({ type: "err", text: "Transaction cancelled — try again and Approve in Phantom." });
      } else if (m.includes("debit") || m.includes("insufficient") || m.includes("0x1")) {
        setMsg({ type: "err", text: "Insufficient SOL — get free devnet SOL at faucet.solana.com" });
      } else {
        setMsg({ type: "err", text: m || "Deploy failed" });
      }
    }
  }

  // ── QR download ───────────────────────────────────────────────────────────

  function handleDownloadQR() {
    const canvas = qrCanvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas || !qrData) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `signal-qr-${qrData.code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const isDeploying = deployStep !== "idle" && deployStep !== "done" && deployStep !== "error";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: organizerCSS }} />
      <div className="grid-bg" />
      <div className="orb-wrap">
        <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
      </div>
      <div className="scanline" />
      <Nav active="organizer" />

      {/* ── QR overlay ── */}
      {qrData && (
        <>
          {/* Hidden canvas for download */}
          <div ref={qrCanvasRef} style={{ position: "fixed", top: -9999, left: -9999, pointerEvents: "none" }}>
            <QRCodeCanvas value={qrData.url} size={400} includeMargin />
          </div>
          <div className="qr-overlay" onClick={() => setQrData(null)}>
            <div className="qr-modal" onClick={e => e.stopPropagation()}>
              <button className="qr-close" onClick={() => setQrData(null)}>✕</button>
              <div className="qr-success-badge">✓ Event Live</div>
              <div className="qr-event-name">{qrData.eventName}</div>
              <div className="qr-code-wrap">
                <QRCodeSVG value={qrData.url} size={200} />
              </div>
              <div className="qr-code-label">#{qrData.code}</div>
              <div
                className="qr-url-box"
                onClick={() => navigator.clipboard.writeText(qrData.url)}
                title="Click to copy"
              >
                {qrData.url}
              </div>
              <div className="qr-actions">
                <button
                  className="btn btn-qr-primary"
                  onClick={handleDownloadQR}
                >
                  ⬇ Download PNG
                </button>
                <button
                  className="btn btn-qr-ghost"
                  onClick={() => navigator.clipboard.writeText(qrData.url)}
                >
                  ⎘ Copy Link
                </button>
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    className="btn btn-qr-ghost"
                    onClick={() => (navigator as any).share({ url: qrData.url, title: qrData.eventName })}
                  >
                    ↗ Share
                  </button>
                )}
              </div>
              <div className="qr-note">
                Attendees scan this QR with Phantom to check in on-chain.<br />
                Valid until the event end time.
              </div>
            </div>
          </div>
        </>
      )}

      <div className="page">
        <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title">Attach to Event</h1>
            <p className="page-sub">Wrap any event with on-chain check-ins · QR · NFT · Signal Score</p>
          </div>
          <div style={{ display: "flex", gap: ".5rem", flexShrink: 0, marginTop: ".35rem" }}>
            <button
              className={`btn ${activeView === "events" ? "btn-primary" : "btn-demo"}`}
              onClick={() => setActiveView("events")}
            >
              ☰ Events
            </button>
            <button
              className={`btn ${activeView === "form" ? "btn-primary" : "btn-demo"}`}
              onClick={() => { setActiveView("form"); setMsg(null); setDeployStep("idle"); }}
            >
              ⬡ Host Event
            </button>
          </div>
        </div>

        {/* ── Host Event form ── */}
        {activeView === "form" && (
          <>
            {msg && (
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: ".75rem",
                background: msg.type === "ok" ? "rgba(0,255,194,.08)" : "rgba(220,38,38,.12)",
                border: `1.5px solid ${msg.type === "ok" ? "rgba(0,255,194,.3)" : "rgba(220,38,38,.4)"}`,
                borderRadius: 12,
                padding: "1rem 1.25rem",
                marginBottom: "1.25rem",
                color: msg.type === "ok" ? "#00FFC2" : "#f87171",
                fontSize: ".85rem",
                lineHeight: 1.6,
              }}>
                <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: ".05rem" }}>
                  {msg.type === "ok" ? "✓" : "⚠"}
                </span>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: ".2rem" }}>
                    {msg.type === "ok" ? "Success" : "Error"}
                  </div>
                  <div>{msg.text}</div>
                  {msg.type === "err" && msg.text.toLowerCase().includes("sol") && (
                    <div style={{ marginTop: ".4rem" }}>
                      <a href="https://faucet.solana.com" target="_blank" rel="noreferrer"
                        style={{ color: "#fbbf24", fontWeight: 600 }}>
                        → Get free devnet SOL at faucet.solana.com ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-title">Launch Event</div>
              <form onSubmit={handleDeploy}>

                {/* Event Name */}
                <label>Event Name *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Bangkok Web3 Meetup"
                  required
                />

                {/* Location */}
                <label>Location *</label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Bangkok, Thailand"
                  required
                />

                {/* Start Date + Time */}
                <div className="row">
                  <div>
                    <label>Start Date *</label>
                    <input
                      type="date"
                      value={startDatePart}
                      onChange={e => setStartDatePart(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label>Start Time *</label>
                    <div ref={startTimeRef} className="time-dropdown">
                      <button type="button" className="time-trigger" onClick={() => setStartTimeOpen(o => !o)}>
                        {startTimePart}
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transition: "transform .2s", transform: startTimeOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                          <path d="M1 1l4 4 4-4" stroke="#5C7580" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                      {startTimeOpen && (
                        <div className="time-options">
                          {TIME_OPTIONS.map(t => (
                            <div key={t} className={`time-option${t === startTimePart ? " active" : ""}`}
                              onClick={() => { setStartTimePart(t); setStartTimeOpen(false); }}>
                              {t}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* End Date + Time */}
                <div className="row">
                  <div>
                    <label>End Date *</label>
                    <input
                      type="date"
                      value={endDatePart}
                      onChange={e => setEndDatePart(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label>End Time *</label>
                    <div ref={endTimeRef} className="time-dropdown">
                      <button type="button" className="time-trigger" onClick={() => setEndTimeOpen(o => !o)}>
                        {endTimePart}
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transition: "transform .2s", transform: endTimeOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                          <path d="M1 1l4 4 4-4" stroke="#5C7580" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                      {endTimeOpen && (
                        <div className="time-options">
                          {TIME_OPTIONS.map(t => (
                            <div key={t} className={`time-option${t === endTimePart ? " active" : ""}`}
                              onClick={() => { setEndTimePart(t); setEndTimeOpen(false); }}>
                              {t}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Capacity */}
                <label>Max Capacity *</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={e => setCapacity(e.target.value || "50")}
                  min="1"
                  placeholder="50"
                  required
                />

                {/* Deploy progress */}
                {deployStep !== "idle" && deployStep !== "error" && (
                  <DeploySteps step={deployStep} />
                )}

                <button
                  className="btn btn-primary btn-block"
                  type="submit"
                  disabled={isDeploying || !connected}
                  style={{ marginTop: ".75rem" }}
                >
                  {isDeploying
                    ? <><span className="step-spin" style={{ display: "inline-block" }}>◈</span> Deploying…</>
                    : !connected
                    ? "Connect wallet to deploy"
                    : "⬡ Deploy & Go Live"}
                </button>

                {!connected && (
                  <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center" }}>
                    <WalletMultiButton />
                  </div>
                )}
              </form>
            </div>
          </>
        )}

        {/* ── Events listing ── */}
        {activeView === "events" && (() => {
          const filtered = allEvents.filter(ev =>
            eventsFilter === "all" ? true : ev.status.toLowerCase() === eventsFilter
          );
          const monthMap = new Map<string, EventRow[]>();
          for (const ev of filtered) {
            const key = getMonthYear(ev.eventDate);
            if (!monthMap.has(key)) monthMap.set(key, []);
            monthMap.get(key)!.push(ev);
          }
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
                eventsFilter === "all" ? (
                  <div style={{
                    border: "1px dashed rgba(255,255,255,.15)",
                    borderRadius: 16, padding: "2.5rem",
                    textAlign: "center", background: "rgba(255,255,255,.02)",
                  }}>
                    <div style={{ fontSize: "2rem", marginBottom: ".75rem" }}>⬡</div>
                    <div style={{ fontFamily: "'Epilogue',sans-serif", fontWeight: 700, fontSize: "1.1rem", marginBottom: ".5rem" }}>
                      No events yet
                    </div>
                    <div style={{ color: "#888", fontSize: ".85rem", marginBottom: "1.5rem" }}>
                      Deploy your first on-chain event to get a QR code for attendees to check in.
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => { setActiveView("form"); setMsg(null); setDeployStep("idle"); }}
                    >
                      ⬡ Host Your First Event
                    </button>
                  </div>
                ) : (
                  <div className="ev-empty">No {eventsFilter} events.</div>
                )
              ) : (
                <div className="ev-list">
                  {Array.from(monthMap.entries()).map(([month, evs]) => (
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
                              {ev.location}{ev.country ? `, ${ev.country}` : ""}
                            </div>
                          </div>
                          <div className="ev-date-col">{formatEventDate(ev.eventDate)}</div>
                          <div className="ev-stat-col">{ev.attendeeCount}/{(ev.capacity === 0 || ev.capacity > 100000) ? "—" : ev.capacity}</div>
                          <div className="ev-cta-col">
                            {ev.status === "Live" ? (
                              <button className="btn-checkin" onClick={() => handleGetQR(ev)} title="Show check-in QR">
                                QR ↗
                              </button>
                            ) : ev.status === "Upcoming" && ev.organizer === publicKey?.toBase58() ? (
                              <button className="btn-checkin" onClick={() => handleGetQR(ev)} style={{ background: "transparent", border: "1px solid #fff", color: "#fff" }}>
                                QR ↗
                              </button>
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
      </div>
    </>
  );
}
