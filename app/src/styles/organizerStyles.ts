export const organizerCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #0a0a0a; color: #e8e8e8; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

  :root {
    --border:rgba(255,255,255,.08); --border-bright:rgba(255,255,255,.16);
    --surface:rgba(255,255,255,.04); --surface2:rgba(255,255,255,.07);
    --muted:#888; --accent:#ffffff;
  }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse     { 0%,100%{opacity:.7} 50%{opacity:1} }
  @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes scanline  { 0%{top:-4px} 100%{top:100vh} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes orb1      { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.08)} 66%{transform:translate(-30px,30px) scale(.95)} }
  @keyframes orb2      { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,40px) scale(1.05)} 66%{transform:translate(40px,-30px) scale(.97)} }
  @keyframes gradMove  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

  .orb-wrap { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
  .orb { position:absolute; border-radius:50%; filter:blur(90px); }
  .orb1 { width:500px; height:500px; background:#0d1a3d; opacity:.7; top:-150px; left:-100px; animation:orb1 20s ease-in-out infinite; }
  .orb2 { width:400px; height:400px; background:#1a1040; opacity:.6; bottom:-100px; right:-50px; animation:orb2 25s ease-in-out infinite; }
  .orb3 { width:300px; height:300px; background:#0a1628; opacity:.5; top:40%; left:60%; animation:orb1 30s ease-in-out infinite reverse; }

  .grid-bg {
    position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:
      linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size:60px 60px;
  }

  .scanline {
    position:fixed; top:0; left:0; right:0; height:2px; z-index:999; pointer-events:none;
    background:linear-gradient(transparent,rgba(255,255,255,.2),transparent);
    animation:scanline 10s linear infinite;
  }

  .page { max-width:860px; margin:0 auto; padding:6rem 1.5rem 3rem; position:relative; z-index:1; }
  @media(max-width:768px){ .page{ padding:5rem 1rem 2rem; } }
  @media(max-width:480px){ .page{ padding:4.5rem .75rem 2rem; } }

  .page-header { margin-bottom:1.5rem; animation:fadeUp .5s ease both; align-items:flex-start; }
  @media(max-width:480px){ .page-header{ flex-direction:column !important; gap:.75rem !important; } }
  .page-title {
    font-family:'Epilogue',sans-serif; font-size:clamp(1.4rem,3.5vw,2.2rem); font-weight:900; margin-bottom:.3rem;
    background:linear-gradient(135deg,#ffffff 0%,#ffffff 50%,#e8e8e8 80%);
    background-size:200% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    animation:gradMove 6s ease infinite;
  }
  .page-sub { font-size:.88rem; color:#888; }

  /* ── Cards ── */
  .card {
    background:rgba(255,255,255,.04); backdrop-filter:blur(16px);
    border:1px solid rgba(255,255,255,.08); border-radius:16px;
    padding:1.5rem; margin-bottom:1rem; animation:fadeUp .5s ease both;
    transition:border-color .25s; box-shadow:0 2px 10px rgba(0,0,0,.3);
  }
  @media(max-width:480px){ .card{ padding:1.1rem; border-radius:12px; } }
  .card:hover { border-color:rgba(255,255,255,.18); }
  .card-title {
    font-family:'Epilogue',sans-serif; font-size:.75rem; font-weight:700;
    color:#ffffff; letter-spacing:.1em; text-transform:uppercase; margin-bottom:1.25rem;
  }

  /* ── Form ── */
  label {
    display:block; font-size:.8rem; font-weight:500; color:#888;
    margin-bottom:.4rem; letter-spacing:.02em;
  }
  input, textarea {
    width:100%; padding:.7rem 1rem;
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
    border-radius:8px; color:#e8e8e8; font-family:'DM Sans',sans-serif; font-size:.88rem;
    margin-bottom:1rem; transition:border-color .2s, box-shadow .2s; outline:none;
  }
  @media(max-width:768px){ input, textarea { font-size:1rem; } }
  input::placeholder, textarea::placeholder { color:rgba(255,255,255,.25); }
  input:focus, textarea:focus { border-color:#ffffff; box-shadow:0 0 0 3px rgba(255,255,255,.12); }
  textarea { resize:vertical; min-height:80px; }
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button { -webkit-appearance:none; }
  input[type="number"] { -moz-appearance:textfield; }
  input[type="date"] { color-scheme:dark; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(1); cursor:pointer; opacity:.6; }

  /* ── Custom time dropdown ── */
  .time-dropdown { position:relative; margin-bottom:1rem; }
  .time-trigger {
    width:100%; padding:.7rem 1rem;
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
    border-radius:8px; color:#e8e8e8; font-family:'DM Sans',sans-serif; font-size:.88rem;
    cursor:pointer; display:flex; align-items:center; justify-content:space-between;
    transition:border-color .2s, box-shadow .2s; text-align:left;
  }
  @media(max-width:768px){ .time-trigger{ font-size:1rem; } }
  .time-trigger:focus, .time-trigger:hover { border-color:#ffffff; box-shadow:0 0 0 3px rgba(255,255,255,.12); outline:none; }
  .time-options {
    position:absolute; top:calc(100% + 4px); left:0; right:0; z-index:200;
    background:#111; border:1px solid rgba(255,255,255,.12);
    border-radius:8px; max-height:200px; overflow-y:auto;
    box-shadow:0 8px 32px rgba(0,0,0,.5);
  }
  .time-options::-webkit-scrollbar { width:4px; }
  .time-options::-webkit-scrollbar-track { background:transparent; }
  .time-options::-webkit-scrollbar-thumb { background:rgba(255,255,255,.15); border-radius:4px; }
  .time-option {
    padding:.55rem 1rem; font-size:.88rem; color:#e8e8e8; cursor:pointer;
    transition:background .15s;
  }
  .time-option:hover { background:rgba(255,255,255,.1); }
  .time-option.active { color:#ffffff; background:rgba(255,255,255,.08); font-weight:600; }
  .row { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  @media(max-width:600px){ .row{ grid-template-columns:1fr; gap:0; } }
  .code-row { display:flex; gap:.5rem; margin-bottom:.25rem; align-items:flex-start; }
  .code-row input { flex:1; margin-bottom:0; }
  @media(max-width:480px){ .code-row{ flex-direction:column; } .code-row input{ width:100%; } .code-row .btn{ width:100%; justify-content:center; } }
  .field-note { font-size:.75rem; color:#888; margin-top:-.5rem; margin-bottom:.9rem; }

  /* ── Buttons ── */
  .btn {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.65rem 1.4rem; border:none; cursor:pointer; border-radius:8px;
    font-family:'Epilogue',sans-serif; font-size:.82rem; font-weight:700;
    letter-spacing:.03em; text-transform:uppercase; transition:all .2s; white-space:nowrap;
  }
  .btn-block { width:100%; justify-content:center; }
  .btn-primary  { background:#ffffff; color:#0a0a0a; }
  .btn-primary:hover { background:#e8e8e8; transform:translateY(-1px); box-shadow:0 6px 24px rgba(255,255,255,.3); }
  .btn-primary:disabled { background:rgba(255,255,255,.2); color:rgba(255,255,255,.3); cursor:not-allowed; transform:none; box-shadow:none; }
  .btn-green    { background:rgba(255,255,255,.1); color:#ffffff; border:1px solid rgba(255,255,255,.25); }
  .btn-green:hover { background:rgba(255,255,255,.18); transform:translateY(-1px); }
  .btn-green:disabled { opacity:.45; cursor:not-allowed; transform:none; }
  .btn-danger   { background:rgba(220,38,38,.1); color:#f87171; border:1px solid rgba(220,38,38,.25); }
  .btn-danger:hover { background:rgba(220,38,38,.18); }
  .btn-danger:disabled { opacity:.45; cursor:not-allowed; }
  .btn-ghost    { background:transparent; color:#888; border:1px solid rgba(255,255,255,.1); }
  .btn-ghost:hover { border-color:#ffffff; color:#e8e8e8; background:rgba(255,255,255,.07); }
  .btn-demo     { background:rgba(255,255,255,.1); color:#ffffff; border:1px solid rgba(255,255,255,.22); }
  .btn-demo:hover { background:rgba(255,255,255,.18); border-color:#ffffff; transform:translateY(-1px); }
  .btn-demo:disabled { opacity:.45; cursor:not-allowed; transform:none; }

  /* ── Messages ── */
  .msg-ok  { background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.2); color:#e8e8e8; padding:.85rem 1.1rem; margin-bottom:1rem; font-size:.85rem; border-radius:10px; white-space:pre-wrap; }
  .msg-err { background:rgba(220,38,38,.1); border:1px solid rgba(220,38,38,.25); color:#f87171; padding:.85rem 1.1rem; margin-bottom:1rem; font-size:.85rem; border-radius:10px; }

  /* ── Event list ── */
  .event-card {
    border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:1.25rem;
    margin-bottom:.75rem; transition:all .25s;
    background:rgba(255,255,255,.03);
  }
  .event-card:hover { border-color:rgba(255,255,255,.2); box-shadow:0 4px 20px rgba(255,255,255,.08); }
  .event-name { font-family:'Epilogue',sans-serif; font-size:1rem; font-weight:700; color:#e8e8e8; margin-bottom:.2rem; }
  .event-meta { font-size:.78rem; color:#888; margin-bottom:.6rem; line-height:1.5; }
  .event-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; margin-top:.75rem; }

  /* ── Badges ── */
  .badge-live     { display:inline-flex; align-items:center; gap:.35rem; font-size:.72rem; font-weight:600; color:#ffffff; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.25); padding:.2rem .7rem; border-radius:100px; }
  .badge-live::before { content:''; width:6px; height:6px; border-radius:50%; background:#ffffff; animation:pulse 2s infinite; flex-shrink:0; }
  .badge-upcoming { font-size:.72rem; font-weight:500; color:#f59e0b; background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.2); padding:.2rem .7rem; border-radius:100px; }
  .badge-ended    { font-size:.72rem; font-weight:500; color:#888; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); padding:.2rem .7rem; border-radius:100px; }

  /* ── QR panel ── */
  .qr-panel { text-align:center; padding:.5rem 0; }
  .event-code-display {
    display:inline-block; font-family:'Space Mono',monospace; font-size:1.8rem; font-weight:700;
    color:#ffffff; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.2);
    padding:.5rem 1.75rem; border-radius:10px; letter-spacing:.2em; margin-bottom:1.25rem;
  }
  .qr-img-wrap {
    display:inline-block; padding:1rem; background:#fff; border-radius:12px; margin-bottom:1rem;
    box-shadow:0 8px 40px rgba(0,0,0,.5);
  }
  .blink-url {
    font-family:'Space Mono',monospace; font-size:.65rem; color:#888;
    word-break:break-all; padding:.7rem 1rem; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1);
    border-radius:8px; margin-bottom:.75rem; cursor:pointer; transition:all .2s; text-align:left; display:block;
  }
  .blink-url:hover { border-color:#ffffff; color:#e8e8e8; }

  /* ── How it works ── */
  .how-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:.6rem; }
  @media(max-width:480px){ .how-grid{ grid-template-columns:1fr 1fr; gap:.5rem; } }
  .how-step {
    background:rgba(255,255,255,.03);
    border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:.85rem 1rem;
    transition:all .25s; animation:float 6s ease-in-out infinite;
  }
  .how-step:hover { border-color:rgba(255,255,255,.2); transform:translateY(-3px) !important; }
  .how-num  { font-family:'Epilogue',sans-serif; font-size:.75rem; font-weight:700; color:#ffffff; margin-bottom:.25rem; }
  .how-text { font-size:.75rem; color:#888; line-height:1.6; }

  /* ── Connect ── */
  .connect-card { text-align:center; padding:3rem 1.5rem; }
  @media(max-width:480px){ .connect-card{ padding:2rem 1rem; } }
  .connect-card p { font-size:.9rem; color:#888; margin-bottom:1.25rem; }
  .connect-card .wallet-adapter-button { width:100%; justify-content:center; max-width:280px; }

  /* ── Events listing (Luma-style) ── */
  .ev-filters { display:flex; gap:.4rem; margin-bottom:1.25rem; flex-wrap:wrap; }
  .ev-filter-btn {
    display:flex; align-items:center; gap:.4rem;
    padding:.3rem .85rem; border-radius:100px;
    border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04);
    color:rgba(255,255,255,.4); font-family:'Epilogue',sans-serif;
    font-size:.75rem; font-weight:600; cursor:pointer; transition:all .2s;
    text-transform:uppercase; letter-spacing:.04em;
  }
  .ev-filter-btn:hover { border-color:rgba(255,255,255,.18); color:#e8e8e8; }
  .ev-filter-btn.active { background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.3); color:#ffffff; }
  .ev-filter-count {
    background:rgba(255,255,255,.15); color:#ffffff; border-radius:100px;
    padding:0 .45rem; font-size:.65rem; font-weight:700; min-width:18px; text-align:center;
  }
  .ev-filter-btn.active .ev-filter-count { background:rgba(255,255,255,.25); }

  .ev-list { display:flex; flex-direction:column; }
  .ev-month-group { margin-bottom:.75rem; }
  .ev-month-label {
    font-family:'Epilogue',sans-serif; font-size:.68rem; font-weight:700;
    letter-spacing:.08em; text-transform:uppercase; color:#888;
    padding:.3rem 0; margin-bottom:.3rem;
    border-bottom:1px solid rgba(255,255,255,.07);
  }

  .ev-row {
    display:grid; grid-template-columns:12px 1fr auto auto auto;
    gap:.75rem; align-items:center; padding:.8rem .6rem;
    border-radius:10px; border:1px solid transparent; transition:all .2s; margin-bottom:.15rem;
  }
  .ev-row:hover { border-color:rgba(255,255,255,.08); background:rgba(255,255,255,.03); }

  .ev-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  .ev-dot-live     { background:#ffffff; box-shadow:0 0 8px rgba(255,255,255,.5); animation:pulse 2s infinite; }
  .ev-dot-upcoming { background:#f59e0b; }
  .ev-dot-ended    { background:#333; }

  .ev-main { min-width:0; }
  .ev-title {
    font-family:'Epilogue',sans-serif; font-size:.92rem; font-weight:600; color:#e8e8e8;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  .ev-sub {
    font-size:.72rem; color:#888; margin-top:.12rem;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  .ev-code { font-family:'Space Mono',monospace; }
  .ev-sep  { margin:0 .3rem; }

  .ev-date-col {
    font-size:.75rem; color:#888; white-space:nowrap;
    font-family:'Epilogue',sans-serif;
  }
  .ev-stat-col {
    font-size:.72rem; color:#888; white-space:nowrap;
    font-family:'Space Mono',monospace;
  }

  .btn-checkin {
    display:inline-flex; align-items:center; padding:.3rem .9rem;
    background:#ffffff; color:#0a0a0a;
    font-family:'Epilogue',sans-serif; font-size:.75rem; font-weight:700;
    border-radius:100px; text-decoration:none; transition:all .2s; white-space:nowrap;
    text-transform:uppercase; letter-spacing:.03em;
  }
  .btn-checkin:hover { background:#e8e8e8; transform:translateY(-1px); box-shadow:0 4px 16px rgba(255,255,255,.3); }

  .ev-empty { padding:2rem; text-align:center; color:#888; font-size:.85rem; }

  @media(max-width:640px){
    .ev-row { grid-template-columns:10px 1fr auto; }
    .ev-date-col, .ev-stat-col { display:none; }
  }
  @media(max-width:480px){
    .ev-row { grid-template-columns:10px 1fr; gap:.5rem; }
    .ev-cta-col { display:none; }
  }
`;