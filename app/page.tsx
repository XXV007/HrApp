"use client";
import { useState } from "react";
type Result = { id: string; candidate: any; score: number };
const examples = [
  "Senior React engineers in New York who have worked at a startup",
  "Product designers in San Francisco who are open to work",
  "Backend engineers in Austin who know Go and Kubernetes",
];
export default function Home() {
  const [brief, setBrief] = useState(examples[0]);
  const [results, setResults] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function search() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const d = (await r.json()) as {
        results?: Result[];
        total?: number;
        error?: string;
      };
      if (!r.ok) {
        if (r.status === 401)
          throw new Error("Please sign in to search candidates.");
        throw new Error(d.error || "Search failed. Please try again.");
      }
      setResults(d.results || []);
      setTotal(d.total || 0);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Search failed. Please try again.",
      );
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main>
      <aside>
        <div className="brand">
          <span className="mark">✦</span>
          <span>
            talent<span className="muted">/</span>radar
          </span>
        </div>
        <nav>
          <a className="active">
            ⌕ <span>Search</span>
          </a>
          <a>
            ♡ <span>Shortlists</span>
          </a>
          <a>
            ◷ <span>Saved briefs</span>
          </a>
        </nav>
        <div className="side-bottom">
          <div className="plan">
            <small>PLAN</small>
            <strong>Free workspace</strong>
            <div className="meter">
              <i />
            </div>
            <small>1 search included on the free plan</small>
          </div>
          <div className="profile">
            <span className="avatar">JD</span>
            <div>
              <strong>Jordan Davis</strong>
              <small>Acme recruiting</small>
            </div>
            <span>•••</span>
          </div>
        </div>
      </aside>
      <section className="content">
        <header>
          <div>
            <p className="eyebrow">SEARCH / CANDIDATES</p>
            <h1>Find your next great hire.</h1>
            <p className="subtitle">
              Describe who you’re looking for in plain English.
            </p>
          </div>
          <button className="outline" onClick={() => setSaved(!saved)}>
            {saved ? "✓ Saved" : "＋ Save brief"}
          </button>
        </header>
        <div className="search-card">
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                search();
              }
            }}
          />
          <div className="search-footer">
            <span className="hint">⌘ Enter to search</span>
            <button className="primary" onClick={search} disabled={loading}>
              {loading ? "Searching…" : "Search candidates  →"}
            </button>
          </div>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="examples">
          <span>Try an example</span>
          {examples.map((x, i) => (
            <button key={x} onClick={() => setBrief(x)}>
              {["✦", "⌁", "◈"][i]} {x}
            </button>
          ))}
        </div>
        {total > 0 && (
          <div className="results-head">
            <div>
              <h2>
                {total.toLocaleString()} candidates{" "}
                <span>matching your brief</span>
              </h2>
              <p>Ranked by relevance · Updated just now</p>
            </div>
            <button className="sort">Best match⌄</button>
          </div>
        )}
        {results.length > 0 ? (
          <div className="grid">
            {results.map(({ candidate: c, score }) => (
              <article className="candidate" key={c.id}>
                <div className="card-top">
                  {/* eslint-disable-next-line @next/next/no-img-element -- fixture URLs use an external host not configured for next/image. */}
                  <img src={c.avatar_url} alt="" />
                  <button aria-label={`Save ${c.full_name}`}>♡</button>
                </div>
                <h3>{c.full_name}</h3>
                <p className="role">{c.current_title || c.role}</p>
                <p className="company">
                  {c.current_company} · {c.location?.city}
                </p>
                <div className="tags">
                  {(c.skills || []).slice(0, 3).map((s: string) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
                <div className="card-bottom">
                  <span className="match">
                    {Math.min(99, Math.round(72 + score * 4))}% match
                  </span>
                  <span>{c.open_to_work ? "● Open to work" : ""}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon">⌕</div>
            <h2>Search your candidate universe</h2>
            <p>
              Use the prompt above to surface candidates from your private
              talent pool.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
