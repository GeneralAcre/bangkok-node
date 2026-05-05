import { NextRequest, NextResponse } from "next/server";
import { claims } from "../../../achievement/store";

export async function GET(_req: NextRequest, { params }: { params: { wallet: string } }) {
  const { wallet } = params;
  const approved = Array.from(claims.values()).filter(
    c => c.wallet === wallet && c.status === "approved"
  );
  const totalPoints = approved.reduce((sum, c) => sum + (c.points ?? 0), 0);
  return NextResponse.json({ achievements: approved, totalPoints });
}
