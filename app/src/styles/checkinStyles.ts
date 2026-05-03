export const checkinCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#0a0a0a; color:#e8e8e8; font-family:'DM Sans',sans-serif; min-height:100vh; }
  :root {
    --accent:#ffffff; --accent2:#e8e8e8;
    --accent-dim:rgba(255,255,255,.10); --accent-border:rgba(255,255,255,.25);
    --surface:rgba(255,255,255,.04); --border:rgba(255,255,255,.08); --muted:#888;
  }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{opacity:.7} 50%{opacity:1} }
  @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes pop     { 0%{transform:scale(.8);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
  @keyframes confetti{
    0%  { transform:translateY(0) rotate(0deg);   opacity:1; }
    100%{ transform:translateY(120vh) rotate(720deg); opacity:0; }
  }

  .page { max-width:600px; margin:0 auto; padding:6rem 1.5rem 3rem; }

  .checkin-card {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:20px;
    padding:2.5rem 2rem; text-align:center;
    animation:fadeUp .5s ease both; backdrop-filter:blur(16px);
    box-shadow:0 4px 24px rgba(0,0,0,.4);
  }

  .event-badge {
    display:inline-flex; align-items:center; gap:.4rem;
    background:var(--accent-dim); border:1px solid var(--accent-border);
    color:var(--accent2); font-size:.78rem; font-weight:600; letter-spacing:.06em;
    padding:.35rem 1rem; border-radius:100px; margin-bottom:1.5rem;
    font-family:'Epilogue',sans-serif; text-transform:uppercase;
  }
  .event-badge-live { background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.3); color:#ffffff; }
  .live-dot { width:6px; height:6px; border-radius:50%; background:#ffffff; animation:pulse 2s infinite; }

  .event-title {
    font-family:'Epilogue',sans-serif; font-size:1.75rem; font-weight:800;
    color:#e8e8e8; margin-bottom:.6rem; line-height:1.2;
  }
  .event-meta { font-size:.88rem; color:#888; line-height:1.8; margin-bottom:2rem; }
  .event-code {
    font-family:'Space Mono',monospace; display:inline-block;
    background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.2); border-radius:8px;
    padding:.3rem .9rem; font-size:.8rem; color:#ffffff; letter-spacing:.15em;
    margin-bottom:2rem;
  }

  .btn-checkin {
    width:100%; padding:1rem; background:#ffffff; color:#0a0a0a; border:none;
    font-family:'Epilogue',sans-serif; font-size:1.05rem; font-weight:800;
    border-radius:12px; cursor:pointer; transition:all .2s; letter-spacing:.02em;
    display:flex; align-items:center; justify-content:center; gap:.5rem;
  }
  .btn-checkin:hover { background:#e8e8e8; transform:translateY(-1px); box-shadow:0 8px 30px rgba(255,255,255,.3); }
  .btn-checkin:disabled { background:rgba(255,255,255,.2); color:rgba(255,255,255,.3); cursor:not-allowed; transform:none; box-shadow:none; }

  .msg-err { background:rgba(220,38,38,.1); border:1px solid rgba(220,38,38,.25); color:#f87171; padding:.85rem 1.1rem; border-radius:10px; font-size:.85rem; margin-top:1rem; }

  .success-card {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.2); border-radius:20px;
    padding:3rem 2rem; text-align:center; animation:pop .5s ease both;
    backdrop-filter:blur(16px); box-shadow:0 4px 24px rgba(255,255,255,.1);
  }
  .success-icon { font-size:3.5rem; margin-bottom:1rem; display:block; }
  .success-title {
    font-family:'Epilogue',sans-serif; font-size:1.6rem; font-weight:800;
    color:#ffffff; margin-bottom:.6rem;
  }
  .success-sub { font-size:.92rem; color:#888; line-height:1.7; margin-bottom:2rem; }
  .btn-profile {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.85rem 2rem; background:#ffffff; color:#0a0a0a; border:none;
    font-family:'Epilogue',sans-serif; font-size:.95rem; font-weight:800;
    border-radius:10px; cursor:pointer; text-decoration:none; transition:all .2s;
  }
  .btn-profile:hover { background:#e8e8e8; transform:translateY(-1px); }
  .tx-link { display:block; font-size:.72rem; color:#888; margin-top:1rem; font-family:'Space Mono',monospace; word-break:break-all; }
  .tx-link a { color:#ffffff; }

  .confetti-piece {
    position:fixed; width:10px; height:10px; border-radius:2px;
    animation:confetti 3s ease-in forwards;
    pointer-events:none; z-index:999;
  }

  .connect-prompt { text-align:center; padding:1.5rem 0; }
  .connect-prompt p { font-size:.9rem; color:#888; margin-bottom:1.25rem; }

  .info-text { font-size:.9rem; color:#888; text-align:center; padding:2rem 0; }
  .error-big { font-size:1.1rem; color:#f87171; text-align:center; padding:2rem 0; }
`;