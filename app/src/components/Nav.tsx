"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then(m => m.WalletMultiButton),
  { ssr: false }
);

type ActivePage = "home" | "organizer" | "profile" | "leaderboard" | "marketplace" | "credentials";

const NAV_LINKS: { href: string; label: string; key: ActivePage }[] = [
  { href: "/",            label: "Home",        key: "home" },
  { href: "/organizer",   label: "Organizer",   key: "organizer" },
  { href: "/marketplace", label: "Marketplace", key: "marketplace" },
  { href: "/credentials", label: "Credentials", key: "credentials" },
  { href: "/leaderboard", label: "Leaderboard", key: "leaderboard" },
  { href: "/profile",     label: "Profile",     key: "profile" },
];

export function Nav({ active }: { active: ActivePage }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="/" className="nav-brand">
          <img src="/Strata-logo.svg" alt="Signal" style={{ height: 28 }} />
        </a>

        {/* Desktop links */}
        <div className="nav-links">
          {NAV_LINKS.map(({ href, label, key }) => (
            <a key={key} href={href} className={`nav-link${active === key ? " active" : ""}`}>
              {label}
            </a>
          ))}
          <WalletMultiButton />
        </div>

        {/* Mobile: wallet + hamburger */}
        <div className="nav-mobile-right">
          <WalletMultiButton />
          <button className="nav-hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
            {open ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 3L15 15M15 3L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="nav-mobile-menu">
          {NAV_LINKS.map(({ href, label, key }) => (
            <a
              key={key}
              href={href}
              className={`nav-mobile-link${active === key ? " active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
