export const credentialCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#f4f7fb; color:#1b2d4b; font-family:'Inter',sans-serif; min-height:100vh; }

  :root {
    --g:#1b2d4b; --p:#4271bd; --p2:#4b88b4;
    --g-dim:rgba(27,45,75,.07); --p-dim:rgba(66,113,189,.10);
    --g-glow:rgba(27,45,75,.12); --p-glow:rgba(66,113,189,.22);
    --surface:rgba(66,113,189,.07); --surface2:rgba(66,113,189,.13);
    --border:rgba(66,113,189,.18); --border-hi:rgba(66,113,189,.38);
    --muted:#5d8ba2; --text-dim:#4b88b4;
    --amber:#d97706; --red:#dc2626; --blue:#1d4ed8; --purple:#7c3aed;
    --acc:#4271bd;
  }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse    { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes gradMove { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes orb1     { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.08)} 66%{transform:translate(-30px,30px) scale(.95)} }
  @keyframes orb2     { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,40px) scale(1.05)} 66%{transform:translate(40px,-30px) scale(.97)} }
  @keyframes scanline { 0%{top:-4px} 100%{top:100vh} }

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

  .page { max-width:860px; margin:0 auto; padding:6rem 1.5rem 4rem; position:relative; z-index:1; }
  @media(max-width:768px){ .page{ padding:5rem 1rem 3rem; } }
  @media(max-width:480px){ .page{ padding:4.5rem .75rem 2.5rem; } }

  /* ── Page header ── */
  .cred-eyebrow {
    font-family:'Space Grotesk',sans-serif; font-size:.7rem; font-weight:700;
    letter-spacing:.14em; text-transform:uppercase; color:#4271bd; margin-bottom:.5rem;
  }
  .cred-title {
    font-family:'Space Grotesk',sans-serif; font-size:2rem; font-weight:700; margin-bottom:.3rem;
    background:linear-gradient(135deg,#1b2d4b 0%,#4271bd 50%,#4b88b4 80%);
    background-size:200% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    animation:gradMove 6s ease infinite;
  }
  @media(max-width:480px){ .cred-title{ font-size:1.5rem; } }
  .cred-subtitle { font-size:.82rem; color:#5d8ba2; margin-bottom:2rem; }
  .cred-subtitle span { color:#4271bd; }

  /* ── Query bar ── */
  .query-section { margin-bottom:1.5rem; animation:fadeUp .4s ease both; }
  .query-label {
    font-size:.65rem; letter-spacing:.12em; color:#5d8ba2;
    text-transform:uppercase; margin-bottom:.5rem;
    font-family:'Space Grotesk',sans-serif; font-weight:700;
  }
  .query-bar {
    display:flex; gap:.5rem; align-items:stretch;
    background:rgba(255,255,255,.85); border:1px solid rgba(66,113,189,.25);
    border-radius:10px; padding:.4rem .4rem .4rem .9rem;
    transition:border-color .2s;
  }
  .query-bar:focus-within { border-color:#4271bd; box-shadow:0 0 0 3px rgba(66,113,189,.12); }
  .query-input {
    flex:1; background:transparent; border:none; outline:none;
    font-family:'Space Mono',monospace; font-size:.82rem; color:#1b2d4b;
    caret-color:#4271bd;
  }
  .query-input::placeholder { color:rgba(27,45,75,.35); }
  @media(max-width:768px){ .query-input{ font-size:1rem; } }
  .query-btn {
    padding:.5rem 1.2rem; background:#4271bd; border:none; border-radius:8px;
    font-family:'Space Grotesk',sans-serif; font-size:.78rem; font-weight:700;
    color:#fff; cursor:pointer; transition:all .15s; white-space:nowrap; letter-spacing:.04em;
  }
  .query-btn:hover { background:#355b97; transform:translateY(-1px); }
  .query-btn:disabled { background:rgba(66,113,189,.2); color:rgba(27,45,75,.4); cursor:not-allowed; transform:none; }
  .demo-wallets { display:flex; gap:.4rem; flex-wrap:wrap; margin-top:.6rem; align-items:center; }
  .demo-label { font-size:.68rem; color:#5d8ba2; }
  .demo-pill {
    font-size:.68rem; padding:.2rem .65rem; border:1px solid rgba(66,113,189,.2);
    border-radius:100px; background:rgba(255,255,255,.7); color:#5d8ba2;
    cursor:pointer; font-family:'Space Grotesk',sans-serif; font-weight:500;
    transition:all .15s; white-space:nowrap;
  }
  .demo-pill:hover { border-color:rgba(66,113,189,.4); color:#1b2d4b; background:rgba(66,113,189,.08); }

  /* ── Cards ── */
  .term-box {
    background:rgba(255,255,255,.78); backdrop-filter:blur(16px);
    border:1px solid rgba(66,113,189,.18); border-radius:16px;
    margin-bottom:1.25rem; overflow:hidden; animation:fadeUp .4s ease both;
    transition:border-color .25s; box-shadow:0 2px 12px rgba(66,113,189,.07);
  }
  .term-box:hover { border-color:rgba(66,113,189,.35); }
  .term-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:.65rem 1.25rem; border-bottom:1px solid rgba(66,113,189,.14);
    background:rgba(66,113,189,.05);
  }
  .term-header-dots { display:flex; gap:.35rem; }
  .term-dot { width:9px; height:9px; border-radius:50%; }
  .term-dot-r { background:rgba(220,38,38,.4); }
  .term-dot-y { background:rgba(217,119,6,.4); }
  .term-dot-g { background:rgba(66,113,189,.35); }
  .term-title {
    font-family:'Space Grotesk',sans-serif; font-size:.65rem; font-weight:700;
    letter-spacing:.1em; color:#4271bd; text-transform:uppercase;
  }
  .term-badge {
    font-size:.6rem; padding:.2rem .6rem; border-radius:100px;
    font-weight:700; letter-spacing:.08em; font-family:'Space Grotesk',sans-serif;
    border:1px solid currentColor;
  }
  .term-badge-tier { color:var(--amber); border-color:rgba(217,119,6,.35); background:rgba(217,119,6,.08); }

  /* ── KV rows ── */
  .kv-grid { padding:.85rem 1.25rem; display:flex; flex-direction:column; gap:0; }
  .kv-row {
    display:grid; grid-template-columns:150px 1fr; gap:.75rem;
    padding:.35rem 0; border-bottom:1px solid rgba(66,113,189,.1); align-items:start;
  }
  .kv-row:last-child { border-bottom:none; }
  @media(max-width:480px){ .kv-row{ grid-template-columns:110px 1fr; } }
  .kv-key { font-family:'Space Mono',monospace; font-size:.68rem; color:#5d8ba2; padding-top:.05rem; }
  .kv-val { font-family:'Space Mono',monospace; font-size:.68rem; color:#1b2d4b; word-break:break-all; line-height:1.5; }
  .kv-val.green  { color:#059669; }
  .kv-val.amber  { color:var(--amber); }
  .kv-val.blue   { color:var(--blue); }
  .kv-val.purple { color:var(--purple); }
  .kv-val.dim    { color:#5d8ba2; }

  /* ── Score bar ── */
  .score-section { padding:.75rem 1.25rem; border-top:1px solid rgba(66,113,189,.12); }
  .score-nums {
    display:flex; justify-content:space-between; margin-bottom:.4rem;
    font-family:'Space Grotesk',sans-serif; font-size:.68rem; color:#5d8ba2;
  }
  .score-nums .score-current { color:#1b2d4b; font-weight:600; }
  .score-track { height:5px; background:rgba(66,113,189,.15); border-radius:100px; overflow:hidden; }
  .score-fill  { height:100%; background:linear-gradient(90deg,#4271bd,#4b88b4); border-radius:100px; transition:width 1s ease; }

  /* ── ZK Proof section ── */
  .proof-header {
    padding:.65rem 1.25rem; border-bottom:1px solid rgba(66,113,189,.14);
    background:rgba(66,113,189,.05); display:flex; align-items:center; gap:.5rem;
  }
  .proof-ok {
    font-family:'Space Grotesk',sans-serif; font-size:.65rem; font-weight:700;
    letter-spacing:.1em; color:#4271bd; text-transform:uppercase;
  }
  .proof-dot { width:6px; height:6px; border-radius:50%; background:#4271bd; animation:pulse 2s infinite; flex-shrink:0; }
  .proof-grid { padding:.85rem 1.25rem; display:flex; flex-direction:column; gap:.5rem; }
  .proof-row { display:grid; grid-template-columns:44px 1fr; gap:.5rem; }
  .proof-key { font-family:'Space Mono',monospace; font-size:.65rem; color:#5d8ba2; padding-top:.1rem; }
  .proof-val { font-family:'Space Mono',monospace; font-size:.63rem; color:#4271bd; word-break:break-all; line-height:1.55; }
  .proof-val.nested { display:flex; flex-direction:column; gap:.2rem; }
  .proof-val .nested-row { display:flex; gap:.4rem; }
  .proof-val .nested-row span { color:#5d8ba2; min-width:22px; font-size:.6rem; }

  /* ── Tier progression ── */
  .tier-prog-section { padding:.85rem 1.25rem; }
  .tier-steps { display:grid; grid-template-columns:repeat(6,1fr); gap:.4rem; }
  @media(max-width:480px){ .tier-steps{ grid-template-columns:repeat(3,1fr); } }
  .tier-step {
    padding:.55rem .3rem; border:1px solid rgba(66,113,189,.15); border-radius:10px;
    text-align:center; transition:all .2s; background:rgba(66,113,189,.04);
  }
  .tier-step.reached { border-color:rgba(66,113,189,.3); background:rgba(66,113,189,.08); }
  .tier-step.current { border-color:var(--amber); background:rgba(217,119,6,.08); }
  .tier-step-icon { font-size:.9rem; margin-bottom:.2rem; }
  .tier-step-name {
    font-family:'Space Grotesk',sans-serif; font-size:.56rem; font-weight:700;
    letter-spacing:.06em; color:#5d8ba2; text-transform:uppercase;
  }
  .tier-step.reached .tier-step-name { color:#4271bd; }
  .tier-step.current .tier-step-name { color:var(--amber); }

  /* ── Tier Gate Verifier ── */
  .gate-section { padding:.85rem 1.25rem; }
  .gate-wallet-input {
    width:100%; padding:.7rem 1rem; background:rgba(255,255,255,.9);
    border:1px solid rgba(66,113,189,.25); border-radius:8px; outline:none;
    font-family:'Space Mono',monospace; font-size:.82rem; color:#1b2d4b;
    margin-bottom:.85rem; transition:border-color .2s;
  }
  @media(max-width:768px){ .gate-wallet-input{ font-size:1rem; } }
  .gate-wallet-input:focus { border-color:#4271bd; box-shadow:0 0 0 3px rgba(66,113,189,.12); }
  .gate-wallet-input::placeholder { color:rgba(27,45,75,.35); }
  .tier-btns { display:flex; gap:.4rem; flex-wrap:wrap; margin-bottom:.85rem; }
  .tier-btn {
    padding:.4rem .85rem; border-radius:8px; border:1px solid rgba(66,113,189,.2);
    background:rgba(255,255,255,.7); font-family:'Space Grotesk',sans-serif; font-size:.72rem; font-weight:600;
    color:#5d8ba2; cursor:pointer; transition:all .15s; display:flex; align-items:center; gap:.3rem;
  }
  .tier-btn:hover { border-color:#4271bd; color:#1b2d4b; background:rgba(66,113,189,.08); }
  .tier-btn.selected { border-color:var(--amber); color:var(--amber); background:rgba(217,119,6,.07); }
  .verify-btn {
    width:100%; padding:.7rem; background:#4271bd; border:none; border-radius:8px;
    font-family:'Space Grotesk',sans-serif; font-size:.85rem; font-weight:700;
    color:#fff; letter-spacing:.05em; cursor:pointer; transition:all .18s;
  }
  .verify-btn:hover { background:#355b97; box-shadow:0 4px 16px rgba(66,113,189,.3); }
  .verify-btn:disabled { background:rgba(66,113,189,.2); color:rgba(27,45,75,.4); cursor:not-allowed; box-shadow:none; }

  /* ── Gate result ── */
  .gate-result {
    margin-top:.85rem; padding:.85rem 1.1rem; border-radius:10px;
    font-family:'Space Mono',monospace; font-size:.7rem; line-height:1.9;
    animation:fadeUp .2s ease both;
  }
  .gate-result.pass { border:1px solid rgba(5,150,105,.25); background:rgba(5,150,105,.07); }
  .gate-result.fail { border:1px solid rgba(220,38,38,.2); background:rgba(220,38,38,.05); }
  .gate-result-title {
    font-family:'Space Grotesk',sans-serif; font-weight:700; letter-spacing:.08em;
    margin-bottom:.6rem; font-size:.72rem;
  }
  .gate-result.pass .gate-result-title { color:#059669; }
  .gate-result.fail .gate-result-title  { color:var(--red); }
  .gate-kv { display:grid; grid-template-columns:140px 1fr; gap:.2rem; }
  .gate-key { color:#5d8ba2; }
  .gate-val-pass { color:#059669; font-weight:700; }
  .gate-val-fail { color:var(--red); font-weight:700; }

  /* ── Bottom stats ── */
  .bottom-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:.85rem; margin-top:.5rem; }
  @media(max-width:480px){ .bottom-stats{ grid-template-columns:1fr; } }
  .stat-box {
    text-align:center; padding:1.1rem .85rem;
    background:rgba(255,255,255,.75); backdrop-filter:blur(16px);
    border:1px solid rgba(66,113,189,.18); border-radius:16px;
    animation:fadeUp .4s ease both; box-shadow:0 2px 8px rgba(66,113,189,.06);
  }
  .stat-num {
    font-family:'Space Grotesk',sans-serif; font-size:1.3rem; font-weight:700; margin-bottom:.3rem;
  }
  .stat-num.green  { color:#059669; }
  .stat-num.amber  { color:var(--amber); }
  .stat-num.blue   { color:var(--blue); }
  .stat-desc { font-size:.65rem; color:#5d8ba2; line-height:1.6; }

  /* ── Shimmer ── */
  .shimmer { background:linear-gradient(90deg,#e8eef8 25%,#cdd9ef 50%,#e8eef8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }

  /* ── Error / message ── */
  .error-box { padding:.85rem 1.1rem; border:1px solid rgba(220,38,38,.2); border-radius:10px; font-size:.82rem; color:var(--red); background:rgba(220,38,38,.05); margin-bottom:1rem; }

  /* ── Cursor blink ── */
  .cursor { display:inline-block; width:7px; height:1em; background:#4271bd; margin-left:3px; animation:blink 1s step-end infinite; vertical-align:-.05em; border-radius:1px; }

  /* ── Wallet address pill ── */
  .wallet-pill {
    display:inline-flex; align-items:center; gap:.4rem;
    font-family:'Space Mono',monospace; font-size:.7rem; color:#4271bd;
  }
`;
