export const organizerCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #000; color: #fff; font-family: 'Inter', sans-serif; min-height: 100vh; }

  :root {
    --g: #8CE9A4; --p: #7A57E9; --white: #FFFFFF; --black: #000;
    --g-dim: #8CE9A415; --p-dim: #7A57E915;
    --g-border: #8CE9A440; --p-border: #7A57E940;
    --p-glow: #7A57E930; --g-glow: #8CE9A430;
    --surface: rgba(10,10,15,.7); --surface2: rgba(17,17,24,.8); --border: rgba(30,30,46,.8);
    --text-muted: #6b7280; --text-dim: #374151;
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
  .orb1 { width:500px; height:500px; background:#7A57E9; opacity:.1; top:-150px; left:-100px; animation:orb1 20s ease-in-out infinite; }
  .orb2 { width:400px; height:400px; background:#8CE9A4; opacity:.08; bottom:-100px; right:-50px; animation:orb2 25s ease-in-out infinite; }
  .orb3 { width:300px; height:300px; background:#7A57E9; opacity:.06; top:40%; left:60%; animation:orb1 30s ease-in-out infinite reverse; }

  /* Grid overlay */
  .grid-bg {
    position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:
      linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
    background-size:60px 60px;
  }

  .scanline {
    position:fixed; top:0; left:0; right:0; height:2px; z-index:999; pointer-events:none;
    background:linear-gradient(transparent,#7A57E918,transparent);
    animation:scanline 10s linear infinite;
  }

  .nav {
    position:sticky; top:0; z-index:100;
    background:transparent; backdrop-filter:blur(0px);
    padding:0 2.5rem;
  }
  .nav-inner {
    max-width:1400px; margin:0 auto;
    display:flex; align-items:center; justify-content:space-between; height:80px;
  }
  .nav-brand { text-decoration:none; display:flex; align-items:center; }
  .nav-brand img { height:56px; display:block; }
  .nav-links { display:flex; gap:.3rem; align-items:center; }
  .nav-link {
    font-family:'Space Grotesk',sans-serif; font-size:.78rem; font-weight:500;
    color:rgba(255,255,255,.5); text-decoration:none; padding:.3rem .7rem;
    border-radius:6px; transition:all .2s;
  }
  .nav-link:hover { color:#fff; }
  .nav-link.active { color:#fff; }
  @media(max-width:600px){.nav-link:not(.active){display:none}}

  .page { max-width:1400px; margin:0 auto; padding:6rem 2.5rem 2rem; position:relative; z-index:1; }
  @media(max-width:768px){ .page{ padding:5rem 1.25rem 2rem; } }

  .page-header { margin-bottom:2rem; animation:fadeUp .5s ease both; }
  .page-title {
    font-family:'Space Grotesk',sans-serif; font-size:2rem; font-weight:700; margin-bottom:.4rem;
    background:linear-gradient(135deg,#fff 0%,#c4b5fd 40%,var(--p) 65%,var(--g) 90%);
    background-size:200% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    animation:gradMove 6s ease infinite;
  }
  .page-sub { font-size:.85rem; color:var(--text-muted); }

  .card {
    background:rgba(10,10,15,.6); backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.06); border-radius:16px;
    padding:1.5rem; margin-bottom:1.25rem; animation:fadeUp .5s ease both;
    transition:border-color .3s, box-shadow .3s;
  }
  .card:hover { border-color:rgba(122,87,233,.2); box-shadow:0 8px 40px rgba(0,0,0,.4); }
  .card-title {
    font-family:'Space Grotesk',sans-serif; font-size:.78rem; font-weight:600;
    color:var(--p); letter-spacing:.1em; text-transform:uppercase; margin-bottom:1.25rem;
  }

  label {
    display:block; font-size:.78rem; font-weight:500; color:#9ca3af;
    margin-bottom:.4rem; letter-spacing:.03em;
  }
  input, textarea {
    width:100%; padding:.7rem 1rem; background:rgba(17,17,24,.8); border:1px solid rgba(30,30,46,.8);
    border-radius:8px; color:#fff; font-family:'Inter',sans-serif; font-size:.88rem;
    margin-bottom:1rem; transition:border-color .2s, box-shadow .2s; outline:none;
  }
  input:focus, textarea:focus { border-color:var(--p); box-shadow:0 0 0 3px var(--p-dim); }
  textarea { resize:vertical; min-height:80px; }
  .row { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  @media(max-width:520px){.row{grid-template-columns:1fr}}
  .field-note { font-size:.72rem; color:var(--text-muted); margin-top:-.5rem; margin-bottom:.9rem; }

  .btn {
    display:inline-flex; align-items:center; gap:.4rem;
    padding:.65rem 1.4rem; border:none; cursor:pointer; border-radius:8px;
    font-family:'Space Grotesk',sans-serif; font-size:.85rem; font-weight:600;
    letter-spacing:.03em; transition:all .2s;
  }
  .btn-primary  { background:var(--p); color:#fff; }
  .btn-primary:hover { background:#8B6EF0; transform:translateY(-1px); box-shadow:0 6px 24px var(--p-glow); }
  .btn-primary:disabled { background:#2d2060; color:#6b7280; cursor:not-allowed; transform:none; box-shadow:none; }
  .btn-green    { background:var(--g-dim); color:var(--g); border:1px solid var(--g-border); }
  .btn-green:hover { background:#8CE9A425; transform:translateY(-1px); box-shadow:0 4px 16px var(--g-glow); }
  .btn-green:disabled { opacity:.5; cursor:not-allowed; transform:none; box-shadow:none; }
  .btn-danger   { background:#1a0010; color:#f87171; border:1px solid #7f1d1d; }
  .btn-danger:hover { background:#2d0018; }
  .btn-danger:disabled { opacity:.5; cursor:not-allowed; }
  .btn-ghost    { background:transparent; color:#9ca3af; border:1px solid rgba(30,30,46,.8); }
  .btn-ghost:hover { border-color:var(--p); color:var(--p); background:var(--p-dim); }
  .btn-demo     { background:var(--g-dim); color:var(--g); border:1px solid var(--g-border); }
  .btn-demo:hover { background:#8CE9A425; border-color:var(--g); transform:translateY(-1px); box-shadow:0 4px 20px var(--g-glow); }
  .btn-demo:disabled { opacity:.5; cursor:not-allowed; transform:none; }

  .msg-ok  { background:rgba(10,31,15,.8); backdrop-filter:blur(10px); border:1px solid #166534; color:var(--g); padding:.85rem 1.1rem; margin-bottom:1rem; font-size:.82rem; border-radius:10px; white-space:pre-wrap; }
  .msg-err { background:rgba(26,10,15,.8); backdrop-filter:blur(10px); border:1px solid #7f1d1d; color:#f87171; padding:.85rem 1.1rem; margin-bottom:1rem; font-size:.82rem; border-radius:10px; }

  .event-card {
    border:1px solid rgba(30,30,46,.8); border-radius:12px; padding:1.25rem;
    margin-bottom:.75rem; transition:all .25s;
    background:rgba(17,17,24,.4); backdrop-filter:blur(10px);
  }
  .event-card:hover { border-color:var(--p-border); background:rgba(122,87,233,.04); box-shadow:0 4px 20px rgba(0,0,0,.4); }
  .event-name { font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:600; color:#fff; margin-bottom:.2rem; }
  .event-meta { font-size:.75rem; color:var(--text-muted); margin-bottom:.6rem; line-height:1.5; }
  .event-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; margin-top:.75rem; }

  .badge-live     { display:inline-flex; align-items:center; gap:.35rem; font-size:.72rem; font-weight:600; color:var(--g); background:var(--g-dim); border:1px solid var(--g-border); padding:.2rem .7rem; border-radius:100px; }
  .badge-live::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--g); animation:pulse 2s infinite; flex-shrink:0; }
  .badge-upcoming { font-size:.72rem; font-weight:500; color:#fbbf24; background:#fbbf2415; border:1px solid #fbbf2440; padding:.2rem .7rem; border-radius:100px; }
  .badge-ended    { font-size:.72rem; font-weight:500; color:#374151; background:#11111a; border:1px solid #1e1e2e; padding:.2rem .7rem; border-radius:100px; }

  .qr-panel { text-align:center; padding:.5rem 0; }
  .event-code-display {
    display:inline-block; font-family:'Space Mono',monospace; font-size:1.8rem; font-weight:700;
    color:var(--p); background:var(--p-dim); border:1px solid var(--p-border);
    padding:.5rem 1.75rem; border-radius:10px; letter-spacing:.2em; margin-bottom:1.25rem;
  }
  .qr-img-wrap {
    display:inline-block; padding:1rem; background:#fff; border-radius:12px; margin-bottom:1rem;
    box-shadow:0 8px 40px #7A57E940;
  }
  .blink-url {
    font-family:'Space Mono',monospace; font-size:.65rem; color:var(--text-muted);
    word-break:break-all; padding:.7rem 1rem; background:rgba(17,17,24,.8); border:1px solid rgba(30,30,46,.8);
    border-radius:8px; margin-bottom:.75rem; cursor:pointer; transition:all .2s; text-align:left; display:block;
  }
  .blink-url:hover { border-color:var(--p); color:var(--p); }

  .how-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:.75rem; }
  .how-step {
    background:rgba(17,17,24,.5); backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,.05); border-radius:10px; padding:.85rem 1rem;
    transition:all .25s; animation:float 6s ease-in-out infinite;
  }
  .how-step:hover { border-color:var(--p-border); transform:translateY(-3px) !important; box-shadow:0 8px 24px rgba(0,0,0,.5); }
  .how-num  { font-family:'Space Grotesk',sans-serif; font-size:.72rem; font-weight:700; color:var(--p); margin-bottom:.25rem; }
  .how-text { font-size:.72rem; color:var(--text-muted); line-height:1.6; }

  .connect-card { text-align:center; padding:4rem 1.5rem; }
  .connect-card p { font-size:.9rem; color:var(--text-muted); margin-bottom:1.5rem; }

  .wallet-adapter-button {
    background:rgba(122,87,233,.25) !important; color:#fff !important;
    font-family:'Space Grotesk',sans-serif !important; font-size:.72rem !important;
    font-weight:600 !important; border-radius:20px !important;
    padding:.3rem .85rem !important; height:auto !important;
    border:1px solid rgba(122,87,233,.4) !important; min-width:0 !important;
  }
  .wallet-adapter-button:hover { background:rgba(122,87,233,.45) !important; }
  .wallet-adapter-button-start-icon { width:16px !important; height:16px !important; margin-right:6px !important; }
`;
