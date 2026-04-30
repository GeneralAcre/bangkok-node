export const profileCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#f4f7fb; color:#1b2d4b; font-family:'Inter',sans-serif; min-height:100vh; }

  @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes fadeIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow     { 0%,100%{box-shadow:0 0 0 0 rgba(66,113,189,0)} 50%{box-shadow:0 0 16px 2px rgba(66,113,189,.2)} }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

  .page {
    max-width:860px; margin:0 auto;
    padding:96px 24px 80px;
    animation:fadeIn .35s ease both;
    position:relative; z-index:1;
  }
  .section { margin-bottom:32px; }

  /* ── Cards ── */
  .card {
    background:rgba(255,255,255,.78); border:0.5px solid rgba(66,113,189,.18); border-radius:12px; padding:20px;
    backdrop-filter:blur(12px); box-shadow:0 2px 10px rgba(66,113,189,.06);
  }
  .card-sm { background:rgba(255,255,255,.78); border:0.5px solid rgba(66,113,189,.18); border-radius:12px; padding:16px; backdrop-filter:blur(12px); }

  /* ── Eyebrow labels ── */
  .eyebrow {
    font-size:11px; font-weight:600; color:#5d8ba2; letter-spacing:.1em;
    text-transform:uppercase; margin-bottom:14px;
  }

  /* ── Identity header ── */
  .identity-row {
    display:flex; align-items:center; gap:14px; margin-bottom:14px; flex-wrap:wrap;
  }
  .avatar {
    width:48px; height:48px; border-radius:50%; flex-shrink:0;
    background:rgba(66,113,189,.1); border:0.5px solid rgba(66,113,189,.3);
    display:flex; align-items:center; justify-content:center;
    font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:700; color:#4271bd;
  }
  .identity-body { flex:1; min-width:0; }
  .identity-name {
    font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:600; color:#1b2d4b;
    margin-bottom:3px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;
  }
  .tier-badge {
    display:inline-flex; align-items:center; gap:5px;
    background:rgba(66,113,189,.1); color:#4271bd; border-radius:20px;
    font-size:11px; font-weight:600; padding:3px 10px; white-space:nowrap;
    border:0.5px solid rgba(66,113,189,.3);
  }
  .wallet-row {
    display:flex; align-items:center; gap:6px; margin-top:2px;
  }
  .wallet-mono {
    font-family:'Space Mono',monospace; font-size:11px; color:#5d8ba2;
  }
  .copy-icon {
    background:none; border:none; color:#5d8ba2; cursor:pointer; padding:0; font-size:12px;
    line-height:1; transition:color .15s; display:flex; align-items:center;
  }
  .copy-icon:hover { color:#1b2d4b; }
  .copy-icon.did-copy { color:#4271bd; }
  .identity-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:12px; }
  .btn-secondary {
    background:transparent; border:0.5px solid rgba(66,113,189,.25); color:#5d8ba2; border-radius:8px;
    font-family:'Space Grotesk',sans-serif; font-size:12px; font-weight:500;
    padding:6px 14px; cursor:pointer; transition:all .15s; display:inline-flex; align-items:center; gap:5px;
  }
  .btn-secondary:hover { border-color:rgba(66,113,189,.5); color:#1b2d4b; }
  .btn-secondary.did-copy { border-color:rgba(66,113,189,.4); color:#4271bd; }
  .sol-chip {
    display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:500;
    padding:4px 10px; border-radius:20px;
  }
  .sol-ok  { color:#059669; background:rgba(5,150,105,.08); border:0.5px solid rgba(5,150,105,.25); }
  .sol-low { color:#dc2626; background:rgba(220,38,38,.06); border:0.5px solid rgba(220,38,38,.2); }

  /* ── 2-column profile top layout ── */
  .profile-top {
    display:grid; grid-template-columns:1.3fr 1fr; gap:12px;
    margin-bottom:32px; align-items:start;
  }
  @media(max-width:640px) { .profile-top { grid-template-columns:1fr; } }
  .profile-left { display:flex; flex-direction:column; }
  .profile-right {
    display:flex; flex-direction:column; align-items:center; text-align:center;
  }
  .stat-grid-2 {
    display:grid; grid-template-columns:repeat(2,1fr); gap:10px;
    margin-top:20px; width:100%;
  }

  /* ── Score hero ── */
  .score-hero {
    display:flex; flex-direction:column; align-items:center;
    padding:32px 20px 28px; background:rgba(255,255,255,.78); border:0.5px solid rgba(66,113,189,.18); border-radius:12px;
    margin-bottom:32px; backdrop-filter:blur(12px);
  }
  .score-num {
    font-family:'Space Grotesk',sans-serif; font-size:56px; font-weight:500;
    color:#4271bd; line-height:1; margin-bottom:8px; letter-spacing:-1px;
  }
  .score-label {
    font-size:12px; color:#5d8ba2; letter-spacing:.08em; text-transform:uppercase;
    margin-bottom:20px;
  }
  .prog-wrap { width:100%; max-width:320px; margin-bottom:8px; }
  .prog-track {
    height:3px; background:rgba(66,113,189,.15); border-radius:2px; overflow:hidden; width:100%;
  }
  .prog-fill { height:100%; background:#4271bd; border-radius:2px; transition:width .8s ease; }
  .prog-label { font-size:11px; color:#5d8ba2; text-align:center; margin-top:6px; }

  /* ── Stat grid ── */
  .stat-grid {
    display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:32px;
  }
  @media(max-width:540px){ .stat-grid{ grid-template-columns:repeat(2,1fr); } }
  .stat-card {
    background:rgba(255,255,255,.78); border:0.5px solid rgba(66,113,189,.18); border-radius:12px; padding:16px;
    backdrop-filter:blur(10px);
  }
  .stat-val {
    font-family:'Space Grotesk',sans-serif; font-size:24px; font-weight:500;
    color:#1b2d4b; line-height:1; margin-bottom:6px;
  }
  .stat-lbl { font-size:11px; color:#5d8ba2; font-weight:500; }

  /* ── Tabs ── */
  .tabs { display:flex; gap:0; border-bottom:0.5px solid rgba(66,113,189,.15); margin-bottom:16px; }
  .tab-btn {
    background:none; border:none; padding:10px 16px; font-family:'Inter',sans-serif;
    font-size:13px; font-weight:500; cursor:pointer; transition:color .15s;
    border-bottom:1.5px solid transparent; margin-bottom:-0.5px;
  }
  .tab-btn.active { color:#4271bd; border-bottom-color:#4271bd; }
  .tab-btn:not(.active) { color:#5d8ba2; }
  .tab-btn:not(.active):hover { color:#1b2d4b; }

  /* ── Event rows ── */
  .event-list { display:flex; flex-direction:column; gap:0; }
  .event-row {
    display:flex; align-items:center; gap:12px; padding:14px 0;
    border-bottom:0.5px solid rgba(66,113,189,.1);
  }
  .event-row:last-child { border-bottom:none; }
  .event-left { flex:1; min-width:0; }
  .event-name {
    font-size:14px; color:#1b2d4b; font-weight:500; white-space:nowrap;
    overflow:hidden; text-overflow:ellipsis; margin-bottom:3px;
  }
  .event-date { font-size:12px; color:#5d8ba2; }
  .event-tags { display:flex; gap:5px; align-items:center; flex-shrink:0; flex-wrap:wrap; }
  .tag {
    display:inline-flex; align-items:center;
    background:rgba(66,113,189,.1); color:#4271bd; border-radius:20px;
    font-size:11px; font-weight:600; padding:3px 10px; white-space:nowrap;
  }
  .tag-hackathon { background:rgba(124,58,237,.08); color:#7c3aed; border-radius:20px; font-size:10px; font-weight:600; padding:2px 8px; }
  .nft-thumb {
    width:36px; height:36px; border-radius:6px; background:rgba(66,113,189,.1);
    flex-shrink:0; display:flex; align-items:center; justify-content:center;
    overflow:hidden;
  }
  .nft-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
  .nft-thumb-placeholder { flex-shrink:0; display:flex; align-items:center; }

  /* ── Claim button ── */
  .btn-claim {
    display:inline-flex; align-items:center; gap:5px; white-space:nowrap;
    padding:5px 12px; background:rgba(66,113,189,.1); color:#4271bd;
    border:0.5px solid rgba(66,113,189,.3); font-family:'Space Grotesk',sans-serif;
    font-size:12px; font-weight:600; border-radius:8px; cursor:pointer; transition:all .2s;
    animation:glow 3s ease-in-out infinite;
  }
  .btn-claim:hover { background:rgba(66,113,189,.2); border-color:#4271bd; animation:none; }
  .btn-claim:disabled { background:rgba(66,113,189,.05); color:#5d8ba2; border-color:rgba(66,113,189,.15); cursor:not-allowed; animation:none; }
  .nft-minted-link {
    display:inline-flex; align-items:center; gap:4px; white-space:nowrap;
    padding:5px 10px; background:transparent; color:#4271bd;
    font-size:11px; font-weight:600; text-decoration:none; border-radius:6px; transition:color .15s;
  }
  .nft-minted-link:hover { color:#1b2d4b; text-decoration:none; }

  /* ── NFT gallery ── */
  .nft-gallery { margin-bottom:32px; }
  .nft-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  @media(max-width:480px){ .nft-grid{ grid-template-columns:repeat(2,1fr); } }
  .nft-card {
    background:rgba(255,255,255,.78); border:0.5px solid rgba(66,113,189,.18); border-radius:12px; overflow:hidden;
    text-decoration:none; display:block; transition:border-color .2s;
    backdrop-filter:blur(10px);
  }
  .nft-card:hover { border-color:rgba(66,113,189,.38); text-decoration:none; }
  .nft-square {
    width:100%; aspect-ratio:1; background:rgba(66,113,189,.06); display:flex;
    align-items:center; justify-content:center; overflow:hidden;
  }
  .nft-square img { width:100%; height:100%; object-fit:cover; display:block; }
  .nft-square-placeholder {
    width:100%; height:100%; display:flex; align-items:center; justify-content:center;
    font-size:24px; color:rgba(66,113,189,.3);
  }
  .nft-body { padding:12px; }
  .nft-title { font-size:13px; color:#1b2d4b; font-weight:500; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .nft-date2 { font-size:11px; color:#5d8ba2; margin-bottom:3px; }
  .nft-edition { font-size:11px; color:#4271bd; font-weight:600; }

  /* ── Notices ── */
  .msg-err { background:rgba(220,38,38,.06); border:0.5px solid rgba(220,38,38,.2); color:#dc2626; padding:12px 14px; margin-bottom:16px; font-size:13px; border-radius:10px; }
  .msg-ok  { background:rgba(66,113,189,.07); border:0.5px solid rgba(66,113,189,.25); color:#4271bd; padding:12px 14px; margin-bottom:16px; font-size:13px; border-radius:10px; }

  /* ── Empty / connect ── */
  .center-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:16px; text-align:center; padding:0 24px; }
  .center-wrap p { font-size:14px; color:#5d8ba2; }
  .empty-text { font-size:13px; color:#5d8ba2; text-align:center; padding:24px 0; }

  /* ── Not registered card ── */
  .register-card { padding:24px; }
  .register-title { font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:600; color:#1b2d4b; margin-bottom:6px; }
  .register-sub   { font-size:13px; color:#5d8ba2; line-height:1.6; margin-bottom:20px; }
  .btn-primary {
    display:inline-flex; align-items:center; gap:5px;
    padding:9px 18px; background:#4271bd; color:#fff; border:none;
    font-family:'Space Grotesk',sans-serif; font-size:13px; font-weight:600;
    border-radius:8px; cursor:pointer; transition:background .15s;
  }
  .btn-primary:hover { background:#355b97; }
  .btn-primary:disabled { background:rgba(66,113,189,.2); color:rgba(27,45,75,.4); cursor:not-allowed; }
  .btn-faucet {
    display:inline-flex; align-items:center; gap:5px;
    padding:9px 18px; background:transparent; color:#d97706; border:0.5px solid rgba(217,119,6,.35);
    font-family:'Space Grotesk',sans-serif; font-size:13px; font-weight:600;
    border-radius:8px; cursor:pointer; text-decoration:none; transition:all .15s;
  }
  .btn-faucet:hover { background:rgba(217,119,6,.07); }

  /* ── Org event row ── */
  .org-row {
    display:flex; align-items:center; gap:10px; padding:14px 0;
    border-bottom:0.5px solid rgba(66,113,189,.1); flex-wrap:wrap;
  }
  .org-row:last-child { border-bottom:none; }
  .org-left { flex:1; min-width:0; }
  .org-actions { display:flex; gap:6px; align-items:center; flex-shrink:0; flex-wrap:wrap; }
  .btn-org {
    padding:4px 10px; background:rgba(66,113,189,.1); color:#4271bd;
    border:0.5px solid rgba(66,113,189,.3); border-radius:6px;
    font-family:'Space Grotesk',sans-serif; font-size:11px; font-weight:600;
    cursor:pointer; transition:all .15s; white-space:nowrap;
  }
  .btn-org:hover { background:rgba(66,113,189,.2); border-color:#4271bd; }
  .btn-org:disabled { background:rgba(66,113,189,.05); color:#5d8ba2; border-color:rgba(66,113,189,.15); cursor:not-allowed; }
  .btn-org-danger {
    padding:4px 10px; background:transparent; color:#dc2626;
    border:0.5px solid rgba(220,38,38,.25); border-radius:6px;
    font-family:'Space Grotesk',sans-serif; font-size:11px; font-weight:600;
    cursor:pointer; transition:all .15s; white-space:nowrap;
  }
  .btn-org-danger:hover { background:rgba(220,38,38,.07); }
  .btn-org-danger:disabled { opacity:.4; cursor:not-allowed; }
  .org-badge-live     { font-size:10px; font-weight:600; color:#4271bd; background:rgba(66,113,189,.1); border:0.5px solid rgba(66,113,189,.3); padding:2px 8px; border-radius:20px; }
  .org-badge-upcoming { font-size:10px; font-weight:500; color:#d97706; background:rgba(217,119,6,.08); border:0.5px solid rgba(217,119,6,.28); padding:2px 8px; border-radius:20px; }
  .org-badge-ended    { font-size:10px; font-weight:500; color:#5d8ba2; background:rgba(66,113,189,.06); border:0.5px solid rgba(66,113,189,.14); padding:2px 8px; border-radius:20px; }

  /* ── Inline QR ── */
  .org-qr-panel {
    background:rgba(66,113,189,.05); border:0.5px solid rgba(66,113,189,.2); border-radius:10px;
    padding:16px; margin-top:12px; text-align:center;
  }
  .org-qr-wrap {
    display:inline-block; padding:10px; background:#fff; border-radius:8px; margin-bottom:10px;
    box-shadow:0 4px 16px rgba(66,113,189,.1);
  }
  .org-qr-url {
    font-family:'Space Mono',monospace; font-size:10px; color:#5d8ba2;
    word-break:break-all; background:rgba(255,255,255,.8); border:0.5px solid rgba(66,113,189,.2);
    border-radius:6px; padding:6px 10px; margin-bottom:8px; cursor:pointer;
    display:block; transition:color .15s;
  }
  .org-qr-url:hover { color:#4271bd; }

  /* ── Activity heatmap ── */
  .heatmap { margin-bottom:32px; }
  .heatmap-months-row { display:flex; margin-bottom:3px; }
  .heatmap-weeks-labels { display:flex; }
  .heatmap-month-cell {
    width:13px; font-size:9px; color:#5d8ba2;
    font-family:'Space Mono',monospace; flex-shrink:0;
    overflow:visible; white-space:nowrap; pointer-events:none;
  }
  .heatmap-body-row { display:flex; gap:6px; align-items:flex-start; }
  .heatmap-day-labels {
    display:flex; flex-direction:column; gap:2px;
    width:22px; flex-shrink:0; padding-top:1px;
  }
  .heatmap-day-labels span {
    height:11px; font-size:9px; color:#5d8ba2;
    font-family:'Space Mono',monospace;
    display:flex; align-items:center; line-height:1;
  }
  .heatmap-weeks-grid { display:flex; gap:2px; overflow-x:auto; }
  .heatmap-week { display:flex; flex-direction:column; gap:2px; flex-shrink:0; }
  .heatmap-day {
    width:11px; height:11px; border-radius:2px; flex-shrink:0;
    background:#e8eef8; border:0.5px solid rgba(66,113,189,.15);
    transition:border-color .1s; cursor:default;
  }
  .heatmap-day:not(.future):hover { border-color:rgba(66,113,189,.4); }
  .heatmap-day.future { opacity:0; pointer-events:none; }
  .heatmap-day[data-count="1"] { background:rgba(66,113,189,.2); border-color:rgba(66,113,189,.3); }
  .heatmap-day[data-count="2"] { background:rgba(66,113,189,.4); border-color:rgba(66,113,189,.5); }
  .heatmap-day[data-count="3"] { background:rgba(66,113,189,.65); border-color:#4271bd; }
  .heatmap-day[data-count="4"] { background:#4271bd; border-color:#355b97; }
  .heatmap-legend {
    display:flex; align-items:center; gap:3px;
    margin-top:8px; justify-content:flex-end;
  }
  .heatmap-legend-label { font-size:9px; color:#5d8ba2; font-family:'Space Mono',monospace; }
  .heatmap-legend-cell { width:10px; height:10px; border-radius:2px; }

  /* ── Inline stats ── */
  .inline-stats {
    display:flex; gap:20px; margin-top:14px; padding-top:14px;
    border-top:0.5px solid rgba(66,113,189,.12); flex-wrap:wrap;
  }
  .inline-stat { display:flex; flex-direction:column; gap:3px; }
  .inline-stat-val {
    font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:600;
    color:#1b2d4b; line-height:1;
  }
  .inline-stat-lbl {
    font-size:10px; color:#5d8ba2; font-weight:500;
    text-transform:uppercase; letter-spacing:.08em;
  }

  /* ── Shimmer ── */
  .shimmer {
    background:linear-gradient(90deg,#e8eef8 25%,#cdd9ef 50%,#e8eef8 75%);
    background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px;
  }
`;
