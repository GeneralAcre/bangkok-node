export const marketplaceCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#0a0a0a; color:#e8e8e8; font-family:'DM Sans',sans-serif; min-height:100vh; }

  :root {
    --border:rgba(255,255,255,.08); --border-bright:rgba(255,255,255,.16);
    --surface:rgba(255,255,255,.04); --surface2:rgba(255,255,255,.07);
    --muted:#888; --accent:#ffffff; --accent2:#e8e8e8;
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
  .orb1 { width:500px; height:500px; background:#0d1a3d; opacity:.7; top:-150px; left:-100px; animation:orb1 22s ease-in-out infinite; }
  .orb2 { width:400px; height:400px; background:#1a1040; opacity:.6; bottom:-100px; right:-50px; animation:orb2 28s ease-in-out infinite; }
  .grid-bg {
    position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);
    background-size:60px 60px;
  }
  .scan-line {
    position:fixed; top:0; left:0; right:0; height:1px; z-index:50; pointer-events:none;
    background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.35) 40%,rgba(255,255,255,.2) 60%,transparent 100%);
    opacity:.4; animation:scanln 12s linear infinite;
  }

  .page { position:relative; z-index:1; max-width:960px; margin:0 auto; padding:6rem 1.5rem 4rem; }
  @media(max-width:768px){ .page{ padding:5rem 1rem 3rem; } }
  @media(max-width:480px){ .page{ padding:4.5rem .75rem 2.5rem; } }

  /* ── Page header ── */
  .page-header { margin-bottom:2rem; animation:fadeUp .5s ease both; }
  .eyebrow { font-size:.7rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#ffffff; margin-bottom:.4rem; }
  .page-title {
    font-family:'Epilogue',sans-serif; font-size:clamp(1.6rem,3.5vw,2.6rem); font-weight:900; line-height:1.1;
    background:linear-gradient(135deg,#ffffff 0%,#ffffff 55%,#e8e8e8 100%);
    background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text; animation:gradMove 6s ease infinite; margin-bottom:.4rem;
  }
  @media(max-width:480px){ .page-title{ font-size:1.6rem; } }
  .page-sub { font-size:.9rem; color:#888; max-width:540px; line-height:1.6; }

  /* ── Stats strip ── */
  .stats-strip {
    display:flex; gap:1.5rem; flex-wrap:wrap; margin-bottom:2rem;
    padding:1rem 1.25rem; background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.08); border-radius:14px;
    animation:fadeUp .5s .1s ease both; backdrop-filter:blur(10px);
  }
  .stat-item { display:flex; flex-direction:column; }
  .stat-val  { font-family:'Epilogue',sans-serif; font-size:1.4rem; font-weight:800; color:#e8e8e8; line-height:1; }
  .stat-lbl  { font-size:.68rem; color:#888; text-transform:uppercase; letter-spacing:.08em; margin-top:.2rem; }

  /* ── Fee chip ── */
  .fee-chip {
    display:inline-flex; align-items:center; gap:.4rem;
    background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.22);
    color:#e8e8e8; font-family:'Space Mono',monospace; font-size:.72rem;
    padding:.3rem .75rem; border-radius:100px; white-space:nowrap;
  }

  /* ── Toolbar ── */
  .toolbar {
    display:flex; gap:.75rem; flex-wrap:wrap; align-items:center;
    margin-bottom:1.5rem; animation:fadeUp .5s .15s ease both;
  }
  .filter-group { display:flex; gap:.35rem; flex-wrap:wrap; flex:1; }
  .filter-pill {
    padding:.4rem .9rem; border-radius:100px; font-size:.78rem; font-weight:600;
    font-family:'Epilogue',sans-serif; cursor:pointer; border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.04); color:#888; transition:all .18s; white-space:nowrap;
    text-transform:uppercase; letter-spacing:.03em;
  }
  .filter-pill:hover { border-color:rgba(255,255,255,.18); color:#e8e8e8; }
  .filter-pill.active { background:#ffffff; border-color:#ffffff; color:#0a0a0a; }
  .filter-pill.legend-pill { border-color:rgba(124,58,237,.25); color:#a78bfa; }
  .filter-pill.legend-pill.active { background:#7c3aed; border-color:#7c3aed; color:#fff; }
  .divider { width:1px; height:24px; background:rgba(255,255,255,.08); }
  @media(max-width:600px){ .divider{ display:none; } }

  .btn-post {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.55rem 1.2rem; border-radius:8px; border:none; cursor:pointer;
    font-family:'Epilogue',sans-serif; font-size:.85rem; font-weight:700;
    background:#ffffff; color:#0a0a0a; transition:all .18s; white-space:nowrap;
    letter-spacing:.02em; text-transform:uppercase;
  }
  .btn-post:hover { background:#e8e8e8; transform:translateY(-1px); box-shadow:0 4px 16px rgba(255,255,255,.3); }

  /* ── Grid ── */
  .listings-grid {
    display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem;
    animation:fadeUp .5s .2s ease both;
  }
  @media(max-width:480px){ .listings-grid{ grid-template-columns:1fr; } }

  /* ── Listing card ── */
  .listing-card {
    position:relative; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
    border-radius:16px; padding:1.25rem; transition:all .22s; overflow:hidden;
    display:flex; flex-direction:column; gap:.75rem;
    backdrop-filter:blur(10px); box-shadow:0 2px 10px rgba(0,0,0,.3);
  }
  .listing-card:hover { border-color:rgba(255,255,255,.2); box-shadow:0 6px 28px rgba(255,255,255,.1); transform:translateY(-2px); }
  .listing-card.locked { cursor:default; }
  .listing-card.locked:hover { transform:none; box-shadow:0 2px 10px rgba(0,0,0,.3); }

  .card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:.5rem; }
  .card-badges { display:flex; gap:.35rem; flex-wrap:wrap; }

  .role-badge {
    font-size:.65rem; font-weight:700; padding:.15rem .55rem; border-radius:100px;
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#888;
    text-transform:uppercase; letter-spacing:.06em;
  }

  /* ── Tier badges ── */
  .tier-gate {
    font-size:.65rem; font-weight:700; padding:.15rem .6rem; border-radius:100px;
    border:1px solid currentColor; white-space:nowrap;
  }
  .tier-any      { color:#888;    border-color:rgba(136,136,136,.25); background:rgba(136,136,136,.06); }
  .tier-seeker   { color:#ffffff; border-color:rgba(96,165,250,.25);  background:rgba(96,165,250,.06); }
  .tier-resident { color:#34d399; border-color:rgba(52,211,153,.25);  background:rgba(52,211,153,.06); }
  .tier-builder  { color:#fbbf24; border-color:rgba(251,191,36,.25);  background:rgba(251,191,36,.06); }
  .tier-core     { color:#f87171; border-color:rgba(248,113,113,.25); background:rgba(248,113,113,.06); }
  .tier-legend   { color:#a78bfa; border-color:rgba(167,139,250,.25); background:rgba(167,139,250,.06); }

  .card-title { font-family:'Epilogue',sans-serif; font-size:1rem; font-weight:700; color:#e8e8e8; line-height:1.25; }
  .card-org   { font-size:.8rem; font-weight:600; color:#ffffff; }
  .card-desc  { font-size:.8rem; color:#888; line-height:1.6;
    display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }

  .card-meta { display:flex; gap:.75rem; flex-wrap:wrap; }
  .meta-item {
    display:flex; align-items:center; gap:.3rem;
    font-size:.75rem; color:#888; white-space:nowrap;
  }
  .meta-item svg { flex-shrink:0; }

  .card-footer { display:flex; align-items:center; justify-content:space-between; gap:.5rem; margin-top:auto; }
  .comp { font-family:'Space Mono',monospace; font-size:.8rem; color:#e8e8e8; font-weight:700; }
  .apps { font-size:.67rem; color:#888; }

  .btn-apply {
    padding:.45rem 1.1rem; border-radius:8px; border:1px solid rgba(255,255,255,.3);
    background:rgba(255,255,255,.08); color:#ffffff; font-family:'Epilogue',sans-serif;
    font-size:.8rem; font-weight:700; cursor:pointer; transition:all .18s; white-space:nowrap;
    text-transform:uppercase; letter-spacing:.03em;
  }
  .btn-apply:hover  { background:#ffffff; color:#0a0a0a; box-shadow:0 4px 14px rgba(255,255,255,.3); }
  .btn-apply.applied { border-color:rgba(52,211,153,.3); color:#34d399; background:rgba(52,211,153,.08); cursor:default; }

  /* ── Lock overlay ── */
  .lock-overlay {
    position:absolute; inset:0; border-radius:16px;
    background:rgba(10,10,10,.88); backdrop-filter:blur(6px);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:.5rem; z-index:10;
  }
  .lock-icon { font-size:1.6rem; animation:lockPulse 3s ease-in-out infinite; }
  .lock-title { font-family:'Epilogue',sans-serif; font-size:.88rem; font-weight:700; color:#e8e8e8; }
  .lock-sub   { font-size:.72rem; color:#888; text-align:center; padding:0 1rem; }
  .lock-tier  { padding:.25rem .75rem; border-radius:100px; font-size:.68rem; font-weight:700; border:1px solid currentColor; }

  /* ── Empty state ── */
  .empty-state { text-align:center; padding:4rem 1rem; color:#888; }
  .empty-state h3 { font-family:'Epilogue',sans-serif; font-size:1.1rem; font-weight:700; color:#e8e8e8; margin-bottom:.5rem; }

  /* ── Shimmer ── */
  .shimmer { background:linear-gradient(90deg,#161616 25%,#202020 50%,#161616 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:10px; }

  /* ── Apply modal ── */
  .modal-backdrop {
    position:fixed; inset:0; background:rgba(0,0,0,.7); backdrop-filter:blur(8px);
    z-index:500; display:flex; align-items:center; justify-content:center; padding:1rem;
  }
  .modal {
    background:#111; border:1px solid rgba(255,255,255,.12); border-radius:20px;
    padding:2rem; width:100%; max-width:520px; animation:popIn .25s ease both;
    max-height:90vh; overflow-y:auto; box-shadow:0 12px 40px rgba(0,0,0,.6);
  }
  .modal-title { font-family:'Epilogue',sans-serif; font-size:1.2rem; font-weight:800; color:#e8e8e8; margin-bottom:.25rem; }
  .modal-sub   { font-size:.82rem; color:#888; margin-bottom:1.25rem; }
  .modal label { display:block; font-size:.78rem; font-weight:600; color:#888; margin-bottom:.35rem; letter-spacing:.03em; }
  .modal textarea {
    width:100%; padding:.75rem 1rem; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
    border-radius:10px; color:#e8e8e8; font-family:'DM Sans',sans-serif; font-size:.88rem;
    resize:vertical; min-height:120px; outline:none; transition:border-color .2s;
  }
  @media(max-width:768px){ .modal textarea{ font-size:1rem; } }
  .modal textarea:focus { border-color:#ffffff; box-shadow:0 0 0 3px rgba(255,255,255,.12); }
  .modal-actions { display:flex; gap:.6rem; margin-top:1.25rem; }
  .btn-submit {
    flex:1; padding:.7rem; border:none; border-radius:10px; cursor:pointer;
    font-family:'Epilogue',sans-serif; font-size:.9rem; font-weight:700;
    background:#ffffff; color:#0a0a0a; transition:all .18s;
  }
  .btn-submit:hover { background:#e8e8e8; }
  .btn-submit:disabled { background:rgba(255,255,255,.2); color:rgba(255,255,255,.3); cursor:not-allowed; }
  .btn-cancel {
    padding:.7rem 1.2rem; border:1px solid rgba(255,255,255,.1); border-radius:10px; cursor:pointer;
    font-family:'Epilogue',sans-serif; font-size:.9rem; font-weight:600;
    background:transparent; color:#888; transition:all .18s;
  }
  .btn-cancel:hover { border-color:#ffffff; color:#e8e8e8; }
  .modal-tier-warn {
    padding:.65rem .9rem; border-radius:8px; font-size:.8rem; line-height:1.5;
    background:rgba(167,139,250,.07); border:1px solid rgba(167,139,250,.2); color:#a78bfa;
    margin-bottom:1rem;
  }
  .modal-success {
    text-align:center; padding:1rem 0;
  }
  .modal-success .icon { font-size:2.5rem; margin-bottom:.5rem; }
  .modal-success h3 { font-family:'Epilogue',sans-serif; font-size:1.1rem; font-weight:800; color:#ffffff; margin-bottom:.3rem; }
  .modal-success p  { font-size:.85rem; color:#888; }
`;