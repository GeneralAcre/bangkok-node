export const walletProfileCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Space+Mono&family=Inter:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#f4f7fb; color:#1b2d4b; font-family:'Inter',sans-serif; min-height:100vh; }
  :root {
    --g:#1b2d4b; --p:#4271bd; --p2:#4b88b4;
    --g-dim:rgba(27,45,75,.07); --p-dim:rgba(66,113,189,.10);
    --g-glow:rgba(27,45,75,.12); --p-glow:rgba(66,113,189,.22);
    --surface:rgba(66,113,189,.07); --surface2:rgba(66,113,189,.13);
    --border:rgba(66,113,189,.18); --border-bright:rgba(66,113,189,.38);
    --muted:#5d8ba2;
  }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes orb1    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(80px,-60px) scale(1.1)} 66%{transform:translate(-40px,40px) scale(.95)} }
  @keyframes orb2    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-60px,40px) scale(1.05)} 66%{transform:translate(60px,-30px) scale(.9)} }
  @keyframes scanLine{ 0%{top:-2px} 100%{top:100vh} }

  .orb { position:fixed; border-radius:50%; filter:blur(110px); pointer-events:none; z-index:0; }
  .orb1 { width:700px; height:700px; background:#93b8d2; opacity:.28; top:-200px; left:-150px; animation:orb1 25s ease-in-out infinite; }
  .orb2 { width:600px; height:600px; background:#b4c6e4; opacity:.22; bottom:-150px; right:-100px; animation:orb2 30s ease-in-out infinite; }
  .grid-bg {
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:linear-gradient(rgba(66,113,189,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(66,113,189,.05) 1px,transparent 1px);
    background-size:60px 60px;
    mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%);
  }
  .scan-line {
    position:fixed; top:0; left:0; right:0; height:1px; z-index:50; pointer-events:none;
    background:linear-gradient(90deg,transparent 0%,rgba(66,113,189,.45) 40%,rgba(27,45,75,.3) 60%,transparent 100%);
    opacity:.45; animation:scanLine 15s linear infinite;
  }

  .page { position:relative; z-index:1; max-width:860px; margin:0 auto; padding:100px 1.5rem 5rem; }

  .search-bar {
    display:flex; gap:.5rem; margin-bottom:2rem;
    background:rgba(255,255,255,.75); border:1px solid rgba(66,113,189,.2); border-radius:12px;
    padding:.4rem .4rem .4rem .9rem; align-items:center; backdrop-filter:blur(10px);
  }
  .search-bar input {
    flex:1; background:transparent; border:none; outline:none; color:#1b2d4b;
    font-family:'Inter',sans-serif; font-size:.85rem;
  }
  .search-bar input::placeholder { color:#5d8ba2; }
  .search-bar button {
    background:#4271bd; color:#fff; border:none; border-radius:8px; padding:.4rem .9rem;
    font-family:'Space Grotesk',sans-serif; font-size:.78rem; font-weight:600; cursor:pointer;
    white-space:nowrap; transition:background .15s;
  }
  .search-bar button:hover { background:#355b97; }

  .score-card {
    background:rgba(255,255,255,.75); border:1px solid rgba(66,113,189,.18); border-radius:20px;
    padding:2rem; margin-bottom:1.5rem; animation:fadeUp .5s ease both;
    display:flex; gap:1.5rem; align-items:center; flex-wrap:wrap;
    backdrop-filter:blur(12px); box-shadow:0 2px 12px rgba(66,113,189,.08);
  }
  .score-left { flex:1; min-width:200px; }
  .wallet-addr {
    font-family:'Space Mono',monospace; font-size:.75rem; color:#5d8ba2;
    margin-bottom:.5rem; word-break:break-all;
  }
  .score-num {
    font-family:'Space Grotesk',sans-serif; font-size:3.5rem; font-weight:800; line-height:1;
    background:linear-gradient(135deg,#1b2d4b,#4b88b4);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .score-label { font-size:.7rem; color:#5d8ba2; text-transform:uppercase; letter-spacing:.12em; margin-top:.25rem; }
  .score-right { display:flex; flex-direction:column; gap:.75rem; align-items:flex-start; }
  .tier-badge {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.45rem 1.1rem; border-radius:100px;
    font-family:'Space Grotesk',sans-serif; font-size:.82rem; font-weight:700;
    border:1px solid currentColor;
  }
  .score-stats { display:flex; gap:1.5rem; flex-wrap:wrap; }
  .score-stat { text-align:center; }
  .score-stat-val { font-family:'Space Grotesk',sans-serif; font-size:1.4rem; font-weight:700; color:#1b2d4b; }
  .score-stat-lbl { font-size:.65rem; color:#5d8ba2; text-transform:uppercase; letter-spacing:.1em; }
  .copy-btn {
    background:rgba(66,113,189,.08); border:1px solid rgba(66,113,189,.2); color:rgba(27,45,75,.6);
    font-family:'Space Grotesk',sans-serif; font-size:.72rem; font-weight:600;
    padding:.3rem .75rem; border-radius:8px; cursor:pointer; transition:all .15s; white-space:nowrap;
  }
  .copy-btn:hover { border-color:rgba(66,113,189,.4); color:#1b2d4b; }
  .copy-btn.copied { border-color:rgba(66,113,189,.5); color:#4271bd; }

  .section-title { font-family:'Space Grotesk',sans-serif; font-size:1.05rem; font-weight:700; color:#1b2d4b; margin-bottom:1rem; }

  .event-list { display:flex; flex-direction:column; gap:.6rem; }
  .event-row {
    background:rgba(255,255,255,.7); border:1px solid rgba(66,113,189,.16); border-radius:14px;
    padding:.9rem 1.1rem; display:flex; align-items:center; justify-content:space-between;
    gap:1rem; flex-wrap:wrap; transition:border-color .2s;
  }
  .event-row:hover { border-color:rgba(66,113,189,.32); }
  .event-name { font-family:'Space Grotesk',sans-serif; font-size:.88rem; font-weight:600; color:#1b2d4b; }
  .event-meta { font-size:.73rem; color:#5d8ba2; margin-top:.15rem; }
  .event-right { display:flex; gap:.5rem; align-items:center; flex-shrink:0; }
  .badge-nft {
    font-size:.65rem; font-weight:600; padding:.2rem .65rem; border-radius:100px;
    background:rgba(66,113,189,.1); border:1px solid rgba(66,113,189,.28); color:#4271bd;
  }
  .badge-unclaimed {
    font-size:.65rem; font-weight:600; padding:.2rem .65rem; border-radius:100px;
    background:rgba(66,113,189,.07); border:1px solid rgba(66,113,189,.22); color:#4b88b4;
    cursor:pointer;
  }
  .badge-unclaimed:hover { background:rgba(66,113,189,.15); }
  .badge-hackathon {
    font-size:.6rem; font-weight:600; padding:.15rem .55rem; border-radius:100px;
    background:rgba(124,58,237,.1); border:1px solid rgba(124,58,237,.25); color:#7c3aed;
  }

  .shimmer {
    background:linear-gradient(90deg,#e8eef8 25%,#cdd9ef 50%,#e8eef8 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:8px;
  }

  .empty-state { text-align:center; padding:3rem 1rem; color:#5d8ba2; font-size:.9rem; }

  .progress-bar-wrap {
    background:rgba(66,113,189,.1); border-radius:100px; height:6px;
    overflow:hidden; margin-top:.75rem; max-width:300px;
  }
  .progress-bar { height:100%; border-radius:100px; transition:width .8s ease; }

  .tier-next { font-size:.7rem; color:#5d8ba2; margin-top:.3rem; }

  @media(max-width:600px) { .score-num { font-size:2.5rem; } .score-card { flex-direction:column; } }
`;
