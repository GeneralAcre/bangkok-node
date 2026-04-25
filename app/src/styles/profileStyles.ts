export const profileCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#0a0a0a; color:#fff; font-family:'Inter',sans-serif; min-height:100vh; }

  @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes fadeIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow     { 0%,100%{box-shadow:0 0 0 0 #1D9E7500} 50%{box-shadow:0 0 16px 2px #1D9E7530} }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

  /* ── Nav ── */
  .nav {
    position:sticky; top:0; z-index:100; background:#0a0a0a;
    border-bottom:0.5px solid #1a1a1a; padding:0 24px;
  }
  .nav-inner {
    max-width:860px; margin:0 auto;
    display:flex; align-items:center; justify-content:space-between; height:60px;
  }
  .nav-brand { text-decoration:none; display:flex; align-items:center; }
  .nav-brand img { height:44px; display:block; }
  .nav-links { display:flex; gap:.25rem; align-items:center; }
  .nav-link {
    font-family:'Space Grotesk',sans-serif; font-size:.75rem; font-weight:500;
    color:#555; text-decoration:none; padding:.3rem .65rem; border-radius:6px; transition:color .15s;
  }
  .nav-link:hover { color:#fff; }
  .nav-link.active { color:#fff; }
  @media(max-width:600px){ .nav-link:not(.active){ display:none; } }
  .wallet-adapter-button {
    background:rgba(29,158,117,.15) !important; color:#fff !important;
    font-family:'Space Grotesk',sans-serif !important; font-size:.72rem !important;
    font-weight:600 !important; border-radius:20px !important;
    padding:.28rem .8rem !important; height:auto !important;
    border:0.5px solid rgba(29,158,117,.35) !important; min-width:0 !important;
  }
  .wallet-adapter-button:hover { background:rgba(29,158,117,.28) !important; }
  .wallet-adapter-button-start-icon { width:14px !important; height:14px !important; margin-right:5px !important; }

  /* ── Page shell ── */
  .page {
    max-width:860px; margin:0 auto;
    padding:48px 24px 80px;
    animation:fadeIn .35s ease both;
  }
  .section { margin-bottom:32px; }

  /* ── Cards ── */
  .card {
    background:#111; border:0.5px solid #222; border-radius:12px; padding:20px;
  }
  .card-sm { background:#111; border:0.5px solid #222; border-radius:12px; padding:16px; }

  /* ── Eyebrow labels ── */
  .eyebrow {
    font-size:11px; font-weight:600; color:#555; letter-spacing:.1em;
    text-transform:uppercase; margin-bottom:14px;
  }

  /* ── Identity header ── */
  .identity-row {
    display:flex; align-items:center; gap:14px; margin-bottom:14px; flex-wrap:wrap;
  }
  .avatar {
    width:48px; height:48px; border-radius:50%; flex-shrink:0;
    background:#1D9E7520; border:0.5px solid #1D9E7540;
    display:flex; align-items:center; justify-content:center;
    font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:700; color:#1D9E75;
  }
  .identity-body { flex:1; min-width:0; }
  .identity-name {
    font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:600; color:#fff;
    margin-bottom:3px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;
  }
  .tier-badge {
    display:inline-flex; align-items:center; gap:5px;
    background:#1D9E7520; color:#1D9E75; border-radius:20px;
    font-size:11px; font-weight:600; padding:3px 10px; white-space:nowrap;
    border:0.5px solid #1D9E7540;
  }
  .wallet-row {
    display:flex; align-items:center; gap:6px; margin-top:2px;
  }
  .wallet-mono {
    font-family:'Space Mono',monospace; font-size:11px; color:#555;
  }
  .copy-icon {
    background:none; border:none; color:#555; cursor:pointer; padding:0; font-size:12px;
    line-height:1; transition:color .15s; display:flex; align-items:center;
  }
  .copy-icon:hover { color:#fff; }
  .copy-icon.did-copy { color:#1D9E75; }
  .identity-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:12px; }
  .btn-secondary {
    background:transparent; border:0.5px solid #333; color:#888; border-radius:8px;
    font-family:'Space Grotesk',sans-serif; font-size:12px; font-weight:500;
    padding:6px 14px; cursor:pointer; transition:all .15s; display:inline-flex; align-items:center; gap:5px;
  }
  .btn-secondary:hover { border-color:#555; color:#fff; }
  .btn-secondary.did-copy { border-color:#1D9E7540; color:#1D9E75; }
  .sol-chip {
    display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:500;
    padding:4px 10px; border-radius:20px;
  }
  .sol-ok  { color:#1D9E75; background:#1D9E7515; border:0.5px solid #1D9E7535; }
  .sol-low { color:#f87171; background:#f8717110; border:0.5px solid #7f1d1d; }

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

  /* ── Score hero (legacy, kept for reference) ── */
  .score-hero {
    display:flex; flex-direction:column; align-items:center;
    padding:32px 20px 28px; background:#111; border:0.5px solid #222; border-radius:12px;
    margin-bottom:32px;
  }
  .score-num {
    font-family:'Space Grotesk',sans-serif; font-size:56px; font-weight:500;
    color:#1D9E75; line-height:1; margin-bottom:8px; letter-spacing:-1px;
  }
  .score-label {
    font-size:12px; color:#555; letter-spacing:.08em; text-transform:uppercase;
    margin-bottom:20px;
  }
  .prog-wrap { width:100%; max-width:320px; margin-bottom:8px; }
  .prog-track {
    height:3px; background:#1a1a1a; border-radius:2px; overflow:hidden; width:100%;
  }
  .prog-fill { height:100%; background:#1D9E75; border-radius:2px; transition:width .8s ease; }
  .prog-label { font-size:11px; color:#555; text-align:center; margin-top:6px; }

  /* ── Stat grid ── */
  .stat-grid {
    display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:32px;
  }
  @media(max-width:540px){ .stat-grid{ grid-template-columns:repeat(2,1fr); } }
  .stat-card {
    background:#111; border:0.5px solid #222; border-radius:12px; padding:16px;
  }
  .stat-val {
    font-family:'Space Grotesk',sans-serif; font-size:24px; font-weight:500;
    color:#fff; line-height:1; margin-bottom:6px;
  }
  .stat-lbl { font-size:11px; color:#555; font-weight:500; }

  /* ── Tabs ── */
  .tabs { display:flex; gap:0; border-bottom:0.5px solid #1a1a1a; margin-bottom:16px; }
  .tab-btn {
    background:none; border:none; padding:10px 16px; font-family:'Inter',sans-serif;
    font-size:13px; font-weight:500; cursor:pointer; transition:color .15s;
    border-bottom:1.5px solid transparent; margin-bottom:-0.5px;
  }
  .tab-btn.active { color:#fff; border-bottom-color:#1D9E75; }
  .tab-btn:not(.active) { color:#555; }
  .tab-btn:not(.active):hover { color:#888; }

  /* ── Event rows ── */
  .event-list { display:flex; flex-direction:column; gap:0; }
  .event-row {
    display:flex; align-items:center; gap:12px; padding:14px 0;
    border-bottom:0.5px solid #1a1a1a;
  }
  .event-row:last-child { border-bottom:none; }
  .event-left { flex:1; min-width:0; }
  .event-name {
    font-size:14px; color:#fff; font-weight:500; white-space:nowrap;
    overflow:hidden; text-overflow:ellipsis; margin-bottom:3px;
  }
  .event-date { font-size:12px; color:#555; }
  .event-tags { display:flex; gap:5px; align-items:center; flex-shrink:0; flex-wrap:wrap; }
  .tag {
    display:inline-flex; align-items:center;
    background:#1D9E7520; color:#1D9E75; border-radius:20px;
    font-size:11px; font-weight:600; padding:3px 10px; white-space:nowrap;
  }
  .tag-hackathon { background:rgba(168,85,247,.15); color:#c084fc; border-radius:20px; font-size:10px; font-weight:600; padding:2px 8px; }
  .nft-thumb {
    width:36px; height:36px; border-radius:6px; background:#1a1a1a;
    flex-shrink:0; display:flex; align-items:center; justify-content:center;
    overflow:hidden;
  }
  .nft-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
  .nft-thumb-placeholder { flex-shrink:0; display:flex; align-items:center; }

  /* ── Claim button ── */
  .btn-claim {
    display:inline-flex; align-items:center; gap:5px; white-space:nowrap;
    padding:5px 12px; background:#1D9E7518; color:#1D9E75;
    border:0.5px solid #1D9E7540; font-family:'Space Grotesk',sans-serif;
    font-size:12px; font-weight:600; border-radius:8px; cursor:pointer; transition:all .2s;
    animation:glow 3s ease-in-out infinite;
  }
  .btn-claim:hover { background:#1D9E7530; border-color:#1D9E75; animation:none; }
  .btn-claim:disabled { background:#1a1a1a; color:#555; border-color:#222; cursor:not-allowed; animation:none; }
  .nft-minted-link {
    display:inline-flex; align-items:center; gap:4px; white-space:nowrap;
    padding:5px 10px; background:transparent; color:#1D9E75;
    font-size:11px; font-weight:600; text-decoration:none; border-radius:6px; transition:color .15s;
  }
  .nft-minted-link:hover { color:#fff; text-decoration:none; }

  /* ── NFT gallery ── */
  .nft-gallery { margin-bottom:32px; }
  .nft-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  @media(max-width:480px){ .nft-grid{ grid-template-columns:repeat(2,1fr); } }
  .nft-card {
    background:#111; border:0.5px solid #222; border-radius:12px; overflow:hidden;
    text-decoration:none; display:block; transition:border-color .2s;
  }
  .nft-card:hover { border-color:#1D9E7540; text-decoration:none; }
  .nft-square {
    width:100%; aspect-ratio:1; background:#1a1a1a; display:flex;
    align-items:center; justify-content:center; overflow:hidden;
  }
  .nft-square img { width:100%; height:100%; object-fit:cover; display:block; }
  .nft-square-placeholder {
    width:100%; height:100%; display:flex; align-items:center; justify-content:center;
    font-size:24px; color:#333;
  }
  .nft-body { padding:12px; }
  .nft-title { font-size:13px; color:#fff; font-weight:500; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .nft-date2 { font-size:11px; color:#555; margin-bottom:3px; }
  .nft-edition { font-size:11px; color:#1D9E75; font-weight:600; }

  /* ── Notices ── */
  .msg-err { background:#110a0a; border:0.5px solid #3f1010; color:#f87171; padding:12px 14px; margin-bottom:16px; font-size:13px; border-radius:10px; }
  .msg-ok  { background:#0a1410; border:0.5px solid #103f2a; color:#1D9E75; padding:12px 14px; margin-bottom:16px; font-size:13px; border-radius:10px; }

  /* ── Empty / connect ── */
  .center-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:16px; text-align:center; padding:0 24px; }
  .center-wrap p { font-size:14px; color:#555; }
  .empty-text { font-size:13px; color:#555; text-align:center; padding:24px 0; }

  /* ── Not registered card ── */
  .register-card { padding:24px; }
  .register-title { font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:600; color:#fff; margin-bottom:6px; }
  .register-sub   { font-size:13px; color:#555; line-height:1.6; margin-bottom:20px; }
  .btn-primary {
    display:inline-flex; align-items:center; gap:5px;
    padding:9px 18px; background:#1D9E75; color:#fff; border:none;
    font-family:'Space Grotesk',sans-serif; font-size:13px; font-weight:600;
    border-radius:8px; cursor:pointer; transition:background .15s;
  }
  .btn-primary:hover { background:#18876a; }
  .btn-primary:disabled { background:#1a1a1a; color:#555; cursor:not-allowed; }
  .btn-faucet {
    display:inline-flex; align-items:center; gap:5px;
    padding:9px 18px; background:transparent; color:#f59e0b; border:0.5px solid #f59e0b50;
    font-family:'Space Grotesk',sans-serif; font-size:13px; font-weight:600;
    border-radius:8px; cursor:pointer; text-decoration:none; transition:all .15s;
  }
  .btn-faucet:hover { background:#f59e0b15; }

  /* ── Org event row ── */
  .org-row {
    display:flex; align-items:center; gap:10px; padding:14px 0;
    border-bottom:0.5px solid #1a1a1a; flex-wrap:wrap;
  }
  .org-row:last-child { border-bottom:none; }
  .org-left { flex:1; min-width:0; }
  .org-actions { display:flex; gap:6px; align-items:center; flex-shrink:0; flex-wrap:wrap; }
  .btn-org {
    padding:4px 10px; background:#1D9E7518; color:#1D9E75;
    border:0.5px solid #1D9E7540; border-radius:6px;
    font-family:'Space Grotesk',sans-serif; font-size:11px; font-weight:600;
    cursor:pointer; transition:all .15s; white-space:nowrap;
  }
  .btn-org:hover { background:#1D9E7530; border-color:#1D9E75; }
  .btn-org:disabled { background:#1a1a1a; color:#555; border-color:#222; cursor:not-allowed; }
  .btn-org-danger {
    padding:4px 10px; background:transparent; color:#f87171;
    border:0.5px solid #7f1d1d; border-radius:6px;
    font-family:'Space Grotesk',sans-serif; font-size:11px; font-weight:600;
    cursor:pointer; transition:all .15s; white-space:nowrap;
  }
  .btn-org-danger:hover { background:#f8717110; }
  .btn-org-danger:disabled { opacity:.4; cursor:not-allowed; }
  .org-badge-live     { font-size:10px; font-weight:600; color:#1D9E75; background:#1D9E7515; border:0.5px solid #1D9E7535; padding:2px 8px; border-radius:20px; }
  .org-badge-upcoming { font-size:10px; font-weight:500; color:#fbbf24; background:#fbbf2415; border:0.5px solid #fbbf2440; padding:2px 8px; border-radius:20px; }
  .org-badge-ended    { font-size:10px; font-weight:500; color:#444; background:#111; border:0.5px solid #222; padding:2px 8px; border-radius:20px; }

  /* ── Inline QR ── */
  .org-qr-panel {
    background:#0f0f0f; border:0.5px solid #1D9E7530; border-radius:10px;
    padding:16px; margin-top:12px; text-align:center;
  }
  .org-qr-wrap {
    display:inline-block; padding:10px; background:#fff; border-radius:8px; margin-bottom:10px;
  }
  .org-qr-url {
    font-family:'Space Mono',monospace; font-size:10px; color:#555;
    word-break:break-all; background:#0a0a0a; border:0.5px solid #222;
    border-radius:6px; padding:6px 10px; margin-bottom:8px; cursor:pointer;
    display:block; transition:color .15s;
  }
  .org-qr-url:hover { color:#1D9E75; }

  /* ── GitHub-style daily activity heatmap ── */
  .heatmap { margin-bottom:32px; }
  .heatmap-months-row { display:flex; margin-bottom:3px; }
  .heatmap-weeks-labels { display:flex; }
  .heatmap-month-cell {
    width:13px; font-size:9px; color:#555;
    font-family:'Space Mono',monospace; flex-shrink:0;
    overflow:visible; white-space:nowrap; pointer-events:none;
  }
  .heatmap-body-row { display:flex; gap:6px; align-items:flex-start; }
  .heatmap-day-labels {
    display:flex; flex-direction:column; gap:2px;
    width:22px; flex-shrink:0; padding-top:1px;
  }
  .heatmap-day-labels span {
    height:11px; font-size:9px; color:#444;
    font-family:'Space Mono',monospace;
    display:flex; align-items:center; line-height:1;
  }
  .heatmap-weeks-grid { display:flex; gap:2px; overflow-x:auto; }
  .heatmap-week { display:flex; flex-direction:column; gap:2px; flex-shrink:0; }
  .heatmap-day {
    width:11px; height:11px; border-radius:2px; flex-shrink:0;
    background:#161616; border:0.5px solid #1f1f1f;
    transition:border-color .1s; cursor:default;
  }
  .heatmap-day:not(.future):hover { border-color:#555; }
  .heatmap-day.future { opacity:0; pointer-events:none; }
  .heatmap-day[data-count="1"] { background:#1D9E7530; border-color:#1D9E7540; }
  .heatmap-day[data-count="2"] { background:#1D9E7555; border-color:#1D9E7565; }
  .heatmap-day[data-count="3"] { background:#1D9E7580; border-color:#1D9E7590; }
  .heatmap-day[data-count="4"] { background:#1D9E75;   border-color:#1D9E75;   }
  .heatmap-legend {
    display:flex; align-items:center; gap:3px;
    margin-top:8px; justify-content:flex-end;
  }
  .heatmap-legend-label { font-size:9px; color:#444; font-family:'Space Mono',monospace; }
  .heatmap-legend-cell { width:10px; height:10px; border-radius:2px; }

  /* ── Inline stats (in left profile card) ── */
  .inline-stats {
    display:flex; gap:20px; margin-top:14px; padding-top:14px;
    border-top:0.5px solid #1a1a1a; flex-wrap:wrap;
  }
  .inline-stat { display:flex; flex-direction:column; gap:3px; }
  .inline-stat-val {
    font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:600;
    color:#fff; line-height:1;
  }
  .inline-stat-lbl {
    font-size:10px; color:#555; font-weight:500;
    text-transform:uppercase; letter-spacing:.08em;
  }

  /* ── Loading shimmer ── */
  .shimmer {
    background:linear-gradient(90deg,#111 25%,#1a1a1a 50%,#111 75%);
    background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px;
  }
`;
