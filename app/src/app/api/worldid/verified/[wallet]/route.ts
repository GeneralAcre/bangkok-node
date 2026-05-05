import { NextRequest, NextResponse } from "next/server";
import { verifiedWallets } from "../../../worldid/store";

export async function GET(_req: NextRequest, { params }: { params: { wallet: string } }) {
  return NextResponse.json({ verified: verifiedWallets.has(params.wallet) });
}
