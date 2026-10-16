import { describe, expect, it } from "vitest";
import { getCandidates } from "@/lib/data";
import { parseBrief, searchCandidates } from "@/lib/search";

describe("candidate search", () => {
  it("extracts structured filters from a recruiter brief", () => {
    expect(
      parseBrief("Senior React engineers in New York who are open to work"),
    ).toMatchObject({
      city: "new york",
      role: "react",
      skill: ["react"],
      seniority: "senior",
      open_to_work: true,
    });
  });

  it("returns fixture-compatible results in the expected order", () => {
    const result = searchCandidates(
      getCandidates(),
      "senior React engineers in New York who have worked at a startup",
      1,
      20,
    );
    expect(result.total).toBe(21);
    expect(result.results.map(({ id }) => id).slice(0, 3)).toEqual([
      "cand_0629",
      "cand_0883",
      "cand_1451",
    ]);
  });

  it("paginates ranked results", () => {
    const first = searchCandidates(getCandidates(), "python", 1, 2);
    const second = searchCandidates(getCandidates(), "python", 2, 2);
    expect(first.results).toHaveLength(2);
    expect(second.results).toHaveLength(2);
    expect(first.results[0].id).not.toBe(second.results[0].id);
  });
});
