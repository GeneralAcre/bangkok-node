import { NextRequest, NextResponse } from "next/server";
import { claims, pointsForRank } from "../store";

const ADMIN_KEY = process.env.SIGNAL_ADMIN_KEY;
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? "https://strata-project.vercel.app";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-key");
  // If SIGNAL_ADMIN_KEY is configured, enforce it; otherwise open (demo mode)
  if (ADMIN_KEY && auth !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { claimId: string; adminPubkey: string; action?: "approve" | "reject" };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { claimId, adminPubkey, action = "approve" } = body;
  if (!claimId || !adminPubkey) {
    return NextResponse.json({ error: "claimId and adminPubkey are required" }, { status: 400 });
  }

  const claim = claims.get(claimId);
  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  if (claim.status !== "pending") {
    return NextResponse.json({ error: `Claim is already ${claim.status}` }, { status: 409 });
  }

  if (action === "reject") {
    claim.status = "rejected";
    claims.set(claimId, claim);
    return NextResponse.json({ success: true, status: "rejected" });
  }

  // Mint achievement NFT
  const mintRes = await fetch(`${APP_URL}/api/mint-nft`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userWallet:       claim.wallet,
      nftType:          "achievement",
      hackathonName:    claim.hackathonName,
      rank:             claim.rank,
      sourceUrl:        claim.projectUrl,
      verifiedByAdmin:  adminPubkey,
    }),
  });

  if (!mintRes.ok) {
    const err = await mintRes.json().catch(() => ({}));
    return NextResponse.json({ error: "NFT mint failed", detail: (err as any).error }, { status: 500 });
  }

  const mintData = await mintRes.json();
  const points   = pointsForRank(claim.rank);

  claim.status    = "approved";
  claim.approvedAt = Math.floor(Date.now() / 1000);
  claim.nftMint   = mintData.mint;
  claim.points    = points;
  claims.set(claimId, claim);

  return NextResponse.json({
    success:  true,
    claimId,
    nftMint:  mintData.mint,
    points,
    wallet:   claim.wallet,
    message:  `Achievement NFT minted for ${claim.wallet}. +${points} Signal Score.`,
  });
}
