import { NextRequest, NextResponse } from "next/server";
import { getSupabase, requireCompany } from "@/lib/auth";
export async function GET() {
  const membership = await requireCompany();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getSupabase();
  const { data, error } = await db
    .from("shortlists")
    .select("id,name,created_at,shortlist_candidates(candidate_id)")
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: "Unable to load shortlists" }, { status: 503 });
  return NextResponse.json({ shortlists: data });
}
export async function POST(req: NextRequest) {
  const membership = await requireCompany();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const db = await getSupabase();
  const { data, error } = await db
    .from("shortlists")
    .insert({
      name: String(body.name || "New shortlist"),
      company_id: membership.companyId,
    })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: "Unable to create shortlist" }, { status: 503 });
  if (Array.isArray(body.candidateIds) && body.candidateIds.length)
    await db
      .from("shortlist_candidates")
      .insert(
        body.candidateIds.map((candidate_id: string) => ({
          shortlist_id: data.id,
          candidate_id,
        })),
      );
  return NextResponse.json(data, { status: 201 });
}
