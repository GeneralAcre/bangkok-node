export const homeCSS = `
  /* ── Hero ── */
  .hero {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    text-align: center; padding: 8rem 1.5rem 5rem; position: relative;
  }
  .hero-inner { position: relative; z-index: 1; animation: fadeUp .8s ease both; }
  .hero-badge {
    display: inline-flex; align-items: center; gap: .5rem;
    background: var(--p-dim); border: 1px solid rgba(122,87,233,.25);
    backdrop-filter: blur(10px); color: var(--p2);
    font-size: .75rem; font-weight: 600; letter-spacing: .1em;
    padding: .4rem 1.1rem; border-radius: 100px; margin-bottom: 2rem;
    font-family: 'Space Grotesk', sans-serif;
  }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--g); animation: pulse 2s infinite; }
  .hero-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(3.5rem,10vw,8rem); font-weight: 800; line-height: .95;
    letter-spacing: -.03em; margin-bottom: 1.5rem;
  }
  .hero-title-grad {
    background: linear-gradient(135deg,#fff 0%,#c4b5fd 35%,var(--p) 55%,var(--g) 80%,#fff 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: gradMove 5s ease infinite, textGlow 4s ease infinite;
  }
  .hero-sub {
    font-size: clamp(1rem,2vw,1.2rem); color: #9ca3af; max-width: 520px;
    margin: 0 auto 2.5rem; line-height: 1.7; font-weight: 300;
  }
  .hero-ctas { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

  /* ── Buttons ── */
  .btn-primary {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem; background: var(--p); color: #fff;
    font-family: 'Space Grotesk', sans-serif; font-size: .92rem; font-weight: 700;
    border: none; border-radius: 12px; cursor: pointer; text-decoration: none;
    transition: all .25s; position: relative; overflow: hidden;
  }
  .btn-primary::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,.1) 100%);
    opacity: 0; transition: opacity .2s;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px var(--p-glow), 0 0 0 1px var(--p); }
  .btn-primary:hover::before { opacity: 1; }
  .btn-glass {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .85rem 2rem; background: var(--surface2); color: #fff;
    font-family: 'Space Grotesk', sans-serif; font-size: .92rem; font-weight: 600;
    border: 1px solid var(--border-bright); border-radius: 12px; cursor: pointer;
    text-decoration: none; transition: all .25s; backdrop-filter: blur(10px);
  }
  .btn-glass:hover { border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.08); transform: translateY(-2px); }

  /* ── Stats ── */
  .stats-section { padding: 2rem 0 5rem; }
  .stats-grid {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 1px;
    background: var(--border); border-radius: 20px; overflow: hidden;
    border: 1px solid var(--border);
    animation: fadeUp .6s .2s ease both; opacity: 0; animation-fill-mode: forwards;
  }
  .stat-box {
    background: #050508; padding: 2rem 1.5rem; text-align: center;
    position: relative; overflow: hidden; transition: background .2s;
  }
  .stat-box:hover { background: rgba(122,87,233,.05); }
  .stat-box::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--p), transparent);
    animation: borderGlow 3s ease-in-out infinite;
  }
  .stat-val {
    font-family: 'Space Grotesk', sans-serif; font-size: 3rem; font-weight: 800;
    line-height: 1; margin-bottom: .4rem;
    background: linear-gradient(135deg,#fff,var(--p2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .stat-lbl { font-size: .72rem; color: var(--muted); letter-spacing: .12em; text-transform: uppercase; font-weight: 500; }
  @media(max-width:540px){ .stats-grid{ grid-template-columns: 1fr; } .stat-val{ font-size: 2.2rem; } }

  /* ── Section ── */
  .section { padding: 5rem 0; }
  .section-eyebrow {
    font-family: 'Space Grotesk', sans-serif; font-size: .72rem; font-weight: 700;
    letter-spacing: .2em; text-transform: uppercase; margin-bottom: 1rem;
    background: linear-gradient(135deg,var(--p),var(--g));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    display: inline-block;
  }
  .section-title {
    font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.75rem,4vw,2.5rem);
    font-weight: 800; letter-spacing: -.03em; margin-bottom: .75rem;
  }
  .section-sub { font-size: 1rem; color: #9ca3af; max-width: 480px; line-height: 1.7; }

  /* ── Steps ── */
  .steps { display: grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap: 1.5rem; margin-top: 3rem; }
  .step-card {
    background: var(--surface); backdrop-filter: blur(20px);
    border: 1px solid var(--border); border-radius: 20px; padding: 2rem;
    transition: all .3s; position: relative; overflow: hidden;
    animation: float 6s ease-in-out infinite;
  }
  .step-card:nth-child(2) { animation-delay: -.8s; }
  .step-card:nth-child(3) { animation-delay: -1.6s; }
  .step-card::before {
    content: ''; position: absolute; inset: 0; border-radius: 20px;
    background: linear-gradient(135deg,var(--p-glow),transparent,var(--g-glow));
    opacity: 0; transition: opacity .3s;
  }
  .step-card:hover { border-color: rgba(122,87,233,.4); transform: translateY(-6px) !important; box-shadow: 0 20px 50px rgba(0,0,0,.5), 0 0 30px var(--p-glow); }
  .step-card:hover::before { opacity: 1; }
  .step-num {
    width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg,var(--p),var(--p2)); color: #fff;
    font-family: 'Space Grotesk', sans-serif; font-size: .9rem; font-weight: 800;
    margin-bottom: 1.25rem; position: relative; z-index: 1; box-shadow: 0 4px 15px var(--p-glow);
  }
  .step-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; font-weight: 700; color: #fff; margin-bottom: .5rem; position: relative; z-index: 1; }
  .step-desc { font-size: .85rem; color: #9ca3af; line-height: 1.7; position: relative; z-index: 1; }

  /* ── Features ── */
  .features { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 1.5rem; margin-top: 3rem; }
  .feature-card {
    background: var(--surface); backdrop-filter: blur(20px);
    border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem;
    transition: all .3s; position: relative; overflow: hidden;
  }
  .feature-card:hover { border-color: rgba(140,233,164,.3); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,.4), 0 0 20px var(--g-glow); }
  .feature-icon {
    width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
    background: var(--g-dim); border: 1px solid var(--g-glow); font-size: 1.2rem; margin-bottom: 1.1rem;
  }
  .feature-title { font-family: 'Space Grotesk', sans-serif; font-size: .95rem; font-weight: 700; color: #fff; margin-bottom: .4rem; }
  .feature-desc { font-size: .82rem; color: #6b7280; line-height: 1.7; }

  /* ── Win ── */
  .win-section {
    position: relative; margin: 3rem 0; padding: 4rem 2.5rem; border-radius: 28px; overflow: hidden;
    background: linear-gradient(135deg,rgba(122,87,233,.08) 0%,rgba(0,0,0,.5) 50%,rgba(140,233,164,.06) 100%);
    border: 1px solid rgba(122,87,233,.2);
    animation: fadeUp .6s .3s ease both; opacity: 0; animation-fill-mode: forwards;
  }
  .win-section::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg,transparent 0%,rgba(122,87,233,.05) 100%);
  }
  .win-inner { position: relative; z-index: 1; }
  .win-trophy { font-size: 2.5rem; margin-bottom: 1rem; animation: float 4s ease-in-out infinite; display: inline-block; }
  .win-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.3rem,3vw,1.9rem); font-weight: 800; color: #fff; margin-bottom: .75rem; letter-spacing: -.02em; }
  .win-sub { font-size: .9rem; color: #9ca3af; max-width: 520px; margin: 0 auto 2.5rem; line-height: 1.7; }
  .win-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 1rem; text-align: left; }
  .win-card {
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
    border-radius: 14px; padding: 1.25rem; transition: all .2s;
  }
  .win-card:hover { background: rgba(122,87,233,.08); border-color: rgba(122,87,233,.2); }
  .win-icon { font-size: 1.3rem; margin-bottom: .6rem; }
  .win-card-title { font-family: 'Space Grotesk', sans-serif; font-size: .88rem; font-weight: 700; color: #fff; margin-bottom: .3rem; }
  .win-card-desc { font-size: .78rem; color: #6b7280; line-height: 1.6; }

  /* ── Events ── */
  .events-list { display: flex; flex-direction: column; gap: .75rem; margin-top: 1.5rem; }
  .event-row {
    background: var(--surface); backdrop-filter: blur(10px);
    border: 1px solid var(--border); border-radius: 14px;
    padding: 1rem 1.25rem; display: flex; align-items: center;
    justify-content: space-between; gap: 1rem; flex-wrap: wrap; transition: all .2s;
  }
  .event-row:hover { border-color: rgba(122,87,233,.3); background: rgba(122,87,233,.04); }
  .event-name { font-family: 'Space Grotesk', sans-serif; font-size: .9rem; font-weight: 600; color: #fff; }
  .event-detail { font-size: .75rem; color: var(--muted); margin-top: .15rem; }
  .badge-live {
    display: inline-flex; align-items: center; gap: .35rem;
    font-size: .7rem; font-weight: 600; color: var(--g);
    background: var(--g-dim); border: 1px solid var(--g-glow); padding: .25rem .8rem; border-radius: 100px;
  }
  .badge-live::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--g); animation: pulse 2s infinite; flex-shrink: 0; }
  .badge-upcoming { font-size: .7rem; font-weight: 500; color: #fbbf24; background: #fbbf2410; border: 1px solid #fbbf2435; padding: .25rem .8rem; border-radius: 100px; }
  .badge-ended { font-size: .7rem; color: #374151; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05); padding: .25rem .8rem; border-radius: 100px; }

  /* ── Wallet search bar ── */
  .wallet-search {
    display: flex; gap: .5rem; max-width: 480px; margin: 2rem auto 0;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
    backdrop-filter: blur(12px); border-radius: 14px; padding: .4rem .4rem .4rem 1rem;
    align-items: center;
  }
  .wallet-search input {
    flex: 1; background: transparent; border: none; outline: none; color: #fff;
    font-family: 'Space Mono', monospace; font-size: .75rem;
  }
  .wallet-search input::placeholder { color: rgba(255,255,255,.3); }
  .wallet-search button {
    background: var(--p); color: #fff; border: none; border-radius: 9px; padding: .45rem 1rem;
    font-family: 'Space Grotesk', sans-serif; font-size: .78rem; font-weight: 700; cursor: pointer;
    transition: background .15s; white-space: nowrap;
  }
  .wallet-search button:hover { background: #8B6EF0; }

  /* ── Hall of Fame ── */
  .hof-section { padding: 3rem 0 0; }
  .hof-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-top: 1.5rem; }
  @media(max-width:600px) { .hof-grid { grid-template-columns: 1fr; } }
  .hof-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 1.25rem 1.25rem 1rem; text-decoration: none; color: #fff;
    transition: all .2s; display: block;
  }
  .hof-card:hover { border-color: rgba(122,87,233,.35); background: rgba(122,87,233,.05); transform: translateY(-3px); }
  .hof-rank { font-family: 'Space Mono', monospace; font-size: 1.1rem; margin-bottom: .6rem; }
  .hof-wallet { font-family: 'Space Mono', monospace; font-size: .72rem; color: var(--muted); margin-bottom: .5rem; }
  .hof-score { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; font-weight: 800; color: #fff; line-height: 1; }
  .hof-score-lbl { font-size: .62rem; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; margin-top: .1rem; }
  .hof-tier { display: inline-flex; align-items: center; gap: .35rem; font-family: 'Space Grotesk', sans-serif; font-size: .7rem; font-weight: 600; padding: .25rem .7rem; border-radius: 100px; border: 1px solid currentColor; margin-top: .6rem; }

  /* ── Footer ── */
  .footer { border-top: 1px solid var(--border); padding: 3rem 0; margin-top: 2rem; position: relative; z-index: 1; }
  .footer-inner { max-width: 1400px; margin: 0 auto; padding: 0 2.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem; }
  .footer-brand { font-family: 'Space Grotesk', sans-serif; font-size: 1rem; font-weight: 800; }
  .footer-brand span { background: linear-gradient(135deg,var(--p2),var(--g)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .footer-link { font-size: .8rem; color: var(--muted); text-decoration: none; transition: color .2s; }
  .footer-link:hover { color: #fff; }
`;
