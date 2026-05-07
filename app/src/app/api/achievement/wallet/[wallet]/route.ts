import { NextRequest, NextResponse } from "next/server";
import { claims } from "../../../achievement/store";

export async function GET(_req: NextRequest, { params }: { params: { wallet: string } }) {
  const { wallet } = params;
  const all      = Array.from(claims.values()).filter(c => c.wallet === wallet);
  const approved = all.filter(c => c.status === "approved");
  const totalPoints = approved.reduce((sum, c) => sum + (c.points ?? 0), 0);
  all.sort((a, b) => b.submittedAt - a.submittedAt);
  return NextResponse.json({ achievements: approved, allClaims: all, totalPoints });
}
