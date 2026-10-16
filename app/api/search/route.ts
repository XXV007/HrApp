import { NextRequest, NextResponse } from "next/server";
import { searchCandidates } from "@/lib/search";
import { getSupabase, requireCompany } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
export async function POST(req: NextRequest) {
  try {
    const membership = await requireCompany();
    if (!membership) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = await getSupabase();
    const quota = await rateLimit(db, `search:${membership.user.id}`, 20);
    if (!quota.allowed)
      return NextResponse.json(
        { error: "Too many searches. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(quota.retryAfter) } },
      );
    const body = await req.json();
    const brief = typeof body.brief === "string" ? body.brief.trim() : "";
    if (!brief)
      return NextResponse.json({ error: "brief is required" }, { status: 400 });
    const { data: candidateRows, error: candidateError } = await db
      .from("candidates")
      .select("document");
    if (candidateError)
      return NextResponse.json({ error: "Unable to load candidates" }, { status: 503 });
    const candidates = candidateRows.map(({ document }) => document);
    const result = searchCandidates(candidates, brief, 1, 20);
    const allResults = searchCandidates(candidates, brief, 1, 10000).results;
    const { data: saved, error: saveError } = await db.rpc(
      "create_search_with_quota",
      {
        p_company_id: membership.companyId,
        p_brief: brief,
        p_filters: result.filters,
        p_results: allResults,
        p_limit: 5,
      },
    );
    if (saveError) {
      if (saveError.message.includes("search limit reached"))
        return NextResponse.json({ error: "Search limit reached", searches_remaining: 0 }, { status: 402 });
      return NextResponse.json({ error: "Unable to save search results" }, { status: 503 });
    }
    const savedSearch = saved?.[0];
    if (!savedSearch) return NextResponse.json({ error: "Unable to save search results" }, { status: 503 });
    return NextResponse.json({
      search_id: savedSearch.search_id, filters: result.filters, total: result.total,
      results: result.results, searches_remaining: savedSearch.searches_remaining,
    });
  } catch (error) {
    logger.error("Search request failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Unable to complete search" }, { status: 500 });
  }
}
