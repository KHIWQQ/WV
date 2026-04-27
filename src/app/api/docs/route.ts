// @deprecated Use /api/v1/docs
import { openApiSpec } from "@/lib/openapi/spec";
import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json(openApiSpec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=3600",
    },
  });
  res.headers.set("Deprecation", "true");
  res.headers.set("Link", "</api/v1/docs>; rel=\"successor-version\"");
  return res;
}
