export const checkinCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Space+Mono&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#000; color:#fff; font-family:'Inter',sans-serif; min-height:100vh; }
  :root {
    --green:#8CE9A4; --purple:#7A57E9;
    --green-dim:#8CE9A415; --purple-dim:#7A57E915;
    --green-border:#8CE9A440; --purple-border:#7A57E940;
    --surface:#0a0a0f; --border:#1e1e2e; --muted:#6b7280;
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
    background:var(--surface); border:1px solid var(--border); border-radius:20px;
    padding:2.5rem 2rem; text-align:center;
    animation:fadeUp .5s ease both;
  }

  .event-badge {
    display:inline-flex; align-items:center; gap:.4rem;
    background:var(--purple-dim); border:1px solid var(--purple-border);
    color:var(--purple); font-size:.75rem; font-weight:600; letter-spacing:.08em;
    padding:.35rem 1rem; border-radius:100px; margin-bottom:1.5rem;
    font-family:'Space Grotesk',sans-serif;
  }
  .event-badge-live { background:var(--green-dim); border-color:var(--green-border); color:var(--green); }
  .live-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse 2s infinite; }

  .event-title {
    font-family:'Space Grotesk',sans-serif; font-size:1.75rem; font-weight:700;
    color:#fff; margin-bottom:.6rem; line-height:1.2;
  }
  .event-meta { font-size:.85rem; color:var(--muted); line-height:1.8; margin-bottom:2rem; }
  .event-code {
    font-family:'Space Mono',monospace; display:inline-block;
    background:#111; border:1px solid var(--border); border-radius:8px;
    padding:.3rem .9rem; font-size:.8rem; color:var(--purple); letter-spacing:.15em;
    margin-bottom:2rem;
  }

  .btn-checkin {
    width:100%; padding:1rem; background:var(--purple); color:#fff; border:none;
    font-family:'Space Grotesk',sans-serif; font-size:1.05rem; font-weight:700;
    border-radius:12px; cursor:pointer; transition:all .2s; letter-spacing:.03em;
    display:flex; align-items:center; justify-content:center; gap:.5rem;
  }
  .btn-checkin:hover { background:#8B6EF0; transform:translateY(-1px); box-shadow:0 8px 30px #7A57E950; }
  .btn-checkin:disabled { background:#2d2060; color:#6b7280; cursor:not-allowed; transform:none; box-shadow:none; }

  .msg-err { background:#1a0a0f; border:1px solid #7f1d1d; color:#f87171; padding:.85rem 1.1rem; border-radius:10px; font-size:.85rem; margin-top:1rem; }

  .success-card {
    background:var(--surface); border:1px solid var(--green-border); border-radius:20px;
    padding:3rem 2rem; text-align:center; animation:pop .5s ease both;
  }
  .success-icon { font-size:3.5rem; margin-bottom:1rem; display:block; }
  .success-title {
    font-family:'Space Grotesk',sans-serif; font-size:1.6rem; font-weight:700;
    color:var(--green); margin-bottom:.6rem;
  }
  .success-sub { font-size:.9rem; color:var(--muted); line-height:1.7; margin-bottom:2rem; }
  .btn-profile {
    display:inline-flex; align-items:center; gap:.5rem;
    padding:.85rem 2rem; background:var(--purple); color:#fff; border:none;
    font-family:'Space Grotesk',sans-serif; font-size:.95rem; font-weight:700;
    border-radius:10px; cursor:pointer; text-decoration:none; transition:all .2s;
  }
  .btn-profile:hover { background:#8B6EF0; transform:translateY(-1px); }
  .tx-link { display:block; font-size:.72rem; color:var(--muted); margin-top:1rem; font-family:'Space Mono',monospace; word-break:break-all; }
  .tx-link a { color:var(--purple); }

  .confetti-piece {
    position:fixed; width:10px; height:10px; border-radius:2px;
    animation:confetti 3s ease-in forwards;
    pointer-events:none; z-index:999;
  }

  .connect-prompt { text-align:center; padding:1.5rem 0; }
  .connect-prompt p { font-size:.9rem; color:var(--muted); margin-bottom:1.25rem; }

  .info-text { font-size:.9rem; color:var(--muted); text-align:center; padding:2rem 0; }
  .error-big { font-size:1.1rem; color:#f87171; text-align:center; padding:2rem 0; }
`;
