import { NextRequest, NextResponse } from "next/server";
import { getSupabase, requireCompany } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ search_id: string }> }) {
  const membership = await requireCompany();
  if (!membership) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { search_id } = await params;
  const { data: search, error } = await (await getSupabase())
    .from("searches")
    .select("id,filters,results")
    .eq("id", search_id)
    .eq("company_id", membership.companyId)
    .maybeSingle();
  if (error)
    return NextResponse.json({ error: "Unable to load search" }, { status: 503 });
  if (!search) return NextResponse.json({ error: "Search not found" }, { status: 404 });
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const start = (page - 1) * 20;
  return NextResponse.json({
    search_id, filters: search.filters, total: search.results.length,
    results: search.results.slice(start, start + 20), page, pageSize: 20,
    totalPages: Math.ceil(search.results.length / 20),
  });
}
