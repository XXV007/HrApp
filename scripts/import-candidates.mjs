import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

const candidates = JSON.parse(await fs.readFile(new URL("../candidates.json", import.meta.url), "utf8"));
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
for (let start = 0; start < candidates.length; start += 500) {
  const rows = candidates.slice(start, start + 500).map((document) => ({ id: document.id, document }));
  const { error } = await db.from("candidates").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Candidate import failed at ${start}: ${error.message}`);
  console.log(`Imported ${Math.min(start + rows.length, candidates.length)}/${candidates.length}`);
}
