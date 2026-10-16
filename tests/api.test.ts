import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireCompany = vi.fn();
const getSupabase = vi.fn();

vi.mock("@/lib/auth", () => ({ getSupabase, requireCompany }));

describe("search API", () => {
  beforeEach(() => {
    vi.resetModules();
    requireCompany.mockReset();
    getSupabase.mockReset();
  });

  it("rejects unauthenticated searches", async () => {
    requireCompany.mockResolvedValue(null);
    const { POST } = await import("@/app/api/search/route");
    const response = await POST(
      new NextRequest("http://localhost/api/search", {
        method: "POST",
        body: JSON.stringify({ brief: "python engineers" }),
      }),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("persists successful search results", async () => {
    requireCompany.mockResolvedValue({ companyId: "company-1", user: { id: "user-1" } });
    getSupabase.mockResolvedValue({
      rpc: async (name: string) =>
        name === "consume_api_rate_limit"
          ? { data: [{ allowed: true, retry_after: 0 }], error: null }
          : { data: [{ search_id: "search-1", searches_remaining: null }], error: null },
      from: (table: string) => table === "companies" ? ({
        select: () => ({
          eq: () => ({ single: async () => ({ data: { plan: "paid" } }) }),
        }),
      }) : table === "candidates" ? ({
        select: async () => ({ data: [{ document: { id: "candidate-1", full_name: "Test Candidate" } }], error: null }),
      }) : ({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: "search-1" }, error: null }),
          }),
        }),
      }),
    });
    const { POST } = await import("@/app/api/search/route");
    const response = await POST(
      new NextRequest("http://localhost/api/search", {
        method: "POST",
        body: JSON.stringify({ brief: "python engineers" }),
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).search_id).toBe("search-1");
  });
});
