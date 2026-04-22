"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Space+Mono&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#000; color:#fff; font-family:'Inter',sans-serif; min-height:100vh; }
  :root {
    --green:#8CE9A4; --purple:#7A57E9;
    --green-dim:#8CE9A415; --purple-dim:#7A57E915;
    --green-border:#8CE9A440; --purple-border:#7A57E940;
    --surface:#0a0a0f; --border:#1e1e2e; --muted:#6b7280;
  }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{opacity:.7} 50%{opacity:1} }
  @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes pop     { 0%{transform:scale(.8);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
  @keyframes confetti{
    0%  { transform:translateY(0) rotate(0deg);   opacity:1; }
    100%{ transform:translateY(120vh) rotate(720deg); opacity:0; }
  }

  .nav {
    position:sticky; top:0; z-index:100;
    background:transparent; backdrop-filter:blur(0px);
    padding:0 2.5rem;
  }
  .nav-inner { max-width:1400px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; height:80px; }
  .nav-brand { text-decoration:none; display:flex; align-items:center; }
  .nav-brand img { height:56px; display:block; }
  .wallet-adapter-button {
    background:rgba(122,87,233,.25) !important; color:#fff !important;
    font-family:'Space Grotesk',sans-serif !important; font-size:.72rem !important;
    font-weight:600 !important; border-radius:20px !important;
    padding:.3rem .85rem !important; height:auto !important;
    border:1px solid rgba(122,87,233,.4) !important; min-width:0 !important;
  }
  .wallet-adapter-button:hover { background:rgba(122,87,233,.45) !important; }
  .wallet-adapter-button-start-icon { width:16px !important; height:16px !important; margin-right:6px !important; }

  .page { max-width:600px; margin:0 auto; padding:3rem 1.5rem; }

  .checkin-card {
    background:var(--surface); border:1px solid var(--border); border-radius:20px;
    padding:2.5rem 2rem; text-align:center;
    animation:fadeUp .5s ease both;
  }

  .event-badge {
    display:inline-flex; align-items:center; gap:.4rem;
    background:var(--purple-dim); border:1px solid var(--purple-border);
    color:var(--purple); font-size:.75rem; font-weight:600; letter-spacing:.08em;
    padding:.35rem 1rem; border-radius:100px; margin-bottom:1.5rem;
    font-family:'Space Grotesk',sans-serif;
  }
  .event-badge-live { background:var(--green-dim); border-color:var(--green-border); color:var(--green); }
  .live-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse 2s infinite; }

  .event-title {
    font-family:'Space Grotesk',sans-serif; font-size:1.75rem; font-weight:700;
    color:#fff; margin-bottom:.6rem; line-height:1.2;
  }
  .event-meta { font-size:.85rem; color:var(--muted); line-height:1.8; margin-bottom:2rem; }
  .event-code {
    font-family:'Space Mono',monospace; display:inline-block;
    background:#111; border:1px solid var(--border); border-radius:8px;
    padding:.3rem .9rem; font-size:.8rem; color:var(--purple); letter-spacing:.15em;
    margin-bottom:2rem;
  }

  .btn-checkin {
    width:100%; padding:1rem; background:var(--purple); color:#fff; border:none;
    font-family:'Space Grotesk',sans-serif; font-size:1.05rem; font-weight:700;
    border-radius:12px; cursor:pointer; transition:all .2s; letter-spacing:.03em;
    display:flex; align-items:center; justify-content:center; gap:.5rem;
  }
  .btn-checkin:hover { background:#8B6EF0; transform:translateY(-1px); box-shadow:0 8px 30px #7A57E950; }
  .btn-checkin:disabled { background:#2d2060; color:#6b7280; cursor:not-allowed; transform:none; box-shadow:none; }

  .msg-err { background:#1a0a0f; border:1px solid #7f1d1d; color:#f87171; padding:.85rem 1.1rem; border-radius:10px; font-size:.85rem; margin-top:1rem; }

  /* Success state */
  .success-card {
    background:var(--surface); border:1px solid var(--green-border); border-radius:20px;
    padding:3rem 2rem; text-align:center; animation:pop .5s ease both;
  }
  .success-icon { font-size:3.5rem; margin-bottom:1rem; display:block; }
  .success-title {
    font-family:'Space Grotesk',sans-serif; font-size:1.6rem; font-weight:700;
    color:var(--green); margin-bottom:.6rem;
  }
  .success-sub { font-size:.9rem; color:var(--muted); line-height:1.7; margin-bottom:2rem; }
  .btn-profile {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.85rem 2rem; background:var(--purple); color:#fff; border:none;
    font-family:'Space Grotesk',sans-serif; font-size:.95rem; font-weight:700;
    border-radius:10px; cursor:pointer; text-decoration:none; transition:all .2s;
  }
  .btn-profile:hover { background:#8B6EF0; transform:translateY(-1px); }
  .tx-link { display:block; font-size:.72rem; color:var(--muted); margin-top:1rem; font-family:'Space Mono',monospace; word-break:break-all; }
  .tx-link a { color:var(--purple); }

  /* Confetti */
  .confetti-piece {
    position:fixed; width:10px; height:10px; border-radius:2px;
    animation:confetti 3s ease-in forwards;
    pointer-events:none; z-index:999;
  }

  /* Connect prompt */
  .connect-prompt { text-align:center; padding:1.5rem 0; }
  .connect-prompt p { font-size:.9rem; color:var(--muted); margin-bottom:1.25rem; }

  /* Loading / not found */
  .info-text { font-size:.9rem; color:var(--muted); text-align:center; padding:2rem 0; }
  .error-big { font-size:1.1rem; color:#f87171; text-align:center; padding:2rem 0; }
`;

const CONFETTI_COLORS = ["#8CE9A4","#7A57E9","#fff","#fbbf24","#f87171"];

function ConfettiPiece({ i }: { i: number }) {
  const left  = `${Math.random() * 100}%`;
  const delay = `${Math.random() * 0.5}s`;
  const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
  return (
    <div className="confetti-piece" style={{ left, top:"-10px", background:color, animationDelay:delay, animationDuration:`${2 + Math.random()}s` }} />
  );
}

interface EventInfo {
  title: string;
  description: string;
  attendeeCount: number;
  capacity: number;
  location: string;
  country: string;
  status: string;
}

function CheckInContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code")?.toUpperCase() ?? "";

  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;

  const [eventInfo,  setEventInfo]  = useState<EventInfo | null>(null);
  const [fetching,   setFetching]   = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [checking,   setChecking]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<{ sig: string } | null>(null);
  const [confetti,   setConfetti]   = useState(false);

  useEffect(() => {
    if (!code) { setFetching(false); setNotFound(true); return; }
    fetch(`/api/actions/checkin?eventCode=${code}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setNotFound(true); }
        else {
          // Parse description for event info
          const desc = d.description ?? "";
          const lines = desc.split("\n").filter(Boolean);
          const location = lines[0]?.replace("📍 ","") ?? "";
          setEventInfo({
            title: d.title?.replace("[STRATA] ","") ?? code,
            description: lines.slice(2).join(" "),
            attendeeCount: 0, capacity: 0,
            location, country: "", status: "Live",
          });
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setFetching(false));
  }, [code]);

  async function handleCheckIn() {
    if (!publicKey || !wallet.signTransaction || !code) return;
    setChecking(true); setError(null);
    try {
      const res = await fetch(`/api/actions/checkin?eventCode=${code}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ account: publicKey.toBase58() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.detail ?? "Check-in failed");
      const tx = Transaction.from(Buffer.from(data.transaction, "base64"));
      const signed = await wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      setSuccess({ sig });
      setConfetti(true);
      setTimeout(() => setConfetti(false), 4000);
    } catch (e: any) {
      const m = e?.message ?? "";
      if (m.includes("already in use") || m.includes("already been processed")) {
        setSuccess({ sig: "already-confirmed" });
        setConfetti(true);
        setTimeout(() => setConfetti(false), 4000);
      } else if (m.includes("rejected") || m.includes("cancelled")) {
        setError("Transaction cancelled — try again and Approve in Phantom.");
      } else {
        setError(m || "Check-in failed");
      }
    } finally { setChecking(false); }
  }

  if (fetching) return <div className="info-text">Loading event…</div>;
  if (notFound || !code) return (
    <div className="checkin-card">
      <div className="error-big">Event not found</div>
      {code && (
        <p style={{ color:"#f87171", fontSize:".8rem", marginTop:".5rem", fontFamily:"'Space Mono',monospace" }}>
          Code tried: <strong>{code}</strong>
        </p>
      )}
      <p style={{ color:"#6b7280", fontSize:".82rem", marginTop:".75rem", lineHeight:1.7 }}>
        {!code
          ? "No event code in URL. Go to the organizer page, start your event, and click \"Open Check-In Page\"."
          : "This event code doesn't exist on-chain. Make sure the event is Live before checking in."}
      </p>
      <div style={{ marginTop:"1.25rem", display:"flex", gap:".75rem", justifyContent:"center", flexWrap:"wrap" }}>
        <a href="/organizer" style={{ display:"inline-flex", alignItems:"center", gap:".4rem", padding:".55rem 1.25rem", background:"var(--purple)", color:"#fff", borderRadius:8, fontSize:".82rem", fontWeight:600, textDecoration:"none", fontFamily:"'Space Grotesk',sans-serif" }}>
          → Go to Organizer
        </a>
      </div>
    </div>
  );

  if (success) {
    return (
      <>
        {confetti && Array.from({ length: 30 }, (_, i) => <ConfettiPiece key={i} i={i} />)}
        <div className="success-card">
          <span className="success-icon">🎉</span>
          <h2 className="success-title">You're checked in!</h2>
          <p className="success-sub">
            Your Proof of Presence for <strong style={{ color:"#fff" }}>{eventInfo?.title ?? code}</strong> is now permanently on Solana.
            <br /><br />
            Go to your profile to <strong style={{ color:"var(--purple)" }}>Claim your NFT</strong>.
          </p>
          <a href="/profile" className="btn-profile">✦ Claim My NFT →</a>
          {success.sig && success.sig !== "already-confirmed" && (
            <div className="tx-link">
              Tx: <a href={`https://explorer.solana.com/tx/${success.sig}?cluster=devnet`} target="_blank" rel="noreferrer">{success.sig.slice(0,20)}…</a>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="checkin-card">
      <div className={`event-badge ${eventInfo?.status === "Live" ? "event-badge-live" : ""}`}>
        {eventInfo?.status === "Live" && <span className="live-dot" />}
        {eventInfo?.status === "Live" ? "LIVE NOW" : "EVENT"}
      </div>

      <h1 className="event-title">{eventInfo?.title ?? code}</h1>
      {eventInfo?.location && (
        <div className="event-meta">
          📍 {eventInfo.location}<br />
          Check in to earn your on-chain Proof of Presence + claimable NFT
        </div>
      )}
      <div className="event-code">#{code}</div>

      {!connected ? (
        <div className="connect-prompt">
          <p>Connect your Phantom wallet to check in</p>
          <WalletMultiButton />
        </div>
      ) : (
        <>
          <button className="btn-checkin" onClick={handleCheckIn} disabled={checking}>
            {checking
              ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>◈</span> Signing transaction…</>
              : "⬡ Check In to This Event"
            }
          </button>
          <p style={{ fontSize:".75rem", color:"var(--muted)", marginTop:".75rem" }}>
            This creates a Solana transaction — approve it in Phantom
          </p>
        </>
      )}

      {error && <div className="msg-err">{error}</div>}
    </div>
  );
}

export default function CheckInPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-brand"><img src="/Strata-logo.svg" alt="STRATA" /></a>
          <WalletMultiButton />
        </div>
      </nav>
      <div className="page">
        <Suspense fallback={<div style={{ color:"#6b7280", textAlign:"center", padding:"3rem" }}>Loading…</div>}>
          <CheckInContent />
        </Suspense>
      </div>
    </>
  );
}
