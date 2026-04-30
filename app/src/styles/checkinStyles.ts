export const checkinCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Space+Mono&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#f4f7fb; color:#1b2d4b; font-family:'Inter',sans-serif; min-height:100vh; }
  :root {
    --blue:#4271bd; --blue2:#4b88b4;
    --blue-dim:rgba(66,113,189,.10); --blue-border:rgba(66,113,189,.28);
    --surface:rgba(255,255,255,.75); --border:rgba(66,113,189,.18); --muted:#5d8ba2;
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
    background:rgba(255,255,255,.8); border:1px solid rgba(66,113,189,.18); border-radius:20px;
    padding:2.5rem 2rem; text-align:center;
    animation:fadeUp .5s ease both; backdrop-filter:blur(16px);
    box-shadow:0 4px 24px rgba(66,113,189,.1);
  }

  .event-badge {
    display:inline-flex; align-items:center; gap:.4rem;
    background:var(--blue-dim); border:1px solid var(--blue-border);
    color:var(--blue2); font-size:.75rem; font-weight:600; letter-spacing:.08em;
    padding:.35rem 1rem; border-radius:100px; margin-bottom:1.5rem;
    font-family:'Space Grotesk',sans-serif;
  }
  .event-badge-live { background:rgba(66,113,189,.1); border-color:rgba(66,113,189,.35); color:#4271bd; }
  .live-dot { width:6px; height:6px; border-radius:50%; background:#4271bd; animation:pulse 2s infinite; }

  .event-title {
    font-family:'Space Grotesk',sans-serif; font-size:1.75rem; font-weight:700;
    color:#1b2d4b; margin-bottom:.6rem; line-height:1.2;
  }
  .event-meta { font-size:.85rem; color:#5d8ba2; line-height:1.8; margin-bottom:2rem; }
  .event-code {
    font-family:'Space Mono',monospace; display:inline-block;
    background:rgba(66,113,189,.08); border:1px solid rgba(66,113,189,.22); border-radius:8px;
    padding:.3rem .9rem; font-size:.8rem; color:#4271bd; letter-spacing:.15em;
    margin-bottom:2rem;
  }

  .btn-checkin {
    width:100%; padding:1rem; background:#4271bd; color:#fff; border:none;
    font-family:'Space Grotesk',sans-serif; font-size:1.05rem; font-weight:700;
    border-radius:12px; cursor:pointer; transition:all .2s; letter-spacing:.03em;
    display:flex; align-items:center; justify-content:center; gap:.5rem;
  }
  .btn-checkin:hover { background:#355b97; transform:translateY(-1px); box-shadow:0 8px 30px rgba(66,113,189,.3); }
  .btn-checkin:disabled { background:rgba(66,113,189,.2); color:rgba(27,45,75,.4); cursor:not-allowed; transform:none; box-shadow:none; }

  .msg-err { background:rgba(220,38,38,.06); border:1px solid rgba(220,38,38,.2); color:#dc2626; padding:.85rem 1.1rem; border-radius:10px; font-size:.85rem; margin-top:1rem; }

  .success-card {
    background:rgba(255,255,255,.85); border:1px solid rgba(66,113,189,.28); border-radius:20px;
    padding:3rem 2rem; text-align:center; animation:pop .5s ease both;
    backdrop-filter:blur(16px); box-shadow:0 4px 24px rgba(66,113,189,.12);
  }
  .success-icon { font-size:3.5rem; margin-bottom:1rem; display:block; }
  .success-title {
    font-family:'Space Grotesk',sans-serif; font-size:1.6rem; font-weight:700;
    color:#4271bd; margin-bottom:.6rem;
  }
  .success-sub { font-size:.9rem; color:#5d8ba2; line-height:1.7; margin-bottom:2rem; }
  .btn-profile {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.85rem 2rem; background:#4271bd; color:#fff; border:none;
    font-family:'Space Grotesk',sans-serif; font-size:.95rem; font-weight:700;
    border-radius:10px; cursor:pointer; text-decoration:none; transition:all .2s;
  }
  .btn-profile:hover { background:#355b97; transform:translateY(-1px); }
  .tx-link { display:block; font-size:.72rem; color:#5d8ba2; margin-top:1rem; font-family:'Space Mono',monospace; word-break:break-all; }
  .tx-link a { color:#4271bd; }

  .confetti-piece {
    position:fixed; width:10px; height:10px; border-radius:2px;
    animation:confetti 3s ease-in forwards;
    pointer-events:none; z-index:999;
  }

  .connect-prompt { text-align:center; padding:1.5rem 0; }
  .connect-prompt p { font-size:.9rem; color:#5d8ba2; margin-bottom:1.25rem; }

  .info-text { font-size:.9rem; color:#5d8ba2; text-align:center; padding:2rem 0; }
  .error-big { font-size:1.1rem; color:#dc2626; text-align:center; padding:2rem 0; }
`;
