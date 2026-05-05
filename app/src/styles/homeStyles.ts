export const homeCSS = `
  /* ── Hero ── */
  .hero {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    text-align: center; padding: 8rem 2.5rem 5rem; position: relative;
  }
  .hero-inner { position: relative; z-index: 1; animation: fadeUp .8s ease both; }
  .hero-badge {
    display: inline-flex; align-items: center; gap: .5rem;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.2);
    backdrop-filter: blur(10px); color: #e8e8e8;
    font-size: .78rem; font-weight: 600; letter-spacing: .06em;
    padding: .4rem 1.1rem; border-radius: 100px; margin-bottom: 2rem;
    font-family: 'Epilogue', sans-serif;
  }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #ffffff; animation: pulse 2s infinite; }
  .hero-title {
    font-family: 'Epilogue', sans-serif;
    font-size: clamp(3.5rem,10vw,8rem); font-weight: 900; line-height: .95;
    letter-spacing: -.03em; margin-bottom: 1.5rem;
  }
  .hero-title-grad {
    background: linear-gradient(135deg, #ffffff 0%, #ffffff 45%, #e8e8e8 70%, #e8e8e8 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: gradMove 5s ease infinite;
  }
  .hero-tagline {
    font-family: 'Epilogue', sans-serif;
    font-size: clamp(1.1rem,2.8vw,1.65rem); font-weight: 700;
    color: #e8e8e8; letter-spacing: -.01em;
    margin-bottom: 1.1rem;
  }
  .hero-sub {
    font-size: clamp(.9rem,1.8vw,1.05rem); color: #888; max-width: 500px;
    margin: 0 auto 2.5rem; line-height: 1.75; font-weight: 400;
  }
  .hero-ctas { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

  /* ── Buttons ── */
  .btn-primary {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem; background: #ffffff; color: #0a0a0a;
    font-family: 'Epilogue', sans-serif; font-size: .95rem; font-weight: 700;
    border: none; border-radius: 12px; cursor: pointer; text-decoration: none;
    transition: all .25s;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(255,255,255,.35); background: #e8e8e8; }
  .btn-glass {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem; background: rgba(255,255,255,.05); color: #e8e8e8;
    font-family: 'Epilogue', sans-serif; font-size: .95rem; font-weight: 600;
    border: 1px solid rgba(255,255,255,.12); border-radius: 12px; cursor: pointer;
    text-decoration: none; transition: all .25s; backdrop-filter: blur(10px);
  }
  .btn-glass:hover { border-color: rgba(255,255,255,.25); background: rgba(255,255,255,.08); transform: translateY(-2px); }

  /* ── Stats ── */
  .stats-section { padding-top: 2rem; padding-bottom: 5rem; }
  .stats-grid {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 2rem;
    animation: fadeUp .6s .2s ease both; opacity: 0; animation-fill-mode: forwards;
  }
  .stat-box {
    padding: 1.75rem 0; text-align: left; position: relative;
    border-top: 1px solid rgba(255,255,255,.15);
  }
  .stat-box::before {
    content: ''; position: absolute; top: -1px; left: 0; width: 40px; height: 2px;
    background: #ffffff;
  }
  .stat-val {
    font-family: 'Epilogue', sans-serif; font-size: 3.5rem; font-weight: 900;
    line-height: 1; margin-bottom: .5rem; color: #ffffff;
  }
  .stat-lbl { font-size: .72rem; color: #888; letter-spacing: .1em; text-transform: uppercase; font-weight: 500; }
  .stat-shimmer { width: 80px; height: 3.5rem; border-radius: 6px; background: rgba(255,255,255,.06); margin-bottom: .5rem; }
  @media(max-width:640px){ .stats-grid{ grid-template-columns: 1fr; gap: 1rem; } .stat-val{ font-size: 2.8rem; } }

  /* ── Section ── */
  .section { padding-top: 5rem; padding-bottom: 5rem; }
  .section-eyebrow {
    font-family: 'Epilogue', sans-serif; font-size: .7rem; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase; margin-bottom: 1rem;
    color: #ffffff; display: inline-block;
  }
  .section-title {
    font-family: 'Epilogue', sans-serif; font-size: clamp(1.5rem,3vw,2.2rem);
    font-weight: 800; letter-spacing: -.02em; margin-bottom: .75rem; color: #e8e8e8;
  }
  .section-sub { font-size: 1rem; color: #888; max-width: 480px; line-height: 1.7; }

  /* ── Steps ── */
  .steps-heading {
    text-align: center; font-family: 'Epilogue', sans-serif;
    font-size: clamp(1.6rem,4vw,2.8rem); font-weight: 900;
    letter-spacing: -.02em; text-transform: uppercase; color: #ffffff;
    margin-bottom: 3rem; line-height: 1.1;
  }
  .steps { display: grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap: 1.5rem; }
  .step-card {
    background: rgba(255,255,255,.04); backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 2rem;
    display: flex; flex-direction: column; gap: .75rem;
    transition: border-color .3s; box-shadow: 0 2px 12px rgba(0,0,0,.3);
  }
  .step-card:hover { border-color: rgba(255,255,255,.28); }
  .step-header { display: flex; align-items: baseline; gap: .75rem; }
  .step-num {
    font-family: 'Epilogue', sans-serif; font-size: 4.5rem; font-weight: 900;
    line-height: 1; color: #ffffff; flex-shrink: 0;
  }
  .step-title {
    font-family: 'Epilogue', sans-serif; font-size: 1.05rem; font-weight: 800;
    text-transform: uppercase; letter-spacing: .04em; color: #ffffff; line-height: 1.2;
  }
  .step-desc { font-size: .88rem; color: #888; line-height: 1.7; flex: 1; }
  .step-cta {
    display: inline-block; align-self: flex-start; margin-top: .5rem;
    padding: .55rem 1.2rem; border: 1px solid rgba(255,255,255,.3); border-radius: 8px;
    font-family: 'Epilogue', sans-serif; font-size: .72rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: .09em; color: #ffffff;
    text-decoration: none; transition: all .2s;
  }
  .step-cta:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.55); }

  /* ── Hall of Fame ── */
  .hof-section { padding-top: 3rem; }
  .hof-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-top: 1.5rem; }
  @media(max-width:600px) { .hof-grid { grid-template-columns: 1fr; } }
  .hof-card {
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 16px;
    padding: 1.25rem 1.25rem 1rem; text-decoration: none; color: #e8e8e8;
    transition: all .2s; display: block;
  }
  .hof-card:hover { border-color: rgba(255,255,255,.25); background: rgba(255,255,255,.06); transform: translateY(-3px); }
  .hof-rank { font-family: 'Space Mono', monospace; font-size: 1.1rem; margin-bottom: .6rem; color: #888; }
  .hof-wallet { font-family: 'Space Mono', monospace; font-size: .72rem; color: #888; margin-bottom: .5rem; }
  .hof-score { font-family: 'Epilogue', sans-serif; font-size: 1.6rem; font-weight: 800; color: #e8e8e8; line-height: 1; }
  .hof-score-lbl { font-size: .62rem; color: #888; text-transform: uppercase; letter-spacing: .1em; margin-top: .1rem; }
  .hof-tier { display: inline-flex; align-items: center; gap: .35rem; font-family: 'Epilogue', sans-serif; font-size: .72rem; font-weight: 700; padding: .25rem .7rem; border-radius: 100px; border: 1px solid currentColor; margin-top: .6rem; }

  /* ── Wallet search bar ── */
  .wallet-search {
    display: flex; gap: .5rem; max-width: 480px; margin: 2rem auto 0;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
    backdrop-filter: blur(12px); border-radius: 14px; padding: .4rem .4rem .4rem 1rem;
    align-items: center;
  }
  .wallet-search input {
    flex: 1; background: transparent; border: none; outline: none; color: #e8e8e8;
    font-family: 'Space Mono', monospace; font-size: .75rem;
  }
  .wallet-search input::placeholder { color: rgba(255,255,255,.25); }
  .wallet-search button {
    background: #ffffff; color: #0a0a0a; border: none; border-radius: 9px; padding: .45rem 1rem;
    font-family: 'Epilogue', sans-serif; font-size: .8rem; font-weight: 700; cursor: pointer;
    transition: background .15s; white-space: nowrap;
  }
  .wallet-search button:hover { background: #e8e8e8; }

  /* ── Footer ── */
  .footer { border-top: 1px solid rgba(255,255,255,.07); padding-top: 3rem; padding-bottom: 3rem; margin-top: 2rem; position: relative; z-index: 1; }
  .footer-inner { max-width: 1400px; margin: 0 auto; padding: 0 2.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem; }
  .footer-brand { font-family: 'Epilogue', sans-serif; font-size: 1rem; font-weight: 900; letter-spacing: -.02em; }
  .footer-brand span { color: #ffffff; }
  .footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .footer-link { font-size: .8rem; color: #888; text-decoration: none; transition: color .2s; }
  .footer-link:hover { color: #e8e8e8; }

  /* ── Responsive ── */
  @media (max-width: 900px) { .hof-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 768px) {
    .hero { padding: 6.5rem 1.5rem 3.5rem; }
    .hero-sub { max-width: 100%; }
    .stats-section { padding-top: 1rem; padding-bottom: 3rem; }
    .hof-section { padding-top: 2rem; }
    .section { padding-top: 3.5rem; padding-bottom: 3.5rem; }
    .step-card { padding: 1.5rem; }
  }
  @media (max-width: 580px) {
    .hero { padding: 5.5rem 1rem 2.5rem; }
    .hero-badge { font-size: .72rem; padding: .35rem .9rem; }
    .hero-sub { font-size: .92rem; margin-bottom: 1.75rem; }
    .hero-ctas { flex-direction: column; align-items: stretch; }
    .btn-primary, .btn-glass { justify-content: center; }
    .wallet-search { flex-direction: column; align-items: stretch; gap: .4rem; padding: .65rem; margin-top: 1.5rem; }
    .wallet-search input { padding: .3rem 0; }
    .wallet-search button { width: 100%; border-radius: 8px; padding: .6rem 1rem; }
    .stat-box { padding: 1.5rem 1rem; }
    .section { padding-top: 2.5rem; padding-bottom: 2.5rem; }
    .hof-section { padding-top: 1.5rem; }
    .footer-inner { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .footer-links { gap: .75rem; }
    .hof-score { font-size: 1.3rem; }
    .hof-rank { font-size: .95rem; }
  }
  @media (max-width: 420px) {
    .hero { padding: 5rem .75rem 2rem; }
    .section-title { font-size: 1.4rem; }
  }

  /* ── Events ── */
  .events-section { padding-top: 5rem; padding-bottom: 2rem; }
  .events-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;
  }
  .events-source {
    display: inline-flex; align-items: center; gap: .5rem;
    font-family: 'Epilogue', sans-serif; font-size: .7rem; font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase; color: #888;
  }
  .events-source a { color: #888; text-decoration: none; transition: color .2s; }
  .events-source a:hover { color: #e8e8e8; }
  .events-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }
  .event-card {
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
    border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit;
    display: flex; flex-direction: column; transition: border-color .2s, transform .2s;
  }
  .event-card:hover { border-color: rgba(255,255,255,.22); transform: translateY(-3px); text-decoration: none; }
  .event-cover {
    width: 100%; aspect-ratio: 16/9; background: rgba(255,255,255,.05);
    overflow: hidden; flex-shrink: 0; position: relative;
  }
  .event-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .event-cover-placeholder {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, rgba(255,255,255,.06) 0%, rgba(255,255,255,.02) 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.75rem; color: rgba(255,255,255,.15);
  }
  .event-body { padding: 1rem 1.1rem 1.1rem; display: flex; flex-direction: column; gap: .45rem; flex: 1; }
  .event-date-line {
    font-family: 'Epilogue', sans-serif; font-size: .7rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: .09em; color: #ffffff;
  }
  .event-title-card {
    font-family: 'Epilogue', sans-serif; font-size: .95rem; font-weight: 700;
    color: #e8e8e8; line-height: 1.3; flex: 1;
  }
  .event-location {
    font-size: .75rem; color: #888; display: flex; align-items: center; gap: .35rem;
    margin-top: auto; padding-top: .4rem;
  }
  .event-register {
    display: inline-flex; align-items: center; gap: .35rem;
    font-family: 'Epilogue', sans-serif; font-size: .72rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: .08em; color: #ffffff;
    padding: .5rem 1rem; border: 1px solid rgba(255,255,255,.2); border-radius: 8px;
    margin-top: .6rem; transition: border-color .2s, background .2s; text-decoration: none;
  }
  .event-register:hover { border-color: rgba(255,255,255,.5); background: rgba(255,255,255,.06); }
  .events-cta { text-align: center; margin-top: 1.5rem; }
  .events-cta a {
    font-family: 'Epilogue', sans-serif; font-size: .78rem; font-weight: 600;
    color: #888; text-decoration: none; letter-spacing: .06em; transition: color .2s;
  }
  .events-cta a:hover { color: #e8e8e8; }

  /* ── FAQ ── */
  .faq-section { padding-top: 4rem; padding-bottom: 5rem; }
  .faq-heading {
    font-family: 'Epilogue', sans-serif;
    font-size: clamp(1.4rem,3vw,2rem); font-weight: 800;
    letter-spacing: -.025em; color: #e8e8e8; margin-bottom: 2rem;
  }
  .faq-list { display: flex; flex-direction: column; }
  .faq-item { border-top: 1px solid rgba(255,255,255,.07); }
  .faq-item:last-child { border-bottom: 1px solid rgba(255,255,255,.07); }
  .faq-question {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    gap: 1rem; padding: 1.25rem 0; cursor: pointer; background: none; border: none;
    font-family: 'Epilogue', sans-serif; font-size: .95rem; font-weight: 600;
    color: #e8e8e8; text-align: left; transition: color .2s;
  }
  .faq-question:hover { color: #ffffff; }
  .faq-chevron {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
    display: flex; align-items: center; justify-content: center; color: #888;
    transition: transform .25s ease, background .2s, color .2s;
  }
  .faq-chevron.open { transform: rotate(180deg); background: rgba(255,255,255,.12); color: #ffffff; }
  .faq-answer {
    overflow: hidden; max-height: 0;
    transition: max-height .32s ease, padding .32s ease;
  }
  .faq-answer.open { max-height: 320px; padding-bottom: 1.25rem; }
  .faq-answer p { font-size: .9rem; color: #888; line-height: 1.8; }
  @media (max-width: 540px) {
    .faq-question { font-size: .88rem; }
    .faq-answer p  { font-size: .84rem; }
  }
`;