// app/api/admin/route.ts (Admin edit endpoint - demo)
// This endpoint simulates admin editing a user's balance (in-memory).
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amount_usd, note } = body;
    // VERY simple demo auth via header (not for production)
    const adminKey = request.headers.get("x-admin-key");
    if (!adminKey || adminKey !== "demo-admin-key") return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    // call the investments POST internally (we'll replicate logic)
    // in production, call DB transactionally and emit socket event server-side
    const investRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/investments`, {
      method: "POST",
      body: JSON.stringify({ userId, amount_usd, type: "profit_added_admin", note }),
      headers: { "content-type": "application/json" },
    });

    const data = await investRes.json();
    return NextResponse.json({ ok: true, result: data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
