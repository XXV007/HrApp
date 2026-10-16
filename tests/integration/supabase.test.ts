import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const describeIntegration = process.env.RUN_INTEGRATION === "1" ? describe : describe.skip;

describeIntegration("Supabase integration", () => {
  it("has imported candidates", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase integration environment is missing");
    const db = createClient(url, key);
    const { count, error } = await db.from("candidates").select("id", { count: "exact", head: true });
    expect(error).toBeNull();
    expect(count).toBeGreaterThan(0);
  });
});
