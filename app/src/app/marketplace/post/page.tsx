"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Nav } from "../../../components/Nav";
import { organizerCSS } from "../../../styles/organizerStyles";
import { SCORE_TIER_COLOR, SCORE_TIER_ICON, StrataScoreTier } from "../../../utils/scoring";
import type { RoleType } from "../../api/marketplace/route";

const TIERS: Array<{ value: StrataScoreTier | "Any"; label: string; desc: string }> = [
  { value: "Any",      label: "Open to All",  desc: "Any Strata member can apply" },
  { value: "Seeker",   label: "Seeker+",      desc: "Attended at least 1 event" },
  { value: "Resident", label: "Resident+",    desc: "Active community builder" },
  { value: "Builder",  label: "Builder+",     desc: "Proven contributor — 6+ events" },
  { value: "Core",     label: "Core+",        desc: "Veteran builder — 11+ events" },
  { value: "Legend",   label: "Legend Only",  desc: "Top 1% — 21+ events" },
];

const ROLE_TYPES: RoleType[] = ["Full-Time", "Part-Time", "Contract", "Bounty"];

const POST_EXTRA_CSS = `
  .tier-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:.6rem; margin-bottom:1rem; }
  .tier-option {
    padding:.75rem; border:1px solid rgba(64,81,91,.6); border-radius:10px;
    cursor:pointer; transition:all .18s; background:rgba(31,44,53,.6);
    display:flex; flex-direction:column; gap:.2rem;
  }
  .tier-option:hover { border-color:var(--p); }
  .tier-option.selected { border-color:currentColor; background:rgba(31,44,53,.9); }
  .tier-opt-label { font-family:'Space Grotesk',sans-serif; font-size:.8rem; font-weight:700; }
  .tier-opt-desc  { font-size:.65rem; color:var(--text-muted); line-height:1.4; }
  .type-group { display:flex; gap:.4rem; flex-wrap:wrap; margin-bottom:1rem; }
  .type-btn {
    padding:.45rem .9rem; border-radius:8px; border:1px solid rgba(64,81,91,.6);
    background:transparent; color:var(--text-muted); font-family:'Space Grotesk',sans-serif;
    font-size:.8rem; font-weight:600; cursor:pointer; transition:all .18s;
  }
  .type-btn:hover { border-color:var(--p); color:#D1D8B4; }
  .type-btn.selected { background:var(--p); border-color:var(--p); color:#D1D8B4; }
  .fee-box {
    padding:1rem 1.25rem; border-radius:10px;
    background:rgba(40,91,115,.18); border:1px solid rgba(40,91,115,.4);
    display:flex; align-items:center; gap:.75rem; margin-bottom:1rem;
  }
  .fee-sol { font-family:'Space Mono',monospace; font-size:1.4rem; font-weight:700; color:#D1D8B4; }
  .fee-desc { font-size:.75rem; color:var(--text-muted); line-height:1.5; }
  @media(max-width:480px){ .tier-grid{ grid-template-columns:1fr 1fr; } }
`;

export default function PostListingPage() {
  const { publicKey, connected } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;

  const [title,        setTitle]        = useState("");
  const [orgName,      setOrgName]      = useState("");
  const [description,  setDescription]  = useState("");
  const [roleType,     setRoleType]     = useState<RoleType>("Full-Time");
  const [compensation, setCompensation] = useState("");
  const [location,     setLocation]     = useState("Remote");
  const [minTier,      setMinTier]      = useState<StrataScoreTier | "Any">("Any");
  const [daysActive,   setDaysActive]   = useState("30");
  const [loading,      setLoading]      = useState(false);
  const [msg,          setMsg]          = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet) return;
    setLoading(true); setMsg(null);
    try {
      const r = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poster: wallet, orgName, title, description, roleType, compensation, location, minTier, daysActive }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed to post");
      setMsg({ type: "ok", text: `✓ "${title}" is now live on the marketplace.` });
      setTitle(""); setOrgName(""); setDescription(""); setCompensation(""); setLocation("Remote");
    } catch (err: any) {
      setMsg({ type: "err", text: err?.message ?? "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: organizerCSS + POST_EXTRA_CSS }} />
      <div className="grid-bg" />
      <div className="orb-wrap"><div className="orb orb1" /><div className="orb orb2" /></div>
      <div className="scanline" />
      <Nav active="marketplace" />

      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Post a Role</h1>
          <p className="page-sub">Reach verified on-chain builders. Every applicant has proof-of-presence.</p>
        </div>

        {!connected && (
          <div className="card connect-card">
            <p>Connect your wallet to post a listing</p>
            <WalletMultiButton />
          </div>
        )}

        {connected && (
          <>
            {/* Fee info */}
            <div className="fee-box">
              <div>
                <div className="fee-sol">0.05 SOL</div>
                <div style={{ fontSize:".62rem", color:"var(--text-muted)", letterSpacing:".08em", textTransform:"uppercase" }}>Posting Fee</div>
              </div>
              <div className="fee-desc">
                Paid on-chain when the marketplace program is deployed.
                Listings are active for your chosen duration and visible to all
                wallets that meet your tier requirement.
              </div>
            </div>

            {msg && (
              <div className={msg.type === "ok" ? "msg-ok" : "msg-err"}>
                {msg.text}
                {msg.type === "ok" && (
                  <div style={{ marginTop:".5rem" }}>
                    <a href="/marketplace" style={{ color:"var(--g)", fontWeight:600 }}>→ View on marketplace ↗</a>
                  </div>
                )}
              </div>
            )}

            <div className="card">
              <div className="card-title">Role Details</div>
              <form id="post-form" onSubmit={handleSubmit}>
                <div className="row">
                  <div>
                    <label>Job Title *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Solana Protocol Engineer" required maxLength={64} />
                  </div>
                  <div>
                    <label>Organisation *</label>
                    <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Acme Labs" required maxLength={64} />
                  </div>
                </div>

                <label>Description *</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the role, responsibilities, and what you're looking for…"
                  required maxLength={512}
                  style={{ minHeight:110 }}
                />
                <p className="field-note">{512 - description.length} chars remaining</p>

                <div className="row">
                  <div>
                    <label>Compensation</label>
                    <input value={compensation} onChange={e => setCompensation(e.target.value)} placeholder="e.g. $8k/mo or 2 SOL" maxLength={64} />
                  </div>
                  <div>
                    <label>Location</label>
                    <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Remote" maxLength={64} />
                  </div>
                </div>

                <label>Role Type</label>
                <div className="type-group">
                  {ROLE_TYPES.map(t => (
                    <button key={t} type="button" className={`type-btn${roleType === t ? " selected" : ""}`}
                      onClick={() => setRoleType(t)}>{t}</button>
                  ))}
                </div>

                <label>Listing Duration</label>
                <div className="row" style={{ marginBottom:".5rem" }}>
                  <div>
                    <input type="number" value={daysActive} onChange={e => setDaysActive(e.target.value)} min="1" max="90" />
                    <p className="field-note">Days active (1–90)</p>
                  </div>
                </div>
              </form>
            </div>

            {/* Tier gate */}
            <div className="card">
              <div className="card-title">Minimum Tier Requirement</div>
              <p style={{ fontSize:".78rem", color:"var(--text-muted)", marginBottom:"1rem", lineHeight:1.6 }}>
                Set the minimum Strata tier to apply. Listings with higher gates appear locked to wallets below the threshold.
              </p>
              <div className="tier-grid">
                {TIERS.map(({ value, label, desc }) => {
                  const color = value !== "Any" ? SCORE_TIER_COLOR[value as StrataScoreTier] : "#879989";
                  const icon  = value !== "Any" ? SCORE_TIER_ICON[value as StrataScoreTier]  : "◦";
                  return (
                    <div
                      key={value}
                      className={`tier-option${minTier === value ? " selected" : ""}`}
                      style={{ color, borderColor: minTier === value ? color : undefined }}
                      onClick={() => setMinTier(value)}
                    >
                      <div className="tier-opt-label">{icon} {label}</div>
                      <div className="tier-opt-desc">{desc}</div>
                    </div>
                  );
                })}
              </div>

              <button
                className="btn btn-primary btn-block"
                type="submit"
                form="post-form"
                disabled={loading || !title || !orgName || !description}
                style={{ marginTop:".25rem" }}
              >
                {loading ? "Posting…" : "⬡ Publish Listing"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
