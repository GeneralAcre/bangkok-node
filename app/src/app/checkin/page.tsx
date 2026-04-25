"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import { checkinCSS } from "../../styles/checkinStyles";

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
          <span className="success-icon">◎</span>
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
          {eventInfo.location}<br />
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
      <style dangerouslySetInnerHTML={{ __html: checkinCSS }} />
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
