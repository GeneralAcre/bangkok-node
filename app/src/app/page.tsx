"use client";

import { useEffect, useState, useRef } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

/* ─── Animated counter hook ─────────────────────────── */
function useCounter(target: number, duration = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
      else setVal(target);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

/* ─── Particle canvas ───────────────────────────────── */
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf: number;
    const W = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    W(); window.addEventListener("resize", W);
    const pts = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
      r: Math.random() * 1.5 + .5,
      c: Math.random() > .5 ? "rgba(122,87,233," : "rgba(140,233,164,",
      a: Math.random() * .4 + .1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c + p.a + ")";
        ctx.fill();
      });
      // Draw lines between close particles
      pts.forEach((a, i) => pts.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 120) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(122,87,233,${.08 * (1 - d / 120)})`;
          ctx.lineWidth = .5; ctx.stroke();
        }
      }));
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", W); };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }} />;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html { scroll-behavior:smooth; }
  body { background:#000; color:#fff; font-family:'Inter',sans-serif; min-height:100vh; overflow-x:hidden; }

  :root {
    --g: #8CE9A4; --p: #7A57E9; --p2: #9B7CF4;
    --g-dim: #8CE9A410; --p-dim: #7A57E910;
    --g-glow: #8CE9A430; --p-glow: #7A57E930;
    --surface: rgba(255,255,255,.03);
    --surface2: rgba(255,255,255,.05);
    --border: rgba(255,255,255,.07);
    --border-bright: rgba(255,255,255,.12);
    --muted: #6b7280;
  }

  /* ── Orbs ── */
  .orb {
    position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0;
  }
  .orb1 { width:700px; height:700px; background:#7A57E9; opacity:.12; top:-200px; left:-150px; animation:orb1 25s ease-in-out infinite; }
  .orb2 { width:600px; height:600px; background:#8CE9A4; opacity:.08; bottom:-150px; right:-100px; animation:orb2 30s ease-in-out infinite; }
  .orb3 { width:500px; height:500px; background:#4f3ab5; opacity:.1; top:40%; left:60%; animation:orb3 20s ease-in-out infinite; }

  @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(80px,-60px) scale(1.1)} 66%{transform:translate(-40px,40px) scale(.95)} }
  @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-60px,40px) scale(1.05)} 66%{transform:translate(60px,-30px) scale(.9)} }
  @keyframes orb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-80px,60px) scale(1.1)} }

  /* ── Grid bg ── */
  .grid-bg {
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
                     linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
    background-size:60px 60px;
    mask-image:radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%);
  }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes gradRot { from{--angle:0deg} to{--angle:360deg} }
  @keyframes pulse   { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes scanLine{ 0%{top:-2px} 100%{top:100vh} }
  @keyframes textGlow{ 0%,100%{text-shadow:0 0 20px #7A57E940} 50%{text-shadow:0 0 60px #7A57E980, 0 0 100px #8CE9A420} }
  @keyframes borderGlow { 0%,100%{opacity:.4} 50%{opacity:1} }
  @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

  /* ── Nav ── */
  .nav {
    position:fixed; top:0; left:0; right:0; z-index:100;
    background:rgba(0,0,0,.5); backdrop-filter:blur(24px);
  }
  .nav-inner {
    max-width:1100px; margin:0 auto; padding:0 1.5rem;
    display:flex; align-items:center; justify-content:space-between; height:72px;
  }
  .nav-brand { text-decoration:none; display:flex; align-items:center; }
  .nav-brand img { height:44px; display:block; }
  .nav-links { display:flex; gap:.5rem; align-items:center; }
  .nav-link {
    font-family:'Space Grotesk',sans-serif; font-size:.82rem; font-weight:500;
    color:var(--muted); text-decoration:none; padding:.4rem .9rem; border-radius:8px; transition:all .2s;
  }
  .nav-link:hover { color:#fff; background:var(--surface2); }
  .nav-link.active { color:#fff; }
  @media(max-width:640px){.nav-links .nav-link:not(.active){display:none}}

  /* ── Page ── */
  .page { position:relative; z-index:1; }
  .container { max-width:1100px; margin:0 auto; padding:0 1.5rem; }

  /* ── Hero ── */
  .hero {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    text-align:center; padding:8rem 1.5rem 5rem; position:relative;
  }
  .hero-inner { position:relative; z-index:1; animation:fadeUp .8s ease both; }
  .hero-badge {
    display:inline-flex; align-items:center; gap:.5rem;
    background:var(--p-dim); border:1px solid rgba(122,87,233,.25);
    backdrop-filter:blur(10px);
    color:var(--p2); font-size:.75rem; font-weight:600; letter-spacing:.1em;
    padding:.4rem 1.1rem; border-radius:100px; margin-bottom:2rem;
    font-family:'Space Grotesk',sans-serif;
  }
  .badge-dot { width:6px; height:6px; border-radius:50%; background:var(--g); animation:pulse 2s infinite; }
  .hero-title {
    font-family:'Space Grotesk',sans-serif;
    font-size:clamp(3.5rem,10vw,8rem); font-weight:800; line-height:.95;
    letter-spacing:-.03em; margin-bottom:1.5rem;
  }
  .hero-title-grad {
    background:linear-gradient(135deg,#fff 0%,#c4b5fd 35%,var(--p) 55%,var(--g) 80%,#fff 100%);
    background-size:200% 200%; animation:gradMove 5s ease infinite;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    animation:gradMove 5s ease infinite, textGlow 4s ease infinite;
  }
  @keyframes gradMove {
    0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%}
  }
  .hero-sub {
    font-size:clamp(1rem,2vw,1.2rem); color:#9ca3af; max-width:520px; margin:0 auto 2.5rem;
    line-height:1.7; font-weight:300;
  }
  .hero-ctas { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; }

  /* ── Buttons ── */
  .btn-primary {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.85rem 2rem; background:var(--p); color:#fff;
    font-family:'Space Grotesk',sans-serif; font-size:.92rem; font-weight:700;
    border:none; border-radius:12px; cursor:pointer; text-decoration:none;
    transition:all .25s; position:relative; overflow:hidden;
    box-shadow:0 0 0 0 transparent;
  }
  .btn-primary::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg,transparent 0%,rgba(255,255,255,.1) 100%);
    opacity:0; transition:opacity .2s;
  }
  .btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 30px var(--p-glow), 0 0 0 1px var(--p); }
  .btn-primary:hover::before { opacity:1; }

  .btn-glass {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.85rem 2rem; background:var(--surface2); color:#fff;
    font-family:'Space Grotesk',sans-serif; font-size:.92rem; font-weight:600;
    border:1px solid var(--border-bright); border-radius:12px; cursor:pointer; text-decoration:none;
    transition:all .25s; backdrop-filter:blur(10px);
  }
  .btn-glass:hover { border-color:rgba(255,255,255,.3); background:rgba(255,255,255,.08); transform:translateY(-2px); }

  /* ── Stats ── */
  .stats-section { padding:2rem 0 5rem; }
  .stats-grid {
    display:grid; grid-template-columns:repeat(3,1fr); gap:1px;
    background:var(--border); border-radius:20px; overflow:hidden;
    border:1px solid var(--border);
    animation:fadeUp .6s .2s ease both; opacity:0; animation-fill-mode:forwards;
  }
  .stat-box {
    background:#050508; padding:2rem 1.5rem; text-align:center;
    position:relative; overflow:hidden; transition:background .2s;
  }
  .stat-box:hover { background:rgba(122,87,233,.05); }
  .stat-box::after {
    content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,var(--p),transparent);
    animation:borderGlow 3s ease-in-out infinite;
  }
  .stat-val {
    font-family:'Space Grotesk',sans-serif; font-size:3rem; font-weight:800;
    line-height:1; margin-bottom:.4rem;
    background:linear-gradient(135deg,#fff,var(--p2));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .stat-lbl { font-size:.72rem; color:var(--muted); letter-spacing:.12em; text-transform:uppercase; font-weight:500; }
  @media(max-width:540px){ .stats-grid{grid-template-columns:1fr} .stat-val{font-size:2.2rem} }

  /* ── Section ── */
  .section { padding:5rem 0; }
  .section-eyebrow {
    font-family:'Space Grotesk',sans-serif; font-size:.72rem; font-weight:700;
    letter-spacing:.2em; text-transform:uppercase; margin-bottom:1rem;
    background:linear-gradient(135deg,var(--p),var(--g));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    display:inline-block;
  }
  .section-title {
    font-family:'Space Grotesk',sans-serif; font-size:clamp(1.75rem,4vw,2.5rem);
    font-weight:800; letter-spacing:-.03em; margin-bottom:.75rem;
  }
  .section-sub { font-size:1rem; color:#9ca3af; max-width:480px; line-height:1.7; }

  /* ── Steps ── */
  .steps { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:1.5rem; margin-top:3rem; }
  .step-card {
    background:var(--surface); backdrop-filter:blur(20px);
    border:1px solid var(--border); border-radius:20px; padding:2rem;
    transition:all .3s; position:relative; overflow:hidden; animation:float 6s ease-in-out infinite;
  }
  .step-card:nth-child(2) { animation-delay:-.8s; }
  .step-card:nth-child(3) { animation-delay:-1.6s; }
  .step-card::before {
    content:''; position:absolute; inset:0; border-radius:20px;
    background:linear-gradient(135deg,var(--p-glow),transparent,var(--g-glow));
    opacity:0; transition:opacity .3s;
  }
  .step-card:hover { border-color:rgba(122,87,233,.4); transform:translateY(-6px) !important; box-shadow:0 20px 50px rgba(0,0,0,.5), 0 0 30px var(--p-glow); }
  .step-card:hover::before { opacity:1; }
  .step-num {
    width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg,var(--p),var(--p2)); color:#fff;
    font-family:'Space Grotesk',sans-serif; font-size:.9rem; font-weight:800; margin-bottom:1.25rem;
    position:relative; z-index:1; box-shadow:0 4px 15px var(--p-glow);
  }
  .step-title { font-family:'Space Grotesk',sans-serif; font-size:1.05rem; font-weight:700; color:#fff; margin-bottom:.5rem; position:relative; z-index:1; }
  .step-desc { font-size:.85rem; color:#9ca3af; line-height:1.7; position:relative; z-index:1; }

  /* ── Features ── */
  .features { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1.5rem; margin-top:3rem; }
  .feature-card {
    background:var(--surface); backdrop-filter:blur(20px);
    border:1px solid var(--border); border-radius:20px; padding:1.75rem;
    transition:all .3s; position:relative; overflow:hidden;
  }
  .feature-card:hover { border-color:rgba(140,233,164,.3); transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,.4), 0 0 20px var(--g-glow); }
  .feature-icon {
    width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center;
    background:var(--g-dim); border:1px solid var(--g-glow); font-size:1.2rem; margin-bottom:1.1rem;
  }
  .feature-title { font-family:'Space Grotesk',sans-serif; font-size:.95rem; font-weight:700; color:#fff; margin-bottom:.4rem; }
  .feature-desc { font-size:.82rem; color:#6b7280; line-height:1.7; }

  /* ── Win section ── */
  .win-section {
    position:relative; margin:3rem 0; padding:4rem 2.5rem; border-radius:28px; overflow:hidden;
    background:linear-gradient(135deg,rgba(122,87,233,.08) 0%,rgba(0,0,0,.5) 50%,rgba(140,233,164,.06) 100%);
    border:1px solid rgba(122,87,233,.2);
    animation:fadeUp .6s .3s ease both; opacity:0; animation-fill-mode:forwards;
  }
  .win-section::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg,transparent 0%,rgba(122,87,233,.05) 100%);
  }
  .win-inner { position:relative; z-index:1; }
  .win-trophy { font-size:2.5rem; margin-bottom:1rem; animation:float 4s ease-in-out infinite; display:inline-block; }
  .win-title { font-family:'Space Grotesk',sans-serif; font-size:clamp(1.3rem,3vw,1.9rem); font-weight:800; color:#fff; margin-bottom:.75rem; letter-spacing:-.02em; }
  .win-sub { font-size:.9rem; color:#9ca3af; max-width:520px; margin:0 auto 2.5rem; line-height:1.7; }
  .win-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; text-align:left; }
  .win-card {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:14px;
    padding:1.25rem; transition:all .2s;
  }
  .win-card:hover { background:rgba(122,87,233,.08); border-color:rgba(122,87,233,.2); }
  .win-icon { font-size:1.3rem; margin-bottom:.6rem; }
  .win-card-title { font-family:'Space Grotesk',sans-serif; font-size:.88rem; font-weight:700; color:#fff; margin-bottom:.3rem; }
  .win-card-desc { font-size:.78rem; color:#6b7280; line-height:1.6; }

  /* ── Events ── */
  .events-list { display:flex; flex-direction:column; gap:.75rem; margin-top:1.5rem; }
  .event-row {
    background:var(--surface); backdrop-filter:blur(10px);
    border:1px solid var(--border); border-radius:14px;
    padding:1rem 1.25rem; display:flex; align-items:center;
    justify-content:space-between; gap:1rem; flex-wrap:wrap; transition:all .2s;
  }
  .event-row:hover { border-color:rgba(122,87,233,.3); background:rgba(122,87,233,.04); }
  .event-name { font-family:'Space Grotesk',sans-serif; font-size:.9rem; font-weight:600; color:#fff; }
  .event-detail { font-size:.75rem; color:var(--muted); margin-top:.15rem; }
  .badge-live {
    display:inline-flex; align-items:center; gap:.35rem;
    font-size:.7rem; font-weight:600; color:var(--g);
    background:var(--g-dim); border:1px solid var(--g-glow); padding:.25rem .8rem; border-radius:100px;
  }
  .badge-live::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--g); animation:pulse 2s infinite; flex-shrink:0; }
  .badge-upcoming { font-size:.7rem; font-weight:500; color:#fbbf24; background:#fbbf2410; border:1px solid #fbbf2435; padding:.25rem .8rem; border-radius:100px; }
  .badge-ended { font-size:.7rem; color:#374151; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.05); padding:.25rem .8rem; border-radius:100px; }

  /* ── Footer ── */
  .footer { border-top:1px solid var(--border); padding:3rem 0; margin-top:2rem; position:relative; z-index:1; }
  .footer-inner { max-width:1100px; margin:0 auto; padding:0 1.5rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1.5rem; }
  .footer-brand { font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:800; }
  .footer-brand span {
    background:linear-gradient(135deg,var(--p2),var(--g));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .footer-links { display:flex; gap:1.5rem; flex-wrap:wrap; }
  .footer-link { font-size:.8rem; color:var(--muted); text-decoration:none; transition:color .2s; }
  .footer-link:hover { color:#fff; }

  /* ── Wallet ── */
  .wallet-adapter-button {
    background:var(--p) !important; color:#fff !important;
    font-family:'Space Grotesk',sans-serif !important; font-size:.8rem !important;
    font-weight:700 !important; border-radius:10px !important;
    padding:.45rem 1.1rem !important; height:auto !important; border:none !important;
    transition:all .2s !important; letter-spacing:.02em !important;
  }
  .wallet-adapter-button:hover { background:#8B6EF0 !important; box-shadow:0 4px 15px var(--p-glow) !important; }
  .wallet-adapter-button-trigger { background:var(--p) !important; }

  /* Scan line */
  .scan-line {
    position:fixed; top:0; left:0; right:0; height:1px; z-index:50; pointer-events:none;
    background:linear-gradient(90deg,transparent 0%,var(--p) 40%,var(--g) 60%,transparent 100%);
    opacity:.3; animation:scanLine 15s linear infinite;
  }
`;

const PROGRAM_ID_STR    = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "";
const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

interface OnChainEvent { title:string; location:string; country:string; status:string; attendeeCount:number; capacity:number; eventCode:string; }

function StatBox({ target, label, loaded }: { target:number; label:string; loaded:boolean }) {
  const val = useCounter(loaded ? target : 0);
  return (
    <div className="stat-box">
      {!loaded
        ? <div style={{ height:"3rem", borderRadius:8, background:"linear-gradient(90deg,#1a1a2e 25%,#2d2d4e 50%,#1a1a2e 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite", marginBottom:".4rem" }} />
        : <div className="stat-val">{val}</div>
      }
      <div className="stat-lbl">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const { connection } = useConnection();
  const [events,      setEvents]      = useState<OnChainEvent[]>([]);
  const [stats,       setStats]       = useState({ events:0, members:0, checkins:0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/stats");
        if (r.ok) {
          const d = await r.json();
          setStats({ events:d.events??0, members:d.members??0, checkins:d.checkins??0 });
          setEvents((d.recentEvents??[]).slice(0,4));
          setStatsLoaded(true); return;
        }
      } catch {}
      if (!COMMUNITY_PDA_STR) { setStatsLoaded(true); return; }
      try {
        const [{ default:idl },{ AnchorProvider },{ StrataClient, findEventPDA, parseEventStatus }] = await Promise.all([
          import("../idl/strata.json"), import("@coral-xyz/anchor"), import("../utils/strata-client"),
        ]);
        const dummy = { publicKey:PublicKey.default, signTransaction:async(t:any)=>t, signAllTransactions:async(ts:any[])=>ts };
        const provider = new AnchorProvider(connection, dummy as any, { commitment:"confirmed" });
        const client = new StrataClient(provider, idl);
        const community = new PublicKey(COMMUNITY_PDA_STR);
        const commAcc = await client.getCommunity(community);
        const count = commAcc.eventCount.toNumber();
        const loaded:OnChainEvent[] = []; let checkins = 0;
        for (let i=0;i<count;i++) {
          const [ePDA] = findEventPDA(community,i);
          try {
            const acc = await client.getEvent(ePDA); checkins += acc.attendeeCount.toNumber();
            loaded.push({ title:acc.title,location:acc.location,country:acc.country,status:parseEventStatus(acc.status),attendeeCount:acc.attendeeCount.toNumber(),capacity:acc.capacity.toNumber(),eventCode:acc.eventCode });
          } catch {}
        }
        setEvents(loaded.reverse().slice(0,4));
        setStats({ events:count, members:commAcc.memberCount.toNumber(), checkins });
      } catch {}
      setStatsLoaded(true);
    }
    load();
  }, [connection]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
      <div className="grid-bg" />
      <div className="scan-line" />
      <Particles />

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-brand"><img src="/Strata-logo.svg" alt="STRATA" /></a>
          <div className="nav-links">
            <a href="/" className="nav-link active">Home</a>
            <a href="/organizer" className="nav-link">Organizer</a>
            <a href="/profile" className="nav-link">Profile</a>
            <WalletMultiButton />
          </div>
        </div>
      </nav>

      <div className="page">
        {/* Hero */}
        <div className="hero">
          <div className="hero-inner">
            <div className="hero-badge">
              <span className="badge-dot" /> Built for Colosseum Hackathon · Solana Devnet
            </div>
            <h1 className="hero-title">
              <span className="hero-title-grad">Proof of<br />Presence.</span>
            </h1>
            <p className="hero-sub">
              Every event. Every check-in. Permanently on-chain.<br />
              Scan a QR with Phantom — mint your NFT in one tap.
            </p>
            <div className="hero-ctas">
              <a href="/organizer" className="btn-primary">⬡ &nbsp;Host an Event</a>
              <a href="/profile"   className="btn-glass">My Profile →</a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="container stats-section">
          <div className="stats-grid">
            <StatBox target={stats.events}   label="Events On-Chain" loaded={statsLoaded} />
            <StatBox target={stats.members}  label="Registered Members" loaded={statsLoaded} />
            <StatBox target={stats.checkins} label="Proof-of-Presence" loaded={statsLoaded} />
          </div>
        </div>

        {/* Why we win */}
        <div className="container">
          <div className="win-section">
            <div className="win-inner" style={{ textAlign:"center" }}>
              <div className="win-trophy">🏆</div>
              <h2 className="win-title">Built to win at Colosseum</h2>
              <p className="win-sub">Real product. Real Solana transactions. Not a mock-up.</p>
              <div className="win-grid">
                {[
                  { icon:"⛓", t:"Fully On-Chain",    d:"Every check-in is a real Solana transaction. Zero off-chain trust. Tamper-proof forever." },
                  { icon:"⬡", t:"Solana Blinks",     d:"QR codes are native Solana Actions. Phantom opens them as one-tap transactions." },
                  { icon:"◎", t:"Metaplex NFTs",     d:"Real NFTs minted server-side with edition numbers and on-chain metadata." },
                  { icon:"✦", t:"6-Tier Reputation", d:"Initiate → Legend. Your on-chain attendance history builds your identity." },
                ].map(p=>(
                  <div className="win-card" key={p.t}>
                    <div className="win-icon">{p.icon}</div>
                    <div className="win-card-title">{p.t}</div>
                    <div className="win-card-desc">{p.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="container section">
          <div className="section-eyebrow">How it works</div>
          <h2 className="section-title">Three steps. Fully on-chain.</h2>
          <p className="section-sub">No app download. No centralized backend. No trust required.</p>
          <div className="steps">
            {[
              { n:"01", t:"Host an Event",    d:"Deploy your event on Solana with a unique code. One transaction — permanent on-chain record." },
              { n:"02", t:"Scan & Check In",  d:"Attendees scan your QR or visit /checkin. One tap builds, signs, and confirms on Solana." },
              { n:"03", t:"Claim Your NFT",   d:"Every check-in unlocks a Metaplex NFT. Permanent proof of presence, forever in your wallet." },
            ].map(s=>(
              <div className="step-card" key={s.n}>
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.t}</div>
                <div className="step-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="container" style={{ paddingBottom:"5rem" }}>
          <div className="section-eyebrow">Protocol Stack</div>
          <h2 className="section-title">Built on Solana.</h2>
          <div className="features">
            {[
              { icon:"⛓", t:"100% On-Chain",    d:"Every attendance record is a Solana transaction. No server, no database, no trust." },
              { icon:"◎", t:"Metaplex NFTs",    d:"Real NFTs with event metadata, edition numbers, and on-chain provenance." },
              { icon:"✦", t:"Reputation Layer", d:"6-tier on-chain reputation. Every check-in compounds your standing." },
              { icon:"⬡", t:"Solana Blinks",    d:"QR codes are Solana Actions — Phantom opens them natively as transactions." },
            ].map(f=>(
              <div className="feature-card" key={f.t}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.t}</div>
                <div className="feature-desc">{f.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live events */}
        {events.length > 0 && (
          <div className="container" style={{ paddingBottom:"5rem" }}>
            <div className="section-eyebrow">On-Chain Now</div>
            <h2 className="section-title">Recent events.</h2>
            <div className="events-list">
              {events.map((ev,i)=>(
                <div className="event-row" key={i}>
                  <div>
                    <div className="event-name">{ev.title}</div>
                    <div className="event-detail">{ev.location}, {ev.country} · {ev.attendeeCount}/{ev.capacity} · #{ev.eventCode}</div>
                  </div>
                  {ev.status==="Live"     && <span className="badge-live">LIVE</span>}
                  {ev.status==="Upcoming" && <span className="badge-upcoming">UPCOMING</span>}
                  {ev.status==="Ended"    && <span className="badge-ended">ENDED</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="footer-brand">STR<span>ATA</span></div>
            <div style={{ fontSize:".72rem", color:"#374151", marginTop:".25rem" }}>Proof of Presence Protocol · Solana Devnet</div>
          </div>
          <div className="footer-links">
            <a href="/organizer" className="footer-link">Organizer</a>
            <a href="/profile"   className="footer-link">Profile</a>
            {PROGRAM_ID_STR && <a href={`https://explorer.solana.com/address/${PROGRAM_ID_STR}?cluster=devnet`} target="_blank" rel="noreferrer" className="footer-link">Program ↗</a>}
            <a href="https://github.com/GeneralAcre/bangkok-node" target="_blank" rel="noreferrer" className="footer-link">GitHub ↗</a>
          </div>
        </div>
      </footer>
    </>
  );
}
