export const leaderboardCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Epilogue:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#0a0a0a; color:#e8e8e8; font-family:'DM Sans',sans-serif; min-height:100vh; }
  :root {
    --border:rgba(255,255,255,.08); --border-bright:rgba(255,255,255,.16);
    --surface:rgba(255,255,255,.04); --surface2:rgba(255,255,255,.07);
    --muted:#888; --accent:#ffffff; --accent2:#e8e8e8;
  }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes orb1    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(80px,-60px) scale(1.1)} 66%{transform:translate(-40px,40px) scale(.95)} }
  @keyframes orb2    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-60px,40px) scale(1.05)} 66%{transform:translate(60px,-30px) scale(.9)} }
  @keyframes scanLine{ 0%{top:-2px} 100%{top:100vh} }
  @keyframes gradMove{ 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

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

  .page { position:relative; z-index:1; max-width:960px; margin:0 auto; padding:100px 1.5rem 5rem; }

  .page-header { margin-bottom:2rem; animation:fadeUp .5s ease both; }
  .eyebrow {
    font-family:'Epilogue',sans-serif; font-size:.68rem; font-weight:700;
    letter-spacing:.14em; text-transform:uppercase; margin-bottom:.75rem;
    color:#ffffff; display:inline-block;
  }
  .page-title {
    font-family:'Orbitron',sans-serif; font-size:clamp(1.3rem,3vw,2.2rem);
    font-weight:800; letter-spacing:.04em; margin-bottom:.5rem;
    background:linear-gradient(135deg,#ffffff 0%,#ffffff 60%,#e8e8e8 100%);
    background-size:200% 200%; -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text; animation:gradMove 5s ease infinite;
  }
  .page-sub { font-size:.92rem; color:#888; }

  .filters { display:flex; gap:.5rem; margin-bottom:1.5rem; flex-wrap:wrap; }
  .filter-btn {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); color:rgba(255,255,255,.4);
    font-family:'Epilogue',sans-serif; font-size:.72rem; font-weight:600;
    letter-spacing:.04em; text-transform:uppercase;
    padding:.35rem .9rem; border-radius:100px; cursor:pointer; transition:all .2s;
  }
  .filter-btn:hover { border-color:rgba(255,255,255,.18); color:#e8e8e8; }
  .filter-btn.active { background:rgba(255,255,255,.12); border-color:rgba(255,255,255,.35); color:#ffffff; }

  .lb-table { display:flex; flex-direction:column; gap:.5rem; }
  .lb-header {
    display:grid; grid-template-columns:48px 1fr auto auto auto;
    gap:.75rem; padding:.5rem 1.25rem; align-items:center;
    font-size:.68rem; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:.08em;
  }
  .lb-row {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:14px;
    display:grid; grid-template-columns:48px 1fr auto auto auto;
    gap:.75rem; padding:.9rem 1.25rem; align-items:center;
    transition:all .2s; text-decoration:none; color:#e8e8e8;
    animation:fadeUp .4s ease both; backdrop-filter:blur(10px);
    box-shadow:0 1px 6px rgba(0,0,0,.3);
  }
  .lb-row:hover { border-color:rgba(255,255,255,.2); background:rgba(255,255,255,.06); transform:translateX(2px); }
  .lb-row.is-me { border-color:rgba(255,255,255,.25); background:rgba(255,255,255,.07); }

  .rank-num { font-family:'Space Mono',monospace; font-size:.85rem; font-weight:700; text-align:center; color:#888; }
  .rank-1 { color:#f59e0b; }
  .rank-2 { color:#94a3b8; }
  .rank-3 { color:#cd7f32; }

  .wallet-col { min-width:0; }
  .wallet-str { font-family:'Space Mono',monospace; font-size:.78rem; color:#e8e8e8; }
  .you-badge { font-size:.62rem; font-weight:600; color:#ffffff; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.25); padding:.1rem .45rem; border-radius:100px; margin-left:.5rem; }

  .tier-badge {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.3rem .8rem; border-radius:100px;
    font-family:'Epilogue',sans-serif; font-size:.72rem; font-weight:700;
    border:1px solid currentColor; white-space:nowrap;
  }

  .score-col { font-family:'Epilogue',sans-serif; font-size:1rem; font-weight:800; text-align:right; white-space:nowrap; color:#e8e8e8; }
  .events-col { font-size:.75rem; color:#888; text-align:right; white-space:nowrap; }

  .shimmer {
    background:linear-gradient(90deg,#161616 25%,#202020 50%,#161616 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:8px;
  }

  .empty-state { text-align:center; padding:4rem 1rem; color:#888; }
  .empty-state h3 { font-family:'Epilogue',sans-serif; font-size:1.1rem; font-weight:700; color:#e8e8e8; margin-bottom:.5rem; }

  .updated-at { font-size:.65rem; color:#888; text-align:right; margin-top:1rem; }

  .rank-hex {
    width:38px; height:44px;
    clip-path:polygon(50% 0%,96% 25%,96% 75%,50% 100%,4% 75%,4% 25%);
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
    font-family:'Space Mono',monospace; font-size:.78rem; font-weight:700;
  }

  .lb-cards-grid {
    display:grid; grid-template-columns:repeat(3,1fr); gap:1.25rem;
    animation:fadeUp .4s ease both;
  }
  .lb-card {
    position:relative; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
    border-radius:20px; padding:1.5rem; text-decoration:none; color:#e8e8e8;
    transition:all .28s; display:flex; flex-direction:column; gap:.85rem;
    backdrop-filter:blur(14px); box-shadow:0 2px 14px rgba(0,0,0,.4);
    animation:fadeUp .4s ease both; overflow:hidden;
  }
  .lb-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:3px;
    background:rgba(255,255,255,.07); border-radius:20px 20px 0 0;
  }
  .lb-card[data-rank="1"]::before { background:linear-gradient(90deg,#f59e0b,#d97706); }
  .lb-card[data-rank="2"]::before { background:linear-gradient(90deg,#94a3b8,#64748b); }
  .lb-card[data-rank="3"]::before { background:linear-gradient(90deg,#cd7f32,#a0522d); }
  .lb-card:hover {
    border-color:rgba(255,255,255,.2); background:rgba(255,255,255,.06);
    transform:translateY(-5px); box-shadow:0 16px 36px rgba(255,255,255,.12);
  }
  .lb-card.is-me { border-color:rgba(255,255,255,.25); background:rgba(255,255,255,.07); }

  .lb-card-rank { position:absolute; top:1.1rem; right:1.1rem; }

  .lb-card-header { display:flex; align-items:center; gap:.8rem; padding-right:3.25rem; }
  .lb-avatar {
    width:48px; height:48px; border-radius:50%; flex-shrink:0;
    background:linear-gradient(135deg,rgba(255,255,255,.15),rgba(138,180,255,.25));
    border:2px solid rgba(255,255,255,.22);
    display:flex; align-items:center; justify-content:center;
    font-family:'Epilogue',sans-serif; font-size:1.1rem; font-weight:800; color:#ffffff;
  }
  .lb-card-identity { min-width:0; flex:1; }
  .lb-card-name {
    font-family:'Epilogue',sans-serif; font-size:.88rem; font-weight:700;
    color:#e8e8e8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    display:flex; align-items:center; gap:.4rem;
  }
  .lb-card-addr { font-family:'Space Mono',monospace; font-size:.63rem; color:#888; margin-top:.2rem; }

  .lb-score-num {
    font-family:'Epilogue',sans-serif; font-size:1.65rem; font-weight:900;
    line-height:1; letter-spacing:-.02em;
    background:linear-gradient(135deg,#e8e8e8 0%,#ffffff 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .lb-score-lbl { font-size:.62rem; color:#888; text-transform:uppercase; letter-spacing:.12em; margin-top:.2rem; }

  .lb-card-tags { display:flex; flex-wrap:wrap; gap:.35rem; }
  .lb-tag {
    display:inline-flex; align-items:center; gap:.3rem;
    font-family:'Epilogue',sans-serif; font-size:.68rem; font-weight:600;
    padding:.22rem .65rem; border-radius:100px;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:#888;
  }
  .lb-tag.tier-tag { border:1px solid currentColor; }

  .lb-card-stats {
    display:flex; align-items:center; gap:.65rem;
    padding-top:.85rem; border-top:1px solid rgba(255,255,255,.07); margin-top:auto;
  }
  .lb-stat { display:flex; flex-direction:column; gap:.1rem; }
  .lb-stat-val { font-family:'Epilogue',sans-serif; font-size:.78rem; font-weight:700; color:#e8e8e8; line-height:1; }
  .lb-stat-lbl { font-size:.58rem; color:#888; text-transform:uppercase; letter-spacing:.08em; }
  .lb-stat-divider { width:1px; height:22px; background:rgba(255,255,255,.08); flex-shrink:0; }

  @media(max-width:960px){ .lb-cards-grid{ grid-template-columns:1fr 1fr; } }
  @media(max-width:540px){ .lb-cards-grid{ grid-template-columns:1fr; } }

  .hof-grid {
    display:grid; grid-template-columns:repeat(3,1fr); gap:1rem;
    animation:fadeUp .4s ease both;
  }
  .hof-card {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:16px;
    padding:1.5rem 1.5rem 1.25rem; text-decoration:none; color:#e8e8e8;
    transition:all .2s; display:block; backdrop-filter:blur(10px);
    box-shadow:0 2px 10px rgba(0,0,0,.3); animation:fadeUp .4s ease both;
  }
  .hof-card:hover { border-color:rgba(255,255,255,.2); background:rgba(255,255,255,.06); transform:translateY(-3px); }
  .hof-card.is-me { border-color:rgba(255,255,255,.25); background:rgba(255,255,255,.07); }
  .hof-position { font-family:'Space Mono',monospace; font-size:1rem; font-weight:700; color:#888; margin-bottom:.6rem; }
  .hof-wallet { font-family:'Space Mono',monospace; font-size:.72rem; color:#888; margin-bottom:.75rem; }
  .hof-score { font-family:'Epilogue',sans-serif; font-size:1.5rem; font-weight:900; color:#e8e8e8; line-height:1; }
  .hof-score-lbl { font-size:.6rem; color:#888; text-transform:uppercase; letter-spacing:.12em; margin-top:.2rem; margin-bottom:.75rem; }
  .hof-tier {
    display:inline-flex; align-items:center; gap:.35rem;
    font-family:'Epilogue',sans-serif; font-size:.72rem; font-weight:700;
    padding:.25rem .75rem; border-radius:100px; border:1px solid currentColor;
  }
  .hof-events { font-size:.72rem; color:#888; margin-top:.5rem; }

  @media(max-width:760px){ .hof-grid { grid-template-columns:1fr 1fr; } }
  @media(max-width:480px){ .hof-grid { grid-template-columns:1fr; } }

  @media(max-width:600px){
    .lb-header, .lb-row { grid-template-columns:36px 1fr auto auto; }
    .lb-header > :last-child, .lb-row > :last-child { display:none; }
  }
`;