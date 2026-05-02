export const homeCSS = `
  /* ── Hero ── */
  .hero {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    text-align: center; padding: 8rem 2.5rem 5rem; position: relative;
  }
  .hero-inner { position: relative; z-index: 1; animation: fadeUp .8s ease both; }
  .hero-badge {
    display: inline-flex; align-items: center; gap: .5rem;
    background: rgba(66,113,189,.10); border: 1px solid rgba(66,113,189,.25);
    backdrop-filter: blur(10px); color: #4b88b4;
    font-size: .75rem; font-weight: 600; letter-spacing: .1em;
    padding: .4rem 1.1rem; border-radius: 100px; margin-bottom: 2rem;
    font-family: 'Orbitron', sans-serif;
  }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #4271bd; animation: pulse 2s infinite; }
  .hero-title {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(3.5rem,10vw,8rem); font-weight: 800; line-height: .95;
    letter-spacing: -.03em; margin-bottom: 1.5rem;
  }
  .hero-title-grad {
    background: linear-gradient(135deg, #1b2d4b 0%, #4271bd 40%, #4b88b4 65%, #1b2d4b 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: gradMove 5s ease infinite;
  }
  .hero-sub {
    font-size: clamp(1rem,2vw,1.2rem); color: #5d8ba2; max-width: 520px;
    margin: 0 auto 2.5rem; line-height: 1.7; font-weight: 300;
  }
  .hero-ctas { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

  /* ── Buttons ── */
  .btn-primary {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem; background: #4271bd; color: #fff;
    font-family: 'Orbitron', sans-serif; font-size: .92rem; font-weight: 700;
    border: none; border-radius: 12px; cursor: pointer; text-decoration: none;
    transition: all .25s; position: relative; overflow: hidden;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(66,113,189,.35), 0 0 0 1px #4271bd; background: #355b97; }
  .btn-glass {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem; background: rgba(66,113,189,.10); color: #1b2d4b;
    font-family: 'Orbitron', sans-serif; font-size: .92rem; font-weight: 600;
    border: 1px solid rgba(66,113,189,.28); border-radius: 12px; cursor: pointer;
    text-decoration: none; transition: all .25s; backdrop-filter: blur(10px);
  }
  .btn-glass:hover { border-color: rgba(66,113,189,.5); background: rgba(66,113,189,.18); transform: translateY(-2px); }

  /* ── Stats ── */
  .stats-section { padding-top: 2rem; padding-bottom: 5rem; }
  .stats-grid {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 1px;
    background: rgba(66,113,189,.15); border-radius: 20px; overflow: hidden;
    border: 1px solid rgba(66,113,189,.15);
    animation: fadeUp .6s .2s ease both; opacity: 0; animation-fill-mode: forwards;
  }
  .stat-box {
    background: rgba(255,255,255,.75); padding: 2rem 1.5rem; text-align: center;
    position: relative; overflow: hidden; transition: background .2s;
    backdrop-filter: blur(10px);
  }
  .stat-box:hover { background: rgba(66,113,189,.08); }
  .stat-box::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(66,113,189,.5), transparent);
    animation: borderGlow 3s ease-in-out infinite;
  }
  .stat-val {
    font-family: 'Orbitron', sans-serif; font-size: 3rem; font-weight: 800;
    line-height: 1; margin-bottom: .4rem;
    background: linear-gradient(135deg, #1b2d4b, #4b88b4);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .stat-lbl { font-size: .72rem; color: #5d8ba2; letter-spacing: .12em; text-transform: uppercase; font-weight: 500; }
  @media(max-width:640px){ .stats-grid{ grid-template-columns: 1fr; } .stat-val{ font-size: 2.2rem; } }

  /* ── Section ── */
  .section { padding-top: 5rem; padding-bottom: 5rem; }
  .section-eyebrow {
    font-family: 'Orbitron', sans-serif; font-size: .58rem; font-weight: 700;
    letter-spacing: .22em; text-transform: uppercase; margin-bottom: 1rem;
    background: linear-gradient(135deg, #4271bd, #4b88b4);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    display: inline-block;
  }
  .section-title {
    font-family: 'Orbitron', sans-serif; font-size: clamp(1.05rem,2.4vw,1.65rem);
    font-weight: 800; letter-spacing: -.01em; margin-bottom: .75rem; color: #1b2d4b;
  }
  .section-sub { font-size: 1rem; color: #5d8ba2; max-width: 480px; line-height: 1.7; }

  /* ── Steps ── */
  .steps { display: grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap: 1.5rem; margin-top: 3rem; }
  .step-card {
    background: rgba(255,255,255,.75); backdrop-filter: blur(20px);
    border: 1px solid rgba(66,113,189,.18); border-radius: 20px; padding: 2rem;
    transition: all .3s; position: relative; overflow: hidden;
    animation: float 6s ease-in-out infinite; box-shadow: 0 2px 12px rgba(66,113,189,.06);
  }
  .step-card:nth-child(2) { animation-delay: -.8s; }
  .step-card:nth-child(3) { animation-delay: -1.6s; }
  .step-card:hover { border-color: rgba(66,113,189,.38); transform: translateY(-6px) !important; box-shadow: 0 20px 50px rgba(66,113,189,.12); }
  .step-num {
    width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #4271bd, #4b88b4); color: #fff;
    font-family: 'Orbitron', sans-serif; font-size: .72rem; font-weight: 800;
    margin-bottom: 1.25rem; position: relative; z-index: 1; box-shadow: 0 4px 15px rgba(66,113,189,.3);
  }
  .step-title { font-family: 'Orbitron', sans-serif; font-size: .82rem; font-weight: 700; color: #1b2d4b; margin-bottom: .5rem; position: relative; z-index: 1; }
  .step-desc { font-size: .85rem; color: #5d8ba2; line-height: 1.7; position: relative; z-index: 1; }

  /* ── Features ── */
  .features { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 1.5rem; margin-top: 3rem; }
  .feature-card {
    background: rgba(255,255,255,.75); backdrop-filter: blur(20px);
    border: 1px solid rgba(66,113,189,.18); border-radius: 20px; padding: 1.75rem;
    transition: all .3s; position: relative; overflow: hidden; box-shadow: 0 2px 10px rgba(66,113,189,.05);
  }
  .feature-card:hover { border-color: rgba(66,113,189,.35); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(66,113,189,.12); }
  .feature-icon {
    width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
    background: rgba(66,113,189,.1); border: 1px solid rgba(66,113,189,.2); font-size: 1.2rem; margin-bottom: 1.1rem;
  }
  .feature-title { font-family: 'Orbitron', sans-serif; font-size: .95rem; font-weight: 700; color: #1b2d4b; margin-bottom: .4rem; }
  .feature-desc { font-size: .82rem; color: #5d8ba2; line-height: 1.7; }

  /* ── Win ── */
  .win-section {
    position: relative; margin: 3rem 0; padding-top: 4rem; padding-bottom: 4rem;
    animation: fadeUp .6s .3s ease both; opacity: 0; animation-fill-mode: forwards;
  }
  .win-inner { position: relative; z-index: 1; }
  .win-trophy { font-size: 2.5rem; margin-bottom: 1rem; animation: float 4s ease-in-out infinite; display: inline-block; }
  .win-title { font-family: 'Orbitron', sans-serif; font-size: clamp(1.3rem,3vw,1.9rem); font-weight: 800; color: #1b2d4b; margin-bottom: .75rem; letter-spacing: -.02em; }
  .win-sub { font-size: .9rem; color: #5d8ba2; max-width: 520px; margin: 0 auto 2.5rem; line-height: 1.7; }
  .win-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 1rem; text-align: left; }
  .win-card {
    background: rgba(255,255,255,.65); border: 1px solid rgba(66,113,189,.16);
    border-radius: 14px; padding: 1.25rem; transition: all .2s;
  }
  .win-card:hover { background: rgba(66,113,189,.08); border-color: rgba(66,113,189,.3); }
  .win-icon { font-size: 1.3rem; margin-bottom: .6rem; }
  .win-card-title { font-family: 'Orbitron', sans-serif; font-size: .88rem; font-weight: 700; color: #1b2d4b; margin-bottom: .3rem; }
  .win-card-desc { font-size: .78rem; color: #5d8ba2; line-height: 1.6; }

  /* ── Events ── */
  .events-list { display: flex; flex-direction: column; gap: .75rem; margin-top: 1.5rem; }
  .event-row {
    background: rgba(255,255,255,.7); backdrop-filter: blur(10px);
    border: 1px solid rgba(66,113,189,.16); border-radius: 14px;
    padding: 1rem 1.25rem; display: flex; align-items: center;
    justify-content: space-between; gap: 1rem; flex-wrap: wrap; transition: all .2s;
  }
  .event-row:hover { border-color: rgba(66,113,189,.35); background: rgba(66,113,189,.06); }
  .event-name { font-family: 'Orbitron', sans-serif; font-size: .9rem; font-weight: 600; color: #1b2d4b; }
  .event-detail { font-size: .75rem; color: #5d8ba2; margin-top: .15rem; }
  .badge-live {
    display: inline-flex; align-items: center; gap: .35rem;
    font-size: .7rem; font-weight: 600; color: #4271bd;
    background: rgba(66,113,189,.10); border: 1px solid rgba(66,113,189,.3); padding: .25rem .8rem; border-radius: 100px;
  }
  .badge-live::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #4271bd; animation: pulse 2s infinite; flex-shrink: 0; }
  .badge-upcoming { font-size: .7rem; font-weight: 500; color: #b45309; background: rgba(180,83,9,.08); border: 1px solid rgba(180,83,9,.25); padding: .25rem .8rem; border-radius: 100px; }
  .badge-ended { font-size: .7rem; color: #5d8ba2; background: rgba(66,113,189,.07); border: 1px solid rgba(66,113,189,.15); padding: .25rem .8rem; border-radius: 100px; }

  /* ── Wallet search bar ── */
  .wallet-search {
    display: flex; gap: .5rem; max-width: 480px; margin: 2rem auto 0;
    background: rgba(255,255,255,.7); border: 1px solid rgba(66,113,189,.22);
    backdrop-filter: blur(12px); border-radius: 14px; padding: .4rem .4rem .4rem 1rem;
    align-items: center;
  }
  .wallet-search input {
    flex: 1; background: transparent; border: none; outline: none; color: #1b2d4b;
    font-family: 'Space Mono', monospace; font-size: .75rem;
  }
  .wallet-search input::placeholder { color: rgba(27,45,75,.35); }
  .wallet-search button {
    background: #4271bd; color: #fff; border: none; border-radius: 9px; padding: .45rem 1rem;
    font-family: 'Orbitron', sans-serif; font-size: .78rem; font-weight: 700; cursor: pointer;
    transition: background .15s; white-space: nowrap;
  }
  .wallet-search button:hover { background: #355b97; }

  /* ── Hall of Fame ── */
  .hof-section { padding-top: 3rem; }
  .hof-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-top: 1.5rem; }
  @media(max-width:600px) { .hof-grid { grid-template-columns: 1fr; } }
  .hof-card {
    background: rgba(255,255,255,.7); border: 1px solid rgba(66,113,189,.16); border-radius: 16px;
    padding: 1.25rem 1.25rem 1rem; text-decoration: none; color: #1b2d4b;
    transition: all .2s; display: block;
  }
  .hof-card:hover { border-color: rgba(66,113,189,.38); background: rgba(66,113,189,.07); transform: translateY(-3px); }
  .hof-rank { font-family: 'Space Mono', monospace; font-size: 1.1rem; margin-bottom: .6rem; }
  .hof-wallet { font-family: 'Space Mono', monospace; font-size: .72rem; color: #5d8ba2; margin-bottom: .5rem; }
  .hof-score { font-family: 'Orbitron', sans-serif; font-size: 1.6rem; font-weight: 800; color: #1b2d4b; line-height: 1; }
  .hof-score-lbl { font-size: .62rem; color: #5d8ba2; text-transform: uppercase; letter-spacing: .1em; margin-top: .1rem; }
  .hof-tier { display: inline-flex; align-items: center; gap: .35rem; font-family: 'Orbitron', sans-serif; font-size: .7rem; font-weight: 600; padding: .25rem .7rem; border-radius: 100px; border: 1px solid currentColor; margin-top: .6rem; }

  /* ── Footer ── */
  .footer { border-top: 1px solid rgba(66,113,189,.14); padding-top: 3rem; padding-bottom: 3rem; margin-top: 2rem; position: relative; z-index: 1; }
  .footer-inner { max-width: 1400px; margin: 0 auto; padding: 0 2.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem; }
  .footer-brand { font-family: 'Orbitron', sans-serif; font-size: 1rem; font-weight: 800; }
  .footer-brand span { background: linear-gradient(135deg, #4271bd, #4b88b4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .footer-link { font-size: .8rem; color: #5d8ba2; text-decoration: none; transition: color .2s; }
  .footer-link:hover { color: #1b2d4b; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .hof-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 768px) {
    .hero { padding: 6.5rem 1.5rem 3.5rem; }
    .hero-sub { max-width: 100%; }
    .stats-section { padding-top: 1rem; padding-bottom: 3rem; }
    .hof-section { padding-top: 2rem; }
    .win-section { margin: 1.5rem 0; padding-top: 2.5rem; padding-bottom: 2.5rem; }
    .section { padding-top: 3.5rem; padding-bottom: 3.5rem; }
    .step-card { padding: 1.5rem; }
    .feature-card { padding: 1.25rem; }
  }
  @media (max-width: 580px) {
    .hero { padding: 5.5rem 1rem 2.5rem; }
    .hero-badge { font-size: .68rem; padding: .35rem .9rem; }
    .hero-sub { font-size: .92rem; margin-bottom: 1.75rem; }
    .hero-ctas { flex-direction: column; align-items: stretch; }
    .btn-primary, .btn-glass { justify-content: center; }
    .wallet-search { flex-direction: column; align-items: stretch; gap: .4rem; padding: .65rem; margin-top: 1.5rem; }
    .wallet-search input { padding: .3rem 0; }
    .wallet-search button { width: 100%; border-radius: 8px; padding: .6rem 1rem; }
    .stat-box { padding: 1.5rem 1rem; }
    .section { padding-top: 2.5rem; padding-bottom: 2.5rem; }
    .hof-section { padding-top: 1.5rem; }
    .win-section { margin: 1rem 0; padding-top: 1.75rem; padding-bottom: 1.75rem; }
    .win-grid { grid-template-columns: 1fr 1fr; }
    .footer-inner { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .footer-links { gap: .75rem; }
    .hof-score { font-size: 1.3rem; }
    .hof-rank { font-size: .95rem; }
  }
  @media (max-width: 420px) {
    .hero { padding: 5rem .75rem 2rem; }
    .win-grid { grid-template-columns: 1fr; }
    .section-title { font-size: 1.5rem; }
  }

  /* ── FAQ ── */
  .faq-section { padding-top: 4rem; padding-bottom: 5rem; }
  .faq-heading {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(1rem, 2.2vw, 1.4rem); font-weight: 800;
    letter-spacing: -.025em; color: #1b2d4b; margin-bottom: 2rem;
  }
  .faq-list { display: flex; flex-direction: column; }
  .faq-item { border-top: 1px solid rgba(66,113,189,.12); }
  .faq-item:last-child { border-bottom: 1px solid rgba(66,113,189,.12); }
  .faq-question {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    gap: 1rem; padding: 1.25rem 0; cursor: pointer; background: none; border: none;
    font-family: 'Orbitron', sans-serif; font-size: .72rem; font-weight: 600;
    color: #1b2d4b; text-align: left; transition: color .2s;
  }
  .faq-question:hover { color: #4271bd; }
  .faq-chevron {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    background: rgba(66,113,189,.08); border: 1px solid rgba(66,113,189,.18);
    display: flex; align-items: center; justify-content: center; color: #5d8ba2;
    transition: transform .25s ease, background .2s, color .2s;
  }
  .faq-chevron.open { transform: rotate(180deg); background: rgba(66,113,189,.15); color: #4271bd; }
  .faq-answer {
    overflow: hidden; max-height: 0;
    transition: max-height .32s ease, padding .32s ease;
  }
  .faq-answer.open { max-height: 320px; padding-bottom: 1.25rem; }
  .faq-answer p { font-size: .88rem; color: #5d8ba2; line-height: 1.8; }
  @media (max-width: 540px) {
    .faq-question { font-size: .9rem; }
    .faq-answer p  { font-size: .84rem; }
  }
`;
