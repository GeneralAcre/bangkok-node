import { NextRequest, NextResponse } from "next/server";
import { getAllClaims, setClaim, AchievementClaim } from "../store";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  let body: {
    wallet: string;
    hackathonName: string;
    projectUrl: string;
    rank: string;
    description?: string;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { wallet, hackathonName, projectUrl, rank } = body;
  if (!wallet || !hackathonName || !projectUrl || !rank) {
    return NextResponse.json({ error: "wallet, hackathonName, projectUrl, rank are required" }, { status: 400 });
  }

  const existing = await getAllClaims();
  for (const c of existing) {
    if (c.wallet === wallet && c.hackathonName === hackathonName && c.status === "pending") {
      return NextResponse.json({ error: "You already have a pending claim for this hackathon" }, { status: 409 });
    }
    if (c.wallet === wallet && c.hackathonName === hackathonName && c.status === "approved") {
      return NextResponse.json({ error: "Claim already approved for this hackathon", nftMint: c.nftMint }, { status: 409 });
    }
  }

  const id: string = createHash("sha256")
    .update(`${wallet}:${hackathonName}:${Date.now()}`)
    .digest("hex")
    .slice(0, 16);

  const claim: AchievementClaim = {
    id, wallet, hackathonName, projectUrl, rank,
    description: body.description ?? "",
    submittedAt: Math.floor(Date.now() / 1000),
    status: "pending",
  };

  await setClaim(claim);

  return NextResponse.json({ success: true, claimId: id, message: "Claim submitted. Signal admin will review and mint your Achievement NFT." });
}
