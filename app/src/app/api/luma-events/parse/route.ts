import { NextRequest, NextResponse } from "next/server";

export interface ParsedEventData {
  title:       string;
  description: string;
  location:    string;
  country:     string;
  date:        string; // ISO date string
  time:        string; // "HH:MM"
  capacity:    number | null;
  coverUrl:    string | null;
  sourceUrl:   string;
}

function extractJsonLd(html: string): any[] {
  const results: any[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try { results.push(JSON.parse(m[1].trim())); } catch {}
  }
  return results;
}

function extractMeta(html: string, prop: string): string {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
  const m  = re.exec(html);
  return m ? m[1] : "";
}

function countryFromCode(code: string): string {
  const map: Record<string, string> = {
    TH: "Thailand", SG: "Singapore", US: "USA", GB: "UK", DE: "Germany",
    JP: "Japan", AU: "Australia", IN: "India", ID: "Indonesia", PH: "Philippines",
    VN: "Vietnam", MY: "Malaysia", KR: "South Korea", FR: "France", NL: "Netherlands",
    AE: "UAE", NG: "Nigeria", KE: "Kenya", BR: "Brazil", MX: "Mexico",
    AR: "Argentina", CA: "Canada", TR: "Turkey", ES: "Spain", IT: "Italy",
  };
  return map[code?.toUpperCase()] ?? code ?? "";
}

function parseEventFromJsonLd(nodes: any[]): Partial<ParsedEventData> | null {
  // Search @graph arrays and top-level nodes
  const allNodes: any[] = [];
  for (const n of nodes) {
    if (Array.isArray(n["@graph"])) allNodes.push(...n["@graph"]);
    else allNodes.push(n);
  }

  const event = allNodes.find(n =>
    n["@type"] === "Event" || n["@type"] === "SocialEvent" ||
    (Array.isArray(n["@type"]) && n["@type"].includes("Event"))
  );
  if (!event) return null;

  // Location
  const loc    = event.location ?? {};
  const addr   = loc.address ?? {};
  const city   = addr.addressLocality ?? loc.name ?? "";
  const ctryCode = addr.addressCountry ?? "";
  const country  = countryFromCode(ctryCode) || ctryCode;

  // Date / time
  let date = "", time = "09:00";
  const rawDate = event.startDate ?? event.startTime ?? "";
  if (rawDate) {
    try {
      const d    = new Date(rawDate);
      date = d.toISOString().slice(0, 10);
      time = d.toTimeString().slice(0, 5);
    } catch {}
  }

  return {
    title:       event.name ?? "",
    description: typeof event.description === "string" ? event.description.slice(0, 400) : "",
    location:    city,
    country:     country,
    date,
    time,
    capacity:    event.maximumAttendeeCapacity ? Number(event.maximumAttendeeCapacity) : null,
  };
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url") ?? "";
  if (!rawUrl) {
    return NextResponse.json({ error: "url param required" }, { status: 400 });
  }

  let normalised: string;
  try {
    normalised = new URL(rawUrl).toString();
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Only allow Luma and Eventbrite for safety
  const host = new URL(normalised).hostname.replace(/^www\./, "");
  if (!["lu.ma", "eventbrite.com", "eventbrite.co.uk", "eventbrite.co"].some(h => host === h || host.endsWith("." + h))) {
    return NextResponse.json({ error: "Only lu.ma and eventbrite.com URLs are supported" }, { status: 400 });
  }

  try {
    const res = await fetch(normalised, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SignalBot/1.0; +https://signal.app)",
        "Accept":     "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Could not fetch event page (HTTP ${res.status})` }, { status: 400 });
    }

    const html = await res.text();

    // 1. Try JSON-LD structured data (most reliable)
    const jsonLdNodes = extractJsonLd(html);
    const fromLd      = parseEventFromJsonLd(jsonLdNodes);

    // 2. OG meta fallback
    const ogTitle    = extractMeta(html, "og:title");
    const ogDesc     = extractMeta(html, "og:description");
    const ogImage    = extractMeta(html, "og:image");
    // Luma puts "City, Country" in og:description prefix sometimes
    const ogLocMatch = ogDesc.match(/^([^·•\n]+?)(?:\s*[·•]\s*|\n)/);

    const title       = fromLd?.title       || ogTitle.replace(/ on Luma$|on Eventbrite$/i, "").trim() || "";
    const description = fromLd?.description || ogDesc || "";
    const location    = fromLd?.location    || ogLocMatch?.[1]?.trim() || "";
    const country     = fromLd?.country     || "";
    const date        = fromLd?.date        || "";
    const time        = fromLd?.time        || "09:00";
    const capacity    = fromLd?.capacity    ?? null;
    const coverUrl    = ogImage             || null;

    if (!title) {
      return NextResponse.json({ error: "Could not extract event details from this URL. Try filling the form manually." }, { status: 422 });
    }

    return NextResponse.json({
      title, description, location, country, date, time, capacity, coverUrl,
      sourceUrl: normalised,
    } satisfies ParsedEventData);

  } catch (e: any) {
    if (e?.name === "TimeoutError") {
      return NextResponse.json({ error: "Event page took too long to respond" }, { status: 408 });
    }
    console.error("[luma-events/parse]", e);
    return NextResponse.json({ error: e?.message ?? "Failed to parse event URL" }, { status: 500 });
  }
}
