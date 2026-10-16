import { NextRequest, NextResponse } from "next/server";
import { getCandidates } from "@/lib/data";
import { searchCandidates } from "@/lib/search";
import { getSupabase, requireCompany } from "@/lib/auth";
export async function POST(req: NextRequest) {
  try {
    const membership = await requireCompany();
    if (!membership) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const brief = typeof body.brief === "string" ? body.brief.trim() : "";
    if (!brief)
      return NextResponse.json({ error: "brief is required" }, { status: 400 });
    const db = await getSupabase();
    const { data: company } = await db.from("companies").select("plan").eq("id", membership.companyId).single();
    const paid = company?.plan === "paid";
    let remaining: number | null = null;
    if (!paid) {
      const { data: consumed, error } = await db.rpc("consume_search_credit", { p_company_id: membership.companyId, p_limit: 5 });
      if (!error && typeof consumed === "number" && consumed < 0) return NextResponse.json({ error: "Search limit reached", searches_remaining: 0 }, { status: 402 });
      if (error)
        return NextResponse.json(
          { error: "Unable to check search quota" },
          { status: 503 },
        );
      remaining = typeof consumed === "number" ? consumed : null;
    }
    const result = searchCandidates(getCandidates(), brief, 1, 20);
    const allResults = searchCandidates(getCandidates(), brief, 1, 10000).results;
    const { data: savedSearch, error: saveError } = await db
      .from("searches")
      .insert({
        company_id: membership.companyId,
        brief,
        filters: result.filters,
        results: allResults,
      })
      .select("id")
      .single();
    if (saveError || !savedSearch)
      return NextResponse.json(
        { error: "Unable to save search results" },
        { status: 503 },
      );
    if (remaining === null && !paid) remaining = 0;
    return NextResponse.json({
      search_id: savedSearch.id, filters: result.filters, total: result.total,
      results: result.results, searches_remaining: paid ? null : remaining,
    });
  } catch (error) {
    console.error("Search request failed", error);
    return NextResponse.json({ error: "Unable to complete search" }, { status: 500 });
  }
}
