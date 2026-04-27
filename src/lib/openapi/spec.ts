/** OpenAPI 3.1 specification for WealthView TH Market API */
export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "WealthView TH — Market API",
    version: "1.0.0",
    description:
      "Market data API for WealthView TH. Provides stock quotes, crypto prices, forex rates, price history, and search.\n\n" +
      "**Authentication:** All endpoints require a valid Supabase session cookie.\n\n" +
      "**Rate Limiting:** Requests are rate-limited per authenticated user (or IP for anonymous). When exceeded, a `429` response with `Retry-After` header is returned.\n\n" +
      "**Caching:** Responses include `Cache-Control` headers. The `cached` field in the response body indicates whether data came from the in-memory server cache.",
    contact: { name: "WealthView TH Team" },
  },
  servers: [
    { url: "/", description: "Current server" },
  ],
  tags: [
    { name: "Quote", description: "Real-time stock & crypto quotes" },
    { name: "Search", description: "Search for symbols across markets" },
    { name: "History", description: "Historical OHLCV price data" },
    { name: "Forex", description: "Currency exchange rates & conversion" },
  ],
  paths: {
    "/api/v1/market/quote": {
      get: {
        tags: ["Quote"],
        summary: "Get real-time quotes",
        description:
          "Fetch real-time price quotes for up to 20 symbols. Supports stocks, ETFs, crypto, mutual funds.\n\n" +
          "**Rate limit:** 60 requests/min per IP\n\n" +
          "**Cache TTL:** 30 seconds",
        operationId: "getQuotes",
        parameters: [
          {
            name: "symbols",
            in: "query",
            required: true,
            description: "Comma-separated symbol list (max 20 symbols, max 500 chars)",
            schema: { type: "string", example: "AAPL,GOOGL,BTC-USD" },
          },
          {
            name: "currency",
            in: "query",
            required: false,
            description: "Set to `THB` to convert USD prices to Thai Baht",
            schema: { type: "string", enum: ["THB"], example: "THB" },
          },
        ],
        responses: {
          "200": {
            description: "Quotes fetched successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/QuoteResponse" },
                example: {
                  quotes: [
                    {
                      symbol: "AAPL",
                      shortName: "Apple Inc.",
                      longName: "Apple Inc.",
                      price: 178.72,
                      change: 2.15,
                      changePercent: 1.22,
                      currency: "USD",
                      volume: 54123890,
                      marketCap: 2780000000000,
                      exchange: "NMS",
                      assetType: "stock",
                      fetchedAt: "2026-03-15T10:30:00.000Z",
                    },
                  ],
                  cached: false,
                  provider: "yahoo",
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    "/api/v1/market/search": {
      get: {
        tags: ["Search"],
        summary: "Search for symbols",
        description:
          "Search for stocks, ETFs, crypto, and other assets by name or symbol.\n\n" +
          "**Rate limit:** 30 requests/min per IP",
        operationId: "searchMarket",
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description: "Search query (1–200 characters)",
            schema: { type: "string", example: "Apple" },
          },
        ],
        responses: {
          "200": {
            description: "Search results",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SearchResponse" },
                example: {
                  results: [
                    {
                      symbol: "AAPL",
                      shortName: "Apple Inc.",
                      longName: "Apple Inc.",
                      exchange: "NMS",
                      assetType: "stock",
                    },
                    {
                      symbol: "AAPD",
                      shortName: "Direxion Daily AAPL Bear 1X Shares",
                      exchange: "PCX",
                      assetType: "etf",
                    },
                  ],
                  cached: false,
                  provider: "yahoo",
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    "/api/v1/market/history": {
      get: {
        tags: ["History"],
        summary: "Get price history (OHLCV)",
        description:
          "Fetch historical OHLCV (Open, High, Low, Close, Volume) data for a single symbol.\n\n" +
          "**Rate limit:** 20 requests/min per IP\n\n" +
          "**Cache TTL:** 5 minutes",
        operationId: "getPriceHistory",
        parameters: [
          {
            name: "symbol",
            in: "query",
            required: true,
            description: "Ticker symbol (max 30 chars)",
            schema: { type: "string", example: "AAPL" },
          },
          {
            name: "range",
            in: "query",
            required: false,
            description: "Time range for history. Default: `1mo`",
            schema: {
              type: "string",
              enum: ["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y", "max"],
              default: "1mo",
            },
          },
        ],
        responses: {
          "200": {
            description: "Historical price data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HistoryResponse" },
                example: {
                  symbol: "AAPL",
                  range: "1mo",
                  history: [
                    {
                      date: "2026-02-15",
                      open: 172.5,
                      high: 175.3,
                      low: 171.8,
                      close: 174.2,
                      volume: 48500000,
                    },
                    {
                      date: "2026-02-16",
                      open: 174.2,
                      high: 176.1,
                      low: 173.5,
                      close: 175.8,
                      volume: 52100000,
                    },
                  ],
                  cached: true,
                  provider: "yahoo",
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    "/api/v1/market/forex": {
      get: {
        tags: ["Forex"],
        summary: "Get exchange rate or convert currency",
        description:
          "Get exchange rates between currencies, or convert an amount.\n\n" +
          "**Supported pairs:** USD, EUR, GBP, JPY, CNY ↔ THB\n\n" +
          "**Cache TTL:** 60 seconds\n\n" +
          "If `amount` is provided, returns the converted value. Otherwise returns just the rate.",
        operationId: "getForex",
        parameters: [
          {
            name: "from",
            in: "query",
            required: false,
            description: "Source currency code. Default: `USD`",
            schema: { type: "string", default: "USD", example: "USD" },
          },
          {
            name: "to",
            in: "query",
            required: false,
            description: "Target currency code. Default: `THB`",
            schema: { type: "string", default: "THB", example: "THB" },
          },
          {
            name: "amount",
            in: "query",
            required: false,
            description: "Amount to convert. If omitted, returns only the exchange rate.",
            schema: { type: "number", example: 100 },
          },
        ],
        responses: {
          "200": {
            description: "Exchange rate or conversion result",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { $ref: "#/components/schemas/ForexRateResponse" },
                    { $ref: "#/components/schemas/ForexConvertResponse" },
                  ],
                },
                examples: {
                  rate: {
                    summary: "Rate only (no amount param)",
                    value: { from: "USD", to: "THB", rate: 34.85 },
                  },
                  convert: {
                    summary: "Conversion (with amount param)",
                    value: {
                      from: "USD",
                      to: "THB",
                      amount: 100,
                      converted: 3485.0,
                      rate: 34.85,
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
  },

  components: {
    schemas: {
      MarketQuote: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          shortName: { type: "string" },
          longName: { type: "string", nullable: true },
          price: { type: "number", description: "Current price" },
          change: { type: "number", description: "Price change (absolute)" },
          changePercent: { type: "number", description: "Price change (%)" },
          currency: { type: "string", description: "Currency code (USD, THB, etc.)" },
          volume: { type: "number", nullable: true },
          marketCap: { type: "number", nullable: true },
          exchange: { type: "string", nullable: true },
          assetType: {
            type: "string",
            enum: ["stock", "crypto", "forex", "commodity", "index", "etf", "mutualfund", "unknown"],
          },
          fetchedAt: { type: "string", format: "date-time" },
        },
        required: ["symbol", "shortName", "price", "change", "changePercent", "currency", "assetType", "fetchedAt"],
      },

      MarketSearchResult: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          shortName: { type: "string" },
          longName: { type: "string", nullable: true },
          exchange: { type: "string" },
          assetType: {
            type: "string",
            enum: ["stock", "crypto", "forex", "commodity", "index", "etf", "mutualfund", "unknown"],
          },
        },
        required: ["symbol", "shortName", "exchange", "assetType"],
      },

      PriceHistoryPoint: {
        type: "object",
        properties: {
          date: { type: "string", format: "date" },
          open: { type: "number", nullable: true },
          high: { type: "number", nullable: true },
          low: { type: "number", nullable: true },
          close: { type: "number" },
          volume: { type: "number", nullable: true },
        },
        required: ["date", "close"],
      },

      QuoteResponse: {
        type: "object",
        properties: {
          quotes: {
            type: "array",
            items: { $ref: "#/components/schemas/MarketQuote" },
          },
          cached: { type: "boolean", description: "Whether data came from server cache" },
          provider: { type: "string", description: "Data provider used (yahoo / coingecko)" },
        },
      },

      SearchResponse: {
        type: "object",
        properties: {
          results: {
            type: "array",
            items: { $ref: "#/components/schemas/MarketSearchResult" },
          },
          cached: { type: "boolean" },
          provider: { type: "string" },
        },
      },

      HistoryResponse: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          range: { type: "string" },
          history: {
            type: "array",
            items: { $ref: "#/components/schemas/PriceHistoryPoint" },
          },
          cached: { type: "boolean" },
          provider: { type: "string" },
        },
      },

      ForexRateResponse: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          rate: { type: "number" },
        },
        required: ["from", "to", "rate"],
      },

      ForexConvertResponse: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          amount: { type: "number" },
          converted: { type: "number" },
          rate: { type: "number" },
        },
        required: ["from", "to", "amount", "converted", "rate"],
      },

      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
        required: ["error"],
      },
    },

    responses: {
      BadRequest: {
        description: "Bad Request — invalid or missing parameters",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "symbols parameter required (max 500 chars)" },
          },
        },
      },
      Unauthorized: {
        description: "Unauthorized — valid Supabase session cookie required",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Unauthorized" },
          },
        },
      },
      RateLimited: {
        description: "Too Many Requests — rate limit exceeded",
        headers: {
          "Retry-After": {
            description: "Seconds to wait before retrying",
            schema: { type: "integer" },
          },
        },
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Rate limit exceeded" },
          },
        },
      },
      ServerError: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Failed to fetch quotes" },
          },
        },
      },
    },

    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "sb-access-token",
        description: "Supabase session cookie (set automatically after login)",
      },
    },
  },

  security: [{ cookieAuth: [] }],
} as const;
