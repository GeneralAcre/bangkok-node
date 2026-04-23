"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

type ActivePage = "home" | "organizer" | "profile" | "leaderboard";

export function Nav({ active }: { active: ActivePage }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="/" className="nav-brand">
          <img src="/Strata-logo.svg" alt="STRATA" />
        </a>
        <div className="nav-links">
          <a href="/"            className={`nav-link${active === "home"        ? " active" : ""}`}>Home</a>
          <a href="/organizer"   className={`nav-link${active === "organizer"   ? " active" : ""}`}>Organizer</a>
          <a href="/leaderboard" className={`nav-link${active === "leaderboard" ? " active" : ""}`}>Leaderboard</a>
          <a href="/profile"     className={`nav-link${active === "profile"     ? " active" : ""}`}>Profile</a>
          <WalletMultiButton />
        </div>
      </div>
    </nav>
  );
}
