import { NextResponse } from "next/server";
import { verifiedWallets } from "../../worldid/store";

export async function GET() {
  return NextResponse.json({ wallets: Array.from(verifiedWallets) });
}
