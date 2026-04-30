"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Nav } from "../../components/Nav";
import { marketplaceCSS } from "../../styles/marketplaceStyles";
import { SCORE_TIER_COLOR, SCORE_TIER_ICON, StrataScoreTier } from "../../utils/scoring";
import type { Listing, RoleType } from "../api/marketplace/route";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_RANK: Record<StrataScoreTier | "Any", number> = {
  Any: -1, Initiate: 0, Seeker: 1, Resident: 2, Builder: 3, Core: 4, Legend: 5,
};

const TIER_LABELS: Array<{ key: StrataScoreTier | "Any"; label: string }> = [
  { key: "Any",      label: "All Roles" },
  { key: "Seeker",   label: "Seeker+" },
  { key: "Resident", label: "Resident+" },
  { key: "Builder",  label: "Builder+" },
  { key: "Core",     label: "Core+" },
  { key: "Legend",   label: "Legend Only" },
];

const ROLE_TYPES: Array<{ key: RoleType | "All"; label: string }> = [
  { key: "All",       label: "All Types" },
  { key: "Full-Time", label: "Full-Time" },
  { key: "Part-Time", label: "Part-Time" },
  { key: "Contract",  label: "Contract" },
  { key: "Bounty",    label: "Bounty" },
];

const TIER_CLASS: Record<string, string> = {
  Any: "tier-any", Seeker: "tier-seeker", Resident: "tier-resident",
  Builder: "tier-builder", Core: "tier-core", Legend: "tier-legend",
};

function tierGateLabel(t: string) {
  if (t === "Any") return "Open to All";
  const icons: Record<string, string> = { Seeker:"◈", Resident:"⬡", Builder:"✦", Core:"⬟", Legend:"✺" };
  return `${icons[t] ?? ""} ${t}+`;
}

function timeAgo(ms: number): string {
  const d = Math.floor((Date.now() - ms) / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

// ─── Apply Modal ──────────────────────────────────────────────────────────────

function ApplyModal({ listing, userTier, wallet, onClose }: {
  listing: Listing;
  userTier: StrataScoreTier;
  wallet: string;
  onClose: () => void;
}) {
  const [note,     setNote]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");

  const tierRank   = TIER_RANK[userTier];
  const minRank    = TIER_RANK[listing.minTier as StrataScoreTier | "Any"];
  const blocked    = listing.minTier !== "Any" && tierRank < minRank;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (blocked) return;
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/marketplace/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, wallet, note }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? "Failed to apply"); }
      else { setDone(true); }
    } catch { setError("Network error — try again"); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        {done ? (
          <div className="modal-success">
            <div className="icon">✓</div>
            <h3>Application sent!</h3>
            <p>{listing.orgName} can now see your Strata profile and proof-of-presence record.</p>
            <button className="btn-cancel" style={{ marginTop:"1.25rem", width:"100%" }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="modal-title">Apply — {listing.title}</div>
            <div className="modal-sub">{listing.orgName} · {listing.location}</div>

            {blocked && (
              <div className="modal-tier-warn">
                ✺ This listing requires <strong>{listing.minTier}</strong> tier.
                Your current tier is <strong>{userTier}</strong>.
                Attend more events to unlock.
              </div>
            )}

            <form onSubmit={submit}>
              <label>Cover note <span style={{ color:"#5C7580", fontWeight:400 }}>(optional)</span></label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 256))}
                placeholder="Brief intro — your skills, availability, why this role…"
                disabled={blocked}
              />
              <div style={{ fontSize:".68rem", color:"var(--muted)", marginTop:"-.6rem", marginBottom:".75rem" }}>
                Your Strata profile (tier, events, NFTs) will be visible to the recruiter.
              </div>

              {error && <div style={{ color:"#f87171", fontSize:".8rem", marginBottom:".75rem" }}>{error}</div>}

              <div className="modal-actions">
                <button className="btn-cancel" type="button" onClick={onClose}>Cancel</button>
                <button className="btn-submit" type="submit" disabled={loading || blocked}>
                  {loading ? "Sending…" : blocked ? "Tier too low" : "Submit Application"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────

function ListingCard({ listing, userTier, wallet, applied, onApply }: {
  listing:  Listing;
  userTier: StrataScoreTier | null;
  wallet:   string | null;
  applied:  boolean;
  onApply:  () => void;
}) {
  const tierRank  = userTier ? TIER_RANK[userTier] : -1;
  const minRank   = TIER_RANK[listing.minTier as StrataScoreTier | "Any"];
  const isLocked  = listing.minTier !== "Any" && tierRank < minRank;
  const minColor  = listing.minTier !== "Any" ? SCORE_TIER_COLOR[listing.minTier as StrataScoreTier] : undefined;

  return (
    <div className={`listing-card${isLocked ? " locked" : ""}`}>
      {/* Lock overlay */}
      {isLocked && (
        <div className="lock-overlay">
          <div className="lock-icon">🔒</div>
          <div className="lock-title">{listing.minTier} Required</div>
          <div className="lock-sub">Attend more events to unlock this listing</div>
          <div className="lock-tier" style={{ color: minColor, borderColor: minColor + "60" }}>
            {SCORE_TIER_ICON[listing.minTier as StrataScoreTier]} {listing.minTier}
          </div>
        </div>
      )}

      {/* Top badges */}
      <div className="card-top">
        <div className="card-badges">
          <span className="role-badge">{listing.roleType}</span>
          <span className={`tier-gate ${TIER_CLASS[listing.minTier] ?? "tier-any"}`}>
            {tierGateLabel(listing.minTier)}
          </span>
        </div>
        <span style={{ fontSize:".65rem", color:"var(--muted)", whiteSpace:"nowrap", flexShrink:0 }}>
          {timeAgo(listing.createdAt)}
        </span>
      </div>

      {/* Title + org */}
      <div>
        <div className="card-title">{listing.title}</div>
        <div className="card-org">{listing.orgName}</div>
      </div>

      {/* Description */}
      <div className="card-desc">{listing.description}</div>

      {/* Meta */}
      <div className="card-meta">
        <span className="meta-item">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <circle cx="5.5" cy="4.5" r="2" stroke="#879989" strokeWidth="1.2"/>
            <path d="M1.5 10C1.5 8.07 3.32 6.5 5.5 6.5S9.5 8.07 9.5 10" stroke="#879989" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {listing.location}
        </span>
        <span className="meta-item">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="#879989" strokeWidth="1.2"/>
            <path d="M5.5 3v2.5l1.5 1.5" stroke="#879989" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {new Date(listing.expiresAt).toLocaleDateString("en-US", { month:"short", day:"numeric" })}
        </span>
      </div>

      {/* Footer */}
      <div className="card-footer">
        <div>
          <div className="comp">{listing.compensation || "—"}</div>
          <div className="apps">{listing.applications} applied</div>
        </div>
        {wallet && !isLocked && (
          <button
            className={`btn-apply${applied ? " applied" : ""}`}
            onClick={applied ? undefined : onApply}
          >
            {applied ? "✓ Applied" : "Apply →"}
          </button>
        )}
        {!wallet && (
          <span style={{ fontSize:".72rem", color:"var(--muted)" }}>Connect wallet</span>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="listing-card" style={{ gap:".75rem" }}>
      <div className="shimmer" style={{ height:20, width:"40%" }} />
      <div>
        <div className="shimmer" style={{ height:18, width:"80%", marginBottom:6 }} />
        <div className="shimmer" style={{ height:14, width:"45%" }} />
      </div>
      <div>
        <div className="shimmer" style={{ height:12, marginBottom:5 }} />
        <div className="shimmer" style={{ height:12, marginBottom:5 }} />
        <div className="shimmer" style={{ height:12, width:"70%" }} />
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <div className="shimmer" style={{ height:14, width:60 }} />
        <div className="shimmer" style={{ height:14, width:70 }} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const { publicKey, connected } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;

  const [listings,   setListings]   = useState<Listing[]>([]);
  const [userTier,   setUserTier]   = useState<StrataScoreTier | null>(null);
  const [feeSOL,     setFeeSOL]     = useState(0.05);
  const [loading,    setLoading]    = useState(true);
  const [tierFilter, setTierFilter] = useState<StrataScoreTier | "Any">("Any");
  const [typeFilter, setTypeFilter] = useState<RoleType | "All">("All");
  const [applied,    setApplied]    = useState<Set<string>>(new Set());
  const [modal,      setModal]      = useState<Listing | null>(null);

  // Fetch listings
  useEffect(() => {
    fetch("/api/marketplace")
      .then(r => r.json())
      .then(d => { setListings(d.listings ?? []); setFeeSOL(d.feeSOL ?? 0.05); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch user tier
  useEffect(() => {
    if (!wallet) { setUserTier(null); return; }
    fetch(`/api/score/${wallet}`)
      .then(r => r.json())
      .then(d => setUserTier(d.tier ?? "Initiate"))
      .catch(() => setUserTier("Initiate"));
  }, [wallet]);

  // Filtered listings
  const visible = listings.filter(l => {
    if (typeFilter !== "All" && l.roleType !== typeFilter) return false;
    if (tierFilter !== "Any") {
      const minRank = TIER_RANK[l.minTier as StrataScoreTier | "Any"];
      if (minRank < TIER_RANK[tierFilter]) return false;
      if (l.minTier !== "Any" && TIER_RANK[l.minTier as StrataScoreTier] < TIER_RANK[tierFilter]) return false;
    }
    return true;
  });

  const activeCount  = listings.length;
  const orgCount     = new Set(listings.map(l => l.orgName)).size;
  const legendCount  = listings.filter(l => l.minTier === "Legend").length;

  function openApply(listing: Listing) {
    if (!wallet || !connected) return;
    setModal(listing);
  }

  function onApplied(id: string) {
    setApplied(prev => new Set([...prev, id]));
    setModal(null);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: marketplaceCSS }} />
      <div className="grid-bg" />
      <div className="orb-wrap">
        <div className="orb orb1" /><div className="orb orb2" />
      </div>
      <div className="scan-line" />
      <Nav active="marketplace" />

      <div className="page">
        {/* Header */}
        <div className="page-header">
          <div className="eyebrow">Proof-of-Work Talent</div>
          <h1 className="page-title">Strata Marketplace</h1>
          <p className="page-sub">
            Every applicant is verified by on-chain attendance. No fake CVs —
            only wallets with real proof-of-presence get through.
          </p>
        </div>

        {/* Stats */}
        <div className="stats-strip">
          <div className="stat-item">
            <div className="stat-val">{activeCount}</div>
            <div className="stat-lbl">Open Roles</div>
          </div>
          <div className="stat-item">
            <div className="stat-val">{orgCount}</div>
            <div className="stat-lbl">Orgs Hiring</div>
          </div>
          <div className="stat-item">
            <div className="stat-val">{legendCount}</div>
            <div className="stat-lbl">Legend-Only</div>
          </div>
          {userTier && (
            <div className="stat-item" style={{ marginLeft:"auto" }}>
              <div className="stat-val" style={{ color: SCORE_TIER_COLOR[userTier] }}>
                {SCORE_TIER_ICON[userTier]} {userTier}
              </div>
              <div className="stat-lbl">Your Tier</div>
            </div>
          )}
          <div style={{ marginLeft: userTier ? 0 : "auto", display:"flex", alignItems:"center" }}>
            <div className="fee-chip">⬡ {feeSOL} SOL to post</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="filter-group">
            {TIER_LABELS.map(({ key, label }) => (
              <button
                key={key}
                className={`filter-pill${tierFilter === key ? " active" : ""}${key === "Legend" ? " legend-pill" : ""}`}
                onClick={() => setTierFilter(key)}
              >
                {key !== "Any" && key !== "Legend" && SCORE_TIER_ICON[key as StrataScoreTier] + " "}
                {key === "Legend" && "✺ "}
                {label}
              </button>
            ))}
          </div>
          <div className="divider" />
          <div className="filter-group" style={{ flex:"0 0 auto" }}>
            {ROLE_TYPES.map(({ key, label }) => (
              <button
                key={key}
                className={`filter-pill${typeFilter === key ? " active" : ""}`}
                onClick={() => setTypeFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="divider" />
          <a href="/marketplace/post" className="btn-post">+ Post a Role</a>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="listings-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <h3>No listings match your filters</h3>
            <p>Try a broader tier or role type — or be the first to post.</p>
          </div>
        ) : (
          <div className="listings-grid">
            {visible.map(l => (
              <ListingCard
                key={l.id}
                listing={l}
                userTier={userTier}
                wallet={wallet}
                applied={applied.has(l.id)}
                onApply={() => openApply(l)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Apply modal */}
      {modal && wallet && userTier && (
        <ApplyModal
          listing={modal}
          userTier={userTier}
          wallet={wallet}
          onClose={() => setModal(null)}
        />
      )}
      {modal && !wallet && setModal(null)}
    </>
  );
}
