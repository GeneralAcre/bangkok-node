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

// ── Types ────────────────────────────────────────────────────────────────────

type NftType = "attendance" | "participation" | "achievement";

interface MintRequest {
  userWallet:    string;
  nftType?:      NftType;
  // attendance / participation
  eventTitle?:   string;
  eventCode?:    string;
  checkedInAt?:  number;
  organizerPubkey?: string;
  capacitySlot?: number;   // edition number (1st, 2nd … Nth person)
  // achievement
  hackathonName?: string;
  rank?:          string;
  sourceUrl?:     string;
  verifiedByAdmin?: string;
}

interface NftMetadata {
  name:        string;
  symbol:      string;
  description: string;
  attributes:  Array<{ trait_type: string; value: string }>;
}

function buildMetadata(req: MintRequest): NftMetadata {
  const type = req.nftType ?? "attendance";
  const date = req.checkedInAt
    ? new Date(req.checkedInAt * 1000).toLocaleDateString("en-US", { dateStyle: "medium" })
    : new Date().toLocaleDateString();

  if (type === "attendance") {
    return {
      name:        `Signal: ${req.eventTitle ?? "Event"}`,
      symbol:      "SIGNAL",
      description: `Proof of Presence — ${req.eventTitle ?? "Event"} · ${date}`,
      attributes: [
        { trait_type: "type",             value: "attendance" },
        { trait_type: "event_title",      value: req.eventTitle ?? "" },
        { trait_type: "event_code",       value: req.eventCode ?? "" },
        { trait_type: "organizer_pubkey", value: req.organizerPubkey ?? "" },
        { trait_type: "capacity_slot",    value: String(req.capacitySlot ?? "") },
        { trait_type: "timestamp",        value: String(req.checkedInAt ?? "") },
        { trait_type: "date",             value: date },
        { trait_type: "points",           value: "10" },
        { trait_type: "network",          value: "Solana Devnet" },
      ],
    };
  }

  if (type === "participation") {
    return {
      name:        `Signal: ${req.eventTitle ?? "Event"} — Participant`,
      symbol:      "SIGNAL",
      description: `Verified Participation — ${req.eventTitle ?? "Event"} · ${date}. Awarded by organizer.`,
      attributes: [
        { trait_type: "type",             value: "participation" },
        { trait_type: "event_title",      value: req.eventTitle ?? "" },
        { trait_type: "event_code",       value: req.eventCode ?? "" },
        { trait_type: "verified_by",      value: req.organizerPubkey ?? "" },
        { trait_type: "timestamp",        value: String(req.checkedInAt ?? "") },
        { trait_type: "date",             value: date },
        { trait_type: "points",           value: "50" },
        { trait_type: "network",          value: "Solana Devnet" },
      ],
    };
  }

  // achievement
  return {
    name:        `Signal: ${req.hackathonName ?? "Hackathon"} — ${req.rank ?? "Participant"}`,
    symbol:      "SIGNAL",
    description: `Verified Achievement — ${req.hackathonName ?? "Hackathon"} · ${req.rank ?? ""}. Verified by Signal admin.`,
    attributes: [
      { trait_type: "type",           value: "achievement" },
      { trait_type: "hackathon_name", value: req.hackathonName ?? "" },
      { trait_type: "rank",           value: req.rank ?? "" },
      { trait_type: "source_url",     value: req.sourceUrl ?? "" },
      { trait_type: "verified_by",    value: req.verifiedByAdmin ?? "" },
      { trait_type: "timestamp",      value: String(Date.now() / 1000 | 0) },
      { trait_type: "points",         value: req.rank?.toLowerCase().includes("grand") ? "1000" : "300" },
      { trait_type: "label",          value: "Verified by Signal" },
      { trait_type: "network",        value: "Solana Devnet" },
    ],
  };
}

// ── POST /api/mint-nft ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: MintRequest = await req.json();
    const { userWallet } = body;

    if (!userWallet) {
      return NextResponse.json({ error: "Missing userWallet" }, { status: 400 });
    }

    const treasuryRaw = process.env.TREASURY_KEYPAIR;
    if (!treasuryRaw) {
      return NextResponse.json({ error: "TREASURY_KEYPAIR not configured" }, { status: 500 });
    }

    const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(treasuryRaw)));
    const rpc     = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://strata-project.vercel.app";

    const metadata = buildMetadata(body);
    const uri = `data:application/json;base64,${Buffer.from(JSON.stringify({
      ...metadata,
      image:        `${appUrl}/nft-badge.svg`,
      external_url: appUrl,
      properties:   { category: "image" },
    })).toString("base64")}`;

    const umi  = createUmi(rpc);
    umi.use(keypairIdentity(fromWeb3JsKeypair(keypair)));

    const mint = generateSigner(umi);
    await createNft(umi, {
      mint,
      name:                 metadata.name,
      symbol:               metadata.symbol,
      uri,
      sellerFeeBasisPoints: percentAmount(0),
      tokenOwner:           umiKey(userWallet),
      isMutable:            false,
    }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

    return NextResponse.json({ success: true, mint: mint.publicKey, name: metadata.name, type: body.nftType ?? "attendance" });
  } catch (e: any) {
    console.error("Mint NFT error:", e);
    return NextResponse.json({ error: e?.message ?? "Mint failed" }, { status: 500 });
  }
}
