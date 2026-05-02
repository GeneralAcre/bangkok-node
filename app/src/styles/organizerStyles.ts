export const organizerCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #f4f7fb; color: #1b2d4b; font-family: 'Inter', sans-serif; min-height: 100vh; }

  :root {
    --g: #1b2d4b; --p: #4271bd;
    --g-dim: rgba(27,45,75,.07); --p-dim: rgba(66,113,189,.10);
    --g-border: rgba(27,45,75,.2); --p-border: rgba(66,113,189,.28);
    --p-glow: rgba(66,113,189,.22); --g-glow: rgba(27,45,75,.12);
    --surface: rgba(66,113,189,.07); --surface2: rgba(66,113,189,.13); --border: rgba(66,113,189,.18);
    --text-muted: #5d8ba2; --text-dim: #4b88b4;
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
  .orb1 { width:500px; height:500px; background:#93b8d2; opacity:.28; top:-150px; left:-100px; animation:orb1 20s ease-in-out infinite; }
  .orb2 { width:400px; height:400px; background:#b4c6e4; opacity:.22; bottom:-100px; right:-50px; animation:orb2 25s ease-in-out infinite; }
  .orb3 { width:300px; height:300px; background:#8eaad7; opacity:.18; top:40%; left:60%; animation:orb1 30s ease-in-out infinite reverse; }

  .grid-bg {
    position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:
      linear-gradient(rgba(66,113,189,.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(66,113,189,.05) 1px, transparent 1px);
    background-size:60px 60px;
  }

  .scanline {
    position:fixed; top:0; left:0; right:0; height:2px; z-index:999; pointer-events:none;
    background:linear-gradient(transparent,rgba(66,113,189,.25),transparent);
    animation:scanline 10s linear infinite;
  }

  .page { max-width:860px; margin:0 auto; padding:6rem 1.5rem 3rem; position:relative; z-index:1; }
  @media(max-width:768px){ .page{ padding:5rem 1rem 2rem; } }
  @media(max-width:480px){ .page{ padding:4.5rem .75rem 2rem; } }

  .page-header { margin-bottom:1.5rem; animation:fadeUp .5s ease both; align-items:flex-start; }
  @media(max-width:480px){ .page-header{ flex-direction:column !important; gap:.75rem !important; } }
  .page-title {
    font-family:'Orbitron',sans-serif; font-size:1.4rem; font-weight:700; margin-bottom:.3rem;
    background:linear-gradient(135deg,#1b2d4b 0%,#4271bd 50%,#4b88b4 80%);
    background-size:200% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    animation:gradMove 6s ease infinite;
  }
  @media(max-width:480px){ .page-title{ font-size:1.5rem; } }
  .page-sub { font-size:.85rem; color:var(--text-muted); }
  @media(max-width:480px){ .page-sub{ font-size:.78rem; } }

  /* ── Cards ── */
  .card {
    background:rgba(255,255,255,.75); backdrop-filter:blur(16px);
    border:1px solid rgba(66,113,189,.18); border-radius:16px;
    padding:1.5rem; margin-bottom:1rem; animation:fadeUp .5s ease both;
    transition:border-color .25s; box-shadow:0 2px 10px rgba(66,113,189,.06);
  }
  @media(max-width:480px){ .card{ padding:1.1rem; border-radius:12px; } }
  .card:hover { border-color:rgba(66,113,189,.35); }
  .card-title {
    font-family:'Orbitron',sans-serif; font-size:.72rem; font-weight:700;
    color:#4271bd; letter-spacing:.12em; text-transform:uppercase; margin-bottom:1.25rem;
  }

  /* ── Form ── */
  label {
    display:block; font-size:.78rem; font-weight:500; color:var(--text-muted);
    margin-bottom:.4rem; letter-spacing:.02em;
  }
  input, textarea {
    width:100%; padding:.7rem 1rem;
    background:rgba(255,255,255,.9); border:1px solid rgba(66,113,189,.25);
    border-radius:8px; color:#1b2d4b; font-family:'Inter',sans-serif; font-size:.88rem;
    margin-bottom:1rem; transition:border-color .2s, box-shadow .2s; outline:none;
  }
  @media(max-width:768px){ input, textarea { font-size:1rem; } }
  input::placeholder, textarea::placeholder { color:rgba(27,45,75,.35); }
  input:focus, textarea:focus { border-color:#4271bd; box-shadow:0 0 0 3px rgba(66,113,189,.12); }
  textarea { resize:vertical; min-height:80px; }
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button { -webkit-appearance:none; }
  input[type="number"] { -moz-appearance:textfield; }
  input[type="date"] { color-scheme:light; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter:none; cursor:pointer; opacity:.6; }

  /* ── Custom time dropdown ── */
  .time-dropdown { position:relative; margin-bottom:1rem; }
  .time-trigger {
    width:100%; padding:.7rem 1rem;
    background:rgba(255,255,255,.9); border:1px solid rgba(66,113,189,.25);
    border-radius:8px; color:#1b2d4b; font-family:'Inter',sans-serif; font-size:.88rem;
    cursor:pointer; display:flex; align-items:center; justify-content:space-between;
    transition:border-color .2s, box-shadow .2s; text-align:left;
  }
  @media(max-width:768px){ .time-trigger{ font-size:1rem; } }
  .time-trigger:focus, .time-trigger:hover { border-color:#4271bd; box-shadow:0 0 0 3px rgba(66,113,189,.12); outline:none; }
  .time-options {
    position:absolute; top:calc(100% + 4px); left:0; right:0; z-index:200;
    background:rgba(255,255,255,.98); border:1px solid rgba(66,113,189,.25);
    border-radius:8px; max-height:200px; overflow-y:auto;
    box-shadow:0 8px 32px rgba(66,113,189,.15);
  }
  .time-options::-webkit-scrollbar { width:4px; }
  .time-options::-webkit-scrollbar-track { background:transparent; }
  .time-options::-webkit-scrollbar-thumb { background:rgba(66,113,189,.25); border-radius:4px; }
  .time-option {
    padding:.55rem 1rem; font-size:.88rem; color:#1b2d4b; cursor:pointer;
    transition:background .15s;
  }
  .time-option:hover { background:rgba(66,113,189,.08); }
  .time-option.active { color:#4271bd; background:rgba(66,113,189,.07); font-weight:600; }
  .row { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  @media(max-width:600px){ .row{ grid-template-columns:1fr; gap:0; } }
  .code-row { display:flex; gap:.5rem; margin-bottom:.25rem; align-items:flex-start; }
  .code-row input { flex:1; margin-bottom:0; }
  @media(max-width:480px){ .code-row{ flex-direction:column; } .code-row input{ width:100%; } .code-row .btn{ width:100%; justify-content:center; } }
  .field-note { font-size:.72rem; color:var(--text-muted); margin-top:-.5rem; margin-bottom:.9rem; }

  /* ── Buttons ── */
  .btn {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.65rem 1.4rem; border:none; cursor:pointer; border-radius:8px;
    font-family:'Orbitron',sans-serif; font-size:.65rem; font-weight:600;
    letter-spacing:.05em; text-transform:uppercase; transition:all .2s; white-space:nowrap;
  }
  .btn-block { width:100%; justify-content:center; }
  .btn-primary  { background:#4271bd; color:#fff; }
  .btn-primary:hover { background:#355b97; transform:translateY(-1px); box-shadow:0 6px 24px rgba(66,113,189,.3); }
  .btn-primary:disabled { background:rgba(66,113,189,.2); color:rgba(27,45,75,.4); cursor:not-allowed; transform:none; box-shadow:none; }
  .btn-green    { background:rgba(66,113,189,.1); color:#4271bd; border:1px solid rgba(66,113,189,.3); }
  .btn-green:hover { background:rgba(66,113,189,.18); transform:translateY(-1px); box-shadow:0 4px 16px rgba(66,113,189,.2); }
  .btn-green:disabled { opacity:.45; cursor:not-allowed; transform:none; box-shadow:none; }
  .btn-danger   { background:rgba(220,38,38,.1); color:#dc2626; border:1px solid rgba(220,38,38,.3); }
  .btn-danger:hover { background:rgba(220,38,38,.18); }
  .btn-danger:disabled { opacity:.45; cursor:not-allowed; }
  .btn-ghost    { background:transparent; color:var(--text-muted); border:1px solid rgba(66,113,189,.22); }
  .btn-ghost:hover { border-color:#4271bd; color:#1b2d4b; background:rgba(66,113,189,.07); }
  .btn-demo     { background:rgba(66,113,189,.1); color:#4271bd; border:1px solid rgba(66,113,189,.28); }
  .btn-demo:hover { background:rgba(66,113,189,.18); border-color:#4271bd; transform:translateY(-1px); }
  .btn-demo:disabled { opacity:.45; cursor:not-allowed; transform:none; }

  /* ── Messages ── */
  .msg-ok  { background:rgba(37,99,235,.07); border:1px solid rgba(37,99,235,.2); color:#1b2d4b; padding:.85rem 1.1rem; margin-bottom:1rem; font-size:.82rem; border-radius:10px; white-space:pre-wrap; }
  .msg-err { background:rgba(220,38,38,.06); border:1px solid rgba(220,38,38,.2); color:#dc2626; padding:.85rem 1.1rem; margin-bottom:1rem; font-size:.82rem; border-radius:10px; }

  /* ── Event list ── */
  .event-card {
    border:1px solid rgba(66,113,189,.18); border-radius:12px; padding:1.25rem;
    margin-bottom:.75rem; transition:all .25s;
    background:rgba(255,255,255,.65);
  }
  .event-card:hover { border-color:rgba(66,113,189,.35); box-shadow:0 4px 20px rgba(66,113,189,.1); }
  .event-name { font-family:'Orbitron',sans-serif; font-size:1rem; font-weight:600; color:#1b2d4b; margin-bottom:.2rem; }
  .event-meta { font-size:.75rem; color:var(--text-muted); margin-bottom:.6rem; line-height:1.5; }
  .event-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; margin-top:.75rem; }

  /* ── Badges ── */
  .badge-live     { display:inline-flex; align-items:center; gap:.35rem; font-size:.72rem; font-weight:600; color:#4271bd; background:rgba(66,113,189,.1); border:1px solid rgba(66,113,189,.28); padding:.2rem .7rem; border-radius:100px; }
  .badge-live::before { content:''; width:6px; height:6px; border-radius:50%; background:#4271bd; animation:pulse 2s infinite; flex-shrink:0; }
  .badge-upcoming { font-size:.72rem; font-weight:500; color:#b45309; background:rgba(180,83,9,.08); border:1px solid rgba(180,83,9,.25); padding:.2rem .7rem; border-radius:100px; }
  .badge-ended    { font-size:.72rem; font-weight:500; color:#5d8ba2; background:rgba(66,113,189,.07); border:1px solid rgba(66,113,189,.15); padding:.2rem .7rem; border-radius:100px; }

  /* ── QR panel ── */
  .qr-panel { text-align:center; padding:.5rem 0; }
  .event-code-display {
    display:inline-block; font-family:'Space Mono',monospace; font-size:1.8rem; font-weight:700;
    color:#4271bd; background:rgba(66,113,189,.08); border:1px solid rgba(66,113,189,.28);
    padding:.5rem 1.75rem; border-radius:10px; letter-spacing:.2em; margin-bottom:1.25rem;
  }
  .qr-img-wrap {
    display:inline-block; padding:1rem; background:#fff; border-radius:12px; margin-bottom:1rem;
    box-shadow:0 8px 40px rgba(66,113,189,.15);
  }
  .blink-url {
    font-family:'Space Mono',monospace; font-size:.65rem; color:var(--text-muted);
    word-break:break-all; padding:.7rem 1rem; background:rgba(255,255,255,.8); border:1px solid rgba(66,113,189,.22);
    border-radius:8px; margin-bottom:.75rem; cursor:pointer; transition:all .2s; text-align:left; display:block;
  }
  .blink-url:hover { border-color:#4271bd; color:#1b2d4b; }

  /* ── How it works ── */
  .how-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:.6rem; }
  @media(max-width:480px){ .how-grid{ grid-template-columns:1fr 1fr; gap:.5rem; } }
  .how-step {
    background:rgba(255,255,255,.6);
    border:1px solid rgba(66,113,189,.16); border-radius:10px; padding:.85rem 1rem;
    transition:all .25s; animation:float 6s ease-in-out infinite;
  }
  .how-step:hover { border-color:rgba(66,113,189,.35); transform:translateY(-3px) !important; }
  .how-num  { font-family:'Orbitron',sans-serif; font-size:.72rem; font-weight:700; color:#4271bd; margin-bottom:.25rem; }
  .how-text { font-size:.72rem; color:var(--text-muted); line-height:1.6; }

  /* ── Connect ── */
  .connect-card { text-align:center; padding:3rem 1.5rem; }
  @media(max-width:480px){ .connect-card{ padding:2rem 1rem; } }
  .connect-card p { font-size:.9rem; color:var(--text-muted); margin-bottom:1.25rem; }
  .connect-card .wallet-adapter-button { width:100%; justify-content:center; max-width:280px; }

  /* ── Events listing (Luma-style) ── */
  .ev-filters { display:flex; gap:.4rem; margin-bottom:1.25rem; flex-wrap:wrap; }
  .ev-filter-btn {
    display:flex; align-items:center; gap:.4rem;
    padding:.3rem .85rem; border-radius:100px;
    border:1px solid rgba(66,113,189,.18); background:rgba(255,255,255,.6);
    color:rgba(27,45,75,.5); font-family:'Orbitron',sans-serif;
    font-size:.72rem; font-weight:600; cursor:pointer; transition:all .2s;
  }
  .ev-filter-btn:hover { border-color:rgba(66,113,189,.35); color:#1b2d4b; }
  .ev-filter-btn.active { background:rgba(66,113,189,.1); border-color:rgba(66,113,189,.4); color:#4271bd; }
  .ev-filter-count {
    background:rgba(66,113,189,.12); color:#4271bd; border-radius:100px;
    padding:0 .45rem; font-size:.65rem; font-weight:700; min-width:18px; text-align:center;
  }
  .ev-filter-btn.active .ev-filter-count { background:rgba(66,113,189,.2); }

  .ev-list { display:flex; flex-direction:column; }
  .ev-month-group { margin-bottom:.75rem; }
  .ev-month-label {
    font-family:'Orbitron',sans-serif; font-size:.65rem; font-weight:700;
    letter-spacing:.1em; text-transform:uppercase; color:#5d8ba2;
    padding:.3rem 0; margin-bottom:.3rem;
    border-bottom:1px solid rgba(66,113,189,.1);
  }

  .ev-row {
    display:grid; grid-template-columns:12px 1fr auto auto auto;
    gap:.75rem; align-items:center; padding:.8rem .6rem;
    border-radius:10px; border:1px solid transparent; transition:all .2s; margin-bottom:.15rem;
  }
  .ev-row:hover { border-color:rgba(66,113,189,.18); background:rgba(255,255,255,.7); }

  .ev-dot {
    width:10px; height:10px; border-radius:50%; flex-shrink:0;
  }
  .ev-dot-live     { background:#4271bd; box-shadow:0 0 8px rgba(66,113,189,.5); animation:pulse 2s infinite; }
  .ev-dot-upcoming { background:#b45309; }
  .ev-dot-ended    { background:#d1dbe8; }

  .ev-main { min-width:0; }
  .ev-title {
    font-family:'Orbitron',sans-serif; font-size:.9rem; font-weight:600; color:#1b2d4b;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  .ev-sub {
    font-size:.7rem; color:#5d8ba2; margin-top:.12rem;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  .ev-code { font-family:'Space Mono',monospace; }
  .ev-sep  { margin:0 .3rem; }

  .ev-date-col {
    font-size:.73rem; color:#5d8ba2; white-space:nowrap;
    font-family:'Orbitron',sans-serif;
  }
  .ev-stat-col {
    font-size:.7rem; color:#5d8ba2; white-space:nowrap;
    font-family:'Space Mono',monospace;
  }

  .btn-checkin {
    display:inline-flex; align-items:center; padding:.3rem .9rem;
    background:#4271bd; color:#fff;
    font-family:'Orbitron',sans-serif; font-size:.74rem; font-weight:600;
    border-radius:100px; text-decoration:none; transition:all .2s; white-space:nowrap;
  }
  .btn-checkin:hover { background:#355b97; transform:translateY(-1px); box-shadow:0 4px 16px rgba(66,113,189,.25); }

  .ev-empty { padding:2rem; text-align:center; color:#5d8ba2; font-size:.82rem; }

  @media(max-width:640px){
    .ev-row { grid-template-columns:10px 1fr auto; }
    .ev-date-col, .ev-stat-col { display:none; }
  }
  @media(max-width:480px){
    .ev-row { grid-template-columns:10px 1fr; gap:.5rem; }
    .ev-cta-col { display:none; }
  }
`;
