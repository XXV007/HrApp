import { NextResponse } from "next/server";
import { getCandidates } from "@/lib/data";
export async function GET() {
  return NextResponse.json({ total: getCandidates().length });
}
