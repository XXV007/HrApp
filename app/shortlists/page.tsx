"use client";

import { useEffect, useState } from "react";

type Shortlist = { id: string; name: string; shortlist_candidates: { candidate_id: string }[] };

export default function ShortlistsPage() {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/shortlists").then(async (response) => {
      if (response.ok) setShortlists((await response.json()).shortlists);
      else setError((await response.json()).error || "Unable to load shortlists.");
    });
  }, []);
  return (
    <main className="content standalone-page">
      <p className="eyebrow">WORKSPACE / SHORTLISTS</p>
      <h1>Your shortlists.</h1>
      {error && <div className="error" role="alert">{error}</div>}
      <div className="list-stack">
        {shortlists.map((shortlist) => (
          <article className="list-card" key={shortlist.id}>
            <strong>{shortlist.name}</strong>
            <span>{shortlist.shortlist_candidates?.length || 0} candidates</span>
          </article>
        ))}
        {!shortlists.length && !error && <p className="subtitle">No shortlists yet. Save a candidate from search to create one.</p>}
      </div>
    </main>
  );
}
