"use client";

import { useEffect, useState } from "react";

type Brief = { id: string; name: string; brief: string };

export default function SavedBriefsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/saved-briefs").then(async (response) => {
      if (response.ok) setBriefs((await response.json()).briefs);
      else setError((await response.json()).error || "Unable to load saved briefs.");
    });
  }, []);
  return (
    <main className="content standalone-page">
      <p className="eyebrow">WORKSPACE / SAVED BRIEFS</p>
      <h1>Saved briefs.</h1>
      {error && <div className="error" role="alert">{error}</div>}
      <div className="list-stack">
        {briefs.map((brief) => (
          <article className="list-card" key={brief.id}>
            <strong>{brief.name}</strong>
            <span>{brief.brief}</span>
          </article>
        ))}
        {!briefs.length && !error && <p className="subtitle">No saved briefs yet.</p>}
      </div>
    </main>
  );
}
