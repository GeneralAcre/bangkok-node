"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction, Connection, PublicKey } from "@solana/web3.js";
import { QRCodeSVG } from "qrcode.react";
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

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

function readStr(data: Buffer, off: number): { value: string; next: number } {
  const len = data.readUInt32LE(off);
  return { value: data.slice(off + 4, off + 4 + len).toString("utf-8"), next: off + 4 + len };
}

interface EventInfo {
  title:        string;
  location:     string;
  country:      string;
  status:       string;
  startTime:    number;
  endTime:      number;
  capacity:     number;
  attendeeCount: number;
  eventCode:    string;
  organizer:    string;
}

type WorldIdState = "idle" | "verifying" | "verified" | "error";

function CheckInContent() {
  const searchParams   = useSearchParams();
  const eventPubkeyStr = searchParams.get("event") ?? "";
  const sig            = searchParams.get("sig") ?? "";
  const exp            = searchParams.get("exp") ?? "";

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
  const [qrUrl,      setQrUrl]      = useState<string | null>(null);
  const [showQr,     setShowQr]     = useState(false);
  const [generatingQr, setGeneratingQr] = useState(false);

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

  // Fetch event info directly from chain by pubkey
  useEffect(() => {
    if (!eventPubkeyStr) { setFetching(false); setNotFound(true); return; }
    (async () => {
      try {
        const conn = new Connection(RPC_URL, "confirmed");
        const info = await conn.getAccountInfo(new PublicKey(eventPubkeyStr));
        if (!info) { setNotFound(true); return; }
        const d = Buffer.from(info.data);
        // Layout: disc(8)+community(32)+organizer(32)+title(str)+location(str)+country(str)
        //         +start_time(8)+end_time(8)+capacity(8)+attendee_count(8)+fee(8)+event_code(str)
        const organizerPubkey = new PublicKey(d.slice(40, 72)).toBase58();
        let o = 8 + 32 + 32;
        const title        = readStr(d, o); o = title.next;
        const location     = readStr(d, o); o = location.next;
        const country      = readStr(d, o); o = country.next;
        const startTime    = Number(d.readBigInt64LE(o)); o += 8;
        const endTime      = Number(d.readBigInt64LE(o)); o += 8;
        const capacity     = Number(d.readBigUInt64LE(o)); o += 8;
        const attendeeCount = Number(d.readBigUInt64LE(o)); o += 8;
        o += 8; // fee
        const eventCode    = readStr(d, o);
        const now    = Math.floor(Date.now() / 1000);
        const status = now < startTime ? "Upcoming" : now <= endTime ? "Live" : "Ended";
        setEventInfo({ title: title.value, location: location.value, country: country.value, status, startTime, endTime, capacity, attendeeCount, eventCode: eventCode.value, organizer: organizerPubkey });
      } catch { setNotFound(true); }
      finally  { setFetching(false); }
    })();
  }, [eventPubkeyStr]);

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
          signal:             eventInfo?.eventCode ?? eventPubkeyStr,
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
          nonce:     `signal_${eventInfo?.eventCode ?? eventPubkeyStr}_${Date.now()}`,
          statement: `Verify you are human to check in to event #${eventInfo?.eventCode ?? eventPubkeyStr}. This proves one World ID per event.`,
        });
        if (result?.status === "error" || !result?.data?.address) {
          throw new Error("World App wallet auth failed or was cancelled.");
        }
        // Deterministic nullifier: sha256(worldAppAddress:eventCode) via SubtleCrypto
        const rawBytes = new TextEncoder().encode(`${result.data.address.toLowerCase()}:${eventInfo?.eventCode ?? eventPubkeyStr}`);
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
          eventCode:      eventInfo?.eventCode ?? "",
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
    if (!publicKey || !wallet.signTransaction || !eventInfo?.eventCode) return;
    setChecking(true); setError(null);
    try {
      const body: Record<string, unknown> = { account: publicKey.toBase58() };
      if (nullifierHash) body.nullifier_hash = nullifierHash;

      const res = await fetch(`/api/actions/checkin?eventCode=${eventInfo.eventCode}&sig=${encodeURIComponent(sig)}&exp=${exp}`, {
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

  async function signCheckinUrl(): Promise<string | null> {
    if (!wallet.signMessage || !publicKey || !eventInfo) return null;
    const expiry   = eventInfo.endTime;
    const message  = new TextEncoder().encode(`signal_checkin:${eventInfo.eventCode}:${expiry}`);
    const sigBytes = await wallet.signMessage(message);
    const sigHex   = Buffer.from(sigBytes).toString("hex");
    return `${window.location.origin}/checkin?event=${eventPubkeyStr}&sig=${sigHex}&exp=${expiry}`;
  }

  async function handleGenerateQR() {
    if (!wallet.signMessage || !publicKey || !eventInfo) return;
    setGeneratingQr(true);
    try {
      const url = await signCheckinUrl();
      if (url) { setQrUrl(url); setShowQr(true); }
    } catch (e: any) {
      const m = e?.message ?? "";
      if (!m.includes("rejected") && !m.includes("cancelled")) setError(m || "Failed to generate QR");
    } finally {
      setGeneratingQr(false);
    }
  }

  async function handleSelfCheckIn() {
    if (!wallet.signMessage || !publicKey || !eventInfo) return;
    setGeneratingQr(true);
    try {
      const url = await signCheckinUrl();
      if (url) window.location.href = url;
    } catch (e: any) {
      const m = e?.message ?? "";
      if (!m.includes("rejected") && !m.includes("cancelled")) setError(m || "Failed to sign — try again");
    } finally {
      setGeneratingQr(false);
    }
  }

  // Whether World ID step is needed
  const wldRequired    = !!WLD_APP_ID;
  const wldDone        = !wldRequired || wldState === "verified";
  const canCheckIn     = connected && wldDone;

  if (fetching) return <div className="info-text">Loading event…</div>;
  if (notFound || !eventPubkeyStr) return (
    <div className="checkin-card">
      <div className="error-big">Event not found</div>
      <p style={{ color:"#6b7280", fontSize:".82rem", marginTop:".75rem", lineHeight:1.7 }}>
        {!eventPubkeyStr
          ? "No event in URL. Scan the QR code from the organizer."
          : "This event doesn't exist on-chain or the pubkey is invalid."}
      </p>
      <div style={{ marginTop:"1.25rem", display:"flex", gap:".75rem", justifyContent:"center", flexWrap:"wrap" }}>
        <a href="/organizer" style={{ display:"inline-flex", alignItems:"center", gap:".4rem", padding:".55rem 1.25rem", background:"var(--purple)", color:"#fff", borderRadius:8, fontSize:".82rem", fontWeight:600, textDecoration:"none", fontFamily:"'Space Grotesk',sans-serif" }}>
          Go to Organizer
        </a>
      </div>
    </div>
  );

  if (success) {
    return (
      <>
        {confetti && Array.from({ length: 30 }, (_, i) => <ConfettiPiece key={i} i={i} />)}
        <div className="success-card">
          <h2 className="success-title">You're checked in!</h2>
          {wldState === "verified" && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:".4rem", background:"rgba(0,180,255,.1)", border:"1px solid rgba(0,180,255,.25)", borderRadius:100, padding:".3rem .85rem", fontSize:".72rem", color:"#60c8f5", marginBottom:".75rem" }}>
              World ID Verified
            </div>
          )}
          <p className="success-sub">
            Your Proof of Presence for <strong style={{ color:"#fff" }}>{eventInfo?.title ?? eventInfo?.eventCode}</strong> is now permanently on Solana.
            <br /><br />
            Go to your profile to <strong style={{ color:"var(--purple)" }}>Claim your NFT</strong>.
          </p>
          <a href="/credentials" className="btn-profile">Claim My NFT</a>
          {success.sig && success.sig !== "already-confirmed" && (
            <div className="tx-link">
              Tx: <a href={`https://explorer.solana.com/tx/${success.sig}?cluster=devnet`} target="_blank" rel="noreferrer">{success.sig.slice(0,20)}…</a>
            </div>
          )}
        </div>
      </>
    );
  }

  const isOrganizer    = connected && publicKey?.toBase58() === eventInfo?.organizer;
  // organizer can check in once they've generated a QR (sig present) or navigated via QR URL
  const showCheckinForm = !isOrganizer || !!sig;

  return (
    <>
    {/* QR overlay for organizer */}
    {showQr && qrUrl && (
      <div onClick={() => setShowQr(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.88)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:20, padding:"2rem 2.5rem", textAlign:"center", maxWidth:340, width:"90%" }}>
          <div style={{ fontWeight:800, fontSize:"1rem", color:"#0a0a0a", marginBottom:".25rem" }}>{eventInfo?.title}</div>
          <div style={{ fontSize:".78rem", color:"#6b7280", marginBottom:"1.25rem" }}>#{eventInfo?.eventCode} · Show this to attendees</div>
          <QRCodeSVG value={qrUrl} size={220} />
          <a
            href={qrUrl}
            onClick={() => setShowQr(false)}
            style={{ marginTop:"1rem", display:"block", width:"100%", padding:".6rem", background:"#0a0a0a", color:"#fff", borderRadius:10, fontWeight:700, fontSize:".85rem", textDecoration:"none", boxSizing:"border-box" }}
          >
            Check In Myself
          </a>
          <button onClick={() => setShowQr(false)} style={{ marginTop:".5rem", display:"block", width:"100%", padding:".55rem", background:"transparent", color:"#6b7280", border:"1px solid rgba(0,0,0,.12)", borderRadius:10, fontWeight:600, cursor:"pointer", fontSize:".82rem" }}>
            Close
          </button>
        </div>
      </div>
    )}

    <div className="checkin-card">
      {/* Organizer panel */}
      {isOrganizer && !sig && (
        <div style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, padding:"1rem 1.25rem", marginBottom:"1.25rem", textAlign:"center" }}>
          <div style={{ fontSize:".72rem", color:"#9ca3af", letterSpacing:".08em", textTransform:"uppercase", marginBottom:".75rem" }}>You are the organizer</div>
          {qrUrl ? (
            <div style={{ display:"flex", gap:".6rem", justifyContent:"center", flexWrap:"wrap" }}>
              <button onClick={() => setShowQr(true)} style={{ padding:".55rem 1.4rem", background:"rgba(255,255,255,.1)", color:"#fff", border:"1px solid rgba(255,255,255,.25)", borderRadius:8, fontWeight:700, fontSize:".82rem", cursor:"pointer" }}>
                Show QR for Attendees
              </button>
              <a href={qrUrl} style={{ padding:".55rem 1.4rem", background:"#ffffff", color:"#0a0a0a", border:"none", borderRadius:8, fontWeight:800, fontSize:".82rem", cursor:"pointer", textDecoration:"none" }}>
                Check In Myself
              </a>
            </div>
          ) : (
            <div style={{ display:"flex", gap:".6rem", justifyContent:"center", flexWrap:"wrap" }}>
              <button onClick={handleGenerateQR} disabled={generatingQr} style={{ padding:".55rem 1.4rem", background:"rgba(255,255,255,.1)", color:"#fff", border:"1px solid rgba(255,255,255,.25)", borderRadius:8, fontWeight:700, fontSize:".82rem", cursor:"pointer", opacity: generatingQr ? .6 : 1 }}>
                {generatingQr ? "Signing…" : "Generate QR for Attendees"}
              </button>
              <button onClick={handleSelfCheckIn} disabled={generatingQr} style={{ padding:".55rem 1.4rem", background:"#ffffff", color:"#0a0a0a", border:"none", borderRadius:8, fontWeight:800, fontSize:".82rem", cursor:"pointer", opacity: generatingQr ? .6 : 1 }}>
                {generatingQr ? "Signing…" : "Check In Myself →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* No-sig warning for regular attendees */}
      {!isOrganizer && !sig && connected && (
        <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:".85rem 1.1rem", marginBottom:"1rem", fontSize:".82rem", color:"#9ca3af", lineHeight:1.7, textAlign:"center" }}>
          Scan the QR code from the event organizer to check in.
        </div>
      )}

      <div className={`event-badge ${eventInfo?.status === "Live" ? "event-badge-live" : ""}`}>
        {eventInfo?.status === "Live" && <span className="live-dot" />}
        {eventInfo?.status === "Live" ? "LIVE NOW" : "EVENT"}
      </div>

      <h1 className="event-title">{eventInfo?.title}</h1>
      {eventInfo?.location && (
        <div className="event-meta">
          {eventInfo.location}{eventInfo.country ? `, ${eventInfo.country}` : ""}<br />
          {eventInfo.attendeeCount}/{eventInfo.capacity} checked in · {new Date(eventInfo.startTime * 1000).toLocaleDateString("en-US", { dateStyle: "medium" })}<br />
          Check in to earn your on-chain Proof of Presence + claimable NFT
        </div>
      )}
      <div className="event-code">#{eventInfo?.eventCode}</div>

      {/* Step 1 — Connect wallet */}
      {!connected && showCheckinForm && (
        <div className="connect-prompt">
          <p>Connect your Phantom wallet to check in</p>
          <WalletMultiButton />
        </div>
      )}

      {/* Step 2 — World ID verification */}
      {showCheckinForm && connected && wldRequired && wldState !== "verified" && (
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
              <div style={{ marginBottom:".4rem" }}></div>
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
                ? "Verifying…"
                : "Verify with World ID"}
            </button>
          )}

          {wldState === "error" && (
            <>
              <div className="msg-err" style={{ marginBottom:".75rem" }}>{wldError}</div>
              <button className="btn-worldid" onClick={handleWorldId}>
                Try Again
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 2 badge when verified */}
      {showCheckinForm && connected && wldState === "verified" && (
        <div className="wld-verified-badge">
          World ID Verified
        </div>
      )}

      {/* Step 3 (or Step 2 if no WLD) — Check In */}
      {showCheckinForm && canCheckIn && !!sig && (
        <>
          <button className="btn-checkin" onClick={handleCheckIn} disabled={checking}>
            {checking ? "Signing transaction…" : "Check In to This Event"}
          </button>
          <p style={{ fontSize:".75rem", color:"var(--muted)", marginTop:".75rem" }}>
            This creates a Solana transaction — approve it in Phantom
          </p>
        </>
      )}

      {error && <div className="msg-err">{error}</div>}
    </div>
    </>
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
