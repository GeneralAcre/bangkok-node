import { NextRequest, NextResponse } from "next/server";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  keypairIdentity,
  generateSigner,
  percentAmount,
  publicKey as umiKey,
} from "@metaplex-foundation/umi";
import { createNft } from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { Keypair } from "@solana/web3.js";

export async function POST(req: NextRequest) {
  try {
    const { userWallet, eventTitle, eventCode, checkedInAt } = await req.json();

    if (!userWallet || !eventTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const treasuryRaw = process.env.TREASURY_KEYPAIR;
    if (!treasuryRaw) {
      return NextResponse.json({ error: "TREASURY_KEYPAIR not configured" }, { status: 500 });
    }

    const keypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(treasuryRaw))
    );

    const rpc = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://strata-project.vercel.app";

    const umi = createUmi(rpc);
    umi.use(keypairIdentity(fromWeb3JsKeypair(keypair)));

    // Build metadata JSON inline (no IPFS needed)
    const date = checkedInAt
      ? new Date(checkedInAt * 1000).toLocaleDateString("en-US", { dateStyle: "medium" })
      : new Date().toLocaleDateString();

    const metadata = {
      name: `Strata: ${eventTitle}`,
      symbol: "STRATA",
      description: `Proof of Presence — ${eventTitle} · ${date}`,
      image: `${appUrl}/nft-badge.svg`,
      external_url: appUrl,
      attributes: [
        { trait_type: "Event",    value: eventTitle },
        { trait_type: "Code",     value: eventCode ?? "" },
        { trait_type: "Date",     value: date },
        { trait_type: "Protocol", value: "Strata" },
        { trait_type: "Network",  value: "Solana Devnet" },
      ],
      properties: { category: "image" },
    };

    const uri = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString("base64")}`;

    const mint = generateSigner(umi);

    await createNft(umi, {
      mint,
      name:                  `Strata: ${eventTitle}`,
      symbol:                "STRATA",
      uri,
      sellerFeeBasisPoints:  percentAmount(0),
      tokenOwner:            umiKey(userWallet),
      isMutable:             false,
    }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

    return NextResponse.json({
      success: true,
      mint:    mint.publicKey,
      name:    `Strata: ${eventTitle}`,
    });
  } catch (e: any) {
    console.error("Mint NFT error:", e);
    return NextResponse.json({ error: e?.message ?? "Mint failed" }, { status: 500 });
  }
}
