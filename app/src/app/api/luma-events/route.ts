import { NextResponse } from "next/server";

const LUMA_API_KEY     = process.env.LUMA_API_KEY     ?? "";
const LUMA_CALENDAR_ID = process.env.LUMA_CALENDAR_ID ?? "";

export interface LumaEvent {
  id:       string;
  title:    string;
  startAt:  string;
  coverUrl: string | null;
  url:      string;
  location: string;
  isOnline: boolean;
}

let cache: { data: LumaEvent[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

const MOCK_EVENTS: LumaEvent[] = [
  {
    id: "mock-1",
    title: "Superteam Thailand Monthly Meetup",
    startAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    coverUrl: null,
    url: "https://lu.ma/superteam",
    location: "Bangkok, Thailand",
    isOnline: false,
  },
  {
    id: "mock-2",
    title: "Solana Builders Workshop",
    startAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    coverUrl: null,
    url: "https://lu.ma/superteam",
    location: "Online",
    isOnline: true,
  },
  {
    id: "mock-3",
    title: "Superteam Demo Day",
    startAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    coverUrl: null,
    url: "https://lu.ma/superteam",
    location: "Bangkok, Thailand",
    isOnline: false,
  },
  {
    id: "mock-4",
    title: "Web3 Hackathon Kickoff",
    startAt: new Date(Date.now() + 21 * 86400000).toISOString(),
    coverUrl: null,
    url: "https://lu.ma/superteam",
    location: "Chiang Mai, Thailand",
    isOnline: false,
  },
];

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ events: cache.data });
  }

  if (!LUMA_API_KEY || !LUMA_CALENDAR_ID) {
    return NextResponse.json({ events: MOCK_EVENTS, isMock: true });
  }

  try {
    const res = await fetch(
      `https://api.lu.ma/public/v1/calendar/list-events?calendar_api_id=${LUMA_CALENDAR_ID}`,
      {
        headers: { "x-luma-api-key": LUMA_API_KEY },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) throw new Error(`Luma API ${res.status}`);
    const data = await res.json();

    const events: LumaEvent[] = (data.entries ?? []).map((e: any) => ({
      id:       e.api_id,
      title:    e.event.name,
      startAt:  e.event.start_at,
      coverUrl: e.event.cover_url ?? null,
      url:      e.event.url,
      location: e.event.geo_address_json?.city
             ?? e.event.geo_address_json?.full_address
             ?? (e.event.zoom_meeting_url ? "Online" : "TBD"),
      isOnline: !!e.event.zoom_meeting_url && !e.event.geo_address_json,
    }));

    cache = { data: events, ts: Date.now() };
    return NextResponse.json({ events });
  } catch (e: any) {
    return NextResponse.json({ events: MOCK_EVENTS, isMock: true, error: e.message });
  }
}
