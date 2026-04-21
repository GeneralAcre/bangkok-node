"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import { StrataClient, findEventPDA, parseEventStatus, EventAccount } from "../../utils/strata-client";

const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

function randomCode() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #000; color: #fff; font-family: 'Inter', sans-serif; min-height: 100vh; }

  :root {
    --g: #8CE9A4; --p: #7A57E9; --white: #FFFFFF; --black: #000;
    --g-dim: #8CE9A415; --p-dim: #7A57E915;
    --g-border: #8CE9A440; --p-border: #7A57E940;
    --p-glow: #7A57E930; --g-glow: #8CE9A430;
    --surface: rgba(10,10,15,.7); --surface2: rgba(17,17,24,.8); --border: rgba(30,30,46,.8);
    --text-muted: #6b7280; --text-dim: #374151;
  }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse     { 0%,100%{opacity:.7} 50%{opacity:1} }
  @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes scanline  { 0%{top:-4px} 100%{top:100vh} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes orb1      { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.08)} 66%{transform:translate(-30px,30px) scale(.95)} }
  @keyframes orb2      { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,40px) scale(1.05)} 66%{transform:translate(40px,-30px) scale(.97)} }
  @keyframes gradMove  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

  /* Ambient orbs */
  .orb-wrap { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
  .orb { position:absolute; border-radius:50%; filter:blur(80px); }
  .orb1 { width:500px; height:500px; background:#7A57E9; opacity:.1; top:-150px; left:-100px; animation:orb1 20s ease-in-out infinite; }
  .orb2 { width:400px; height:400px; background:#8CE9A4; opacity:.08; bottom:-100px; right:-50px; animation:orb2 25s ease-in-out infinite; }
  .orb3 { width:300px; height:300px; background:#7A57E9; opacity:.06; top:40%; left:60%; animation:orb1 30s ease-in-out infinite reverse; }

  /* Grid overlay */
  .grid-bg {
    position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:
      linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
    background-size:60px 60px;
  }

  .scanline {
    position:fixed; top:0; left:0; right:0; height:2px; z-index:999; pointer-events:none;
    background:linear-gradient(transparent,#7A57E918,transparent);
    animation:scanline 10s linear infinite;
  }

  .nav {
    position:sticky; top:0; z-index:100;
    background:rgba(0,0,0,.75); backdrop-filter:blur(24px);
    border-bottom:1px solid rgba(30,30,46,.6); padding:0 1.5rem;
  }
  .nav-inner {
    max-width:1000px; margin:0 auto;
    display:flex; align-items:center; justify-content:space-between; height:60px;
  }
  .nav-brand {
    font-family:'Space Grotesk',sans-serif; font-size:1.2rem; font-weight:700;
    background:linear-gradient(135deg,var(--p),var(--g));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    text-decoration:none;
  }
  .nav-links { display:flex; gap:.4rem; align-items:center; }
  .nav-link {
    font-family:'Space Grotesk',sans-serif; font-size:.8rem; font-weight:500;
    color:var(--text-muted); text-decoration:none; padding:.4rem .8rem;
    border-radius:6px; transition:all .2s;
  }
  .nav-link:hover { color:#fff; background:var(--p-dim); }
  .nav-link.active { color:var(--p); }
  @media(max-width:600px){.nav-link:not(.active){display:none}}

  .page { max-width:1000px; margin:0 auto; padding:2rem 1.5rem; position:relative; z-index:1; }

  .page-header { margin-bottom:2rem; animation:fadeUp .5s ease both; }
  .page-title {
    font-family:'Space Grotesk',sans-serif; font-size:2rem; font-weight:700; margin-bottom:.4rem;
    background:linear-gradient(135deg,#fff 0%,#c4b5fd 40%,var(--p) 65%,var(--g) 90%);
    background-size:200% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    animation:gradMove 6s ease infinite;
  }
  .page-sub { font-size:.85rem; color:var(--text-muted); }

  .card {
    background:rgba(10,10,15,.6); backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.06); border-radius:16px;
    padding:1.5rem; margin-bottom:1.25rem; animation:fadeUp .5s ease both;
    transition:border-color .3s, box-shadow .3s;
  }
  .card:hover { border-color:rgba(122,87,233,.2); box-shadow:0 8px 40px rgba(0,0,0,.4); }
  .card-title {
    font-family:'Space Grotesk',sans-serif; font-size:.78rem; font-weight:600;
    color:var(--p); letter-spacing:.1em; text-transform:uppercase; margin-bottom:1.25rem;
  }

  label {
    display:block; font-size:.78rem; font-weight:500; color:#9ca3af;
    margin-bottom:.4rem; letter-spacing:.03em;
  }
  input, textarea {
    width:100%; padding:.7rem 1rem; background:rgba(17,17,24,.8); border:1px solid rgba(30,30,46,.8);
    border-radius:8px; color:#fff; font-family:'Inter',sans-serif; font-size:.88rem;
    margin-bottom:1rem; transition:border-color .2s, box-shadow .2s; outline:none;
  }
  input:focus, textarea:focus { border-color:var(--p); box-shadow:0 0 0 3px var(--p-dim); }
  textarea { resize:vertical; min-height:80px; }
  .row { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  @media(max-width:520px){.row{grid-template-columns:1fr}}
  .field-note { font-size:.72rem; color:var(--text-muted); margin-top:-.5rem; margin-bottom:.9rem; }

  .btn {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.65rem 1.4rem; border:none; cursor:pointer; border-radius:8px;
    font-family:'Space Grotesk',sans-serif; font-size:.85rem; font-weight:600;
    letter-spacing:.03em; transition:all .2s;
  }
  .btn-primary  { background:var(--p); color:#fff; }
  .btn-primary:hover { background:#8B6EF0; transform:translateY(-1px); box-shadow:0 6px 24px var(--p-glow); }
  .btn-primary:disabled { background:#2d2060; color:#6b7280; cursor:not-allowed; transform:none; box-shadow:none; }
  .btn-green    { background:var(--g-dim); color:var(--g); border:1px solid var(--g-border); }
  .btn-green:hover { background:#8CE9A425; transform:translateY(-1px); box-shadow:0 4px 16px var(--g-glow); }
  .btn-green:disabled { opacity:.5; cursor:not-allowed; transform:none; box-shadow:none; }
  .btn-danger   { background:#1a0010; color:#f87171; border:1px solid #7f1d1d; }
  .btn-danger:hover { background:#2d0018; }
  .btn-danger:disabled { opacity:.5; cursor:not-allowed; }
  .btn-ghost    { background:transparent; color:#9ca3af; border:1px solid rgba(30,30,46,.8); }
  .btn-ghost:hover { border-color:var(--p); color:var(--p); background:var(--p-dim); }
  .btn-demo     { background:var(--g-dim); color:var(--g); border:1px solid var(--g-border); }
  .btn-demo:hover { background:#8CE9A425; border-color:var(--g); transform:translateY(-1px); box-shadow:0 4px 20px var(--g-glow); }
  .btn-demo:disabled { opacity:.5; cursor:not-allowed; transform:none; }

  .msg-ok  { background:rgba(10,31,15,.8); backdrop-filter:blur(10px); border:1px solid #166534; color:var(--g); padding:.85rem 1.1rem; margin-bottom:1rem; font-size:.82rem; border-radius:10px; white-space:pre-wrap; }
  .msg-err { background:rgba(26,10,15,.8); backdrop-filter:blur(10px); border:1px solid #7f1d1d; color:#f87171; padding:.85rem 1.1rem; margin-bottom:1rem; font-size:.82rem; border-radius:10px; }

  .event-card {
    border:1px solid rgba(30,30,46,.8); border-radius:12px; padding:1.25rem;
    margin-bottom:.75rem; transition:all .25s;
    background:rgba(17,17,24,.4); backdrop-filter:blur(10px);
  }
  .event-card:hover { border-color:var(--p-border); background:rgba(122,87,233,.04); box-shadow:0 4px 20px rgba(0,0,0,.4); }
  .event-name { font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:600; color:#fff; margin-bottom:.2rem; }
  .event-meta { font-size:.75rem; color:var(--text-muted); margin-bottom:.6rem; line-height:1.5; }
  .event-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; margin-top:.75rem; }

  .badge-live     { display:inline-flex; align-items:center; gap:.35rem; font-size:.72rem; font-weight:600; color:var(--g); background:var(--g-dim); border:1px solid var(--g-border); padding:.2rem .7rem; border-radius:100px; }
  .badge-live::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--g); animation:pulse 2s infinite; flex-shrink:0; }
  .badge-upcoming { font-size:.72rem; font-weight:500; color:#fbbf24; background:#fbbf2415; border:1px solid #fbbf2440; padding:.2rem .7rem; border-radius:100px; }
  .badge-ended    { font-size:.72rem; font-weight:500; color:#374151; background:#11111a; border:1px solid #1e1e2e; padding:.2rem .7rem; border-radius:100px; }

  .qr-panel { text-align:center; padding:.5rem 0; }
  .event-code-display {
    display:inline-block; font-family:'Space Mono',monospace; font-size:1.8rem; font-weight:700;
    color:var(--p); background:var(--p-dim); border:1px solid var(--p-border);
    padding:.5rem 1.75rem; border-radius:10px; letter-spacing:.2em; margin-bottom:1.25rem;
  }
  .qr-img-wrap {
    display:inline-block; padding:1rem; background:#fff; border-radius:12px; margin-bottom:1rem;
    box-shadow:0 8px 40px #7A57E940;
  }
  .blink-url {
    font-family:'Space Mono',monospace; font-size:.65rem; color:var(--text-muted);
    word-break:break-all; padding:.7rem 1rem; background:rgba(17,17,24,.8); border:1px solid rgba(30,30,46,.8);
    border-radius:8px; margin-bottom:.75rem; cursor:pointer; transition:all .2s; text-align:left; display:block;
  }
  .blink-url:hover { border-color:var(--p); color:var(--p); }

  .how-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:.75rem; }
  .how-step {
    background:rgba(17,17,24,.5); backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,.05); border-radius:10px; padding:.85rem 1rem;
    transition:all .25s; animation:float 6s ease-in-out infinite;
  }
  .how-step:hover { border-color:var(--p-border); transform:translateY(-3px) !important; box-shadow:0 8px 24px rgba(0,0,0,.5); }
  .how-num  { font-family:'Space Grotesk',sans-serif; font-size:.72rem; font-weight:700; color:var(--p); margin-bottom:.25rem; }
  .how-text { font-size:.72rem; color:var(--text-muted); line-height:1.6; }

  .connect-card { text-align:center; padding:4rem 1.5rem; }
  .connect-card p { font-size:.9rem; color:var(--text-muted); margin-bottom:1.5rem; }

  .wallet-adapter-button {
    background:var(--p) !important; color:#fff !important;
    font-family:'Space Grotesk',sans-serif !important; font-size:.8rem !important;
    font-weight:600 !important; border-radius:8px !important;
    padding:.45rem 1rem !important; height:auto !important; border:none !important;
  }
  .wallet-adapter-button:hover { background:#8B6EF0 !important; }
`;

interface LocalEvent { pubkey: string; account: EventAccount; }

export default function OrganizerPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;

  const [client,       setClient]       = useState<StrataClient | null>(null);
  const [idlLoaded,    setIdlLoaded]    = useState(false);
  const [events,       setEvents]       = useState<LocalEvent[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [msg,          setMsg]          = useState<{ type:"ok"|"err"; text:string } | null>(null);
  const [qrEvent,      setQrEvent]      = useState<LocalEvent | null>(null);
  const [qrDataUrl,    setQrDataUrl]    = useState("");
  const [copied,       setCopied]       = useState(false);
  const [demoChecking, setDemoChecking] = useState<string | null>(null);

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [location,    setLocation]    = useState("");
  const [country,     setCountry]     = useState("Thailand");
  const [eventDate,   setEventDate]   = useState("");
  const [capacity,    setCapacity]    = useState("100");
  const [eventCode,   setEventCode]   = useState("");

  useEffect(() => { setEventCode(randomCode()); }, []);

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

  async function generateQr(code: string) {
    try {
      const QRCode = (await import("qrcode")).default;
      const base = typeof window !== "undefined" ? window.location.origin : APP_URL;
      const url = `solana-action:${base}/api/actions/checkin?eventCode=${code}`;
      const dataUrl = await QRCode.toDataURL(url, { width:200, margin:1, color:{ dark:"#000", light:"#fff" } });
      setQrDataUrl(dataUrl);
    } catch {}
  }

  function blinkUrl(code: string) {
    const base = typeof window !== "undefined" ? window.location.origin : APP_URL;
    return `solana-action:${base}/api/actions/checkin?eventCode=${code}`;
  }

  function copyUrl(code: string) {
    navigator.clipboard.writeText(blinkUrl(code));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!client || !COMMUNITY_PDA_STR) return;
    setLoading(true); setMsg(null);
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
      });
      setMsg({ type:"ok", text:`✓ "${title}" deployed on-chain! Now click GO LIVE when ready.` });
      setTitle(""); setDescription(""); setLocation(""); setEventCode(randomCode());
      await loadEvents();
    } catch (err: any) {
      const m = err?.message ?? "";
      if (m.includes("already been processed") || m.includes("already in use")) {
        setMsg({ type:"ok", text:"Event created! (already confirmed)" }); await loadEvents();
      } else if (m.includes("rejected") || m.includes("cancelled")) {
        setMsg({ type:"err", text:"Transaction cancelled — try again and Approve in Phantom." });
      } else if (m.includes("debit") || m.includes("insufficient") || m.includes("0x1")) {
        setMsg({ type:"err", text:"Insufficient SOL — get free devnet SOL at faucet.solana.com" });
      } else { setMsg({ type:"err", text: m || "Transaction failed" }); }
    } finally { setLoading(false); }
  }

  async function handleStart(ev: LocalEvent) {
    if (!client) return;
    setLoading(true); setMsg(null);
    try {
      await client.startEvent(new PublicKey(ev.pubkey));
      const updated = { ...ev, account: { ...ev.account, status: { live: {} } as any } };
      setQrEvent(updated);
      await generateQr(ev.account.eventCode);
      setMsg({ type:"ok", text:"✓ Event is now LIVE — share the QR below!" });
      await loadEvents();
    } catch (err: any) { setMsg({ type:"err", text:err?.message }); }
    finally { setLoading(false); }
  }

  async function handleEnd(ev: LocalEvent) {
    if (!client) return;
    setLoading(true); setMsg(null);
    try {
      await client.endEvent(new PublicKey(ev.pubkey));
      setMsg({ type:"ok", text:"Event ended." }); setQrEvent(null); await loadEvents();
    } catch (err: any) { setMsg({ type:"err", text:err?.message }); }
    finally { setLoading(false); }
  }

  async function handleDemoCheckIn(ev: LocalEvent) {
    if (!publicKey || !wallet.signTransaction) return;
    setDemoChecking(ev.pubkey); setMsg(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : APP_URL;
      const res = await fetch(`${origin}/api/actions/checkin?eventCode=${ev.account.eventCode}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ account: publicKey.toBase58() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.detail ?? "Check-in failed");
      const tx = Transaction.from(Buffer.from(data.transaction, "base64"));
      const signed = await wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      setMsg({ type:"ok", text:`✓ Demo check-in confirmed!\nNow go to /profile → click CLAIM NFT to mint your attendance NFT.` });
      await loadEvents();
    } catch (err: any) {
      const m = err?.message ?? "";
      if (m.includes("already in use") || m.includes("already been processed")) {
        setMsg({ type:"ok", text:"Already checked in! Go to /profile → CLAIM NFT." });
      } else if (m.includes("rejected") || m.includes("cancelled")) {
        setMsg({ type:"err", text:"Transaction cancelled." });
      } else { setMsg({ type:"err", text: m || "Demo check-in failed" }); }
    } finally { setDemoChecking(null); }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="grid-bg" />
      <div className="orb-wrap">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
      </div>
      <div className="scanline" />

      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-brand">STRATA</a>
          <div className="nav-links">
            <a href="/" className="nav-link">Home</a>
            <a href="/organizer" className="nav-link active">Organizer</a>
            <a href="/profile" className="nav-link">Profile</a>
            <WalletMultiButton />
          </div>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Organizer</h1>
          <p className="page-sub">Deploy events on-chain · Generate QR Blinks · Track check-ins</p>
        </div>

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
            <p>Connect your wallet to create and manage events</p>
            <WalletMultiButton />
          </div>
        )}

        {/* Live QR Panel */}
        {qrEvent && (
          <div className="card" style={{ borderColor:"#8CE9A440" }}>
            <div className="card-title" style={{ color:"var(--g)" }}>◉ Live Event — Share This QR</div>
            <div className="qr-panel">
              <div className="event-code-display">{qrEvent.account.eventCode}</div>
              <div style={{ marginBottom:".75rem" }}>
                <div className="qr-img-wrap">
                  {qrDataUrl
                    ? <img src={qrDataUrl} alt="QR Code" width={180} height={180} style={{ display:"block", borderRadius:4 }} />
                    : <div style={{ width:180, height:180, background:"#f5f5f5", display:"flex", alignItems:"center", justifyContent:"center", color:"#999", fontSize:".75rem", borderRadius:4 }}>Generating…</div>
                  }
                </div>
              </div>
              <p style={{ fontSize:".8rem", color:"var(--text-muted)", marginBottom:".75rem" }}>
                Attendees scan with Phantom → one-tap check-in on Solana
              </p>
              <div className="blink-url" onClick={() => copyUrl(qrEvent.account.eventCode)} title="Click to copy">
                {blinkUrl(qrEvent.account.eventCode)}
              </div>
              <div style={{ display:"flex", gap:".5rem", justifyContent:"center", flexWrap:"wrap", marginBottom:".75rem" }}>
                <button className="btn btn-ghost" onClick={() => copyUrl(qrEvent.account.eventCode)}>
                  {copied ? "✓ Copied!" : "Copy Blink URL"}
                </button>
                <button className="btn btn-ghost" onClick={() => setQrEvent(null)}>Hide QR</button>
              </div>
              <div style={{ background:"#111118", border:"1px solid #1e1e2e", borderRadius:10, padding:".85rem 1rem", fontSize:".78rem", color:"#6b7280", textAlign:"left" }}>
                <span style={{ color:"var(--g)", fontWeight:600 }}>💻 Demo on your computer:</span>{" "}
                Share this link instead of the QR —{" "}
                <a
                  href={`/checkin?code=${qrEvent.account.eventCode}`}
                  target="_blank" rel="noreferrer"
                  style={{ color:"var(--p)", fontFamily:"'Space Mono',monospace", wordBreak:"break-all" }}
                >
                  /checkin?code={qrEvent.account.eventCode}
                </a>
                {" "}— works in any browser with Phantom installed.
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        {connected && (
          <div className="card" style={{ borderColor:"#1e1e2e" }}>
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

        {/* Create Event */}
        {connected && idlLoaded && (
          <div className="card">
            <div className="card-title">+ Deploy Event On-Chain</div>
            <form onSubmit={handleCreate}>
              <label>Event Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Bangkok Web3 Meetup #1" required />

              <label>Description <span style={{ color:"var(--text-dim)", fontWeight:400 }}>(optional)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this event about?" />

              <div className="row">
                <div><label>Venue / Location *</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="Hubba-TO, Bangkok" required /></div>
                <div><label>Country *</label><input value={country} onChange={e => setCountry(e.target.value)} placeholder="Thailand" required /></div>
              </div>
              <div className="row">
                <div><label>Date & Time *</label><input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} required /></div>
                <div><label>Capacity *</label><input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} min="1" required /></div>
              </div>

              <label>Event Code (8 chars)</label>
              <div style={{ display:"flex", gap:".5rem", marginBottom:".25rem" }}>
                <input value={eventCode} onChange={e => setEventCode(e.target.value.toUpperCase().slice(0,8))} maxLength={8} style={{ flex:1, marginBottom:0 }} required />
                <button type="button" className="btn btn-ghost" onClick={() => setEventCode(randomCode())}>Random</button>
              </div>
              <p className="field-note">Embedded in the QR — attendees use this to check in</p>

              <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop:".5rem", width:"100%", justifyContent:"center" }}>
                {loading ? "Deploying…" : "⬡ Deploy Event On-Chain"}
              </button>
            </form>
          </div>
        )}

        {/* My Events */}
        {events.length > 0 && (
          <div className="card">
            <div className="card-title">My Events ({events.length})</div>
            {events.map(ev => {
              const status = parseEventStatus(ev.account.status);
              return (
                <div className="event-card" key={ev.pubkey}>
                  <div className="event-name">{ev.account.title}</div>
                  <div className="event-meta">
                    {ev.account.location}, {ev.account.country} ·{" "}
                    {new Date(ev.account.eventDate.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle:"medium" })} ·{" "}
                    {ev.account.attendeeCount.toNumber()}/{ev.account.capacity.toNumber()} checked in ·{" "}
                    <span style={{ fontFamily:"'Space Mono',monospace" }}>#{ev.account.eventCode}</span>
                  </div>
                  <span className={`badge-${status.toLowerCase()}`}>{status}</span>
                  <div className="event-actions">
                    {status === "Upcoming" && (
                      <button className="btn btn-green" disabled={loading} onClick={() => handleStart(ev)}>▶ Go Live</button>
                    )}
                    {status === "Live" && (<>
                      <button className="btn btn-ghost" onClick={() => {
                        const next = qrEvent?.pubkey === ev.pubkey ? null : ev;
                        setQrEvent(next);
                        if (next) generateQr(ev.account.eventCode);
                      }}>
                        {qrEvent?.pubkey === ev.pubkey ? "Hide QR" : "⬡ Show QR"}
                      </button>
                      <button
                        className="btn btn-demo"
                        disabled={!!demoChecking}
                        onClick={() => handleDemoCheckIn(ev)}
                        title="Check yourself in as a demo attendee"
                      >
                        {demoChecking === ev.pubkey
                          ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>◈</span> Checking in…</>
                          : "✦ Demo Check-In"}
                      </button>
                      <button className="btn btn-danger" disabled={loading} onClick={() => handleEnd(ev)}>End Event</button>
                    </>)}
                    <a href={`https://explorer.solana.com/address/${ev.pubkey}?cluster=devnet`} target="_blank" rel="noreferrer"
                      style={{ fontSize:".75rem", color:"var(--text-muted)", marginLeft:"auto", alignSelf:"center" }}>Explorer ↗</a>
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

