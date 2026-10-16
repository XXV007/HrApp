import { NextResponse } from "next/server";
import { getSupabase, requireCompany } from "@/lib/auth";

export async function POST(_: Request, { params }: { params: Promise<{ shortlist_id: string; person_id: string }> }) {
  const m = await requireCompany(); if (!m) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = await params; const db = await getSupabase();
  const { error } = await db.from("shortlist_candidates").upsert({ shortlist_id: p.shortlist_id, candidate_id: p.person_id });
  if (error)
    return NextResponse.json({ error: "Unable to add candidate to shortlist" }, { status: 503 });
  return NextResponse.json({ added: true });
}
export async function DELETE(_: Request, { params }: { params: Promise<{ shortlist_id: string; person_id: string }> }) {
  const m = await requireCompany(); if (!m) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = await params; const db = await getSupabase();
  const { error } = await db.from("shortlist_candidates").delete().eq("shortlist_id", p.shortlist_id).eq("candidate_id", p.person_id);
  if (error)
    return NextResponse.json({ error: "Unable to remove candidate from shortlist" }, { status: 503 });
  return NextResponse.json({ removed: true });
}
