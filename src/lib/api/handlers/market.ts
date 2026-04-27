import { NextRequest, NextResponse } from "next/server";
import { gatewayQuote, gatewaySearch, gatewayHistory, isRateLimitError, getExchangeRate, convertCurrency } from "@/lib/market";
import type { TimeRange } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const VALID_RANGES: TimeRange[] = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y", "max"];

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function requireUser(): Promise<{ id: string } | NextResponse> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

// ─── Quote ─────────────────────────────────────────────────────────
export async function handleQuote(request: NextRequest): Promise<NextResponse> {
  const userOrError = await requireUser();
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  const symbolsParam = request.nextUrl.searchParams.get("symbols");
  const convertToThb = request.nextUrl.searchParams.get("currency") === "THB";

  if (!symbolsParam || symbolsParam.length > 500) {
    return NextResponse.json({ error: "symbols parameter required (max 500 chars)" }, { status: 400 });
  }

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  const clientIp = getClientIp(request);

  try {
    const result = await gatewayQuote(symbols, { clientIp, userId: user.id, convertToThb });

    if (isRateLimitError(result)) {
      return NextResponse.json(
        { error: result.error },
        { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
      );
    }

    return NextResponse.json(
      { quotes: result.data, cached: result.cached, provider: result.provider },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    logger.error({ err: error, userId: user.id, symbols }, "market/quote: gateway failed");
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}

// ─── Search ────────────────────────────────────────────────────────
export async function handleSearch(request: NextRequest): Promise<NextResponse> {
  const userOrError = await requireUser();
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.trim().length < 1) {
    return NextResponse.json({ results: [] });
  }
  if (q.length > 200) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const clientIp = getClientIp(request);

  try {
    const result = await gatewaySearch(q.trim(), { clientIp, userId: user.id });

    if (isRateLimitError(result)) {
      return NextResponse.json(
        { error: result.error },
        { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
      );
    }

    return NextResponse.json({ results: result.data, cached: result.cached, provider: result.provider });
  } catch (error) {
    logger.error({ err: error, userId: user.id, q }, "market/search: gateway failed");
    return NextResponse.json({ error: "Failed to search market data" }, { status: 500 });
  }
}

// ─── History ───────────────────────────────────────────────────────
export async function handleHistory(request: NextRequest): Promise<NextResponse> {
  const userOrError = await requireUser();
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  const symbol = request.nextUrl.searchParams.get("symbol");
  const range = request.nextUrl.searchParams.get("range") || "1mo";

  if (!symbol || symbol.length > 30) {
    return NextResponse.json({ error: "symbol parameter required (max 30 chars)" }, { status: 400 });
  }

  if (!VALID_RANGES.includes(range as TimeRange)) {
    return NextResponse.json(
      { error: `Invalid range. Use: ${VALID_RANGES.join(", ")}` },
      { status: 400 }
    );
  }

  const validRange = range as TimeRange;
  const clientIp = getClientIp(request);

  try {
    const result = await gatewayHistory(symbol.trim(), validRange, { clientIp, userId: user.id });

    if (isRateLimitError(result)) {
      return NextResponse.json(
        { error: result.error },
        { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
      );
    }

    return NextResponse.json(
      { symbol, range, history: result.data, cached: result.cached, provider: result.provider },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    logger.error({ err: error, userId: user.id, symbol, range }, "market/history: gateway failed");
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
  }
}

// ─── Forex ─────────────────────────────────────────────────────────
export async function handleForex(request: NextRequest): Promise<NextResponse> {
  const userOrError = await requireUser();
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  const from = request.nextUrl.searchParams.get("from") || "USD";
  const to = request.nextUrl.searchParams.get("to") || "THB";
  const amountStr = request.nextUrl.searchParams.get("amount");

  try {
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (isNaN(amount)) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
      const result = await convertCurrency(amount, from.toUpperCase(), to.toUpperCase());
      if (!result) {
        return NextResponse.json({ error: `Unsupported pair: ${from}/${to}` }, { status: 400 });
      }
      return NextResponse.json({
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        amount,
        converted: result.converted,
        rate: result.rate,
      });
    }

    const rate = await getExchangeRate(from.toUpperCase(), to.toUpperCase());
    if (rate === null) {
      return NextResponse.json({ error: `Unsupported pair: ${from}/${to}` }, { status: 400 });
    }

    return NextResponse.json(
      { from: from.toUpperCase(), to: to.toUpperCase(), rate },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    logger.error({ err: error, userId: user.id, from, to }, "market/forex: fetch failed");
    return NextResponse.json({ error: "Failed to fetch exchange rate" }, { status: 500 });
  }
}
