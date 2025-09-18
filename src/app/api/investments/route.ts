// app/api/investments/route.ts (Next.js route: GET/POST, in-memory store for demo)
// Put this file in your Next project's app/api/investments/route.ts
import { NextResponse } from "next/server";

type Tx = {
  id: string;
  userId: string;
  type: "deposit" | "profit_added_admin" | "adjustment_admin";
  amount_usd: number;
  note?: string;
  created_at: string;
};

const USERS_BALANCE: Record<string, number> = {}; // userId -> balance
const TRANSACTIONS: Tx[] = []; // global list (for demo)

// helper to ensure user exists
function ensureUser(userId: string) {
  if (!USERS_BALANCE[userId]) USERS_BALANCE[userId] = 0;
}

// GET -> ?userId=123
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || "anonymous";
    ensureUser(userId);

    const userTx = TRANSACTIONS.filter((t) => t.userId === userId).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return NextResponse.json({ ok: true, balance_usd: USERS_BALANCE[userId], transactions: userTx });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}

// POST -> { userId, amount_usd, type?, note? }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = String(body.userId || "anonymous");
    const amount_usd = Number(body.amount_usd);
    const type = (body.type as Tx["type"]) || "deposit";
    const note = body.note || (type === "deposit" ? "User deposit" : type === "profit_added_admin" ? "Profit added by Admin" : "Admin adjustment");

    if (isNaN(amount_usd)) {
      return NextResponse.json({ ok: false, error: "amount_usd must be a number" }, { status: 400 });
    }

    ensureUser(userId);

    const tx: Tx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      userId,
      type,
      amount_usd,
      note,
      created_at: new Date().toISOString(),
    };

    // persist to in-memory store
    TRANSACTIONS.push(tx);
    USERS_BALANCE[userId] = Number((USERS_BALANCE[userId] + amount_usd).toFixed(2));

    // Respond with new snapshot (frontend will optionally call socket server separately if using real socket)
    return NextResponse.json({ ok: true, balance_usd: USERS_BALANCE[userId], transaction: tx });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
}
