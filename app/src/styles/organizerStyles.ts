export const organizerCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #1F2C35; color: #D1D8B4; font-family: 'Inter', sans-serif; min-height: 100vh; }

  :root {
    --g: #D1D8B4; --p: #5C7580;
    --g-dim: #D1D8B415; --p-dim: #5C758015;
    --g-border: #D1D8B440; --p-border: #5C758045;
    --p-glow: #5C758030; --g-glow: #D1D8B430;
    --surface: rgba(64,81,91,.22); --surface2: rgba(64,81,91,.32); --border: rgba(64,81,91,.55);
    --text-muted: #879989; --text-dim: #5C7580;
  }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse     { 0%,100%{opacity:.7} 50%{opacity:1} }
  @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes scanline  { 0%{top:-4px} 100%{top:100vh} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes orb1      { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.08)} 66%{transform:translate(-30px,30px) scale(.95)} }
  @keyframes orb2      { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,40px) scale(1.05)} 66%{transform:translate(40px,-30px) scale(.97)} }
  @keyframes gradMove  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

  /* Ambient orbs */
  .orb-wrap { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
  .orb { position:absolute; border-radius:50%; filter:blur(80px); }
  .orb1 { width:500px; height:500px; background:#285B73; opacity:.18; top:-150px; left:-100px; animation:orb1 20s ease-in-out infinite; }
  .orb2 { width:400px; height:400px; background:#879989; opacity:.12; bottom:-100px; right:-50px; animation:orb2 25s ease-in-out infinite; }
  .orb3 { width:300px; height:300px; background:#40515B; opacity:.12; top:40%; left:60%; animation:orb1 30s ease-in-out infinite reverse; }

  /* Grid overlay */
  .grid-bg {
    position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:
      linear-gradient(rgba(209,216,180,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(209,216,180,.03) 1px, transparent 1px);
    background-size:60px 60px;
  }

  .scanline {
    position:fixed; top:0; left:0; right:0; height:2px; z-index:999; pointer-events:none;
    background:linear-gradient(transparent,#5C758020,transparent);
    animation:scanline 10s linear infinite;
  }

  .page { max-width:860px; margin:0 auto; padding:6rem 1.5rem 3rem; position:relative; z-index:1; }
  @media(max-width:768px){ .page{ padding:5rem 1.25rem 2rem; } }

  .page-header { margin-bottom:2rem; animation:fadeUp .5s ease both; }
  .page-title {
    font-family:'Space Grotesk',sans-serif; font-size:2rem; font-weight:700; margin-bottom:.3rem;
    background:linear-gradient(135deg,#D1D8B4 0%,#879989 40%,var(--p) 70%);
    background-size:200% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    animation:gradMove 6s ease infinite;
  }
  .page-sub { font-size:.85rem; color:var(--text-muted); }

  /* ── Cards ── */
  .card {
    background:var(--surface); backdrop-filter:blur(16px);
    border:1px solid var(--border); border-radius:16px;
    padding:1.5rem; margin-bottom:1.25rem; animation:fadeUp .5s ease both;
    transition:border-color .25s;
  }
  .card:hover { border-color:rgba(92,117,128,.5); }
  .card-title {
    font-family:'Space Grotesk',sans-serif; font-size:.72rem; font-weight:700;
    color:var(--p); letter-spacing:.12em; text-transform:uppercase; margin-bottom:1.25rem;
  }

  /* ── Form ── */
  label {
    display:block; font-size:.78rem; font-weight:500; color:var(--text-muted);
    margin-bottom:.4rem; letter-spacing:.02em;
  }
  input, textarea {
    width:100%; padding:.7rem 1rem;
    background:rgba(31,44,53,.8); border:1px solid rgba(64,81,91,.6);
    border-radius:8px; color:#D1D8B4; font-family:'Inter',sans-serif; font-size:.88rem;
    margin-bottom:1rem; transition:border-color .2s, box-shadow .2s; outline:none;
  }
  input::placeholder, textarea::placeholder { color:#40515B; }
  input:focus, textarea:focus { border-color:var(--p); box-shadow:0 0 0 3px var(--p-dim); }
  textarea { resize:vertical; min-height:80px; }
  input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter:invert(.6); cursor:pointer; }
  .row { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  @media(max-width:520px){.row{grid-template-columns:1fr}}
  .field-note { font-size:.72rem; color:var(--text-muted); margin-top:-.5rem; margin-bottom:.9rem; }

  /* ── Buttons ── */
  .btn {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.65rem 1.4rem; border:none; cursor:pointer; border-radius:8px;
    font-family:'Space Grotesk',sans-serif; font-size:.85rem; font-weight:600;
    letter-spacing:.03em; transition:all .2s;
  }
  .btn-primary  { background:var(--p); color:#D1D8B4; }
  .btn-primary:hover { background:#6b8a99; transform:translateY(-1px); box-shadow:0 6px 24px var(--p-glow); }
  .btn-primary:disabled { background:#253340; color:#40515B; cursor:not-allowed; transform:none; box-shadow:none; }
  .btn-green    { background:var(--g-dim); color:var(--g); border:1px solid var(--g-border); }
  .btn-green:hover { background:#D1D8B425; transform:translateY(-1px); box-shadow:0 4px 16px var(--g-glow); }
  .btn-green:disabled { opacity:.45; cursor:not-allowed; transform:none; box-shadow:none; }
  .btn-danger   { background:rgba(127,29,29,.25); color:#f87171; border:1px solid rgba(127,29,29,.5); }
  .btn-danger:hover { background:rgba(127,29,29,.4); }
  .btn-danger:disabled { opacity:.45; cursor:not-allowed; }
  .btn-ghost    { background:transparent; color:var(--text-muted); border:1px solid rgba(64,81,91,.6); }
  .btn-ghost:hover { border-color:var(--p); color:#D1D8B4; background:var(--p-dim); }
  .btn-demo     { background:var(--g-dim); color:var(--g); border:1px solid var(--g-border); }
  .btn-demo:hover { background:#D1D8B425; border-color:var(--g); transform:translateY(-1px); }
  .btn-demo:disabled { opacity:.45; cursor:not-allowed; transform:none; }

  /* ── Messages ── */
  .msg-ok  { background:rgba(40,75,55,.35); border:1px solid rgba(209,216,180,.25); color:#D1D8B4; padding:.85rem 1.1rem; margin-bottom:1rem; font-size:.82rem; border-radius:10px; white-space:pre-wrap; }
  .msg-err { background:rgba(127,29,29,.2); border:1px solid rgba(248,113,113,.25); color:#f87171; padding:.85rem 1.1rem; margin-bottom:1rem; font-size:.82rem; border-radius:10px; }

  /* ── Event list ── */
  .event-card {
    border:1px solid var(--border); border-radius:12px; padding:1.25rem;
    margin-bottom:.75rem; transition:all .25s;
    background:rgba(40,91,115,.1);
  }
  .event-card:hover { border-color:rgba(92,117,128,.5); box-shadow:0 4px 20px rgba(31,44,53,.4); }
  .event-name { font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:600; color:#D1D8B4; margin-bottom:.2rem; }
  .event-meta { font-size:.75rem; color:var(--text-muted); margin-bottom:.6rem; line-height:1.5; }
  .event-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; margin-top:.75rem; }

  /* ── Badges ── */
  .badge-live     { display:inline-flex; align-items:center; gap:.35rem; font-size:.72rem; font-weight:600; color:var(--g); background:var(--g-dim); border:1px solid var(--g-border); padding:.2rem .7rem; border-radius:100px; }
  .badge-live::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--g); animation:pulse 2s infinite; flex-shrink:0; }
  .badge-upcoming { font-size:.72rem; font-weight:500; color:#fbbf24; background:#fbbf2415; border:1px solid #fbbf2440; padding:.2rem .7rem; border-radius:100px; }
  .badge-ended    { font-size:.72rem; font-weight:500; color:#879989; background:rgba(64,81,91,.2); border:1px solid rgba(64,81,91,.5); padding:.2rem .7rem; border-radius:100px; }

  /* ── QR panel ── */
  .qr-panel { text-align:center; padding:.5rem 0; }
  .event-code-display {
    display:inline-block; font-family:'Space Mono',monospace; font-size:1.8rem; font-weight:700;
    color:var(--p); background:var(--p-dim); border:1px solid var(--p-border);
    padding:.5rem 1.75rem; border-radius:10px; letter-spacing:.2em; margin-bottom:1.25rem;
  }
  .qr-img-wrap {
    display:inline-block; padding:1rem; background:#fff; border-radius:12px; margin-bottom:1rem;
    box-shadow:0 8px 40px rgba(40,91,115,.4);
  }
  .blink-url {
    font-family:'Space Mono',monospace; font-size:.65rem; color:var(--text-muted);
    word-break:break-all; padding:.7rem 1rem; background:rgba(31,44,53,.8); border:1px solid rgba(64,81,91,.6);
    border-radius:8px; margin-bottom:.75rem; cursor:pointer; transition:all .2s; text-align:left; display:block;
  }
  .blink-url:hover { border-color:var(--p); color:#D1D8B4; }

  /* ── How it works ── */
  .how-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:.75rem; }
  .how-step {
    background:rgba(40,91,115,.12);
    border:1px solid rgba(64,81,91,.45); border-radius:10px; padding:.85rem 1rem;
    transition:all .25s; animation:float 6s ease-in-out infinite;
  }
  .how-step:hover { border-color:rgba(92,117,128,.5); transform:translateY(-3px) !important; }
  .how-num  { font-family:'Space Grotesk',sans-serif; font-size:.72rem; font-weight:700; color:var(--p); margin-bottom:.25rem; }
  .how-text { font-size:.72rem; color:var(--text-muted); line-height:1.6; }

  /* ── Connect ── */
  .connect-card { text-align:center; padding:4rem 1.5rem; }
  .connect-card p { font-size:.9rem; color:var(--text-muted); margin-bottom:1.5rem; }
`;
