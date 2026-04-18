"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  StrataClient,
  parseTier,
  MemberAccount,
  EventAccount,
  AttendanceAccount,
  TIER_COLOR,
  TIER_THRESHOLD,
  MemberTier,
} from "../../utils/strata-client";

const COMMUNITY_PDA_STR = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";

interface AttendedEvent {
  eventPubkey: string;
  attendance:  AttendanceAccount;
  event:       EventAccount | null;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #000; color: #e2e8f0; font-family: 'Share Tech Mono', monospace; }
  .page { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; }

  .top-nav {
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #7f1d1d; padding-bottom: 1rem; margin-bottom: 2rem;
  }
  .nav-brand { font-family: 'Cinzel Decorative', serif; font-size: 1.1rem; color: #dc2626; letter-spacing: 0.1em; }
  .nav-links { display: flex; gap: 1rem; align-items: center; }
  .nav-link {
    font-size: 0.75rem; color: #9ca3af; text-decoration: none; letter-spacing: 0.1em;
    padding: 0.3rem 0.7rem; border: 1px solid #374151; border-radius: 2px;
    transition: all 0.2s;
  }
  .nav-link:hover { color: #dc2626; border-color: #dc2626; }
  .nav-link.active { color: #dc2626; border-color: #dc2626; }

  h1 { font-family: 'Cinzel Decorative', serif; font-size: 1.4rem; color: #dc2626; margin-bottom: 0.2rem; letter-spacing: 0.05em; }
  .sub { font-size: 0.75rem; color: #6b7280; margin-bottom: 2rem; letter-spacing: 0.05em; }

  .card {
    background: #0a0a0a; border: 1px solid #7f1d1d;
    border-radius: 2px; padding: 1.5rem; margin-bottom: 1.5rem;
    position: relative;
  }
  .card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, #dc2626, transparent);
  }
  .card-title {
    font-size: 0.7rem; color: #6b7280; letter-spacing: 0.2em; margin-bottom: 1.2rem;
    text-transform: uppercase;
  }

  .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
  .stat { text-align: center; background: #111; border: 1px solid #1f1f1f; padding: 1rem; border-radius: 2px; }
  .stat-val { font-size: 2rem; font-weight: 700; color: #f9fafb; }
  .stat-lbl { font-size: 0.65rem; color: #6b7280; margin-top: 0.25rem; letter-spacing: 0.15em; }

  .tier-badge {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.4rem 1rem; border-radius: 2px; font-size: 0.85rem; font-weight: 700;
    margin-bottom: 1.2rem; font-family: 'Rajdhani', sans-serif;
    letter-spacing: 0.1em;
  }
  .tier-dot { width: 8px; height: 8px; border-radius: 50%; }

  .prog-bar { height: 4px; background: #1f1f1f; border-radius: 0; overflow: hidden; margin-bottom: 0.4rem; }
  .prog-fill { height: 100%; transition: width 0.6s ease; }
  .prog-labels { display: flex; justify-content: space-between; font-size: 0.65rem; color: #6b7280; letter-spacing: 0.05em; }

  .wallet-addr { font-size: 0.65rem; color: #6b7280; margin-bottom: 1rem; letter-spacing: 0.05em; }
  .username { font-size: 1.2rem; color: #f9fafb; margin-bottom: 0.3rem; font-family: 'Rajdhani', sans-serif; font-weight: 700; }

  .event-row { border-bottom: 1px solid #1a1a1a; padding: 0.8rem 0; }
  .event-row:last-child { border-bottom: none; }
  .event-title { font-size: 0.9rem; color: #e2e8f0; margin-bottom: 0.25rem; }
  .event-meta  { font-size: 0.7rem; color: #4b5563; }
  .nft-badge { font-size: 0.65rem; color: #dc2626; border: 1px solid #7f1d1d; padding: 1px 6px; margin-left: 0.5rem; border-radius: 2px; }

  .btn {
    padding: 0.6rem 1.4rem; border: 1px solid #dc2626; background: transparent;
    color: #dc2626; cursor: pointer; font-family: 'Share Tech Mono', monospace;
    font-size: 0.8rem; letter-spacing: 0.1em; border-radius: 2px;
    transition: all 0.2s; text-transform: uppercase;
  }
  .btn:hover { background: #dc2626; color: #000; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .msg-err { background: #0d0000; border: 1px solid #7f1d1d; color: #f87171; padding: 0.75rem; border-radius: 2px; font-size: 0.8rem; margin-bottom: 1rem; }
  .connect-box { text-align: center; padding: 3rem 1rem; color: #6b7280; }
  a { color: #dc2626; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .empty { color: #4b5563; font-size: 0.85rem; text-align: center; padding: 1.5rem 0; }

  /* WalletMultiButton override */
  .wallet-adapter-button {
    background: transparent !important; border: 1px solid #dc2626 !important; color: #dc2626 !important;
    font-family: 'Share Tech Mono', monospace !important; font-size: 0.75rem !important;
    letter-spacing: 0.08em !important; border-radius: 2px !important; padding: 0.35rem 0.9rem !important;
    height: auto !important;
  }
  .wallet-adapter-button:hover { background: #dc2626 !important; color: #000 !important; }
`;

export default function ProfilePage() {
  const { connection }           = useConnection();
  const wallet                   = useWallet();
  const { publicKey, connected } = wallet;

  const [client,    setClient]    = useState<StrataClient | null>(null);
  const [member,    setMember]    = useState<MemberAccount | null>(null);
  const [attended,  setAttended]  = useState<AttendedEvent[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [balance,   setBalance]   = useState<number | null>(null);
  const [claiming,  setClaiming]  = useState<string | null>(null); // eventPubkey being claimed
  const [minted,    setMinted]    = useState<Record<string, string>>({}); // eventPubkey → mintAddr

  useEffect(() => {
    if (!connected || !publicKey) return;
    async function init() {
      try {
        const idl = await import("../../idl/strata.json").catch(() => null);
        if (!idl) return;
        const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
        setClient(new StrataClient(provider, idl));
      } catch (e: any) {
        setError(e?.message);
      }
    }
    init();
  }, [connected, publicKey, connection, wallet]);

  const loadProfile = useCallback(async () => {
    if (!client || !publicKey || !COMMUNITY_PDA_STR) return;
    setLoading(true);
    setError(null);
    try {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / 1e9);

      const community = new PublicKey(COMMUNITY_PDA_STR);
      const mem = await client.getMember(community, publicKey);
      setMember(mem);

      if (mem) {
        const records = await client.getAllAttendanceByWallet(publicKey);
        const rich: AttendedEvent[] = await Promise.all(
          records.map(async ({ account }) => {
            let event: EventAccount | null = null;
            try { event = await client.getEvent(account.event); } catch {}
            return { eventPubkey: account.event.toBase58(), attendance: account, event };
          })
        );
        rich.sort((a, b) => b.attendance.checkedInAt.toNumber() - a.attendance.checkedInAt.toNumber());
        setAttended(rich);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [client, publicKey]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  async function handleRegister() {
    if (!client || !COMMUNITY_PDA_STR) return;
    setLoading(true);
    setError(null);
    try {
      const bal = await connection.getBalance(publicKey!);
      if (bal < 10_000_000) {
        setError("INSUFFICIENT SOL — your wallet needs devnet SOL to register. Get some free at faucet.solana.com");
        setLoading(false);
        return;
      }
      const community = new PublicKey(COMMUNITY_PDA_STR);
      const username  = publicKey!.toBase58().slice(0, 12);
      await client.registerMember(community, username);
      await loadProfile();
    } catch (e: any) {
      const msg = e?.message ?? "";
      if (msg.includes("already in use") || msg.includes("already initialized")) {
        // Account exists — user is already registered, just reload
        await loadProfile();
        return;
      } else if (msg.includes("rejected") || msg.includes("cancelled") || msg.includes("denied")) {
        setError("Transaction cancelled — click Register again and Approve in Phantom.");
      } else if (msg.includes("debit") || msg.includes("insufficient") || msg.includes("0x1")) {
        setError("INSUFFICIENT SOL — get free devnet SOL at faucet.solana.com then try again");
      } else {
        setError(msg || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  function tierProgress(tier: MemberTier, events: number): { pct: number; next: string } {
    const thresholds: Record<MemberTier, [number, number]> = {
      Initiate: [0,  1],
      Seeker:   [1,  3],
      Resident: [3,  6],
      Builder:  [6, 11],
      Core:     [11, 21],
      Legend:   [21, 21],
    };
    const [lo, hi] = thresholds[tier];
    if (tier === "Legend") return { pct: 100, next: "MAX TIER" };
    const pct = Math.min(100, Math.round(((events - lo) / (hi - lo)) * 100));
    const nextTier: Record<MemberTier, MemberTier> = {
      Initiate: "Seeker", Seeker: "Resident", Resident: "Builder",
      Builder: "Core", Core: "Legend", Legend: "Legend",
    };
    return { pct, next: `${hi - events} more to ${nextTier[tier].toUpperCase()}` };
  }

  async function handleClaimNft(rec: AttendedEvent) {
    if (!publicKey) return;
    setClaiming(rec.eventPubkey);
    setError(null);
    try {
      const res = await fetch("/api/mint-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userWallet:  publicKey.toBase58(),
          eventTitle:  rec.event?.title ?? "Strata Event",
          eventCode:   rec.event?.eventCode ?? "",
          checkedInAt: rec.attendance.checkedInAt.toNumber(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Mint failed");
      setMinted(prev => ({ ...prev, [rec.eventPubkey]: data.mint }));
    } catch (e: any) {
      setError(e?.message ?? "NFT mint failed");
    } finally {
      setClaiming(null);
    }
  }

  const Nav = () => (
    <nav className="top-nav">
      <span className="nav-brand">STRATA</span>
      <div className="nav-links">
        <a href="/" className="nav-link">MAIN</a>
        <a href="/organizer" className="nav-link">ORGANIZER</a>
        <a href="/profile" className="nav-link active">PROFILE</a>
        <WalletMultiButton />
      </div>
    </nav>
  );

  if (!connected || !publicKey) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="page">
          <Nav />
          <h1>PROFILE</h1>
          <p className="sub">Your on-chain identity and reputation.</p>
          <div className="card connect-box">
            <p style={{ marginBottom: "1.5rem", fontSize: "0.85rem" }}>
              Connect your wallet to view your Strata profile.
            </p>
            <WalletMultiButton />
          </div>
        </div>
      </>
    );
  }

  if (!COMMUNITY_PDA_STR) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="page">
          <Nav />
          <h1>PROFILE</h1>
          <div className="msg-err">NEXT_PUBLIC_COMMUNITY_PDA not configured.</div>
        </div>
      </>
    );
  }

  const tier     = member ? parseTier(member.tier) : null;
  const events   = member ? member.eventsAttended.toNumber() : 0;
  const rep      = member ? member.reputationScore.toNumber() : 0;
  const progress = tier ? tierProgress(tier, events) : null;
  const color    = tier ? TIER_COLOR[tier] : "#6b7280";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="page">
        <Nav />
        <h1>PROFILE</h1>
        <p className="sub">On-chain reputation · Permanent record.</p>

        {error && (
          <div className="msg-err">
            {error}
            {(error.includes("SOL") || error.includes("debit")) && (
              <div style={{ marginTop: "0.5rem" }}>
                <a href="https://faucet.solana.com" target="_blank" rel="noreferrer"
                  style={{ color: "#fbbf24", textDecoration: "underline" }}>
                  → Get free devnet SOL at faucet.solana.com ↗
                </a>
              </div>
            )}
          </div>
        )}

        {loading && !member && (
          <div className="card">
            <div className="empty">Loading chain data…</div>
          </div>
        )}

        {!loading && !member && (
          <div className="card">
            <div className="card-title">Identity</div>
            <div className="wallet-addr" style={{ marginBottom: "0.75rem" }}>
              {publicKey.toBase58()}
              {balance !== null && (
                <span style={{ marginLeft: "1rem", color: balance < 0.01 ? "#f87171" : "#4ade80" }}>
                  {balance.toFixed(4)} SOL
                  {balance < 0.01 && " ⚠ Need SOL"}
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: "1.2rem" }}>
              You are not yet a member of this community. Register to start building your on-chain reputation.
            </p>
            {balance !== null && balance < 0.01 ? (
              <a href="https://faucet.solana.com" target="_blank" rel="noreferrer"
                style={{ display: "inline-block", padding: "0.6rem 1.4rem", border: "1px solid #fbbf24",
                  color: "#fbbf24", fontSize: "0.8rem", letterSpacing: "0.1em", borderRadius: "2px" }}>
                GET DEVNET SOL FIRST ↗
              </a>
            ) : (
              <button className="btn" disabled={loading} onClick={handleRegister}>
                {loading ? "Registering…" : "Register as Member"}
              </button>
            )}
          </div>
        )}

        {member && tier && (
          <>
            <div className="card">
              <div className="card-title">Identity</div>
              <div className="username">@{member.username}</div>
              <div className="wallet-addr">{publicKey.toBase58()}</div>

              <div
                className="tier-badge"
                style={{ background: `${color}15`, border: `1px solid ${color}55`, color }}
              >
                <span className="tier-dot" style={{ background: color }} />
                {tier.toUpperCase()}
                <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>· {TIER_THRESHOLD[tier]}</span>
              </div>

              <div className="stat-row">
                <div className="stat">
                  <div className="stat-val">{events}</div>
                  <div className="stat-lbl">EVENTS</div>
                </div>
                <div className="stat">
                  <div className="stat-val">{rep}</div>
                  <div className="stat-lbl">REP SCORE</div>
                </div>
                <div className="stat">
                  <div className="stat-val" style={{ fontSize: "1rem", paddingTop: "0.4rem" }}>
                    {new Date(member.joinedAt.toNumber() * 1000).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </div>
                  <div className="stat-lbl">JOINED</div>
                </div>
              </div>

              {progress && (
                <>
                  <div className="prog-bar">
                    <div className="prog-fill" style={{ width: `${progress.pct}%`, background: color }} />
                  </div>
                  <div className="prog-labels">
                    <span>{progress.pct}% to next tier</span>
                    <span>{progress.next}</span>
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <div className="card-title">Attendance History ({attended.length})</div>
              {attended.length === 0 && (
                <div className="empty">No check-ins yet. Scan a QR at a live Strata event.</div>
              )}
              {attended.map((rec) => (
                <div className="event-row" key={rec.eventPubkey}>
                  <div className="event-title">
                    {rec.event?.title ?? "Unknown Event"}
                    {rec.attendance.nftMint && (
                      <span className="nft-badge">cNFT ✓</span>
                    )}
                  </div>
                  <div className="event-meta">
                    {rec.event && `${rec.event.location}, ${rec.event.country} · `}
                    Checked in{" "}
                    {new Date(rec.attendance.checkedInAt.toNumber() * 1000).toLocaleDateString("en-US", { dateStyle: "medium" })}
                    {" "}· Edition #{rec.attendance.edition.toNumber()}
                    {" "}·{" "}
                    <a href={`https://explorer.solana.com/address/${rec.eventPubkey}?cluster=devnet`} target="_blank" rel="noreferrer">
                      Explorer ↗
                    </a>
                  </div>
                  <div style={{ marginTop: "0.6rem" }}>
                    {rec.attendance.nftMint || minted[rec.eventPubkey] ? (
                      <a
                        href={`https://explorer.solana.com/address/${rec.attendance.nftMint?.toBase58() ?? minted[rec.eventPubkey]}?cluster=devnet`}
                        target="_blank" rel="noreferrer"
                        style={{ fontSize: "0.72rem", color: "#4ade80", border: "1px solid #166534",
                          padding: "2px 10px", borderRadius: "2px", textDecoration: "none" }}
                      >
                        ✓ NFT MINTED — VIEW ↗
                      </a>
                    ) : (
                      <button
                        onClick={() => handleClaimNft(rec)}
                        disabled={claiming === rec.eventPubkey}
                        style={{ fontSize: "0.72rem", color: "#dc2626", border: "1px solid #7f1d1d",
                          background: "transparent", padding: "2px 10px", borderRadius: "2px",
                          cursor: "pointer", fontFamily: "'Share Tech Mono', monospace",
                          opacity: claiming === rec.eventPubkey ? 0.5 : 1 }}
                      >
                        {claiming === rec.eventPubkey ? "MINTING…" : "CLAIM NFT"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
