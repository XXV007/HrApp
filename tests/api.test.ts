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
    requireCompany.mockResolvedValue({ companyId: "company-1" });
    getSupabase.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({ single: async () => ({ data: { plan: "paid" } }) }),
        }),
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
