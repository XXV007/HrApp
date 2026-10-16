import { NextRequest, NextResponse } from "next/server";
import { getSupabase, requireUser } from "@/lib/auth";
export async function GET() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await (
    await getSupabase()
  )
    .from("saved_briefs")
    .select("*")
    .order("created_at", { ascending: false });
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ briefs: data });
}
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (typeof b.brief !== "string" || !b.brief.trim())
    return NextResponse.json({ error: "brief is required" }, { status: 400 });
  const db = await getSupabase();
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile)
    return NextResponse.json(
      { error: "Company membership not found" },
      { status: 403 },
    );
  const { data, error } = await db
    .from("saved_briefs")
    .insert({
      brief: b.brief.trim(),
      name: b.name || b.brief.slice(0, 60),
      company_id: profile.company_id,
    })
    .select()
    .single();
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json(data, { status: 201 });
}
