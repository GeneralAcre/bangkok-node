export const credentialCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#0a0a0a; color:#e8e8e8; font-family:'Space Grotesk',sans-serif; min-height:100vh; }

  :root {
    --teal:#00FFC2;
    --teal-dim:rgba(0,255,194,.10);
    --teal-glow:rgba(0,255,194,.22);
    --border:rgba(255,255,255,.08);
    --surface:#111111;
    --muted:#888;
  }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes orb1     { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.08)} 66%{transform:translate(-30px,30px) scale(.95)} }
  @keyframes orb2     { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,40px) scale(1.05)} 66%{transform:translate(40px,-30px) scale(.97)} }
  @keyframes scanline { 0%{top:-4px} 100%{top:100vh} }

  .orb-wrap { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
  .orb { position:absolute; border-radius:50%; filter:blur(90px); }
  .orb1 { width:500px; height:500px; background:#0d1a3d; opacity:.7; top:-150px; left:-100px; animation:orb1 20s ease-in-out infinite; }
  .orb2 { width:400px; height:400px; background:#1a1040; opacity:.6; bottom:-100px; right:-50px; animation:orb2 25s ease-in-out infinite; }
  .orb3 { width:300px; height:300px; background:#0a2820; opacity:.35; top:40%; left:60%; animation:orb1 30s ease-in-out infinite reverse; }
  .grid-bg {
    position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image: linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);
    background-size:60px 60px;
  }
  .scanline {
    position:fixed; top:0; left:0; right:0; height:2px; z-index:999; pointer-events:none;
    background:linear-gradient(transparent,rgba(0,255,194,.12),transparent);
    animation:scanline 10s linear infinite;
  }

  .page { max-width:800px; margin:0 auto; padding:6rem 1.5rem 4rem; position:relative; z-index:1; }
  @media(max-width:768px){ .page{ padding:5rem 1rem 3rem; } }

  /* ── Page header ── */
  .cred-eyebrow {
    font-family:'Orbitron',sans-serif; font-size:.6rem; font-weight:700;
    letter-spacing:.2em; text-transform:uppercase; color:var(--teal);
    margin-bottom:.5rem; display:inline-block;
  }
  .cred-title {
    font-family:'Orbitron',sans-serif; font-size:clamp(1.4rem,3vw,2.2rem);
    font-weight:800; margin-bottom:.35rem; color:#fff; letter-spacing:.06em;
  }
  .cred-subtitle { font-size:.88rem; color:var(--muted); margin-bottom:2rem; }

  /* ── Query bar ── */
  .query-section { margin-bottom:1.75rem; animation:fadeUp .4s ease both; }
  .query-label {
    font-size:.6rem; letter-spacing:.14em; color:var(--muted);
    text-transform:uppercase; margin-bottom:.5rem;
    font-family:'Orbitron',sans-serif; font-weight:700;
  }
  .query-bar {
    display:flex; gap:.5rem; align-items:stretch;
    background:rgba(255,255,255,.04); border:1px solid var(--border);
    border-radius:10px; padding:.4rem .4rem .4rem .9rem; transition:border-color .2s;
  }
  .query-bar:focus-within { border-color:var(--teal); box-shadow:0 0 0 3px var(--teal-dim); }
  .query-input {
    flex:1; background:transparent; border:none; outline:none;
    font-family:'Space Mono',monospace; font-size:.82rem; color:#e8e8e8; caret-color:var(--teal);
  }
  .query-input::placeholder { color:rgba(255,255,255,.25); }
  @media(max-width:768px){ .query-input{ font-size:1rem; } }
  .query-btn {
    padding:.5rem 1.2rem; background:var(--teal); border:none; border-radius:8px;
    font-family:'Orbitron',sans-serif; font-size:.7rem; font-weight:700;
    color:#0a0a0a; cursor:pointer; transition:all .15s;
    white-space:nowrap; letter-spacing:.06em; text-transform:uppercase;
  }
  .query-btn:hover { opacity:.85; transform:translateY(-1px); }
  .query-btn:disabled { background:rgba(255,255,255,.2); color:rgba(255,255,255,.3); cursor:not-allowed; transform:none; }
  .demo-wallets { display:flex; gap:.4rem; flex-wrap:wrap; margin-top:.6rem; align-items:center; }
  .demo-label { font-size:.68rem; color:var(--muted); }
  .demo-pill {
    font-size:.62rem; padding:.2rem .65rem; border:1px solid var(--border);
    border-radius:100px; background:rgba(255,255,255,.04); color:var(--muted);
    cursor:pointer; font-family:'Orbitron',sans-serif; font-weight:600;
    transition:all .15s; white-space:nowrap; text-transform:uppercase; letter-spacing:.04em;
  }
  .demo-pill:hover { border-color:var(--teal); color:var(--teal); background:var(--teal-dim); }

  /* ── Stats bar ── */
  .stats-bar {
    display:grid; grid-template-columns:repeat(4,1fr); gap:.75rem;
    margin-bottom:2rem; animation:fadeUp .4s ease both;
  }
  @media(max-width:640px){ .stats-bar{ grid-template-columns:repeat(2,1fr); } }

  .stat-card {
    background:var(--surface); border:1px solid var(--border); border-radius:16px;
    padding:1.2rem 1rem 1.1rem; display:flex; flex-direction:column; gap:.35rem;
    transition:border-color .2s;
  }
  .stat-card:hover { border-color:rgba(0,255,194,.18); }
  .stat-card-label {
    font-family:'Orbitron',sans-serif; font-size:.55rem; font-weight:700;
    letter-spacing:.16em; text-transform:uppercase; color:var(--muted); margin-bottom:.15rem;
  }
  .stat-card-value {
    font-family:'Space Mono',monospace; font-size:clamp(1.5rem,3vw,1.9rem);
    font-weight:700; color:var(--teal); line-height:1.05; letter-spacing:-.01em;
  }
  .stat-card-sub { font-size:.7rem; color:var(--muted); }

  /* Level card */
  .level-icon { font-size:1.4rem; line-height:1; margin-bottom:.05rem; }
  .level-name {
    font-family:'Orbitron',sans-serif; font-size:.7rem; font-weight:700;
    text-transform:uppercase; letter-spacing:.1em;
  }
  .level-num {
    font-family:'Space Mono',monospace; font-size:.65rem; color:var(--muted);
    margin-bottom:.1rem;
  }
  .xp-bar-wrap { background:rgba(255,255,255,.08); border-radius:100px; height:4px; overflow:hidden; }
  .xp-bar { height:100%; border-radius:100px; background:var(--teal); transition:width .9s ease; }
  .xp-next { font-size:.6rem; color:var(--muted); }

  /* ── Section headers ── */
  .section-head {
    font-family:'Orbitron',sans-serif; font-size:.7rem; font-weight:700;
    letter-spacing:.14em; text-transform:uppercase; color:#e8e8e8;
    margin-bottom:.9rem; display:flex; align-items:center; gap:.6rem;
  }
  .section-count {
    font-family:'Space Mono',monospace; font-size:.62rem; color:var(--muted);
    background:rgba(255,255,255,.06); border:1px solid var(--border);
    padding:.1rem .5rem; border-radius:100px;
  }

  /* ── Event list ── */
  .event-list { display:flex; flex-direction:column; gap:.5rem; margin-bottom:2rem; }
  .event-row {
    background:var(--surface); border:1px solid var(--border); border-radius:12px;
    padding:.85rem 1rem; display:flex; align-items:center; justify-content:space-between;
    gap:1rem; flex-wrap:wrap; transition:border-color .2s;
  }
  .event-row:hover { border-color:rgba(0,255,194,.14); }
  .event-name { font-size:.88rem; font-weight:600; color:#e8e8e8; }
  .event-meta { font-size:.7rem; color:var(--muted); margin-top:.15rem; }
  .event-pts {
    font-family:'Space Mono',monospace; font-size:.7rem; font-weight:700;
    color:var(--teal); background:var(--teal-dim); border:1px solid var(--teal-glow);
    padding:.18rem .6rem; border-radius:100px; white-space:nowrap; flex-shrink:0;
  }
  .badge-hackathon {
    font-size:.58rem; font-weight:700; padding:.14rem .5rem; border-radius:100px;
    background:rgba(167,139,250,.1); border:1px solid rgba(167,139,250,.25); color:#a78bfa;
    text-transform:uppercase; letter-spacing:.06em; flex-shrink:0;
  }

  /* ── Achievement grid ── */
  .ach-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:.75rem; margin-bottom:2rem; }
  @media(max-width:500px){ .ach-grid{ grid-template-columns:1fr; } }
  .ach-card {
    background:var(--surface); border:1px solid var(--border); border-radius:12px;
    padding:1rem 1.1rem; display:flex; flex-direction:column; gap:.35rem;
    transition:border-color .2s;
  }
  .ach-card:hover { border-color:rgba(0,255,194,.18); }
  .ach-verified {
    font-family:'Orbitron',sans-serif; font-size:.52rem; font-weight:700;
    letter-spacing:.12em; text-transform:uppercase; color:rgba(0,255,194,.5);
  }
  .ach-name { font-size:.88rem; font-weight:600; color:#e8e8e8; }
  .ach-rank { font-family:'Space Mono',monospace; font-size:.75rem; color:var(--teal); }
  .ach-pts {
    font-family:'Space Mono',monospace; font-size:.7rem; font-weight:700;
    color:var(--teal); background:var(--teal-dim); border:1px solid var(--teal-glow);
    padding:.18rem .6rem; border-radius:100px; align-self:flex-start; margin-top:.1rem;
  }

  /* ── Shimmer ── */
  .shimmer {
    background:linear-gradient(90deg,#151515 25%,#1e1e1e 50%,#151515 75%);
    background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px;
  }

  /* ── Misc ── */
  .error-box {
    padding:.85rem 1.1rem; border:1px solid rgba(220,38,38,.3); border-radius:10px;
    font-size:.85rem; color:#f87171; background:rgba(220,38,38,.1); margin-bottom:1rem;
  }
  .cred-empty { text-align:center; padding:4rem 1rem; font-size:.85rem; color:var(--muted); }
  .empty-small { color:var(--muted); font-size:.8rem; text-align:center; padding:1.25rem 0; }

  /* ── Claim section ── */
  .claim-section { margin-top:2.5rem; border-top:1px solid var(--border); padding-top:2rem; }
  .claim-head { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:.75rem; }
  .claim-eyebrow {
    font-family:'Orbitron',sans-serif; font-size:.55rem; font-weight:700;
    letter-spacing:.14em; text-transform:uppercase; color:var(--muted); margin-bottom:.2rem;
  }
  .claim-title { font-size:1rem; font-weight:700; color:#e8e8e8; }
`;
