"use client";
import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/browser-auth";
import type { Candidate } from "@/lib/types";
type Result = { id: string; candidate: Candidate; score: number };
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
  const [profile, setProfile] = useState<{ full_name?: string; companies?: { name?: string; plan?: string } } | null>(null);
  const [shortlistId, setShortlistId] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    fetch("/api/me").then(async (response) => {
      if (response.status === 401) router.push("/login");
      else if (response.ok) setProfile(await response.json());
    });
  }, [router]);
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
  async function saveBrief() {
    setError(null);
    const response = await fetch("/api/saved-briefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ brief, name: brief.slice(0, 60) }),
    });
    if (!response.ok)
      setError((await response.json()).error || "Unable to save brief.");
    else setSaved(true);
  }
  async function signOut() {
    await getBrowserSupabase().auth.signOut();
    router.push("/login");
  }
  async function shortlist(candidateId: string) {
    setError(null);
    let id = shortlistId;
    if (!id) {
      const created = await fetch("/api/shortlists", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Search shortlist" }),
      });
      if (!created.ok) {
        setError("Unable to create shortlist.");
        return;
      }
      id = (await created.json()).id;
      setShortlistId(id);
    }
    const response = await fetch(`/api/shortlists/${id}/people/${candidateId}`, {
      method: "POST",
    });
    if (!response.ok) setError("Unable to add candidate to shortlist.");
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
          <Link className="active" href="/">
            ⌕ <span>Search</span>
          </Link>
          <Link href="/shortlists">
            ♡ <span>Shortlists</span>
          </Link>
          <Link href="/saved-briefs">
            ◷ <span>Saved briefs</span>
          </Link>
        </nav>
        <div className="side-bottom">
          <div className="plan">
            <small>PLAN</small>
            <strong>{profile?.companies?.plan === "paid" ? "Paid workspace" : "Free workspace"}</strong>
            <div className="meter">
              <i />
            </div>
            <small>1 search included on the free plan</small>
          </div>
          <div className="profile">
            <span className="avatar">JD</span>
            <div>
              <strong>{profile?.full_name || "Recruiter"}</strong>
              <small>{profile?.companies?.name || "Workspace"}</small>
            </div>
            <button className="profile-menu" onClick={signOut} aria-label="Sign out">↪</button>
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
          <button className="outline" onClick={saveBrief}>
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
                  <button onClick={() => shortlist(c.id)} aria-label={`Save ${c.full_name}`}>♡</button>
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
