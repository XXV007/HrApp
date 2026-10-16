import { NextResponse } from "next/server";
import { getSupabase, requireCompany } from "@/lib/auth";
export async function GET() {
  if (!(await requireCompany())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { count, error } = await (await getSupabase())
    .from("candidates")
    .select("id", { count: "exact", head: true });
  if (error) return NextResponse.json({ error: "Unable to load candidate count" }, { status: 503 });
  return NextResponse.json({ total: count || 0 });
}
