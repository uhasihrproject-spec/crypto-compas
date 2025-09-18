// src/app/api/market/route.ts
import { NextResponse } from "next/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
// adjust ids as you like (coingecko ids: bitcoin, ethereum, litecoin, ...)
const DEFAULT_IDS = ["bitcoin", "ethereum", "litecoin"];
const CACHE_TTL = 12; // seconds - short cache to reduce rate limits

// very small in-memory cache. OK for single-host dev. Use Redis/EdgeCache for production.
const cache: { [key: string]: { ts: number; data: any } } = {};

async function fetchCoinSimple(ids: string[]) {
  const key = `simple:${ids.join(",")}`;
  const now = Date.now() / 1000;
  if (cache[key] && now - cache[key].ts < CACHE_TTL) return cache[key].data;

  const url = `${COINGECKO_BASE}/simple/price?ids=${ids.join(
    ","
  )}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("CoinGecko simple price fetch failed");
  const data = await res.json();
  cache[key] = { ts: now, data };
  return data;
}

async function fetchMarketChart(id: string, days = 1) {
  const key = `chart:${id}:${days}`;
  const now = Date.now() / 1000;
  if (cache[key] && now - cache[key].ts < CACHE_TTL) return cache[key].data;

  const url = `${COINGECKO_BASE}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("CoinGecko market_chart fetch failed");
  const data = await res.json();
  cache[key] = { ts: now, data };
  return data;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    // accepts query ?ids=bitcoin,ethereum&chart=bitcoin&days=1
    const idsParam = url.searchParams.get("ids");
    const ids = idsParam ? idsParam.split(",").map((s) => s.trim()) : DEFAULT_IDS;

    const chartId = url.searchParams.get("chart"); // optional single coin for chart data
    const days = Number(url.searchParams.get("days") || "1");

    const [simple, chart] = await Promise.all([
      fetchCoinSimple(ids),
      chartId ? fetchMarketChart(chartId, days) : Promise.resolve(null),
    ]);

    return NextResponse.json({ simple, chart });
  } catch (err: any) {
    console.error("market proxy error", err);
    return NextResponse.json({ error: err.message || "unknown" }, { status: 500 });
  }
}
