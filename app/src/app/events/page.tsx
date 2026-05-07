"use client";

import { useEffect, useState } from "react";
import { Nav } from "../../components/Nav";
import { Footer } from "../../components/Footer";
import { PageBackground } from "../../components/PageBackground";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Epilogue:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#0a0a0a; color:#e8e8e8; font-family:'DM Sans',sans-serif; min-height:100vh; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse  { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes shimmer{ 0%{background-position:-200% 0} 100%{background-position:200% 0} }

  .page { max-width:900px; margin:0 auto; padding:100px 1.5rem 5rem; position:relative; z-index:1; }

  .page-eyebrow {
    font-family:'Epilogue',sans-serif; font-size:.7rem; font-weight:700;
    letter-spacing:.14em; text-transform:uppercase; color:#ffffff; margin-bottom:.75rem;
  }
  .page-title {
    font-family:'Orbitron',sans-serif; font-size:clamp(1.3rem,3.5vw,2.2rem);
    font-weight:800; letter-spacing:.04em; color:#ffffff; margin-bottom:.5rem;
  }
  .page-sub { font-size:.92rem; color:#888; margin-bottom:3rem; max-width:480px; line-height:1.6; }

  /* ── Filter tabs ── */
  .filter-row { display:flex; gap:.5rem; margin-bottom:2rem; flex-wrap:wrap; }
  .filter-btn {
    font-family:'Epilogue',sans-serif; font-size:.72rem; font-weight:700;
    text-transform:uppercase; letter-spacing:.08em;
    padding:.45rem 1.1rem; border-radius:100px; cursor:pointer; transition:all .18s;
    border:1px solid rgba(255,255,255,.12); background:transparent; color:#888;
  }
  .filter-btn:hover { border-color:rgba(255,255,255,.3); color:#e8e8e8; }
  .filter-btn.active { background:#ffffff; color:#0a0a0a; border-color:#ffffff; }

  /* ── Live dot ── */
  .live-dot { width:7px; height:7px; border-radius:50%; background:#ffffff; animation:pulse 1.6s infinite; display:inline-block; margin-right:.4rem; }

  /* ── Event grid ── */
  .event-grid { display:flex; flex-direction:column; gap:.75rem; }

  .event-row {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    border-radius:16px; padding:1.25rem 1.5rem;
    display:flex; align-items:center; gap:1.25rem; flex-wrap:wrap;
    transition:border-color .2s; animation:fadeUp .4s ease both;
  }
  .event-row:hover { border-color:rgba(255,255,255,.2); }
  .event-row.live { border-color:rgba(255,255,255,.2); background:rgba(255,255,255,.06); }

  .event-status-col { flex-shrink:0; width:68px; text-align:center; }
  .badge-live {
    display:inline-flex; align-items:center;
    font-family:'Epilogue',sans-serif; font-size:.62rem; font-weight:700;
    text-transform:uppercase; letter-spacing:.1em;
    padding:.3rem .75rem; border-radius:100px;
    background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.3); color:#ffffff;
  }
  .badge-upcoming {
    font-family:'Epilogue',sans-serif; font-size:.62rem; font-weight:700;
    text-transform:uppercase; letter-spacing:.1em; color:#888;
  }
  .badge-ended {
    font-family:'Epilogue',sans-serif; font-size:.62rem; font-weight:700;
    text-transform:uppercase; letter-spacing:.1em; color:rgba(255,255,255,.2);
  }

  .event-info { flex:1; min-width:0; }
  .event-title {
    font-family:'Epilogue',sans-serif; font-size:1rem; font-weight:700;
    color:#e8e8e8; margin-bottom:.3rem;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  .event-meta { font-size:.78rem; color:#888; display:flex; gap:1rem; flex-wrap:wrap; }
  .event-meta span { display:flex; align-items:center; gap:.3rem; }

  .event-actions { display:flex; gap:.6rem; align-items:center; flex-shrink:0; }
  .btn-checkin {
    font-family:'Epilogue',sans-serif; font-size:.78rem; font-weight:800;
    text-transform:uppercase; letter-spacing:.07em;
    padding:.55rem 1.3rem; background:#ffffff; color:#0a0a0a;
    border:none; border-radius:10px; cursor:pointer; text-decoration:none;
    transition:background .15s; white-space:nowrap; display:inline-block;
  }
  .btn-checkin:hover { background:#e8e8e8; }
  .btn-view {
    font-family:'Epilogue',sans-serif; font-size:.78rem; font-weight:600;
    padding:.55rem 1.1rem; background:transparent; color:#888;
    border:1px solid rgba(255,255,255,.1); border-radius:10px;
    cursor:pointer; transition:all .15s; white-space:nowrap;
  }
  .btn-view:hover { border-color:rgba(255,255,255,.3); color:#e8e8e8; }

  .checkin-count {
    font-family:'Space Mono',monospace; font-size:.7rem; color:#888;
    padding:.4rem .8rem; background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.07); border-radius:8px; white-space:nowrap;
  }

  /* ── Empty state ── */
  .empty {
    text-align:center; padding:5rem 1rem; color:#888;
    font-size:.92rem; line-height:1.8;
  }
  .empty strong { display:block; font-family:'Epilogue',sans-serif; font-size:1.1rem; font-weight:700; color:#e8e8e8; margin-bottom:.5rem; }

  /* ── Host CTA ── */
  .host-cta {
    margin-top:3rem; padding:2rem; border:1px solid rgba(255,255,255,.08);
    border-radius:16px; background:rgba(255,255,255,.03);
    display:flex; align-items:center; justify-content:space-between;
    gap:1.5rem; flex-wrap:wrap;
  }
  .host-cta-text { font-size:.92rem; color:#888; line-height:1.6; }
  .host-cta-text strong { display:block; font-family:'Epilogue',sans-serif; font-size:1rem; font-weight:700; color:#e8e8e8; margin-bottom:.25rem; }
  .btn-host {
    font-family:'Epilogue',sans-serif; font-size:.82rem; font-weight:800;
    text-transform:uppercase; letter-spacing:.07em;
    padding:.7rem 1.6rem; background:#ffffff; color:#0a0a0a;
    border:none; border-radius:10px; cursor:pointer; text-decoration:none;
    transition:background .15s; flex-shrink:0; display:inline-block;
  }
  .btn-host:hover { background:#e8e8e8; }

  /* ── Shimmer ── */
  .shimmer {
    background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);
    background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:12px;
  }
`;

interface EventItem {
  title: string;
  location: string;
  country: string;
  status: "Live" | "Upcoming" | "Ended";
  attendeeCount: number;
  capacity: number;
  eventCode: string;
  eventDate: number;
  pubkey?: string;
}

type Filter = "all" | "live" | "upcoming" | "ended";

function formatDate(ts: number) {
  if (!ts || ts <= 0) return "—";
  const d = new Date(ts * 1000);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function EventsPage() {
  const [events,  setEvents]  = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.allEvents) {
          setEvents(d.allEvents.filter((e: EventItem) =>
            e.eventDate > 0 && e.capacity > 0 && e.capacity < 1_000_000
          ));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? events
    : events.filter(e => e.status.toLowerCase() === filter);

  const liveCount     = events.filter(e => e.status === "Live").length;
  const upcomingCount = events.filter(e => e.status === "Upcoming").length;
  const endedCount    = events.filter(e => e.status === "Ended").length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PageBackground />
      <Nav active="events" />

      <div className="page">
        <div className="page-eyebrow">On-chain</div>
        <h1 className="page-title">Live Events</h1>
        <p className="page-sub">
          Every event is deployed on Solana. Scan the QR, check in, claim your NFT.
        </p>

        {/* Filter tabs */}
        <div className="filter-row">
          {([
            { key: "all",      label: `All (${events.length})` },
            { key: "live",     label: liveCount > 0 ? `Live (${liveCount})` : "Live" },
            { key: "upcoming", label: `Upcoming (${upcomingCount})` },
            { key: "ended",    label: `Ended (${endedCount})` },
          ] as { key: Filter; label: string }[]).map(f => (
            <button
              key={f.key}
              className={`filter-btn${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.key === "live" && liveCount > 0 && <span className="live-dot" />}
              {f.label}
            </button>
          ))}
        </div>

        {/* Event list */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            {[1,2,3].map(i => (
              <div key={i} className="shimmer" style={{ height: 80 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <strong>{filter === "live" ? "No live events right now" : "No events found"}</strong>
            {filter === "live"
              ? "Check back soon — or host your own event and go live."
              : "Be the first to deploy an event on Signal."}
          </div>
        ) : (
          <div className="event-grid">
            {filtered.map((ev, i) => (
              <div
                key={ev.eventCode + i}
                className={`event-row${ev.status === "Live" ? " live" : ""}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Status */}
                <div className="event-status-col">
                  {ev.status === "Live" ? (
                    <span className="badge-live"><span className="live-dot" />Live</span>
                  ) : ev.status === "Upcoming" ? (
                    <span className="badge-upcoming">Soon</span>
                  ) : (
                    <span className="badge-ended">Ended</span>
                  )}
                </div>

                {/* Info */}
                <div className="event-info">
                  <div className="event-title">{ev.title}</div>
                  <div className="event-meta">
                    <span>{ev.location}{ev.country && ev.country !== "Global" ? `, ${ev.country}` : ""}</span>
                    <span>{formatDate(ev.eventDate)}</span>
                  </div>
                </div>

                {/* Checkin count */}
                <div className="checkin-count">
                  {ev.attendeeCount}/{ev.capacity > 100_000 ? "—" : ev.capacity} checked in
                </div>

                {/* Actions */}
                <div className="event-actions">
                  {ev.status === "Live" ? (
                    <a href={ev.pubkey ? `/checkin?event=${ev.pubkey}` : "/events"} className="btn-checkin">
                      Check In ↗
                    </a>
                  ) : ev.status === "Upcoming" ? (
                    <span className="btn-view">Upcoming</span>
                  ) : (
                    ev.pubkey
                      ? <a href={`/checkin?event=${ev.pubkey}`} className="btn-view">View</a>
                      : <span className="btn-view">Ended</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Host CTA */}
        <div className="host-cta">
          <div className="host-cta-text">
            <strong>Host your own event</strong>
            Deploy on Solana in 30 seconds. Attendees scan your QR, check in on-chain, and earn their NFT automatically.
          </div>
          <a href="/organizer" className="btn-host">Deploy Event →</a>
        </div>
      </div>
      <Footer />
    </>
  );
}
