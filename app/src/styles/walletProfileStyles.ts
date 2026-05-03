export const walletProfileCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#0a0a0a; color:#e8e8e8; font-family:'DM Sans',sans-serif; min-height:100vh; }
  :root {
    --border:rgba(255,255,255,.08); --border-bright:rgba(255,255,255,.16);
    --surface:rgba(255,255,255,.04); --muted:#888; --accent:#ffffff; --accent2:#e8e8e8;
  }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes orb1    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(80px,-60px) scale(1.1)} 66%{transform:translate(-40px,40px) scale(.95)} }
  @keyframes orb2    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-60px,40px) scale(1.05)} 66%{transform:translate(60px,-30px) scale(.9)} }
  @keyframes scanLine{ 0%{top:-2px} 100%{top:100vh} }

  .orb { position:fixed; border-radius:50%; filter:blur(120px); pointer-events:none; z-index:0; }
  .orb1 { width:700px; height:700px; background:#0d1a3d; opacity:.7; top:-200px; left:-150px; animation:orb1 25s ease-in-out infinite; }
  .orb2 { width:600px; height:600px; background:#1a1040; opacity:.6; bottom:-150px; right:-100px; animation:orb2 30s ease-in-out infinite; }
  .grid-bg {
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);
    background-size:60px 60px;
    mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%);
  }
  .scan-line {
    position:fixed; top:0; left:0; right:0; height:1px; z-index:50; pointer-events:none;
    background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.35) 40%,rgba(255,255,255,.2) 60%,transparent 100%);
    opacity:.45; animation:scanLine 15s linear infinite;
  }

  .page { position:relative; z-index:1; max-width:860px; margin:0 auto; padding:100px 1.5rem 5rem; }

  .search-bar {
    display:flex; gap:.5rem; margin-bottom:2rem;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:12px;
    padding:.4rem .4rem .4rem .9rem; align-items:center; backdrop-filter:blur(10px);
  }
  .search-bar input {
    flex:1; background:transparent; border:none; outline:none; color:#e8e8e8;
    font-family:'DM Sans',sans-serif; font-size:.88rem;
  }
  .search-bar input::placeholder { color:#888; }
  .search-bar button {
    background:#ffffff; color:#0a0a0a; border:none; border-radius:8px; padding:.4rem .9rem;
    font-family:'Epilogue',sans-serif; font-size:.8rem; font-weight:700; cursor:pointer;
    white-space:nowrap; transition:background .15s; text-transform:uppercase;
  }
  .search-bar button:hover { background:#e8e8e8; }

  .score-card {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:20px;
    padding:2rem; margin-bottom:1.5rem; animation:fadeUp .5s ease both;
    display:flex; gap:1.5rem; align-items:center; flex-wrap:wrap;
    backdrop-filter:blur(12px); box-shadow:0 2px 12px rgba(0,0,0,.3);
  }
  .score-left { flex:1; min-width:200px; }
  .wallet-addr {
    font-family:'Space Mono',monospace; font-size:.75rem; color:#888;
    margin-bottom:.5rem; word-break:break-all;
  }
  .score-num {
    font-family:'Epilogue',sans-serif; font-size:3.5rem; font-weight:900; line-height:1;
    background:linear-gradient(135deg,#e8e8e8,#ffffff);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .score-label { font-size:.72rem; color:#888; text-transform:uppercase; letter-spacing:.1em; margin-top:.25rem; }
  .score-right { display:flex; flex-direction:column; gap:.75rem; align-items:flex-start; }
  .tier-badge {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.45rem 1.1rem; border-radius:100px;
    font-family:'Epilogue',sans-serif; font-size:.85rem; font-weight:700;
    border:1px solid currentColor;
  }
  .score-stats { display:flex; gap:1.5rem; flex-wrap:wrap; }
  .score-stat { text-align:center; }
  .score-stat-val { font-family:'Epilogue',sans-serif; font-size:1.4rem; font-weight:800; color:#e8e8e8; }
  .score-stat-lbl { font-size:.67rem; color:#888; text-transform:uppercase; letter-spacing:.08em; }
  .copy-btn {
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.55);
    font-family:'Epilogue',sans-serif; font-size:.75rem; font-weight:600;
    padding:.3rem .75rem; border-radius:8px; cursor:pointer; transition:all .15s; white-space:nowrap;
  }
  .copy-btn:hover { border-color:rgba(255,255,255,.35); color:#e8e8e8; }
  .copy-btn.copied { border-color:rgba(255,255,255,.5); color:#ffffff; }

  .section-title { font-family:'Epilogue',sans-serif; font-size:1.05rem; font-weight:700; color:#e8e8e8; margin-bottom:1rem; }

  .event-list { display:flex; flex-direction:column; gap:.6rem; }
  .event-row {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:14px;
    padding:.9rem 1.1rem; display:flex; align-items:center; justify-content:space-between;
    gap:1rem; flex-wrap:wrap; transition:border-color .2s;
  }
  .event-row:hover { border-color:rgba(255,255,255,.18); }
  .event-name { font-family:'Epilogue',sans-serif; font-size:.9rem; font-weight:600; color:#e8e8e8; }
  .event-meta { font-size:.75rem; color:#888; margin-top:.15rem; }
  .event-right { display:flex; gap:.5rem; align-items:center; flex-shrink:0; }
  .badge-nft {
    font-size:.67rem; font-weight:600; padding:.2rem .65rem; border-radius:100px;
    background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.25); color:#ffffff;
  }
  .badge-unclaimed {
    font-size:.67rem; font-weight:600; padding:.2rem .65rem; border-radius:100px;
    background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.18); color:#e8e8e8;
    cursor:pointer;
  }
  .badge-unclaimed:hover { background:rgba(255,255,255,.15); }
  .badge-hackathon {
    font-size:.62rem; font-weight:600; padding:.15rem .55rem; border-radius:100px;
    background:rgba(167,139,250,.1); border:1px solid rgba(167,139,250,.2); color:#a78bfa;
  }

  .shimmer {
    background:linear-gradient(90deg,#161616 25%,#202020 50%,#161616 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:8px;
  }

  .empty-state { text-align:center; padding:3rem 1rem; color:#888; font-size:.92rem; }

  .progress-bar-wrap {
    background:rgba(255,255,255,.08); border-radius:100px; height:6px;
    overflow:hidden; margin-top:.75rem; max-width:300px;
  }
  .progress-bar { height:100%; border-radius:100px; transition:width .8s ease; }

  .tier-next { font-size:.72rem; color:#888; margin-top:.3rem; }

  @media(max-width:600px) { .score-num { font-size:2.5rem; } .score-card { flex-direction:column; } }
`;