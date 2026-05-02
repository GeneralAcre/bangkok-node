export const leaderboardCSS = `
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
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes orb1    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(80px,-60px) scale(1.1)} 66%{transform:translate(-40px,40px) scale(.95)} }
  @keyframes orb2    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-60px,40px) scale(1.05)} 66%{transform:translate(60px,-30px) scale(.9)} }
  @keyframes scanLine{ 0%{top:-2px} 100%{top:100vh} }
  @keyframes gradMove{ 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

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

  .page { position:relative; z-index:1; max-width:960px; margin:0 auto; padding:100px 1.5rem 5rem; }

  .page-header { margin-bottom:2rem; animation:fadeUp .5s ease both; }
  .eyebrow {
    font-family:'Space Grotesk',sans-serif; font-size:.72rem; font-weight:700;
    letter-spacing:.2em; text-transform:uppercase; margin-bottom:.75rem;
    background:linear-gradient(135deg,#4271bd,#4b88b4);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    display:inline-block;
  }
  .page-title {
    font-family:'Space Grotesk',sans-serif; font-size:clamp(1.8rem,4vw,2.8rem);
    font-weight:800; letter-spacing:-.03em; margin-bottom:.5rem;
    background:linear-gradient(135deg,#1b2d4b 0%,#4271bd 60%,#4b88b4 100%);
    background-size:200% 200%; -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text; animation:gradMove 5s ease infinite;
  }
  .page-sub { font-size:.9rem; color:#5d8ba2; }

  .filters { display:flex; gap:.5rem; margin-bottom:1.5rem; flex-wrap:wrap; }
  .filter-btn {
    background:rgba(255,255,255,.7); border:1px solid rgba(66,113,189,.2); color:rgba(27,45,75,.5);
    font-family:'Space Grotesk',sans-serif; font-size:.75rem; font-weight:600;
    padding:.35rem .9rem; border-radius:100px; cursor:pointer; transition:all .2s;
  }
  .filter-btn:hover { border-color:rgba(66,113,189,.4); color:#1b2d4b; }
  .filter-btn.active { background:rgba(66,113,189,.12); border-color:rgba(66,113,189,.45); color:#4271bd; }

  .lb-table { display:flex; flex-direction:column; gap:.5rem; }
  .lb-header {
    display:grid; grid-template-columns:48px 1fr auto auto auto;
    gap:.75rem; padding:.5rem 1.25rem; align-items:center;
    font-size:.65rem; font-weight:600; color:#5d8ba2; text-transform:uppercase; letter-spacing:.1em;
  }
  .lb-row {
    background:rgba(255,255,255,.75); border:1px solid rgba(66,113,189,.16); border-radius:14px;
    display:grid; grid-template-columns:48px 1fr auto auto auto;
    gap:.75rem; padding:.9rem 1.25rem; align-items:center;
    transition:all .2s; text-decoration:none; color:#1b2d4b;
    animation:fadeUp .4s ease both; backdrop-filter:blur(10px);
    box-shadow:0 1px 6px rgba(66,113,189,.06);
  }
  .lb-row:hover { border-color:rgba(66,113,189,.35); background:rgba(66,113,189,.07); transform:translateX(2px); }
  .lb-row.is-me { border-color:rgba(66,113,189,.35); background:rgba(66,113,189,.08); }

  .rank-num { font-family:'Space Mono',monospace; font-size:.85rem; font-weight:700; text-align:center; color:#5d8ba2; }
  .rank-1 { color:#b45309; }
  .rank-2 { color:#6b7280; }
  .rank-3 { color:#92400e; }

  .wallet-col { min-width:0; }
  .wallet-str { font-family:'Space Mono',monospace; font-size:.78rem; color:#1b2d4b; }
  .you-badge { font-size:.6rem; font-weight:600; color:#4271bd; background:rgba(66,113,189,.12); border:1px solid rgba(66,113,189,.3); padding:.1rem .45rem; border-radius:100px; margin-left:.5rem; }

  .tier-badge {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.3rem .8rem; border-radius:100px;
    font-family:'Space Grotesk',sans-serif; font-size:.7rem; font-weight:600;
    border:1px solid currentColor; white-space:nowrap;
  }

  .score-col { font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:700; text-align:right; white-space:nowrap; color:#1b2d4b; }
  .events-col { font-size:.75rem; color:#5d8ba2; text-align:right; white-space:nowrap; }

  .shimmer {
    background:linear-gradient(90deg,#e8eef8 25%,#cdd9ef 50%,#e8eef8 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:8px;
  }

  .empty-state { text-align:center; padding:4rem 1rem; color:#5d8ba2; }
  .empty-state h3 { font-family:'Space Grotesk',sans-serif; font-size:1.1rem; font-weight:700; color:#1b2d4b; margin-bottom:.5rem; }

  .updated-at { font-size:.65rem; color:#5d8ba2; text-align:right; margin-top:1rem; }

  /* ── Rank hexagon badge ── */
  .rank-hex {
    width:38px; height:44px;
    clip-path:polygon(50% 0%,96% 25%,96% 75%,50% 100%,4% 75%,4% 25%);
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
    font-family:'Space Mono',monospace; font-size:.78rem; font-weight:700;
  }

  /* ── Leaderboard card grid ── */
  .lb-cards-grid {
    display:grid; grid-template-columns:repeat(3,1fr); gap:1.25rem;
    animation:fadeUp .4s ease both;
  }
  .lb-card {
    position:relative; background:rgba(255,255,255,.85); border:1px solid rgba(66,113,189,.14);
    border-radius:20px; padding:1.5rem; text-decoration:none; color:#1b2d4b;
    transition:all .28s; display:flex; flex-direction:column; gap:.85rem;
    backdrop-filter:blur(14px); box-shadow:0 2px 14px rgba(66,113,189,.07);
    animation:fadeUp .4s ease both; overflow:hidden;
  }
  /* top accent strip */
  .lb-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:3px;
    background:rgba(66,113,189,.2); border-radius:20px 20px 0 0;
  }
  .lb-card[data-rank="1"]::before { background:linear-gradient(90deg,#f59e0b,#d97706); }
  .lb-card[data-rank="2"]::before { background:linear-gradient(90deg,#94a3b8,#64748b); }
  .lb-card[data-rank="3"]::before { background:linear-gradient(90deg,#cd7f32,#a0522d); }
  .lb-card:hover {
    border-color:rgba(66,113,189,.32); background:rgba(255,255,255,.95);
    transform:translateY(-5px); box-shadow:0 16px 36px rgba(66,113,189,.14);
  }
  .lb-card.is-me { border-color:rgba(66,113,189,.4); background:rgba(66,113,189,.06); }

  /* rank badge top-right */
  .lb-card-rank { position:absolute; top:1.1rem; right:1.1rem; }

  /* identity row */
  .lb-card-header { display:flex; align-items:center; gap:.8rem; padding-right:3.25rem; }
  .lb-avatar {
    width:48px; height:48px; border-radius:50%; flex-shrink:0;
    background:linear-gradient(135deg,rgba(66,113,189,.15),rgba(75,136,180,.28));
    border:2px solid rgba(66,113,189,.22);
    display:flex; align-items:center; justify-content:center;
    font-family:'Space Grotesk',sans-serif; font-size:1.1rem; font-weight:800; color:#4271bd;
  }
  .lb-card-identity { min-width:0; flex:1; }
  .lb-card-name {
    font-family:'Space Grotesk',sans-serif; font-size:.95rem; font-weight:700;
    color:#1b2d4b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    display:flex; align-items:center; gap:.4rem;
  }
  .lb-card-addr { font-family:'Space Mono',monospace; font-size:.63rem; color:#5d8ba2; margin-top:.2rem; }

  /* big score */
  .lb-card-score { }
  .lb-score-num {
    font-family:'Space Grotesk',sans-serif; font-size:2.2rem; font-weight:800;
    line-height:1; letter-spacing:-.02em;
    background:linear-gradient(135deg,#1b2d4b 0%,#4271bd 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .lb-score-lbl { font-size:.6rem; color:#5d8ba2; text-transform:uppercase; letter-spacing:.14em; margin-top:.2rem; }

  /* tags */
  .lb-card-tags { display:flex; flex-wrap:wrap; gap:.35rem; }
  .lb-tag {
    display:inline-flex; align-items:center; gap:.3rem;
    font-family:'Space Grotesk',sans-serif; font-size:.65rem; font-weight:600;
    padding:.22rem .65rem; border-radius:100px;
    background:rgba(66,113,189,.07); border:1px solid rgba(66,113,189,.16); color:#5d8ba2;
  }
  .lb-tag.tier-tag { border:1px solid currentColor; }

  /* bottom stats bar */
  .lb-card-stats {
    display:flex; align-items:center; gap:.65rem;
    padding-top:.85rem; border-top:1px solid rgba(66,113,189,.09); margin-top:auto;
  }
  .lb-stat { display:flex; flex-direction:column; gap:.1rem; }
  .lb-stat-val { font-family:'Space Grotesk',sans-serif; font-size:.92rem; font-weight:700; color:#1b2d4b; line-height:1; }
  .lb-stat-lbl { font-size:.58rem; color:#5d8ba2; text-transform:uppercase; letter-spacing:.08em; }
  .lb-stat-divider { width:1px; height:22px; background:rgba(66,113,189,.12); flex-shrink:0; }

  @media(max-width:960px){ .lb-cards-grid{ grid-template-columns:1fr 1fr; } }
  @media(max-width:540px){ .lb-cards-grid{ grid-template-columns:1fr; } }

  /* ── Hall of Fame grid ── */
  .hof-grid {
    display:grid; grid-template-columns:repeat(3,1fr); gap:1rem;
    animation:fadeUp .4s ease both;
  }
  .hof-card {
    background:rgba(255,255,255,.78); border:1px solid rgba(66,113,189,.16); border-radius:16px;
    padding:1.5rem 1.5rem 1.25rem; text-decoration:none; color:#1b2d4b;
    transition:all .2s; display:block; backdrop-filter:blur(10px);
    box-shadow:0 2px 10px rgba(66,113,189,.06); animation:fadeUp .4s ease both;
  }
  .hof-card:hover { border-color:rgba(66,113,189,.38); background:rgba(66,113,189,.07); transform:translateY(-3px); box-shadow:0 8px 24px rgba(66,113,189,.12); }
  .hof-card.is-me { border-color:rgba(66,113,189,.35); background:rgba(66,113,189,.08); }
  .hof-position { font-family:'Space Mono',monospace; font-size:1rem; font-weight:700; color:#5d8ba2; margin-bottom:.6rem; }
  .hof-wallet { font-family:'Space Mono',monospace; font-size:.72rem; color:#5d8ba2; margin-bottom:.75rem; }
  .hof-score { font-family:'Space Grotesk',sans-serif; font-size:2rem; font-weight:800; color:#1b2d4b; line-height:1; }
  .hof-score-lbl { font-size:.6rem; color:#5d8ba2; text-transform:uppercase; letter-spacing:.12em; margin-top:.2rem; margin-bottom:.75rem; }
  .hof-tier {
    display:inline-flex; align-items:center; gap:.35rem;
    font-family:'Space Grotesk',sans-serif; font-size:.7rem; font-weight:600;
    padding:.25rem .75rem; border-radius:100px; border:1px solid currentColor;
  }
  .hof-events { font-size:.72rem; color:#5d8ba2; margin-top:.5rem; }

  @media(max-width:760px){ .hof-grid { grid-template-columns:1fr 1fr; } }
  @media(max-width:480px){ .hof-grid { grid-template-columns:1fr; } }

  @media(max-width:600px){
    .lb-header, .lb-row { grid-template-columns:36px 1fr auto auto; }
    .lb-header > :last-child, .lb-row > :last-child { display:none; }
  }
`;
