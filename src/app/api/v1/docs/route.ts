import { openApiSpec } from "@/lib/openapi/spec";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=3600",
    },
  });
}
