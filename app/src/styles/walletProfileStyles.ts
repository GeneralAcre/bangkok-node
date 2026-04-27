export const walletProfileCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Space+Mono&family=Inter:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#1F2C35; color:#D1D8B4; font-family:'Inter',sans-serif; min-height:100vh; }
  :root {
    --g:#D1D8B4; --p:#5C7580; --p2:#879989;
    --g-dim:#D1D8B410; --p-dim:#5C758010;
    --g-glow:#D1D8B430; --p-glow:#5C758030;
    --surface:rgba(64,81,91,.2); --surface2:rgba(64,81,91,.3);
    --border:rgba(64,81,91,.5); --border-bright:rgba(92,117,128,.65);
    --muted:#879989;
  }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes orb1    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(80px,-60px) scale(1.1)} 66%{transform:translate(-40px,40px) scale(.95)} }
  @keyframes orb2    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-60px,40px) scale(1.05)} 66%{transform:translate(60px,-30px) scale(.9)} }
  @keyframes scanLine{ 0%{top:-2px} 100%{top:100vh} }

  .orb { position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; }
  .orb1 { width:700px; height:700px; background:#285B73; opacity:.18; top:-200px; left:-150px; animation:orb1 25s ease-in-out infinite; }
  .orb2 { width:600px; height:600px; background:#879989; opacity:.10; bottom:-150px; right:-100px; animation:orb2 30s ease-in-out infinite; }
  .grid-bg {
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
    background-size:60px 60px;
    mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%);
  }
  .scan-line {
    position:fixed; top:0; left:0; right:0; height:1px; z-index:50; pointer-events:none;
    background:linear-gradient(90deg,transparent 0%,var(--p) 40%,var(--g) 60%,transparent 100%);
    opacity:.3; animation:scanLine 15s linear infinite;
  }

  .page { position:relative; z-index:1; max-width:860px; margin:0 auto; padding:100px 1.5rem 5rem; }

  .search-bar {
    display:flex; gap:.5rem; margin-bottom:2rem;
    background:var(--surface); border:1px solid var(--border); border-radius:12px;
    padding:.4rem .4rem .4rem .9rem; align-items:center;
  }
  .search-bar input {
    flex:1; background:transparent; border:none; outline:none; color:#fff;
    font-family:'Inter',sans-serif; font-size:.85rem;
  }
  .search-bar input::placeholder { color:var(--muted); }
  .search-bar button {
    background:var(--p); color:#D1D8B4; border:none; border-radius:8px; padding:.4rem .9rem;
    font-family:'Space Grotesk',sans-serif; font-size:.78rem; font-weight:600; cursor:pointer;
    white-space:nowrap; transition:background .15s;
  }
  .search-bar button:hover { background:#6b8a99; }

  .score-card {
    background:var(--surface); border:1px solid var(--border); border-radius:20px;
    padding:2rem; margin-bottom:1.5rem; animation:fadeUp .5s ease both;
    display:flex; gap:1.5rem; align-items:center; flex-wrap:wrap;
  }
  .score-left { flex:1; min-width:200px; }
  .wallet-addr {
    font-family:'Space Mono',monospace; font-size:.75rem; color:var(--muted);
    margin-bottom:.5rem; word-break:break-all;
  }
  .score-num {
    font-family:'Space Grotesk',sans-serif; font-size:3.5rem; font-weight:800; line-height:1;
    background:linear-gradient(135deg,#fff,var(--p2));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .score-label { font-size:.7rem; color:var(--muted); text-transform:uppercase; letter-spacing:.12em; margin-top:.25rem; }
  .score-right { display:flex; flex-direction:column; gap:.75rem; align-items:flex-start; }
  .tier-badge {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.45rem 1.1rem; border-radius:100px;
    font-family:'Space Grotesk',sans-serif; font-size:.82rem; font-weight:700;
    border:1px solid currentColor;
  }
  .score-stats { display:flex; gap:1.5rem; flex-wrap:wrap; }
  .score-stat { text-align:center; }
  .score-stat-val { font-family:'Space Grotesk',sans-serif; font-size:1.4rem; font-weight:700; color:#fff; }
  .score-stat-lbl { font-size:.65rem; color:var(--muted); text-transform:uppercase; letter-spacing:.1em; }
  .copy-btn {
    background:var(--surface2); border:1px solid var(--border); color:rgba(255,255,255,.6);
    font-family:'Space Grotesk',sans-serif; font-size:.72rem; font-weight:600;
    padding:.3rem .75rem; border-radius:8px; cursor:pointer; transition:all .15s; white-space:nowrap;
  }
  .copy-btn:hover { border-color:rgba(255,255,255,.2); color:#fff; }
  .copy-btn.copied { border-color:var(--g); color:var(--g); }

  .section-title { font-family:'Space Grotesk',sans-serif; font-size:1.05rem; font-weight:700; color:#fff; margin-bottom:1rem; }

  .event-list { display:flex; flex-direction:column; gap:.6rem; }
  .event-row {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    padding:.9rem 1.1rem; display:flex; align-items:center; justify-content:space-between;
    gap:1rem; flex-wrap:wrap; transition:border-color .2s;
  }
  .event-row:hover { border-color:rgba(122,87,233,.25); }
  .event-name { font-family:'Space Grotesk',sans-serif; font-size:.88rem; font-weight:600; color:#fff; }
  .event-meta { font-size:.73rem; color:var(--muted); margin-top:.15rem; }
  .event-right { display:flex; gap:.5rem; align-items:center; flex-shrink:0; }
  .badge-nft {
    font-size:.65rem; font-weight:600; padding:.2rem .65rem; border-radius:100px;
    background:rgba(140,233,164,.12); border:1px solid rgba(140,233,164,.3); color:var(--g);
  }
  .badge-unclaimed {
    font-size:.65rem; font-weight:600; padding:.2rem .65rem; border-radius:100px;
    background:rgba(122,87,233,.1); border:1px solid rgba(122,87,233,.25); color:var(--p2);
    cursor:pointer;
  }
  .badge-unclaimed:hover { background:rgba(122,87,233,.2); }
  .badge-hackathon {
    font-size:.6rem; font-weight:600; padding:.15rem .55rem; border-radius:100px;
    background:rgba(168,85,247,.15); border:1px solid rgba(168,85,247,.3); color:#c084fc;
  }

  .shimmer {
    background:linear-gradient(90deg,#1a1a2e 25%,#2d2d4e 50%,#1a1a2e 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:8px;
  }

  .empty-state { text-align:center; padding:3rem 1rem; color:var(--muted); font-size:.9rem; }

  .progress-bar-wrap {
    background:rgba(255,255,255,.06); border-radius:100px; height:6px;
    overflow:hidden; margin-top:.75rem; max-width:300px;
  }
  .progress-bar { height:100%; border-radius:100px; transition:width .8s ease; }

  .tier-next { font-size:.7rem; color:var(--muted); margin-top:.3rem; }

  @media(max-width:600px) { .score-num { font-size:2.5rem; } .score-card { flex-direction:column; } }
`;
