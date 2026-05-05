"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import { checkinCSS } from "../../styles/checkinStyles";

const WLD_APP_ID = process.env.NEXT_PUBLIC_WLD_APP_ID ?? "";
const WLD_ACTION = process.env.NEXT_PUBLIC_WLD_ACTION ?? "signal-checkin";

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
  location: string;
  status: string;
}

type WorldIdState = "idle" | "verifying" | "verified" | "error";

function CheckInContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code")?.toUpperCase() ?? "";
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

  // World ID state
  const [wldState,       setWldState]       = useState<WorldIdState>("idle");
  const [wldError,       setWldError]       = useState<string | null>(null);
  const [nullifierHash,  setNullifierHash]  = useState<string | null>(null);
  const [miniKitReady,   setMiniKitReady]   = useState<boolean | null>(null); // null = loading

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

  // Fetch event info
  useEffect(() => {
    if (!code) { setFetching(false); setNotFound(true); return; }
    fetch(`/api/actions/checkin?eventCode=${code}&sig=${encodeURIComponent(sig)}&exp=${exp}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setNotFound(true); }
        else {
          const desc  = d.description ?? "";
          const lines = desc.split("\n").filter(Boolean);
          setEventInfo({
            title:    d.title?.replace("[SIGNAL] ","") ?? code,
            location: lines[0]?.replace("📍 ","") ?? "",
            status:   "Live",
          });
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setFetching(false));
  }, [code]);

  async function handleWorldId() {
    if (!miniKitReady) return;
    setWldState("verifying");
    setWldError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { MiniKit } = await import("@worldcoin/minikit-js") as any;

      // v1.x API: commandsAsync.verify — present in older World App builds
      // v2.x API: walletAuth — World App wallet sign proves World ID identity
      let nullifier: string;
      let proofPayload: Record<string, string> = {};

      if (typeof MiniKit.commandsAsync?.verify === "function") {
        const { finalPayload } = await MiniKit.commandsAsync.verify({
          action:             WLD_ACTION,
          signal:             code,
          verification_level: "device",
        });
        if (finalPayload?.status === "error") {
          throw new Error(finalPayload.error_code ?? "Verification rejected");
        }
        nullifier     = finalPayload.nullifier_hash;
        proofPayload  = {
          proof:              finalPayload.proof ?? "",
          merkle_root:        finalPayload.merkle_root ?? "",
          verification_level: finalPayload.verification_level ?? "device",
        };
      } else {
        // v2 fallback: walletAuth gives us the World App address — derive nullifier from it
        const result = await MiniKit.walletAuth({
          nonce:     `signal_${code}_${Date.now()}`,
          statement: `Verify you are human to check in to event #${code}. This proves one World ID per event.`,
        });
        if (result?.status === "error" || !result?.data?.address) {
          throw new Error("World App wallet auth failed or was cancelled.");
        }
        // Deterministic nullifier: sha256(worldAppAddress:eventCode) via SubtleCrypto
        const rawBytes = new TextEncoder().encode(`${result.data.address.toLowerCase()}:${code}`);
        const raw      = rawBytes.buffer.slice(rawBytes.byteOffset, rawBytes.byteOffset + rawBytes.byteLength) as ArrayBuffer;
        const digest  = await crypto.subtle.digest("SHA-256", raw as BufferSource);
        nullifier     = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
        proofPayload  = { proof: result.data.signature ?? "", merkle_root: "0x0", verification_level: "device" };
      }

      // Server-side nullifier storage (and optional proof verification)
      const res = await fetch("/api/worldid/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...proofPayload,
          nullifier_hash: nullifier,
          eventCode:      code,
          wallet:         publicKey?.toBase58() ?? "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setWldState("error");
        setWldError(data.error ?? "World ID server verification failed.");
        return;
      }

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

      const res = await fetch(`/api/actions/checkin?eventCode=${code}&sig=${encodeURIComponent(sig)}&exp=${exp}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.detail ?? "Check-in failed");
      const tx = Transaction.from(Buffer.from(data.transaction, "base64"));
      const signed = await wallet.signTransaction(tx);
      const txSig = await connection.sendRawTransaction(signed.serialize());
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

  // Whether World ID step is needed
  const wldRequired    = !!WLD_APP_ID;
  const wldDone        = !wldRequired || wldState === "verified";
  const canCheckIn     = connected && wldDone;

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
          {wldState === "verified" && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:".4rem", background:"rgba(0,180,255,.1)", border:"1px solid rgba(0,180,255,.25)", borderRadius:100, padding:".3rem .85rem", fontSize:".72rem", color:"#60c8f5", marginBottom:".75rem" }}>
              🌐 World ID Verified
            </div>
          )}
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

      {/* Step 1 — Connect wallet */}
      {!connected && (
        <div className="connect-prompt">
          <p>Connect your Phantom wallet to check in</p>
          <WalletMultiButton />
        </div>
      )}

      {/* Step 2 — World ID verification */}
      {connected && wldRequired && wldState !== "verified" && (
        <div className="wld-section">
          <div className="wld-label">Step 2 of 2 — Verify you're human</div>
          <p className="wld-desc">
            Signal uses World ID to prevent sybil attacks. One human = one check-in per event.
          </p>

          {miniKitReady === null && (
            <div className="wld-loading">Loading World ID…</div>
          )}

          {miniKitReady === false && (
            <div className="wld-unavailable">
              <div style={{ fontSize:"1.2rem", marginBottom:".4rem" }}>🌐</div>
              <div style={{ fontWeight:600, marginBottom:".3rem" }}>World App required</div>
              <div style={{ fontSize:".78rem", color:"#6b7280", lineHeight:1.6 }}>
                Open this page inside the <strong style={{ color:"#e8e8e8" }}>World App</strong> to verify your humanity and complete check-in.
              </div>
            </div>
          )}

          {miniKitReady === true && wldState !== "error" && (
            <button
              className="btn-worldid"
              onClick={handleWorldId}
              disabled={wldState === "verifying"}
            >
              {wldState === "verifying"
                ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>◈</span> Verifying…</>
                : "🌐 Verify with World ID"}
            </button>
          )}

          {wldState === "error" && (
            <>
              <div className="msg-err" style={{ marginBottom:".75rem" }}>{wldError}</div>
              <button className="btn-worldid" onClick={handleWorldId}>
                🌐 Try Again
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 2 badge when verified */}
      {connected && wldState === "verified" && (
        <div className="wld-verified-badge">
          🌐 World ID Verified
        </div>
      )}

      {/* Step 3 (or Step 2 if no WLD) — Check In */}
      {canCheckIn && (
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
          <a href="/" className="nav-brand"><img src="/Strata-logo.svg" alt="Signal" /></a>
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
