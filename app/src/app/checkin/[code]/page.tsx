"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import { checkinCSS } from "../../../styles/checkinStyles";

const WLD_APP_ID = process.env.NEXT_PUBLIC_WLD_APP_ID ?? "";
const WLD_ACTION = process.env.NEXT_PUBLIC_WLD_ACTION ?? "signal-checkin";

const CONFETTI_COLORS = ["#8CE9A4","#7A57E9","#fff","#fbbf24","#f87171"];

function ConfettiPiece({ i }: { i: number }) {
  const left  = `${Math.random() * 100}%`;
  const delay = `${Math.random() * 0.5}s`;
  const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
  return (
    <div className="confetti-piece" style={{ left, top: "-10px", background: color, animationDelay: delay, animationDuration: `${2 + Math.random()}s` }} />
  );
}

function formatCountdown(secs: number): string {
  if (secs <= 0) return "Starting now";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

interface EventInfo {
  title: string;
  location: string;
  country: string;
  status: string;
  startTime: number;
  endTime: number;
  capacity: number;
  attendeeCount: number;
}

type WorldIdState = "idle" | "verifying" | "verified" | "error";

function CheckInContent() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const code = (Array.isArray(params.code) ? params.code[0] : params.code ?? "").toUpperCase();
  const sig  = searchParams.get("sig") ?? "";
  const exp  = searchParams.get("exp") ?? "";

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
  const [countdown,  setCountdown]  = useState(0);

  // World ID state
  const [wldState,      setWldState]      = useState<WorldIdState>("idle");
  const [wldError,      setWldError]      = useState<string | null>(null);
  const [nullifierHash, setNullifierHash] = useState<string | null>(null);
  const [miniKitReady,  setMiniKitReady]  = useState<boolean | null>(null);

  // Load MiniKit client-side only
  useEffect(() => {
    if (!WLD_APP_ID) { setMiniKitReady(false); return; }
    import("@worldcoin/minikit-js")
      .then(({ MiniKit }) => {
        try { MiniKit.install(WLD_APP_ID); } catch {}
        setMiniKitReady(MiniKit.isInstalled());
      })
      .catch(() => setMiniKitReady(false));
  }, []);

  // Fetch event info from the event API
  useEffect(() => {
    if (!code) { setFetching(false); setNotFound(true); return; }
    fetch(`/api/event/${code}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setNotFound(true); }
        else {
          setEventInfo({
            title:        d.title ?? code,
            location:     d.location ?? "",
            country:      d.country ?? "",
            status:       d.status ?? "Upcoming",
            startTime:    d.startTime ?? 0,
            endTime:      d.endTime ?? 0,
            capacity:     d.capacity ?? 0,
            attendeeCount: d.attendeeCount ?? 0,
          });
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setFetching(false));
  }, [code]);

  // Countdown ticker for pre-event state
  useEffect(() => {
    if (!eventInfo || eventInfo.startTime <= 0) return;
    const tick = () => {
      const secsLeft = eventInfo.startTime - Math.floor(Date.now() / 1000);
      setCountdown(Math.max(0, secsLeft));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [eventInfo?.startTime]);

  async function handleWorldId() {
    if (!miniKitReady) return;
    setWldState("verifying");
    setWldError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { MiniKit } = await import("@worldcoin/minikit-js") as any;
      let nullifier: string;
      let proofPayload: Record<string, string> = {};

      if (typeof MiniKit.commandsAsync?.verify === "function") {
        const { finalPayload } = await MiniKit.commandsAsync.verify({
          action:             WLD_ACTION,
          signal:             code,
          verification_level: "device",
        });
        if (finalPayload?.status === "error") throw new Error(finalPayload.error_code ?? "Verification rejected");
        nullifier    = finalPayload.nullifier_hash;
        proofPayload = { proof: finalPayload.proof ?? "", merkle_root: finalPayload.merkle_root ?? "", verification_level: finalPayload.verification_level ?? "device" };
      } else {
        const result = await MiniKit.walletAuth({
          nonce:     `signal_${code}_${Date.now()}`,
          statement: `Verify you are human to check in to event #${code}.`,
        });
        if (result?.status === "error" || !result?.data?.address) throw new Error("World App wallet auth failed or was cancelled.");
        const rawBytes = new TextEncoder().encode(`${result.data.address.toLowerCase()}:${code}`);
        const raw      = rawBytes.buffer.slice(rawBytes.byteOffset, rawBytes.byteOffset + rawBytes.byteLength) as ArrayBuffer;
        const digest   = await crypto.subtle.digest("SHA-256", raw as BufferSource);
        nullifier      = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
        proofPayload   = { proof: result.data.signature ?? "", merkle_root: "0x0", verification_level: "device" };
      }

      const res = await fetch("/api/worldid/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...proofPayload, nullifier_hash: nullifier, eventCode: code, wallet: publicKey?.toBase58() ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) { setWldState("error"); setWldError(data.error ?? "World ID server verification failed."); return; }

      setNullifierHash(nullifier);
      setWldState("verified");
    } catch (e: any) {
      setWldState("error");
      setWldError(e?.message ?? "World ID verification failed unexpectedly.");
    }
  }

  async function handleCheckIn() {
    if (!publicKey || !wallet.signTransaction || !code) return;
    setChecking(true); setError(null);
    try {
      const body: Record<string, unknown> = { account: publicKey.toBase58() };
      if (nullifierHash) body.nullifier_hash = nullifierHash;

      const res = await fetch(
        `/api/actions/checkin?eventCode=${code}&sig=${encodeURIComponent(sig)}&exp=${exp}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.detail ?? "Check-in failed");

      const tx     = Transaction.from(Buffer.from(data.transaction, "base64"));
      const signed = await wallet.signTransaction(tx);
      const txSig  = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(txSig, "confirmed");

      setSuccess({ sig: txSig });
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

  const now         = Math.floor(Date.now() / 1000);
  const expiry      = parseInt(exp, 10);
  const qrExpired   = exp ? now > expiry : false;
  const beforeStart = eventInfo ? now < eventInfo.startTime : false;
  const afterEnd    = eventInfo ? now > eventInfo.endTime && eventInfo.endTime > 0 : false;

  const wldRequired = !!WLD_APP_ID;
  const wldDone     = !wldRequired || wldState === "verified";
  const canCheckIn  = connected && wldDone && !beforeStart && !afterEnd && !qrExpired;

  if (fetching) return <div className="info-text">Loading event…</div>;

  if (notFound || !code) return (
    <div className="checkin-card">
      <div className="error-big">Event not found</div>
      {code && <p style={{ color: "#f87171", fontSize: ".8rem", marginTop: ".5rem", fontFamily: "'Space Mono',monospace" }}>Code tried: <strong>{code}</strong></p>}
      <p style={{ color: "#6b7280", fontSize: ".82rem", marginTop: ".75rem", lineHeight: 1.7 }}>
        This event code doesn't exist on-chain yet, or the event was cancelled.
      </p>
      <div style={{ marginTop: "1.25rem", display: "flex", gap: ".75rem", justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/organizer" style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".55rem 1.25rem", background: "var(--purple)", color: "#fff", borderRadius: 8, fontSize: ".82rem", fontWeight: 600, textDecoration: "none", fontFamily: "'Space Grotesk',sans-serif" }}>
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
          <h2 className="success-title">You&apos;re checked in!</h2>
          {wldState === "verified" && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", background: "rgba(0,180,255,.1)", border: "1px solid rgba(0,180,255,.25)", borderRadius: 100, padding: ".3rem .85rem", fontSize: ".72rem", color: "#60c8f5", marginBottom: ".75rem" }}>
              🌐 World ID Verified
            </div>
          )}
          <p className="success-sub">
            Your Proof of Presence for <strong style={{ color: "#fff" }}>{eventInfo?.title ?? code}</strong> is permanently on Solana.
            <br /><br />
            Go to your profile to <strong style={{ color: "var(--purple)" }}>Claim your NFT</strong>.
          </p>
          <a href="/profile" className="btn-profile">✦ Claim My NFT →</a>
          {success.sig && success.sig !== "already-confirmed" && (
            <div className="tx-link">
              Tx: <a href={`https://explorer.solana.com/tx/${success.sig}?cluster=devnet`} target="_blank" rel="noreferrer">{success.sig.slice(0, 20)}…</a>
            </div>
          )}
        </div>
      </>
    );
  }

  const liveStatus = !beforeStart && !afterEnd;

  return (
    <div className="checkin-card">
      <div className={`event-badge ${liveStatus ? "event-badge-live" : ""}`}>
        {liveStatus && <span className="live-dot" />}
        {afterEnd ? "ENDED" : beforeStart ? "UPCOMING" : "LIVE NOW"}
      </div>

      <h1 className="event-title">{eventInfo?.title ?? code}</h1>
      {eventInfo?.location && (
        <div className="event-meta">
          {eventInfo.location}{eventInfo.country ? `, ${eventInfo.country}` : ""}
          <br />
          {!afterEnd && !beforeStart && "Check in to earn your on-chain Proof of Presence + claimable NFT"}
        </div>
      )}
      <div className="event-code">#{code}</div>

      {/* Before event: countdown */}
      {beforeStart && (
        <div className="checkin-card" style={{ marginTop: "1.25rem", background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.25)", padding: "1.25rem", borderRadius: 12 }}>
          <div style={{ fontSize: ".75rem", color: "#a78bfa", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".5rem" }}>Event starts in</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", fontFamily: "'Space Mono',monospace" }}>{formatCountdown(countdown)}</div>
          <div style={{ fontSize: ".78rem", color: "#6b7280", marginTop: ".5rem" }}>
            {new Date(eventInfo!.startTime * 1000).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}
          </div>
        </div>
      )}

      {/* After event */}
      {afterEnd && (
        <div style={{ marginTop: "1.25rem", padding: "1rem 1.25rem", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 12, color: "#f87171", fontSize: ".85rem" }}>
          This event has ended. Check-in is no longer available.
        </div>
      )}

      {/* QR expired warning */}
      {qrExpired && liveStatus && (
        <div style={{ marginTop: "1rem", padding: ".75rem 1rem", background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.3)", borderRadius: 8, color: "#fbbf24", fontSize: ".8rem" }}>
          ⚠ QR code has expired — ask the organizer to refresh it
        </div>
      )}

      {/* Step 1 — Connect wallet */}
      {!connected && !afterEnd && (
        <div className="connect-prompt">
          <p>Connect your Phantom wallet to check in</p>
          <WalletMultiButton />
        </div>
      )}

      {/* Step 2 — World ID */}
      {connected && wldRequired && wldState !== "verified" && !afterEnd && (
        <div className="wld-section">
          <div className="wld-label">Step 2 of 2 — Verify you&apos;re human</div>
          <p className="wld-desc">Signal uses World ID to prevent sybil attacks. One human = one check-in per event.</p>

          {miniKitReady === null && <div className="wld-loading">Loading World ID…</div>}

          {miniKitReady === false && (
            <div className="wld-unavailable">
              <div style={{ fontSize: "1.2rem", marginBottom: ".4rem" }}>🌐</div>
              <div style={{ fontWeight: 600, marginBottom: ".3rem" }}>World App required</div>
              <div style={{ fontSize: ".78rem", color: "#6b7280", lineHeight: 1.6 }}>
                Open this page inside the <strong style={{ color: "#e8e8e8" }}>World App</strong> to verify your humanity.
              </div>
            </div>
          )}

          {miniKitReady === true && wldState !== "error" && (
            <button className="btn-worldid" onClick={handleWorldId} disabled={wldState === "verifying"}>
              {wldState === "verifying"
                ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◈</span> Verifying…</>
                : "🌐 Verify with World ID"}
            </button>
          )}

          {wldState === "error" && (
            <>
              <div className="msg-err" style={{ marginBottom: ".75rem" }}>{wldError}</div>
              <button className="btn-worldid" onClick={handleWorldId}>🌐 Try Again</button>
            </>
          )}
        </div>
      )}

      {connected && wldState === "verified" && (
        <div className="wld-verified-badge">🌐 World ID Verified</div>
      )}

      {/* Check In button */}
      {canCheckIn && (
        <>
          <button className="btn-checkin" onClick={handleCheckIn} disabled={checking}>
            {checking
              ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◈</span> Signing transaction…</>
              : "⬡ Check In to This Event"}
          </button>
          <p style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: ".75rem" }}>
            This creates a Solana transaction — approve it in Phantom
          </p>
        </>
      )}

      {error && <div className="msg-err">{error}</div>}

      <div style={{ marginTop: "1.5rem", fontSize: ".72rem", color: "#374151", display: "flex", gap: ".5rem", justifyContent: "center" }}>
        <span>{eventInfo?.attendeeCount ?? 0} checked in</span>
        <span>·</span>
        <span>{eventInfo?.capacity ?? 0} capacity</span>
      </div>
    </div>
  );
}

export default function CheckInCodePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: checkinCSS }} />
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-brand"><img src="/Strata-logo.svg" alt="Signal" /></a>
          <WalletMultiButton />
        </div>
      </nav>
      <div className="page">
        <Suspense fallback={<div style={{ color: "#6b7280", textAlign: "center", padding: "3rem" }}>Loading…</div>}>
          <CheckInContent />
        </Suspense>
      </div>
    </>
  );
}
