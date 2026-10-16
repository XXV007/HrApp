import fs from "node:fs";
import path from "node:path";
import type { Candidate } from "./types";
let cache: Candidate[] | undefined;
export function getCandidates(): Candidate[] {
  if (!cache) {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "candidates.json"),
      "utf8",
    );
    cache = JSON.parse(raw) as Candidate[];
  }
  return cache;
}
