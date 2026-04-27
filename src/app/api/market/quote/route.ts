// @deprecated Use /api/v1/market/quote — this alias will be removed after 2026-09-01
import { handleQuote } from "@/lib/api/handlers/market";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const res = await handleQuote(request);
  res.headers.set("Deprecation", "true");
  res.headers.set("Sunset", "Tue, 01 Sep 2026 00:00:00 GMT");
  res.headers.set("Link", "</api/v1/market/quote>; rel=\"successor-version\"");
  return res;
}
