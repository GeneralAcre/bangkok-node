export const credentialCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#0a0a0a; color:#e8e8e8; font-family:'DM Sans',sans-serif; min-height:100vh; }

  :root {
    --border:rgba(255,255,255,.08); --border-bright:rgba(255,255,255,.16);
    --surface:rgba(255,255,255,.04); --muted:#888;
    --accent:#ffffff; --accent2:#e8e8e8;
    --accent-dim:rgba(255,255,255,.10); --accent-glow:rgba(255,255,255,.22);
  }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes gradMove { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes orb1     { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.08)} 66%{transform:translate(-30px,30px) scale(.95)} }
  @keyframes orb2     { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,40px) scale(1.05)} 66%{transform:translate(40px,-30px) scale(.97)} }
  @keyframes scanline { 0%{top:-4px} 100%{top:100vh} }

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

  .page { max-width:760px; margin:0 auto; padding:6rem 1.5rem 4rem; position:relative; z-index:1; }
  @media(max-width:768px){ .page{ padding:5rem 1rem 3rem; } }
  @media(max-width:480px){ .page{ padding:4.5rem .75rem 2.5rem; } }

  /* ── Page header ── */
  .cred-eyebrow {
    font-family:'Epilogue',sans-serif; font-size:.68rem; font-weight:700;
    letter-spacing:.14em; text-transform:uppercase; color:#ffffff; margin-bottom:.5rem;
    display:inline-block;
  }
  .cred-title {
    font-family:'Epilogue',sans-serif; font-size:clamp(1.6rem,3.5vw,2.6rem);
    font-weight:900; margin-bottom:.35rem;
    background:linear-gradient(135deg,#ffffff 0%,#ffffff 50%,#e8e8e8 80%);
    background-size:200% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    animation:gradMove 6s ease infinite;
  }
  .cred-subtitle { font-size:.88rem; color:#888; margin-bottom:2rem; }

  /* ── Query bar ── */
  .query-section { margin-bottom:1.5rem; animation:fadeUp .4s ease both; }
  .query-label {
    font-size:.65rem; letter-spacing:.12em; color:#888;
    text-transform:uppercase; margin-bottom:.5rem;
    font-family:'Epilogue',sans-serif; font-weight:700;
  }
  .query-bar {
    display:flex; gap:.5rem; align-items:stretch;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1);
    border-radius:10px; padding:.4rem .4rem .4rem .9rem;
    transition:border-color .2s;
  }
  .query-bar:focus-within { border-color:#ffffff; box-shadow:0 0 0 3px rgba(255,255,255,.12); }
  .query-input {
    flex:1; background:transparent; border:none; outline:none;
    font-family:'Space Mono',monospace; font-size:.82rem; color:#e8e8e8;
    caret-color:#ffffff;
  }
  .query-input::placeholder { color:rgba(255,255,255,.25); }
  @media(max-width:768px){ .query-input{ font-size:1rem; } }
  .query-btn {
    padding:.5rem 1.2rem; background:#ffffff; border:none; border-radius:8px;
    font-family:'Epilogue',sans-serif; font-size:.8rem; font-weight:700;
    color:#0a0a0a; cursor:pointer; transition:all .15s; white-space:nowrap; letter-spacing:.04em; text-transform:uppercase;
  }
  .query-btn:hover { background:#e8e8e8; transform:translateY(-1px); }
  .query-btn:disabled { background:rgba(255,255,255,.2); color:rgba(255,255,255,.3); cursor:not-allowed; transform:none; }
  .demo-wallets { display:flex; gap:.4rem; flex-wrap:wrap; margin-top:.6rem; align-items:center; }
  .demo-label { font-size:.68rem; color:#888; }
  .demo-pill {
    font-size:.65rem; padding:.2rem .65rem; border:1px solid rgba(255,255,255,.1);
    border-radius:100px; background:rgba(255,255,255,.04); color:#888;
    cursor:pointer; font-family:'Epilogue',sans-serif; font-weight:600;
    transition:all .15s; white-space:nowrap; text-transform:uppercase; letter-spacing:.04em;
  }
  .demo-pill:hover { border-color:rgba(255,255,255,.3); color:#e8e8e8; background:rgba(255,255,255,.08); }

  /* ── Credential card ── */
  .cred-card {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    border-radius:20px; padding:1.75rem; margin-bottom:1.25rem;
    display:flex; flex-direction:column; gap:1.25rem;
    animation:fadeUp .4s ease both; backdrop-filter:blur(14px);
    box-shadow:0 2px 16px rgba(0,0,0,.4);
  }
  .cred-card-tier {
    display:inline-flex; align-items:center; gap:.4rem;
    font-family:'Epilogue',sans-serif; font-size:.68rem; font-weight:700;
    letter-spacing:.08em; text-transform:uppercase;
    padding:.28rem .8rem; border-radius:100px; border:1px solid; align-self:flex-start;
  }
  .cred-score-row {
    display:flex; align-items:flex-end; justify-content:space-between; gap:1rem;
  }
  .cred-score-num {
    font-family:'Epilogue',sans-serif; font-size:clamp(2rem,6vw,3.2rem);
    font-weight:900; line-height:1; letter-spacing:-.02em;
    background:linear-gradient(135deg,#e8e8e8 0%,#ffffff 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .cred-score-lbl {
    font-size:.68rem; color:#888; text-transform:uppercase;
    letter-spacing:.12em; margin-top:.3rem;
    font-family:'Epilogue',sans-serif; font-weight:600;
  }
  .cred-wallet-addr {
    font-family:'Space Mono',monospace; font-size:.72rem; color:#888;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
    padding:.35rem .75rem; border-radius:8px; white-space:nowrap; align-self:flex-end;
  }

  .cred-progress-wrap { display:flex; flex-direction:column; gap:.4rem; }
  .cred-progress-track {
    height:6px; background:rgba(255,255,255,.08); border-radius:100px; overflow:hidden;
  }
  .cred-progress-fill { height:100%; border-radius:100px; transition:width 1s ease; }
  .cred-progress-labels {
    display:flex; justify-content:space-between;
    font-size:.62rem; color:#888;
  }

  .cred-stats-row {
    display:flex; align-items:center; gap:.75rem;
    padding-top:1rem; border-top:1px solid rgba(255,255,255,.07);
  }
  .cred-stat { display:flex; flex-direction:column; gap:.2rem; flex:1; }
  .cred-stat-val {
    font-family:'Epilogue',sans-serif; font-size:.88rem; font-weight:700;
    color:#e8e8e8; line-height:1;
  }
  .cred-stat-lbl {
    font-size:.6rem; color:#888; text-transform:uppercase; letter-spacing:.08em;
  }
  .cred-stat-divider { width:1px; height:28px; background:rgba(255,255,255,.08); flex-shrink:0; }
  @media(max-width:480px){
    .cred-stats-row { display:grid; grid-template-columns:1fr 1fr; gap:.85rem; }
    .cred-stat-divider { display:none; }
  }

  .cred-last-event {
    font-size:.75rem; color:#888;
    border-top:1px solid rgba(255,255,255,.07); padding-top:.75rem;
    margin-top:-.25rem;
  }
  .cred-last-event span { color:#ffffff; font-family:'Space Mono',monospace; }

  /* ── Tier ladder ── */
  .tier-ladder {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    border-radius:20px; padding:1.5rem; margin-bottom:1.25rem;
    animation:fadeUp .4s ease both; backdrop-filter:blur(14px);
    box-shadow:0 2px 16px rgba(0,0,0,.4);
  }
  .tier-ladder-title {
    font-family:'Epilogue',sans-serif; font-size:.68rem; font-weight:700;
    letter-spacing:.1em; text-transform:uppercase; color:#888;
    margin-bottom:1rem;
  }
  .tier-steps { display:grid; grid-template-columns:repeat(6,1fr); gap:.6rem; }
  @media(max-width:540px){ .tier-steps{ grid-template-columns:repeat(3,1fr); } }
  .tier-step {
    padding:.7rem .4rem; border:1px solid rgba(255,255,255,.07); border-radius:12px;
    text-align:center; transition:all .2s; background:rgba(255,255,255,.02);
    display:flex; flex-direction:column; gap:.3rem; align-items:center;
  }
  .tier-step-icon { font-size:1rem; color:#888; transition:color .2s; }
  .tier-step-name {
    font-family:'Epilogue',sans-serif; font-size:.6rem; font-weight:700;
    letter-spacing:.04em; color:#888; text-transform:uppercase; transition:color .2s;
  }
  .tier-step-score { font-size:.55rem; color:rgba(136,136,136,.5); letter-spacing:.04em; }

  /* ── Shimmer ── */
  .shimmer {
    background:linear-gradient(90deg,#161616 25%,#202020 50%,#161616 75%);
    background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px;
  }

  /* ── Error / empty ── */
  .error-box {
    padding:.85rem 1.1rem; border:1px solid rgba(220,38,38,.3); border-radius:10px;
    font-size:.85rem; color:#f87171; background:rgba(220,38,38,.1); margin-bottom:1rem;
  }
  .cred-empty {
    text-align:center; padding:4rem 1rem;
    font-size:.85rem; color:#888;
  }
`;