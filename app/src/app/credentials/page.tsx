"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { credentialCSS } from "../../styles/credentialStyles";
import { StrataScoreTier } from "../../utils/scoring";
import { Nav } from "../../components/Nav";
import { Footer } from "../../components/Footer";

const COMMUNITY_PDA  = process.env.NEXT_PUBLIC_COMMUNITY_PDA ?? "";
const PROGRAM_ID_STR = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "";

const TIERS: Array<{ name: StrataScoreTier; icon: string; minScore: number; color: string }> = [
  { name: "Initiate", icon: "◦",  minScore: 0,    color: "#6b7280" },
  { name: "Seeker",   icon: "◈",  minScore: 100,  color: "#ffffff" },
  { name: "Resident", icon: "⬡",  minScore: 250,  color: "#059669" },
  { name: "Builder",  icon: "✦",  minScore: 500,  color: "#d97706" },
  { name: "Core",     icon: "⬟",  minScore: 1000, color: "#dc2626" },
  { name: "Legend",   icon: "✺",  minScore: 2000, color: "#7c3aed" },
];

const NFT_BADGES = [
  { level: 1, img: "/nft-badge/nft-signal-lv1.png", label: "Signal Lv.1", minEvents: 1,  xp: 100,  desc: "Attended your first event" },
  { level: 2, img: "/nft-badge/nft-signal-lv2.png", label: "Signal Lv.2", minEvents: 3,  xp: 300,  desc: "Attended 3 events" },
  { level: 3, img: "/nft-badge/nft-signal-lv3.png", label: "Signal Lv.3", minEvents: 5,  xp: 500,  desc: "Attended 5 events" },
  { level: 4, img: "/nft-badge/nft-signal-lv4.png", label: "Signal Lv.4", minEvents: 10, xp: 1000, desc: "Attended 10 events" },
  { level: 5, img: "/nft-badge/nft-signal-lv5.png", label: "Signal Lv.5", minEvents: 20, xp: 2000, desc: "Attended 20 events" },
];

interface CredentialData {
  owner: string;
  score: number;
  tier: StrataScoreTier;
  tierIndex: number;
  eventsAttended: number;
  hackathonCount: number;
  vouchCount: number;
  lastCheckinAt: number;
  lastIssuer: string;
  isOnChain: boolean;
}

interface Achievement {
  id: string;
  wallet: string;
  hackathonName: string;
  projectUrl: string;
  rank: string;
  description: string;
  submittedAt: number;
  status: string;
  points?: number;
  nftMint?: string;
}

interface ClaimForm {
  hackathonName: string;
  projectUrl:    string;
  rank:          string;
  description:   string;
}

function tierProgress(score: number, idx: number) {
  if (idx >= TIERS.length - 1) return { pct: 100, next: null as string | null, needed: 0 };
  const from = TIERS[idx].minScore;
  const to   = TIERS[idx + 1].minScore;
  const pct  = Math.min(100, Math.round(((score - from) / (to - from)) * 100));
  return { pct, next: TIERS[idx + 1].name, needed: Math.max(0, to - score) };
}

function AchievementCard({ ach }: { ach: Achievement }) {
  return (
    <div className="ach-card">
      <div className="ach-verified">Verified by Signal</div>
      <div className="ach-name">{ach.hackathonName}</div>
      <div className="ach-rank">{ach.rank}</div>
      {ach.points != null && <div className="ach-pts">+{ach.points} pts</div>}
    </div>
  );
}

export default function CredentialsPage() {
  const { publicKey } = useWallet();
  const walletAddr    = publicKey?.toBase58() ?? "";
  const target        = walletAddr;

  const [cred,         setCred]         = useState<CredentialData | null>(null);
  const [rank,         setRank]         = useState<number | null>(null);
  const [leaderTotal,  setLeaderTotal]  = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievePts,   setAchievePts]   = useState(0);
  const [worldVerified, setWorldVerified] = useState(false);

  const [credLoading, setCredLoading] = useState(false);
  const [rankLoading, setRankLoading] = useState(false);
  const [achLoading,  setAchLoading]  = useState(false);
  const [error,       setError]       = useState("");

  const [selectedBadge, setSelectedBadge] = useState<typeof NFT_BADGES[0] | null>(null);
  const [badgeEarned,   setBadgeEarned]   = useState(false);
  const [passportImg,   setPassportImg]   = useState<string | null>(null);
  const [passportOpen,  setPassportOpen]  = useState(false);

  const [claimOpen,    setClaimOpen]    = useState(false);
  const [claimForm,    setClaimForm]    = useState<ClaimForm>({ hackathonName: "", projectUrl: "", rank: "", description: "" });
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMsg,     setClaimMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET ?? "";
  const [adminKey,      setAdminKey]      = useState("");
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [adminKeyOpen,  setAdminKeyOpen]  = useState(false);
  const [myClaims,      setMyClaims]      = useState<any[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [actionMsg,     setActionMsg]     = useState<Record<string, { ok: boolean; text: string }>>({});
  const [actioning,     setActioning]     = useState<string | null>(null);

  // If no admin wallet is configured, any connected wallet gets admin access (demo mode)
  const isAdminWallet = !!publicKey && (!ADMIN_WALLET || publicKey.toBase58() === ADMIN_WALLET);
  const isAdmin = isAdminWallet || !!adminKey;

  useEffect(() => {
    if (!target) return;
    setCred(null); setRank(null); setLeaderTotal(0); setAchievements([]); setAchievePts(0); setWorldVerified(false); setError("");

    setCredLoading(true);
    fetch(`/api/credentials/${target}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setCred(d); })
      .catch(e => setError(e?.message ?? "Failed to fetch credential"))
      .finally(() => setCredLoading(false));

    setRankLoading(true);
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(d => {
        const entries: Array<{ wallet: string }> = d.entries ?? [];
        setLeaderTotal(entries.length);
        const idx = entries.findIndex(e => e.wallet === target);
        setRank(idx >= 0 ? idx + 1 : null);
      })
      .catch(() => {})
      .finally(() => setRankLoading(false));

    setAchLoading(true);
    fetch(`/api/achievement/wallet/${target}`)
      .then(r => r.json())
      .then(d => { setAchievements(d.achievements ?? []); setAchievePts(d.totalPoints ?? 0); })
      .catch(() => {})
      .finally(() => setAchLoading(false));

    fetch(`/api/worldid/verified/${target}`)
      .then(r => r.json())
      .then(d => setWorldVerified(d.verified === true))
      .catch(() => {});
  }, [target]);

  useEffect(() => {
    if (!target) { setMyClaims([]); return; }
    setClaimsLoading(true);
    fetch(`/api/achievement/wallet/${target}`)
      .then(r => r.json())
      .then(d => setMyClaims(d.allClaims ?? []))
      .catch(() => {})
      .finally(() => setClaimsLoading(false));
  }, [target]);

  useEffect(() => {
    if (!isAdmin) return;
    setClaimsLoading(true);
    fetch("/api/achievement/pending?status=pending", {
      headers: { "x-admin-key": adminKey },
    })
      .then(r => r.json())
      .then(d => {
        const adminPending = (d.claims ?? []) as any[];
        setMyClaims(prev => {
          const ownIds = new Set(prev.map((c: any) => c.id));
          const merged = [...prev];
          for (const c of adminPending) {
            if (!ownIds.has(c.id)) merged.push(c);
          }
          return merged;
        });
      })
      .catch(() => {})
      .finally(() => setClaimsLoading(false));
  }, [isAdmin, adminKey]);

  async function handleClaimSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!walletAddr) return;
    setClaimLoading(true); setClaimMsg(null);
    try {
      const res = await fetch("/api/achievement/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddr, ...claimForm }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Submission failed");
      setClaimMsg({ ok: true, text: "Claim submitted! Signal admin will review and mint your Achievement NFT." });
      setClaimForm({ hackathonName: "", projectUrl: "", rank: "", description: "" });
      // Refresh claims inbox
      fetch(`/api/achievement/wallet/${walletAddr}`)
        .then(r => r.json())
        .then(d => setMyClaims(d.allClaims ?? []))
        .catch(() => {});
    } catch (err: any) {
      setClaimMsg({ ok: false, text: err?.message ?? "Submission failed" });
    } finally {
      setClaimLoading(false);
    }
  }

  async function handleAction(claimId: string, action: "approve" | "reject") {
    if (!publicKey) return;
    setActioning(claimId);
    setActionMsg(prev => ({ ...prev, [claimId]: { ok: true, text: action === "approve" ? "Approving…" : "Rejecting…" } }));
    try {
      const res = await fetch("/api/achievement/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ claimId, adminPubkey: publicKey.toBase58(), action }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Action failed");
      setActionMsg(prev => ({
        ...prev,
        [claimId]: { ok: true, text: action === "approve" ? "Approved — NFT minted!" : "Rejected" },
      }));
      setMyClaims(prev => prev.map((c: any) =>
        c.id === claimId ? { ...c, status: action === "approve" ? "approved" : "rejected" } : c
      ));
    } catch (e: any) {
      setActionMsg(prev => ({ ...prev, [claimId]: { ok: false, text: e?.message ?? "Failed" } }));
    } finally {
      setActioning(null);
    }
  }

  const tier = cred ? (TIERS[cred.tierIndex] ?? TIERS[0]) : TIERS[0];
  const prog = cred ? tierProgress(cred.score, cred.tierIndex) : { pct: 0, next: "Seeker", needed: 100 };

  async function handleShare() {
    if (!cred) return;
    await document.fonts.ready;

    const W = 900, H = 560;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    const tierColor = tier.color;

    const tc = tier.color;
    const lw = 290, bh = 56;

    // ── Clip card to rounded rect ────────────────────────────────────────────
    ctx.save();
    ctx.beginPath(); (ctx as any).roundRect(0, 0, W, H, 24); ctx.clip();

    // Base background
    ctx.fillStyle = "#07070f";
    ctx.fillRect(0, 0, W, H);

    // Ambient left glow (tier color)
    const ambL = ctx.createRadialGradient(lw * 0.5, H * 0.45, 0, lw * 0.5, H * 0.45, 340);
    ambL.addColorStop(0, tc + "28"); ambL.addColorStop(1, "transparent");
    ctx.fillStyle = ambL; ctx.fillRect(0, 0, W, H);

    // Ambient right glow (subtle)
    const ambR = ctx.createRadialGradient(W * 0.72, H * 0.3, 0, W * 0.72, H * 0.3, 260);
    ambR.addColorStop(0, tc + "10"); ambR.addColorStop(1, "transparent");
    ctx.fillStyle = ambR; ctx.fillRect(0, 0, W, H);

    // Dot grid (right panel only)
    ctx.fillStyle = "rgba(255,255,255,0.022)";
    for (let x = lw + 20; x < W; x += 30)
      for (let y = 20; y < H - bh; y += 30) {
        ctx.beginPath(); ctx.arc(x, y, 0.9, 0, Math.PI * 2); ctx.fill();
      }

    // ── Left panel ───────────────────────────────────────────────────────────
    const lpGrad = ctx.createLinearGradient(0, 0, lw, H);
    lpGrad.addColorStop(0, tc + "30"); lpGrad.addColorStop(0.7, tc + "0d"); lpGrad.addColorStop(1, "transparent");
    ctx.fillStyle = lpGrad; ctx.fillRect(0, 0, lw, H - bh);

    // Left panel right border glow
    const lpBorder = ctx.createLinearGradient(0, 0, 0, H);
    lpBorder.addColorStop(0, "transparent"); lpBorder.addColorStop(0.3, tc + "55");
    lpBorder.addColorStop(0.7, tc + "55"); lpBorder.addColorStop(1, "transparent");
    ctx.strokeStyle = lpBorder; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lw, 0); ctx.lineTo(lw, H - bh); ctx.stroke();

    // SIGNAL wordmark
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 30px 'Orbitron', monospace";
    (ctx as any).letterSpacing = "3px";
    ctx.fillText("SIGNAL", 28, 58);
    (ctx as any).letterSpacing = "5px";
    ctx.font = "600 9.5px 'Orbitron', monospace";
    ctx.fillStyle = tc + "cc";
    ctx.fillText("PROTOCOL", 30, 75);
    (ctx as any).letterSpacing = "0px";

    // Decorative line under wordmark
    const wlGrad = ctx.createLinearGradient(28, 0, 230, 0);
    wlGrad.addColorStop(0, tc); wlGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = wlGrad; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(28, 84); ctx.lineTo(230, 84); ctx.stroke();

    // Circular avatar with outer glow
    const avCx = lw / 2, avCy = 198, avR = 56;
    const avGlow = ctx.createRadialGradient(avCx, avCy, avR, avCx, avCy, avR + 28);
    avGlow.addColorStop(0, tc + "44"); avGlow.addColorStop(1, "transparent");
    ctx.fillStyle = avGlow; ctx.beginPath(); ctx.arc(avCx, avCy, avR + 28, 0, Math.PI * 2); ctx.fill();

    // Avatar fill
    const avFill = ctx.createRadialGradient(avCx - 18, avCy - 18, 0, avCx, avCy, avR);
    avFill.addColorStop(0, "#1c1c30"); avFill.addColorStop(1, "#0c0c1a");
    ctx.fillStyle = avFill; ctx.beginPath(); ctx.arc(avCx, avCy, avR, 0, Math.PI * 2); ctx.fill();

    // Avatar ring (tier color)
    ctx.strokeStyle = tc; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(avCx, avCy, avR, 0, Math.PI * 2); ctx.stroke();

    // Avatar ring outer (subtle)
    ctx.strokeStyle = tc + "30"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(avCx, avCy, avR + 6, 0, Math.PI * 2); ctx.stroke();

    // Avatar letter
    ctx.shadowColor = tc; ctx.shadowBlur = 12;
    ctx.fillStyle = "#ffffff"; ctx.font = "900 40px 'Epilogue', sans-serif";
    ctx.textAlign = "center"; ctx.fillText(tier.name.charAt(0), avCx, avCy + 15);
    ctx.shadowBlur = 0; ctx.textAlign = "left";

    // Wallet address
    const shortWallet = `${walletAddr.slice(0, 8)}…${walletAddr.slice(-6)}`;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "400 9px 'Space Mono', monospace";
    ctx.textAlign = "center"; ctx.fillText(shortWallet, lw / 2, 278); ctx.textAlign = "left";

    // Tier pill
    const pillW = 112, pillX = (lw - pillW) / 2, pillY = 291;
    ctx.fillStyle = tc + "1a"; ctx.strokeStyle = tc + "70"; ctx.lineWidth = 1;
    ctx.beginPath(); (ctx as any).roundRect(pillX, pillY, pillW, 24, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = tc;
    ctx.font = "700 9.5px 'Orbitron', monospace"; (ctx as any).letterSpacing = "2px";
    ctx.textAlign = "center"; ctx.fillText(tier.name.toUpperCase(), lw / 2, pillY + 16);
    ctx.textAlign = "left"; (ctx as any).letterSpacing = "0px";

    // ── Right panel ──────────────────────────────────────────────────────────
    const rx = lw + 38;

    // "BUILDER PASSPORT" eyebrow
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "700 8px 'Orbitron', monospace"; (ctx as any).letterSpacing = "5px";
    ctx.fillText("BUILDER PASSPORT", rx, 36); (ctx as any).letterSpacing = "0px";
    ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rx, 44); ctx.lineTo(W - 28, 44); ctx.stroke();

    // Score glow shadow
    ctx.shadowColor = tc; ctx.shadowBlur = 28;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 88px 'Orbitron', monospace";
    ctx.fillText(cred.score.toLocaleString(), rx, 150);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.font = "700 8.5px 'Orbitron', monospace"; (ctx as any).letterSpacing = "4px";
    ctx.fillText("SIGNAL SCORE", rx, 170); (ctx as any).letterSpacing = "0px";

    // Score underline (tier fade)
    const suGrad = ctx.createLinearGradient(rx, 0, rx + 280, 0);
    suGrad.addColorStop(0, tc); suGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = suGrad; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(rx, 178); ctx.lineTo(rx + 280, 178); ctx.stroke();

    // Stat cards
    const stats = [
      { label: "EVENTS", val: String(cred.eventsAttended) },
      { label: "RANK",   val: rank !== null ? `#${rank}` : "—" },
      { label: "LEVEL",  val: `LV ${cred.tierIndex + 1}` },
    ];
    const cW = 148, cH = 76, cGap = 12, cY = 196;
    stats.forEach((s, i) => {
      const sx = rx + i * (cW + cGap);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1;
      ctx.beginPath(); (ctx as any).roundRect(sx, cY, cW, cH, 12); ctx.fill(); ctx.stroke();
      // Top accent bar
      const acGrad = ctx.createLinearGradient(sx, 0, sx + cW * 0.6, 0);
      acGrad.addColorStop(0, tc + "bb"); acGrad.addColorStop(1, "transparent");
      ctx.fillStyle = acGrad;
      ctx.beginPath(); (ctx as any).roundRect(sx + 1, cY + 1, cW - 2, 2, [11, 11, 0, 0]); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 28px 'Orbitron', monospace";
      ctx.fillText(s.val, sx + 14, cY + 44);
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.font = "600 7px 'Orbitron', monospace"; (ctx as any).letterSpacing = "2px";
      ctx.fillText(s.label, sx + 14, cY + 60); (ctx as any).letterSpacing = "0px";
    });

    // Badges section
    const bSectY = 284;
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.font = "600 7.5px 'Orbitron', monospace"; (ctx as any).letterSpacing = "3px";
    ctx.fillText("EARNED BADGES", rx, bSectY); (ctx as any).letterSpacing = "0px";

    const earnedBadges = NFT_BADGES.filter(b => cred.eventsAttended >= b.minEvents);
    const bGap = 14;
    const panelW = W - 28 - rx; // available right-panel width
    const bCount = earnedBadges.length || 1;
    const bs = Math.min(130, Math.floor((panelW - (bCount - 1) * bGap) / bCount));
    const badgeImgPromises = earnedBadges.map(b =>
      new Promise<{ img: HTMLImageElement; badge: typeof b }>((res, rej) => {
        const img = new Image(); img.crossOrigin = "anonymous";
        img.onload = () => res({ img, badge: b }); img.onerror = () => rej(); img.src = b.img;
      })
    );
    const loaded = await Promise.allSettled(badgeImgPromises);
    loaded.forEach((r, i) => {
      if (r.status !== "fulfilled") return;
      const bx = rx + i * (bs + bGap), by = bSectY + 12;
      // Badge glow
      const bgGlow = ctx.createRadialGradient(bx + bs / 2, by + bs / 2, 0, bx + bs / 2, by + bs / 2, bs * 0.85);
      bgGlow.addColorStop(0, tc + "38"); bgGlow.addColorStop(1, "transparent");
      ctx.fillStyle = bgGlow; ctx.fillRect(bx - 14, by - 14, bs + 28, bs + 28);
      // Badge image clipped
      ctx.save();
      ctx.beginPath(); (ctx as any).roundRect(bx, by, bs, bs, 14); ctx.clip();
      ctx.drawImage(r.value.img, bx, by, bs, bs);
      ctx.restore();
      // Badge border
      ctx.strokeStyle = tc + "80"; ctx.lineWidth = 2;
      ctx.beginPath(); (ctx as any).roundRect(bx, by, bs, bs, 14); ctx.stroke();
      // Badge label below
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "500 8px 'Space Mono', monospace"; (ctx as any).letterSpacing = "0px";
      ctx.textAlign = "center";
      ctx.fillText(r.value.badge.label, bx + bs / 2, by + bs + 16);
      ctx.textAlign = "left";
    });

    if (earnedBadges.length === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "400 10px 'DM Sans', sans-serif";
      ctx.fillText("No badges yet — check in to earn your first!", rx, bSectY + 60);
    }

    // ── Bottom MRZ strip ─────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.03)"; ctx.fillRect(0, H - bh, W, bh);
    ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - bh); ctx.lineTo(W, H - bh); ctx.stroke();

    const mrzLine1 = `P<SIGNAL<${walletAddr.slice(0, 22).toUpperCase()}<<${walletAddr.slice(-10).toUpperCase()}`.slice(0, 64);
    const mrzLine2 = walletAddr.toUpperCase().replace(/[^A-Z0-9]/g, "").padEnd(44, "<").slice(0, 44);
    ctx.fillStyle = "rgba(255,255,255,0.13)"; ctx.font = "400 8px 'Space Mono', monospace";
    ctx.fillText(mrzLine1, 24, H - bh + 18);
    ctx.fillText(mrzLine2, 24, H - bh + 32);

    // Built on Solana
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.font = "600 8px 'Orbitron', monospace"; (ctx as any).letterSpacing = "1.5px";
    ctx.textAlign = "right"; ctx.fillText("BUILT ON SOLANA  ·  DEVNET", W - 24, H - bh + 25);
    ctx.textAlign = "left"; (ctx as any).letterSpacing = "0px";

    ctx.restore(); // end card clip

    const dataUrl = canvas.toDataURL("image/png");
    setPassportImg(dataUrl);
    setPassportOpen(true);
  }

  function handleDownload() {
    if (!passportImg) return;
    const a = document.createElement("a");
    a.href = passportImg;
    a.download = `signal-passport-${walletAddr.slice(0, 8)}.png`;
    a.click();
  }

  function handleShareX() {
    if (!cred) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `My Signal Builder Passport\n\nScore: ${cred.score.toLocaleString()} pts · ${cred.tier} Tier · ${cred.eventsAttended} events on-chain\n\nBuilt on Solana.`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank", "noopener,noreferrer,width=560,height=560"
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: credentialCSS }} />
      <div className="grid-bg" />
      <div className="orb-wrap">
        <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
      </div>
      <div className="scanline" />
      <Nav active="credentials" />

      {/* ── Passport image modal ── */}
      {passportOpen && passportImg && (
        <div
          onClick={() => setPassportOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem", flexDirection: "column", gap: "1.25rem",
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", maxWidth: 900, width: "100%" }}>
            <img
              src={passportImg}
              alt="Signal Builder Passport"
              style={{ width: "100%", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,.7)", display: "block" }}
            />
            <div style={{ display: "flex", gap: ".75rem" }}>
              <button
                onClick={handleDownload}
                style={{
                  padding: ".6rem 1.4rem", borderRadius: 10,
                  background: "#ffffff", color: "#0a0a0a",
                  fontFamily: "'Epilogue',sans-serif", fontWeight: 800,
                  fontSize: ".8rem", letterSpacing: ".06em", textTransform: "uppercase",
                  border: "none", cursor: "pointer",
                }}
              >
                Download
              </button>
              <button
                onClick={handleShareX}
                style={{
                  padding: ".6rem 1.4rem", borderRadius: 10,
                  background: "#000", color: "#fff",
                  fontFamily: "'Epilogue',sans-serif", fontWeight: 800,
                  fontSize: ".8rem", letterSpacing: ".06em", textTransform: "uppercase",
                  border: "1px solid rgba(255,255,255,.25)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: ".45rem",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Post on X
              </button>
              <button
                onClick={() => setPassportOpen(false)}
                style={{
                  padding: ".6rem 1rem", borderRadius: 10,
                  background: "rgba(255,255,255,.07)", color: "#888",
                  fontFamily: "'Epilogue',sans-serif", fontWeight: 700,
                  fontSize: ".8rem", border: "1px solid rgba(255,255,255,.1)", cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
            <p style={{ fontSize: ".72rem", color: "rgba(255,255,255,.25)", textAlign: "center" }}>
              Save the image, then attach it to your X post for the best look.
            </p>
          </div>
        </div>
      )}

      <div className="page">
        <div className="cred-eyebrow">Identity &amp; Reputation</div>
        <div className="cred-title">Builder Passport</div>
        <div className="cred-subtitle">Your portable on-chain identity, earned across every platform.</div>

        {/* ── Not connected ── */}
        {!walletAddr && (
          <div style={{
            textAlign: "center", padding: "5rem 1rem",
            border: "1px dashed rgba(255,255,255,.1)", borderRadius: 20,
            marginTop: "2rem",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}></div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: ".5rem" }}>Connect your wallet</div>
            <div style={{ color: "#888", fontSize: ".85rem" }}>Your Builder Passport is tied to your wallet address.</div>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {walletAddr && credLoading && (
          <div className="shimmer" style={{ height: 220, borderRadius: 20, marginTop: "1.5rem" }} />
        )}

        {error && <div className="error-box" style={{ marginTop: "1rem" }}>Error: {error}</div>}

        {/* ── Profile Banner ── */}
        {walletAddr && cred && (
          <div style={{
            position: "relative",
            background: "rgba(255,255,255,.03)",
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: 20, overflow: "hidden",
            marginTop: "1.5rem", marginBottom: "1.75rem",
          }}>
            {/* Cover strip */}
            <div style={{
              height: 80,
              background: "linear-gradient(120deg, rgba(255,255,255,.06) 0%, rgba(255,255,255,.02) 100%)",
              borderBottom: "1px solid rgba(255,255,255,.08)",
              position: "relative",
            }}>
              <button
                onClick={handleShare}
                style={{
                  position: "absolute", top: 14, right: 14,
                  display: "flex", alignItems: "center", gap: ".4rem",
                  background: "#000", border: "1px solid rgba(255,255,255,.2)",
                  color: "#ffffff", borderRadius: 8, padding: ".38rem .75rem",
                  fontFamily: "'Epilogue',sans-serif", fontSize: ".72rem",
                  fontWeight: 700, letterSpacing: ".04em", cursor: "pointer",
                  transition: "background .15s, border-color .15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#111"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#000"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.2)"; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share
              </button>
            </div>

            <div style={{ padding: "0 1.75rem 1.75rem" }}>
              {/* Avatar row */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", marginTop: -36, marginBottom: "1rem" }}>
                <div style={{
                  width: 72, height: 72, flexShrink: 0,
                  background: "#111",
                  border: "2px solid rgba(255,255,255,.3)",
                  borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "2rem", color: "#ffffff",
                }}>
                  {tier.name.charAt(0)}
                </div>
                <div style={{ paddingBottom: ".25rem" }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".82rem", color: "#e8e8e8", fontWeight: 700 }}>
                    {walletAddr.slice(0, 8)}…{walletAddr.slice(-6)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginTop: ".2rem", flexWrap: "wrap" }}>
                    <span style={{
                      color: "#fff", fontSize: ".72rem", fontWeight: 700,
                      fontFamily: "'Orbitron',sans-serif", letterSpacing: ".08em",
                      border: "1px solid rgba(255,255,255,.2)", borderRadius: 100,
                      padding: ".1rem .55rem",
                    }}>
                      {tier.name}
                    </span>
                    {worldVerified && (
                      <span style={{
                        background: "rgba(0,180,255,.1)", border: "1px solid rgba(0,180,255,.3)",
                        color: "#60c8f5", borderRadius: 100, padding: ".1rem .5rem",
                        fontSize: ".58rem", fontWeight: 700, fontFamily: "'Orbitron',sans-serif",
                      }}>
                        World ID
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                gap: ".75rem",
              }}>
                {/* Level + XP */}
                <div style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,.14)",
                  borderRadius: 12, padding: ".9rem 1rem",
                }}>
                  <div style={{ fontSize: ".55rem", color: "#888", fontFamily: "'Orbitron',sans-serif", letterSpacing: ".12em", marginBottom: ".4rem" }}>SIGNAL LEVEL</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", lineHeight: 1, marginBottom: ".15rem" }}>
                    {cred.tierIndex + 1}
                    <span style={{ fontSize: ".7rem", color: "#888", fontWeight: 400, marginLeft: ".25rem" }}>LVL</span>
                  </div>
                  <div style={{ fontSize: ".65rem", color: "#888", marginBottom: ".5rem" }}>{cred.score.toLocaleString()} XP</div>
                  <div style={{ height: 3, background: "rgba(255,255,255,.1)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${prog.pct}%`, background: "#ffffff", borderRadius: 100, transition: "width .6s ease" }} />
                  </div>
                  {prog.next && (
                    <div style={{ fontSize: ".58rem", color: "#555", marginTop: ".3rem" }}>{prog.needed} pts to {prog.next}</div>
                  )}
                </div>

                {/* Rank */}
                <div style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,.14)",
                  borderRadius: 12, padding: ".9rem 1rem",
                }}>
                  <div style={{ fontSize: ".55rem", color: "#888", fontFamily: "'Orbitron',sans-serif", letterSpacing: ".12em", marginBottom: ".4rem" }}>RANK</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", lineHeight: 1, marginBottom: ".15rem" }}>
                    {rankLoading ? "—" : rank !== null ? `#${rank}` : "—"}
                  </div>
                  <div style={{ fontSize: ".65rem", color: "#888" }}>of {leaderTotal || "—"} builders</div>
                </div>

                {/* Events */}
                <div style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,.14)",
                  borderRadius: 12, padding: ".9rem 1rem",
                }}>
                  <div style={{ fontSize: ".55rem", color: "#888", fontFamily: "'Orbitron',sans-serif", letterSpacing: ".12em", marginBottom: ".4rem" }}>EVENTS</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", lineHeight: 1, marginBottom: ".15rem" }}>{cred.eventsAttended}</div>
                  <div style={{ fontSize: ".65rem", color: "#888" }}>Attended</div>
                </div>

                {/* Hackathons */}
                <div style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,.14)",
                  borderRadius: 12, padding: ".9rem 1rem",
                }}>
                  <div style={{ fontSize: ".55rem", color: "#888", fontFamily: "'Orbitron',sans-serif", letterSpacing: ".12em", marginBottom: ".4rem" }}>HACKATHONS</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", lineHeight: 1, marginBottom: ".15rem" }}>{cred.hackathonCount}</div>
                  <div style={{ fontSize: ".65rem", color: "#888" }}>Competed</div>
                  {achievePts > 0 && <div style={{ fontSize: ".58rem", color: "#00FFC2", marginTop: ".2rem" }}>+{achievePts} pts boost</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Signal Badges ── */}
        {walletAddr && cred && (
          <div style={{ marginBottom: "2rem" }}>
            <div className="section-head" style={{ marginBottom: "1rem" }}>
              Signal Badges
              <span style={{ fontFamily: "inherit", fontSize: ".72rem", color: "#555", fontWeight: 400, letterSpacing: 0, marginLeft: ".75rem" }}>
                earned by attending events
              </span>
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {NFT_BADGES.map(badge => {
                const earned = cred.eventsAttended >= badge.minEvents;
                return (
                  <div
                    key={badge.level}
                    onClick={() => { setSelectedBadge(badge); setBadgeEarned(earned); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: ".45rem",
                      opacity: earned ? 1 : 0.4,
                      transition: "opacity .2s, transform .15s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <div style={{
                      width: 88, height: 88, position: "relative",
                      background: "transparent",
                      border: `1.5px solid ${earned ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.1)"}`,
                      borderRadius: 16, overflow: "hidden",
                      boxShadow: earned ? "0 0 18px rgba(255,255,255,.08)" : "none",
                    }}>
                      <img
                        src={badge.img}
                        alt={badge.label}
                        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                      />
                      {!earned && (
                        <div style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(0,0,0,.5)", fontSize: "1.3rem",
                        }}></div>
                      )}
                    </div>
                    <div style={{
                      fontSize: ".6rem", fontFamily: "'Orbitron',sans-serif",
                      color: earned ? "#ffffff" : "#555", letterSpacing: ".06em",
                    }}>
                      {badge.label}
                    </div>
                    <div style={{ fontSize: ".58rem", color: earned ? "#888" : "#444" }}>
                      {earned ? "Earned" : `${badge.minEvents} events`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── NFT Badge Modal ── */}
        {selectedBadge && (
          <div
            onClick={() => setSelectedBadge(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "1rem",
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: "relative", width: "100%", maxWidth: 340,
                background: "#111", border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 24, padding: "2rem 1.75rem 1.75rem",
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "1rem", textAlign: "center",
                boxShadow: "0 24px 80px rgba(0,0,0,.6)",
              }}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedBadge(null)}
                style={{
                  position: "absolute", top: 14, right: 16,
                  background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
                  color: "#888", borderRadius: 8, width: 28, height: 28,
                  cursor: "pointer", fontSize: ".85rem", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >x</button>

              {/* Header */}
              {badgeEarned ? (
                <div style={{
                  fontFamily: "'Orbitron',sans-serif", fontSize: ".65rem", fontWeight: 700,
                  letterSpacing: ".2em", color: "#00FFC2", textTransform: "uppercase",
                }}>Congratulations!</div>
              ) : (
                <div style={{
                  fontFamily: "'Orbitron',sans-serif", fontSize: ".65rem", fontWeight: 700,
                  letterSpacing: ".2em", color: "#888", textTransform: "uppercase",
                }}>Locked</div>
              )}

              {/* NFT image */}
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <img
                  src={selectedBadge.img}
                  alt={selectedBadge.label}
                  style={{
                    width: "100%", height: "100%", objectFit: "contain", display: "block",
                    opacity: badgeEarned ? 1 : 0.25,
                  }}
                />
                {!badgeEarned && (
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%,-50%)",
                    fontSize: "2.2rem", lineHeight: 1,
                  }}></div>
                )}
              </div>

              {/* Badge title */}
              <div style={{
                fontFamily: "'Orbitron',sans-serif", fontSize: ".95rem", fontWeight: 900,
                color: "#ffffff", letterSpacing: ".1em", textTransform: "uppercase",
              }}>
                {selectedBadge.label}
              </div>

              {/* Description */}
              <div style={{ fontSize: ".82rem", color: "#888", lineHeight: 1.5 }}>
                {badgeEarned
                  ? selectedBadge.desc
                  : `Attend ${selectedBadge.minEvents} event${selectedBadge.minEvents > 1 ? "s" : ""} to unlock this badge`
                }
              </div>

              {/* XP or progress */}
              {badgeEarned ? (
                <div style={{
                  background: "rgba(0,255,194,.1)", border: "1px solid rgba(0,255,194,.3)",
                  color: "#00FFC2", borderRadius: 100, padding: ".45rem 1.4rem",
                  fontFamily: "'Orbitron',sans-serif", fontSize: ".8rem", fontWeight: 700,
                  letterSpacing: ".08em",
                }}>
                  +{selectedBadge.xp.toLocaleString()} XP
                </div>
              ) : (
                <div style={{
                  background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
                  color: "#888", borderRadius: 100, padding: ".45rem 1.4rem",
                  fontFamily: "'Orbitron',sans-serif", fontSize: ".72rem", fontWeight: 700,
                  letterSpacing: ".08em",
                }}>
                  {Math.max(0, selectedBadge.minEvents - (cred?.eventsAttended ?? 0))} more event{selectedBadge.minEvents - (cred?.eventsAttended ?? 0) !== 1 ? "s" : ""} needed
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Hackathon Achievements ── */}
        {walletAddr && cred && (
          <>
            <div className="section-head">
              Hackathon Achievements
              {!achLoading && achievements.length > 0 && (
                <span className="section-count">{achievements.length}</span>
              )}
            </div>

            {achLoading ? (
              <div className="ach-grid" style={{ marginBottom: "2rem" }}>
                {[0, 1].map(i => (
                  <div key={i} className="shimmer" style={{ height: 90, borderRadius: 12 }} />
                ))}
              </div>
            ) : achievements.length === 0 ? (
              <div className="empty-small" style={{ marginBottom: "2rem" }}>No verified achievements yet.</div>
            ) : (
              <div className="ach-grid" style={{ marginBottom: "2rem" }}>
                {achievements.map(a => <AchievementCard key={a.id} ach={a} />)}
              </div>
            )}
          </>
        )}

        {/* ── Claim Achievement NFT ── */}
        {walletAddr && (
          <div className="claim-section">
            <div className="claim-head">
              <div>
                <div className="claim-eyebrow">Admin Verified</div>
                <div className="claim-title">Claim Achievement NFT</div>
              </div>
              <button
                className="query-btn"
                onClick={() => { setClaimOpen(v => !v); setClaimMsg(null); }}
                style={{ fontSize: ".7rem" }}
              >
                {claimOpen ? "Cancel" : "+ Claim"}
              </button>
            </div>
            <p style={{ fontSize: ".78rem", color: "#888", lineHeight: 1.6, marginBottom: ".5rem" }}>
              Won or placed in a hackathon? Submit your claim below. Signal admin will verify your result
              and mint a <strong style={{ color: "#e8e8e8" }}>Verified by Signal</strong> Achievement NFT
              directly to your wallet.
            </p>

            {claimOpen && (
              <form onSubmit={handleClaimSubmit} style={{ display: "flex", flexDirection: "column", gap: ".75rem", marginTop: "1rem" }}>
                {([
                  { key: "hackathonName", label: "Hackathon Name *", placeholder: "Colosseum Hackathon, ETH Bangkok…", type: "text" },
                  { key: "projectUrl",    label: "Your Project URL *", placeholder: "https://github.com/you/project", type: "url" },
                  { key: "rank",          label: "Finish / Rank *", placeholder: "1st Place, Grand Prize, Runner-Up, Finalist…", type: "text" },
                ] as const).map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: ".75rem", color: "#888", marginBottom: ".3rem" }}>{f.label}</label>
                    <input
                      type={f.type}
                      value={claimForm[f.key]}
                      onChange={e => setClaimForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      required
                      style={{
                        width: "100%", background: "rgba(255,255,255,.04)",
                        border: "1px solid rgba(255,255,255,.1)", borderRadius: 8,
                        padding: ".55rem .75rem", color: "#e8e8e8",
                        fontFamily: "'Space Mono',monospace", fontSize: ".82rem",
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", fontSize: ".75rem", color: "#888", marginBottom: ".3rem" }}>Notes (optional)</label>
                  <textarea
                    value={claimForm.description}
                    onChange={e => setClaimForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Any context that helps admin verify your result…"
                    rows={3}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.12)",
                      borderRadius: 8, color: "#e8e8e8", padding: ".55rem .75rem",
                      fontSize: ".82rem", resize: "vertical", fontFamily: "inherit", outline: "none",
                    }}
                  />
                </div>
                {claimMsg && (
                  <div style={{
                    padding: ".6rem .9rem", borderRadius: 8, fontSize: ".8rem",
                    background: claimMsg.ok ? "rgba(0,255,194,.08)" : "rgba(239,68,68,.12)",
                    color: claimMsg.ok ? "#00FFC2" : "#f87171",
                    border: `1px solid ${claimMsg.ok ? "rgba(0,255,194,.25)" : "rgba(239,68,68,.3)"}`,
                  }}>
                    {claimMsg.text}
                  </div>
                )}
                <button
                  className="query-btn"
                  type="submit"
                  disabled={claimLoading}
                  style={{ alignSelf: "flex-start", padding: ".55rem 1.4rem" }}
                >
                  {claimLoading ? "Submitting…" : "Submit Claim"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── Claims Inbox ── */}
        {walletAddr && (
          <div style={{ marginTop: "2.5rem", borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: "1rem" }}>
              <div>
                <div style={{
                  fontFamily: "'Orbitron',sans-serif", fontSize: ".55rem", fontWeight: 700,
                  letterSpacing: ".14em", textTransform: "uppercase", color: "#888", marginBottom: ".25rem",
                }}>
                  Achievement Claims
                </div>
                <div style={{ fontSize: ".95rem", fontWeight: 700, color: "#e8e8e8" }}>
                  Claims Inbox
                  {myClaims.filter((c: any) => c.status === "pending").length > 0 && (
                    <span style={{
                      marginLeft: ".6rem", background: "rgba(251,191,36,.15)", color: "#fbbf24",
                      border: "1px solid rgba(251,191,36,.3)", borderRadius: 100,
                      fontSize: ".6rem", fontWeight: 700, padding: ".15rem .55rem",
                      fontFamily: "'Orbitron',sans-serif", letterSpacing: ".08em",
                    }}>
                      {myClaims.filter((c: any) => c.status === "pending").length} PENDING
                    </span>
                  )}
                </div>
              </div>

              {!isAdminWallet && (
                <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                  {adminKeyOpen ? (
                    <>
                      <input
                        type="password"
                        value={adminKeyInput}
                        onChange={e => setAdminKeyInput(e.target.value)}
                        placeholder="Admin key…"
                        onKeyDown={e => { if (e.key === "Enter") { setAdminKey(adminKeyInput); setAdminKeyOpen(false); } }}
                        style={{
                          background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)",
                          borderRadius: 8, padding: ".35rem .65rem", color: "#e8e8e8",
                          fontFamily: "'Space Mono',monospace", fontSize: ".75rem", outline: "none", width: 140,
                        }}
                      />
                      <button
                        onClick={() => { setAdminKey(adminKeyInput); setAdminKeyOpen(false); }}
                        style={{
                          background: "rgba(0,255,194,.1)", border: "1px solid rgba(0,255,194,.25)",
                          color: "#00FFC2", borderRadius: 8, padding: ".35rem .75rem",
                          fontSize: ".7rem", cursor: "pointer", fontFamily: "'Orbitron',sans-serif",
                          fontWeight: 700, letterSpacing: ".06em",
                        }}
                      >Unlock</button>
                      <button
                        onClick={() => { setAdminKeyOpen(false); setAdminKeyInput(""); }}
                        style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: ".8rem" }}
                      >x</button>
                    </>
                  ) : (
                    <button
                      onClick={() => setAdminKeyOpen(true)}
                      style={{
                        background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)",
                        color: "#888", borderRadius: 8, padding: ".3rem .7rem",
                        fontSize: ".65rem", cursor: "pointer", fontFamily: "'Orbitron',sans-serif",
                        letterSpacing: ".06em",
                      }}
                    >
                      {adminKey ? "Unlocked" : "Admin"}
                    </button>
                  )}
                </div>
              )}
              {isAdminWallet && (
                <span style={{
                  background: "rgba(0,255,194,.08)", border: "1px solid rgba(0,255,194,.2)",
                  color: "#00FFC2", borderRadius: 100, padding: ".25rem .75rem",
                  fontSize: ".6rem", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: ".1em",
                }}>
                  ADMIN
                </span>
              )}
            </div>

            {claimsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                {[0, 1].map(i => (
                  <div key={i} style={{
                    height: 72, borderRadius: 12,
                    background: "linear-gradient(90deg,#151515 25%,#1e1e1e 50%,#151515 75%)",
                    backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
                  }} />
                ))}
              </div>
            ) : myClaims.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "2rem 1rem",
                border: "1px dashed rgba(255,255,255,.08)", borderRadius: 12,
                color: "#555", fontSize: ".82rem",
              }}>
                No claims yet.{" "}
                <span style={{ color: "#888" }}>Use &quot;+ Claim&quot; above to submit a hackathon win.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                {myClaims.map((claim: any) => {
                  const statusColor  = claim.status === "approved" ? "#00FFC2" : claim.status === "rejected" ? "#f87171" : "#fbbf24";
                  const statusBg     = claim.status === "approved" ? "rgba(0,255,194,.08)" : claim.status === "rejected" ? "rgba(239,68,68,.08)" : "rgba(251,191,36,.08)";
                  const statusBorder = claim.status === "approved" ? "rgba(0,255,194,.2)" : claim.status === "rejected" ? "rgba(239,68,68,.2)" : "rgba(251,191,36,.2)";
                  const msg      = actionMsg[claim.id];
                  const isActing = actioning === claim.id;

                  return (
                    <div key={claim.id} style={{
                      background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)",
                      borderRadius: 12, padding: "1rem 1.1rem",
                      display: "flex", flexDirection: "column", gap: ".5rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: ".75rem" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: ".88rem", color: "#e8e8e8", marginBottom: ".15rem" }}>{claim.hackathonName}</div>
                          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: "#00FFC2" }}>{claim.rank}</div>
                        </div>
                        <span style={{
                          background: statusBg, border: `1px solid ${statusBorder}`,
                          color: statusColor, borderRadius: 100, padding: ".2rem .65rem",
                          fontSize: ".58rem", fontFamily: "'Orbitron',sans-serif",
                          fontWeight: 700, letterSpacing: ".1em", whiteSpace: "nowrap", flexShrink: 0,
                        }}>
                          {claim.status.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                        <a
                          href={claim.projectUrl} target="_blank" rel="noreferrer"
                          style={{ fontFamily: "'Space Mono',monospace", fontSize: ".68rem", color: "#888", textDecoration: "none" }}
                          onMouseOver={e => (e.currentTarget.style.color = "#e8e8e8")}
                          onMouseOut={e => (e.currentTarget.style.color = "#888")}
                        >
                          {claim.projectUrl.replace(/^https?:\/\//, "").slice(0, 40)}{claim.projectUrl.length > 46 ? "…" : ""}
                        </a>
                        <span style={{ fontSize: ".65rem", color: "#555" }}>
                          {new Date(claim.submittedAt * 1000).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        </span>
                        {isAdmin && claim.wallet !== target && (
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".65rem", color: "#666" }}>
                            {claim.wallet.slice(0, 8)}…{claim.wallet.slice(-4)}
                          </span>
                        )}
                        {claim.points && claim.status === "approved" && (
                          <span style={{
                            background: "rgba(0,255,194,.08)", border: "1px solid rgba(0,255,194,.2)",
                            color: "#00FFC2", borderRadius: 100, padding: ".12rem .5rem",
                            fontSize: ".6rem", fontFamily: "'Orbitron',sans-serif", fontWeight: 700,
                          }}>
                            +{claim.points} pts
                          </span>
                        )}
                      </div>

                      {isAdmin && claim.status === "pending" && (
                        <div style={{ display: "flex", gap: ".5rem", alignItems: "center", marginTop: ".25rem", flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleAction(claim.id, "approve")}
                            disabled={isActing}
                            style={{
                              background: "rgba(0,255,194,.1)", border: "1px solid rgba(0,255,194,.25)",
                              color: "#00FFC2", borderRadius: 8, padding: ".35rem .9rem",
                              fontSize: ".72rem", cursor: isActing ? "not-allowed" : "pointer",
                              fontFamily: "'Orbitron',sans-serif", fontWeight: 700,
                              letterSpacing: ".06em", opacity: isActing ? .5 : 1,
                            }}
                          >
                            {isActing ? "Approving..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleAction(claim.id, "reject")}
                            disabled={isActing}
                            style={{
                              background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)",
                              color: "#f87171", borderRadius: 8, padding: ".35rem .9rem",
                              fontSize: ".72rem", cursor: isActing ? "not-allowed" : "pointer",
                              fontFamily: "'Orbitron',sans-serif", fontWeight: 700,
                              letterSpacing: ".06em", opacity: isActing ? .5 : 1,
                            }}
                          >
                            Reject
                          </button>
                          {msg && (
                            <span style={{ fontSize: ".72rem", color: msg.ok ? "#00FFC2" : "#f87171" }}>{msg.text}</span>
                          )}
                        </div>
                      )}

                      {msg && claim.status !== "pending" && (
                        <div style={{ fontSize: ".72rem", color: msg.ok ? "#00FFC2" : "#f87171", marginTop: ".1rem" }}>{msg.text}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
