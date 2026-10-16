import { NextRequest, NextResponse } from "next/server";
import { getSupabase, requireCompany } from "@/lib/auth";

export async function GET() {
  const m = await requireCompany(); if (!m) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await (await getSupabase()).from("saved_briefs").select("*").order("created_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: "Unable to load saved briefs" }, { status: 503 });
  return NextResponse.json({ briefs: data });
}
export async function POST(req: NextRequest) {
  const m = await requireCompany(); if (!m) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (typeof b.brief !== "string" || !b.brief.trim()) return NextResponse.json({ error: "brief is required" }, { status: 400 });
  const value = { brief: b.brief.trim(), name: String(b.name || b.brief.slice(0, 60)), company_id: m.companyId };
  const { data, error } = await (await getSupabase()).from("saved_briefs").insert(value).select().single();
  if (error)
    return NextResponse.json({ error: "Unable to save brief" }, { status: 503 });
  return NextResponse.json(data, { status: 201 });
}
