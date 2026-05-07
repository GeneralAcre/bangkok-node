import { NextRequest, NextResponse } from "next/server";
import { getAllClaims } from "../store";

const ADMIN_KEY = process.env.SIGNAL_ADMIN_KEY;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("x-admin-key");
  if (ADMIN_KEY && auth !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallet = req.nextUrl.searchParams.get("wallet");
  const status = req.nextUrl.searchParams.get("status");

  const all = await getAllClaims();
  const result = all.filter(c => {
    if (wallet && c.wallet !== wallet) return false;
    if (status === "pending") return c.status === "pending";
    if (status === "approved") return c.status === "approved";
    return true;
  });

  result.sort((a, b) => b.submittedAt - a.submittedAt);
  return NextResponse.json({ claims: result, total: result.length });
}
