"use client";

import { useState } from "react";

const FOOTER_CSS = `
.sf-root {
  background: #0a0a0a;
  font-family: 'Space Grotesk', sans-serif;
  color: #e8e8e8;
  position: relative;
  margin-top: 4rem;
}
.sf-root::before {
  content: '';
  display: block;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.06) 15%, rgba(255,255,255,.35) 50%, rgba(255,255,255,.06) 85%, transparent 100%);
  box-shadow: 0 0 24px 2px rgba(255,255,255,.08);
}
.sf-top {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3.5rem 2rem 2.5rem;
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 2.5rem;
}
@media (max-width: 900px) {
  .sf-top { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .sf-top { grid-template-columns: 1fr; }
}
.sf-col-title {
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .12em;
  color: #9ca3af;
  text-transform: uppercase;
  margin-bottom: 1.1rem;
}
.sf-form { display: flex; flex-direction: column; gap: .6rem; }
.sf-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255,255,255,.18);
  color: #e8e8e8;
  font-size: .83rem;
  padding: .45rem .1rem;
  outline: none;
  font-family: 'Space Grotesk', sans-serif;
  width: 100%;
  resize: none;
}
.sf-input::placeholder { color: #6b7280; }
.sf-input:focus { border-bottom-color: rgba(255,255,255,.5); }
.sf-send {
  margin-top: .4rem;
  background: #fff;
  color: #0a0a0a;
  border: none;
  padding: .65rem 1rem;
  font-weight: 800;
  font-size: .78rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  cursor: pointer;
  width: 100%;
  font-family: 'Epilogue', sans-serif;
  transition: opacity .15s;
}
.sf-send:hover { opacity: .85; }
.sf-nav-link {
  display: block;
  color: #c9c9c9;
  text-decoration: none;
  font-size: .85rem;
  margin-bottom: .6rem;
  transition: color .15s;
}
.sf-nav-link:hover { color: #fff; }
.sf-social-row {
  display: flex;
  flex-wrap: wrap;
  gap: .6rem;
  align-items: center;
}
.sf-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 6px;
  color: #e8e8e8;
  text-decoration: none;
  transition: border-color .15s, background .15s;
}
.sf-icon:hover { border-color: rgba(255,255,255,.5); background: rgba(255,255,255,.06); }
.sf-badges {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255,255,255,.07);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  flex-wrap: wrap;
}
.sf-badge-group { text-align: center; }
.sf-badge-label {
  font-size: .58rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: .5rem;
}
.sf-badge-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  font-size: .8rem;
  font-weight: 700;
  color: #e8e8e8;
}
.sf-bottom {
  border-top: 1px solid rgba(255,255,255,.07);
  padding: 1.75rem 2rem;
  text-align: center;
}
.sf-bottom-text {
  font-size: .78rem;
  color: #6b7280;
  line-height: 1.7;
  max-width: 620px;
  margin: 0 auto 1.25rem;
}
.sf-powered {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 8px;
  padding: .45rem 1.1rem;
  font-size: .75rem;
  font-weight: 600;
  color: #e8e8e8;
  letter-spacing: .04em;
}
`;

export function Footer() {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [sent,    setSent]    = useState(false);
  const [sending, setSending] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSending(true);
    setFormErr(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormErr(data.error ?? "Failed to send — try again.");
      } else {
        setSent(true);
        setName(""); setEmail(""); setMessage("");
        setTimeout(() => setSent(false), 5000);
      }
    } catch {
      setFormErr("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <footer className="sf-root">
      <style dangerouslySetInnerHTML={{ __html: FOOTER_CSS }} />

      {/* ── Top grid ── */}
      <div className="sf-top">

        {/* Contact */}
        <div>
          <div className="sf-col-title">Contact &amp; Support</div>
          {sent ? (
            <p style={{ fontSize:".83rem", color:"#10b981", lineHeight:1.6 }}>Message sent — we'll get back to you shortly.</p>
          ) : (
            <form className="sf-form" onSubmit={handleSend}>
              <input className="sf-input" placeholder="name" value={name} onChange={e => setName(e.target.value)} required />
              <input className="sf-input" type="email" placeholder="email" value={email} onChange={e => setEmail(e.target.value)} required />
              <textarea className="sf-input" placeholder="message" rows={3} value={message} onChange={e => setMessage(e.target.value)} required />
              {formErr && <p style={{ fontSize:".75rem", color:"#f87171", margin:0 }}>{formErr}</p>}
              <button className="sf-send" type="submit" disabled={sending} style={{ opacity: sending ? .65 : 1 }}>
                {sending ? "Sending…" : "Send"}
              </button>
            </form>
          )}
        </div>

        {/* Navigation */}
        <div>
          <div className="sf-col-title">Navigation</div>
          <a href="/"            className="sf-nav-link">Home</a>
          <a href="/organizer"   className="sf-nav-link">Attach to Event</a>
          <a href="/events"      className="sf-nav-link">Check In</a>
          <a href="/leaderboard" className="sf-nav-link">Leaderboard</a>
          <a href="/credentials" className="sf-nav-link">Builder Passport</a>
        </div>

        {/* Legal */}
        <div>
          <div className="sf-col-title">Legal &amp; Compliance</div>
          <a href="/terms" className="sf-nav-link">Terms of Use</a>
        </div>

        {/* Social */}
        <div>
          <div className="sf-col-title">Social</div>
          <div className="sf-social-row">
            {/* X / Twitter */}
            <a href="https://x.com/Signal_thailand" target="_blank" rel="noreferrer" className="sf-icon" aria-label="X (Twitter)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="#" className="sf-icon" aria-label="LinkedIn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* ── Badges ── */}
      <div className="sf-badges">
        <div className="sf-badge-group">
          <div className="sf-badge-label">Built on</div>
          <div className="sf-badge-logo">
            <svg width="18" height="14" viewBox="0 0 646 500" fill="currentColor">
              <path d="M108.53 341.18a14.4 14.4 0 0 1 10.18-4.21h502.06a7.2 7.2 0 0 1 5.09 12.29L518.36 456.76a14.4 14.4 0 0 1-10.18 4.21H6.12A7.2 7.2 0 0 1 1.03 449L108.53 341.18zm0-180.79A14.52 14.52 0 0 1 118.71 156h502.06a7.2 7.2 0 0 1 5.09 12.29L518.36 275.79a14.4 14.4 0 0 1-10.18 4.21H6.12A7.2 7.2 0 0 1 1.03 268L108.53 160.39zM518.36 43.24A14.4 14.4 0 0 0 508.18 39H6.12A7.2 7.2 0 0 0 1.03 51.29l107.5 107.5a14.4 14.4 0 0 0 10.18 4.21h502.06a7.2 7.2 0 0 0 5.09-12.29z"/>
            </svg>
            Solana
          </div>
        </div>

        <div className="sf-badge-group">
          <div className="sf-badge-label">Devnet Program</div>
          <div className="sf-badge-logo" style={{ fontSize:".7rem", fontFamily:"'Space Mono',monospace", letterSpacing:0, color:"#9ca3af" }}>
            CmStH6…Mrz57
          </div>
        </div>

        <div className="sf-badge-group">
          <div className="sf-badge-label">Proof of Presence</div>
          <div className="sf-badge-logo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            On-chain
          </div>
        </div>
      </div>

      {/* ── Bottom ── */}
      <div className="sf-bottom">
        <p className="sf-bottom-text">
          Signal is a web3-native coordination layer for builder communities — turning event attendance into on-chain identity through Proof of Presence, NFT badges, and community reputation on Solana.
        </p>
        <div className="sf-powered">
          powered by&nbsp;
          <svg width="16" height="13" viewBox="0 0 646 500" fill="currentColor">
            <path d="M108.53 341.18a14.4 14.4 0 0 1 10.18-4.21h502.06a7.2 7.2 0 0 1 5.09 12.29L518.36 456.76a14.4 14.4 0 0 1-10.18 4.21H6.12A7.2 7.2 0 0 1 1.03 449L108.53 341.18zm0-180.79A14.52 14.52 0 0 1 118.71 156h502.06a7.2 7.2 0 0 1 5.09 12.29L518.36 275.79a14.4 14.4 0 0 1-10.18 4.21H6.12A7.2 7.2 0 0 1 1.03 268L108.53 160.39zM518.36 43.24A14.4 14.4 0 0 0 508.18 39H6.12A7.2 7.2 0 0 0 1.03 51.29l107.5 107.5a14.4 14.4 0 0 0 10.18 4.21h502.06a7.2 7.2 0 0 0 5.09-12.29z"/>
          </svg>
          &nbsp;SOLANA
        </div>
      </div>
    </footer>
  );
}
