import { NextRequest, NextResponse } from "next/server";

// In-memory store: eventCode (uppercase) → { sig, exp }
export const checkinSessions = new Map<string, { sig: string; exp: number }>();

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const s = checkinSessions.get(code);
  if (!s) {
    return NextResponse.json(
      { error: "No active check-in session for this event — organizer must refresh the QR" },
      { status: 404 }
    );
  }
  if (Date.now() / 1000 > s.exp) {
    checkinSessions.delete(code);
    return NextResponse.json(
      { error: "Check-in session expired — organizer must refresh the QR" },
      { status: 410 }
    );
  }
  return NextResponse.json({ sig: s.sig, exp: s.exp });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  let body: { sig: string; exp: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.sig || !body.exp) {
    return NextResponse.json({ error: "sig and exp required" }, { status: 400 });
  }
  checkinSessions.set(code, { sig: body.sig, exp: body.exp });
  return NextResponse.json({ ok: true });
}
