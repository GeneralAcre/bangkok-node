import { NextResponse } from "next/server";

const ACTIONS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ACTIONS_CORS });
}

export async function GET() {
  return NextResponse.json(
    {
      rules: [
        { pathPattern: "/api/checkin/**", apiPath: "/api/checkin/**" },
      ],
    },
    { headers: ACTIONS_CORS }
  );
}
