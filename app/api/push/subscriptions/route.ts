import { NextResponse } from "next/server";
import { memorySubs } from "../subscribe/route";

export async function GET() {
  return NextResponse.json({
    total: memorySubs.length,
    items: memorySubs,
  });
}
