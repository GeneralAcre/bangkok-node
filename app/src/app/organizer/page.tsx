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
  const [showForm,      setShowForm]      = useState(false);

  // Deploy flow
  const [deployStep, setDeployStep] = useState<DeployStep>("idle");
  const [qrData,     setQrData]     = useState<QrData | null>(null);
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  // Form fields
  const [externalUrl,   setExternalUrl]   = useState("");
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
      .then(d => setAllEvents(d.allEvents ?? []))
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
        capacity:         parseInt(capacity, 10),
        entryFeeLamports: 0,
        eventCode:        code,
        externalUrl:      externalUrl || "",
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
      setTitle(""); setLocation(""); setCountry("Global"); setExternalUrl("");
      setStartDatePart(""); setStartTimePart("09:00");
      setEndDatePart(""); setEndTimePart("21:00");
      setCapacity("50"); setEventCode(randomCode());

      // Refresh events list
      const r = await fetch("/api/stats");
      const d = await r.json();
      setAllEvents(d.allEvents ?? []);

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
          <button
            className={`btn ${showForm ? "btn-primary" : "btn-demo"}`}
            onClick={() => { setShowForm(v => !v); setMsg(null); setDeployStep("idle"); }}
            style={{ marginTop: ".35rem", flexShrink: 0 }}
          >
            {showForm ? "✕ Close" : "⬡ Host Event"}
          </button>
        </div>

        {/* ── Events listing ── */}
        {(() => {
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
                <div className="ev-empty">
                  {eventsFilter === "all"
                    ? `No events yet. Click "Host Event" to deploy your first.`
                    : `No ${eventsFilter} events.`}
                </div>
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
                          <div className="ev-stat-col">{ev.attendeeCount}/{ev.capacity}</div>
                          <div className="ev-cta-col">
                            {ev.status === "Live" ? (
                              <button
                                className="btn-checkin"
                                onClick={() => handleGetQR(ev)}
                                title="Show check-in QR"
                              >
                                QR ↗
                              </button>
                            ) : ev.status === "Upcoming" && ev.organizer === publicKey?.toBase58() ? (
                              <button
                                className="btn-checkin"
                                onClick={() => handleGetQR(ev)}
                                style={{ background: "transparent", border: "1px solid #fff", color: "#fff" }}
                              >
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

        {/* ── Host Event form ── */}
        {showForm && (
          <>
            {msg && (
              <div className={msg.type === "ok" ? "msg-ok" : "msg-err"}>
                {msg.text}
                {msg.type === "err" && msg.text.toLowerCase().includes("sol") && (
                  <div style={{ marginTop: ".4rem" }}>
                    <a href="https://faucet.solana.com" target="_blank" rel="noreferrer" style={{ color: "#fbbf24" }}>→ faucet.solana.com ↗</a>
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

            {connected && idlLoaded && (
              <div className="card">
                <div className="card-title">Launch Event</div>
                <form onSubmit={handleDeploy}>

                  {/* External URL (label only — stored on-chain) */}
                  <label>
                    External Event URL
                    <span style={{ color: "#888", fontWeight: 400, marginLeft: ".4rem" }}>(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={e => setExternalUrl(e.target.value)}
                    placeholder="https://lu.ma/your-event"
                  />
                  <p className="field-note">Stored on-chain for attendee reference.</p>

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
                    onChange={e => setCapacity(e.target.value)}
                    min="1"
                    required
                  />

                  {/* Deploy progress */}
                  {deployStep !== "idle" && deployStep !== "error" && (
                    <DeploySteps step={deployStep} />
                  )}

                  <button
                    className="btn btn-primary btn-block"
                    type="submit"
                    disabled={isDeploying}
                    style={{ marginTop: ".75rem" }}
                  >
                    {isDeploying
                      ? <><span className="step-spin" style={{ display: "inline-block" }}>◈</span> Deploying…</>
                      : "⬡ Deploy & Go Live"}
                  </button>
                  <p className="field-note" style={{ textAlign: "center", marginTop: ".5rem" }}>
                    2 Phantom interactions: create tx → sign QR
                  </p>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
