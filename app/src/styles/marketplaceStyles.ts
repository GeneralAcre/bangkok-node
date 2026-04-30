export const marketplaceCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Space+Mono&family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#f4f7fb; color:#1b2d4b; font-family:'Inter',sans-serif; min-height:100vh; }

  :root {
    --g:#1b2d4b; --p:#4271bd; --p2:#4b88b4;
    --g-dim:rgba(27,45,75,.07); --p-dim:rgba(66,113,189,.10);
    --g-glow:rgba(27,45,75,.12); --p-glow:rgba(66,113,189,.22);
    --surface:rgba(66,113,189,.07); --surface2:rgba(66,113,189,.13);
    --border:rgba(66,113,189,.18); --border-hi:rgba(66,113,189,.38);
    --muted:#5d8ba2;
  }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes gradMove{ 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes orb1    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.08)} 66%{transform:translate(-30px,30px) scale(.95)} }
  @keyframes orb2    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,40px) scale(1.05)} 66%{transform:translate(40px,-30px) scale(.97)} }
  @keyframes scanln  { 0%{top:-2px} 100%{top:100vh} }
  @keyframes popIn   { from{opacity:0;transform:scale(.94) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes lockPulse { 0%,100%{opacity:.7} 50%{opacity:1} }

  .orb-wrap { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
  .orb { position:absolute; border-radius:50%; filter:blur(100px); }
  .orb1 { width:500px; height:500px; background:#93b8d2; opacity:.28; top:-150px; left:-100px; animation:orb1 22s ease-in-out infinite; }
  .orb2 { width:400px; height:400px; background:#b4c6e4; opacity:.22; bottom:-100px; right:-50px; animation:orb2 28s ease-in-out infinite; }
  .grid-bg {
    position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:linear-gradient(rgba(66,113,189,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(66,113,189,.05) 1px,transparent 1px);
    background-size:60px 60px;
  }
  .scan-line {
    position:fixed; top:0; left:0; right:0; height:1px; z-index:50; pointer-events:none;
    background:linear-gradient(90deg,transparent 0%,rgba(66,113,189,.45) 40%,rgba(27,45,75,.3) 60%,transparent 100%);
    opacity:.4; animation:scanln 12s linear infinite;
  }

  .page { position:relative; z-index:1; max-width:960px; margin:0 auto; padding:6rem 1.5rem 4rem; }
  @media(max-width:768px){ .page{ padding:5rem 1rem 3rem; } }
  @media(max-width:480px){ .page{ padding:4.5rem .75rem 2.5rem; } }

  /* ── Page header ── */
  .page-header { margin-bottom:2rem; animation:fadeUp .5s ease both; }
  .eyebrow { font-size:.7rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#4271bd; margin-bottom:.4rem; }
  .page-title {
    font-family:'Space Grotesk',sans-serif; font-size:2.2rem; font-weight:800; line-height:1.1;
    background:linear-gradient(135deg,#1b2d4b 0%,#4271bd 55%,#4b88b4 100%);
    background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text; animation:gradMove 6s ease infinite; margin-bottom:.4rem;
  }
  @media(max-width:480px){ .page-title{ font-size:1.6rem; } }
  .page-sub { font-size:.88rem; color:#5d8ba2; max-width:540px; line-height:1.6; }

  /* ── Stats strip ── */
  .stats-strip {
    display:flex; gap:1.5rem; flex-wrap:wrap; margin-bottom:2rem;
    padding:1rem 1.25rem; background:rgba(255,255,255,.7);
    border:1px solid rgba(66,113,189,.16); border-radius:14px;
    animation:fadeUp .5s .1s ease both; backdrop-filter:blur(10px);
  }
  .stat-item { display:flex; flex-direction:column; }
  .stat-val  { font-family:'Space Grotesk',sans-serif; font-size:1.4rem; font-weight:700; color:#1b2d4b; line-height:1; }
  .stat-lbl  { font-size:.65rem; color:#5d8ba2; text-transform:uppercase; letter-spacing:.1em; margin-top:.2rem; }

  /* ── Fee chip ── */
  .fee-chip {
    display:inline-flex; align-items:center; gap:.4rem;
    background:rgba(66,113,189,.1); border:1px solid rgba(66,113,189,.28);
    color:#1b2d4b; font-family:'Space Mono',monospace; font-size:.7rem;
    padding:.3rem .75rem; border-radius:100px; white-space:nowrap;
  }

  /* ── Toolbar ── */
  .toolbar {
    display:flex; gap:.75rem; flex-wrap:wrap; align-items:center;
    margin-bottom:1.5rem; animation:fadeUp .5s .15s ease both;
  }
  .filter-group { display:flex; gap:.35rem; flex-wrap:wrap; flex:1; }
  .filter-pill {
    padding:.4rem .9rem; border-radius:100px; font-size:.75rem; font-weight:600;
    font-family:'Space Grotesk',sans-serif; cursor:pointer; border:1px solid rgba(66,113,189,.2);
    background:rgba(255,255,255,.7); color:#5d8ba2; transition:all .18s; white-space:nowrap;
  }
  .filter-pill:hover { border-color:rgba(66,113,189,.4); color:#1b2d4b; }
  .filter-pill.active { background:#4271bd; border-color:#4271bd; color:#fff; }
  .filter-pill.legend-pill { border-color:rgba(124,58,237,.3); color:#7c3aed; }
  .filter-pill.legend-pill.active { background:#7c3aed; border-color:#7c3aed; color:#fff; }
  .divider { width:1px; height:24px; background:rgba(66,113,189,.2); }
  @media(max-width:600px){ .divider{ display:none; } }

  .btn-post {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.55rem 1.2rem; border-radius:8px; border:none; cursor:pointer;
    font-family:'Space Grotesk',sans-serif; font-size:.82rem; font-weight:700;
    background:#4271bd; color:#fff; transition:all .18s; white-space:nowrap;
    letter-spacing:.02em;
  }
  .btn-post:hover { background:#355b97; transform:translateY(-1px); box-shadow:0 4px 16px rgba(66,113,189,.3); }

  /* ── Grid ── */
  .listings-grid {
    display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem;
    animation:fadeUp .5s .2s ease both;
  }
  @media(max-width:480px){ .listings-grid{ grid-template-columns:1fr; } }

  /* ── Listing card ── */
  .listing-card {
    position:relative; background:rgba(255,255,255,.75); border:1px solid rgba(66,113,189,.16);
    border-radius:16px; padding:1.25rem; transition:all .22s; overflow:hidden;
    display:flex; flex-direction:column; gap:.75rem;
    backdrop-filter:blur(10px); box-shadow:0 2px 10px rgba(66,113,189,.06);
  }
  .listing-card:hover { border-color:rgba(66,113,189,.35); box-shadow:0 6px 28px rgba(66,113,189,.12); transform:translateY(-2px); }
  .listing-card.locked { cursor:default; }
  .listing-card.locked:hover { transform:none; box-shadow:0 2px 10px rgba(66,113,189,.06); }

  .card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:.5rem; }
  .card-badges { display:flex; gap:.35rem; flex-wrap:wrap; }

  .role-badge {
    font-size:.62rem; font-weight:700; padding:.15rem .55rem; border-radius:100px;
    background:rgba(66,113,189,.08); border:1px solid rgba(66,113,189,.2); color:#5d8ba2;
    text-transform:uppercase; letter-spacing:.08em;
  }

  /* ── Tier badges ── */
  .tier-gate {
    font-size:.62rem; font-weight:700; padding:.15rem .6rem; border-radius:100px;
    border:1px solid currentColor; white-space:nowrap;
  }
  .tier-any      { color:#5d8ba2;  border-color:rgba(93,138,162,.3); background:rgba(93,138,162,.08); }
  .tier-seeker   { color:#1d4ed8;  border-color:rgba(29,78,216,.3);  background:rgba(29,78,216,.08); }
  .tier-resident { color:#059669;  border-color:rgba(5,150,105,.3);  background:rgba(5,150,105,.08); }
  .tier-builder  { color:#d97706;  border-color:rgba(217,119,6,.3);  background:rgba(217,119,6,.08); }
  .tier-core     { color:#dc2626;  border-color:rgba(220,38,38,.3);  background:rgba(220,38,38,.08); }
  .tier-legend   { color:#7c3aed;  border-color:rgba(124,58,237,.3); background:rgba(124,58,237,.08); }

  .card-title { font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:700; color:#1b2d4b; line-height:1.25; }
  .card-org   { font-size:.78rem; font-weight:600; color:#4b88b4; }
  .card-desc  { font-size:.78rem; color:#5d8ba2; line-height:1.6;
    display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }

  .card-meta { display:flex; gap:.75rem; flex-wrap:wrap; }
  .meta-item {
    display:flex; align-items:center; gap:.3rem;
    font-size:.72rem; color:#5d8ba2; white-space:nowrap;
  }
  .meta-item svg { flex-shrink:0; }

  .card-footer { display:flex; align-items:center; justify-content:space-between; gap:.5rem; margin-top:auto; }
  .comp { font-family:'Space Mono',monospace; font-size:.78rem; color:#1b2d4b; font-weight:700; }
  .apps { font-size:.65rem; color:#5d8ba2; }

  .btn-apply {
    padding:.45rem 1.1rem; border-radius:8px; border:1px solid rgba(66,113,189,.35);
    background:rgba(66,113,189,.08); color:#4271bd; font-family:'Space Grotesk',sans-serif;
    font-size:.78rem; font-weight:700; cursor:pointer; transition:all .18s; white-space:nowrap;
  }
  .btn-apply:hover  { background:#4271bd; color:#fff; box-shadow:0 4px 14px rgba(66,113,189,.3); }
  .btn-apply.applied { border-color:rgba(5,150,105,.35); color:#059669; background:rgba(5,150,105,.08); cursor:default; }

  /* ── Lock overlay ── */
  .lock-overlay {
    position:absolute; inset:0; border-radius:16px;
    background:rgba(244,247,251,.88); backdrop-filter:blur(6px);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:.5rem; z-index:10;
  }
  .lock-icon { font-size:1.6rem; animation:lockPulse 3s ease-in-out infinite; }
  .lock-title { font-family:'Space Grotesk',sans-serif; font-size:.85rem; font-weight:700; color:#1b2d4b; }
  .lock-sub   { font-size:.7rem; color:#5d8ba2; text-align:center; padding:0 1rem; }
  .lock-tier  { padding:.25rem .75rem; border-radius:100px; font-size:.65rem; font-weight:700; border:1px solid currentColor; }

  /* ── Empty state ── */
  .empty-state { text-align:center; padding:4rem 1rem; color:#5d8ba2; }
  .empty-state h3 { font-family:'Space Grotesk',sans-serif; font-size:1.1rem; font-weight:700; color:#1b2d4b; margin-bottom:.5rem; }

  /* ── Shimmer ── */
  .shimmer { background:linear-gradient(90deg,#e8eef8 25%,#cdd9ef 50%,#e8eef8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:10px; }

  /* ── Apply modal ── */
  .modal-backdrop {
    position:fixed; inset:0; background:rgba(27,45,75,.35); backdrop-filter:blur(8px);
    z-index:500; display:flex; align-items:center; justify-content:center; padding:1rem;
  }
  .modal {
    background:#f4f7fb; border:1px solid rgba(66,113,189,.28); border-radius:20px;
    padding:2rem; width:100%; max-width:520px; animation:popIn .25s ease both;
    max-height:90vh; overflow-y:auto; box-shadow:0 12px 40px rgba(66,113,189,.2);
  }
  .modal-title { font-family:'Space Grotesk',sans-serif; font-size:1.2rem; font-weight:700; color:#1b2d4b; margin-bottom:.25rem; }
  .modal-sub   { font-size:.8rem; color:#5d8ba2; margin-bottom:1.25rem; }
  .modal label { display:block; font-size:.75rem; font-weight:600; color:#5d8ba2; margin-bottom:.35rem; letter-spacing:.03em; }
  .modal textarea {
    width:100%; padding:.75rem 1rem; background:rgba(255,255,255,.9); border:1px solid rgba(66,113,189,.25);
    border-radius:10px; color:#1b2d4b; font-family:'Inter',sans-serif; font-size:.88rem;
    resize:vertical; min-height:120px; outline:none; transition:border-color .2s;
  }
  @media(max-width:768px){ .modal textarea{ font-size:1rem; } }
  .modal textarea:focus { border-color:#4271bd; box-shadow:0 0 0 3px rgba(66,113,189,.12); }
  .modal-actions { display:flex; gap:.6rem; margin-top:1.25rem; }
  .btn-submit {
    flex:1; padding:.7rem; border:none; border-radius:10px; cursor:pointer;
    font-family:'Space Grotesk',sans-serif; font-size:.9rem; font-weight:700;
    background:#4271bd; color:#fff; transition:all .18s;
  }
  .btn-submit:hover { background:#355b97; }
  .btn-submit:disabled { background:rgba(66,113,189,.2); color:rgba(27,45,75,.4); cursor:not-allowed; }
  .btn-cancel {
    padding:.7rem 1.2rem; border:1px solid rgba(66,113,189,.22); border-radius:10px; cursor:pointer;
    font-family:'Space Grotesk',sans-serif; font-size:.88rem; font-weight:600;
    background:transparent; color:#5d8ba2; transition:all .18s;
  }
  .btn-cancel:hover { border-color:#4271bd; color:#1b2d4b; }
  .modal-tier-warn {
    padding:.65rem .9rem; border-radius:8px; font-size:.78rem; line-height:1.5;
    background:rgba(124,58,237,.07); border:1px solid rgba(124,58,237,.25); color:#7c3aed;
    margin-bottom:1rem;
  }
  .modal-success {
    text-align:center; padding:1rem 0;
  }
  .modal-success .icon { font-size:2.5rem; margin-bottom:.5rem; }
  .modal-success h3 { font-family:'Space Grotesk',sans-serif; font-size:1.1rem; font-weight:700; color:#4271bd; margin-bottom:.3rem; }
  .modal-success p  { font-size:.82rem; color:#5d8ba2; }
`;
