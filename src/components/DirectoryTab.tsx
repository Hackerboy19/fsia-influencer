import React, { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { routeForTab } from "../seo";
import type { ProfileView } from "../lib/profile";
import ProfileCard from "./ProfileCard";
import type { RosterStatus } from "./RosterNotice";
import RosterNotice from "./RosterNotice";
import { APPLY_LABEL, JOIN_RULE } from "../content/awards";

interface DirectoryTabProps {
  key?: React.Key;
  profiles: ProfileView[];
  status: RosterStatus;
  onSelectProfile: (profile: ProfileView) => void;
  onApply: () => void;
  onRetry: () => void;
}

type Sort = "listed" | "name";
const PAGE_SIZE = 24;

const readParam = (key: string) => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get(key) || "");

// Search and filters work on the live list. Category and city options come from the
// profiles themselves, so every option returns at least one result.
export default function DirectoryTab({ profiles, status, onSelectProfile, onApply, onRetry }: DirectoryTabProps) {
  const route = routeForTab("directory");
  const [query, setQuery] = useState(() => readParam("q"));
  const [category, setCategory] = useState(() => readParam("category"));
  const [city, setCity] = useState(() => readParam("city"));
  const [sort, setSort] = useState<Sort>("listed");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const categories = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [profiles]
  );
  const cities = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.city).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [profiles]
  );

  // Keep filters in the address bar so a filtered list can be shared (the profile param is left alone)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const set = (k: string, v: string) => (v ? params.set(k, v) : params.delete(k));
    set("q", query.trim());
    set("category", category);
    set("city", city);
    const qs = params.toString();
    const next = window.location.pathname + (qs ? `?${qs}` : "");
    if (next !== window.location.pathname + window.location.search) window.history.replaceState(window.history.state, "", next);
  }, [query, category, city]);

  useEffect(() => setVisible(PAGE_SIZE), [query, category, city, sort]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = profiles.filter((p) => {
      if (category && p.category !== category) return false;
      if (city && p.city !== city) return false;
      if (!q) return true;
      return [p.name, p.role, p.city, p.category, p.bio].some((v) => v.toLowerCase().includes(q));
    });
    return sort === "name" ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : list;
  }, [profiles, query, category, city, sort]);

  const filtered = !!(query.trim() || category || city);
  const clear = () => {
    setQuery("");
    setCategory("");
    setCity("");
  };

  const selectClass =
    "h-11 w-full rounded-[4px] border border-field bg-surface px-3 text-[0.9375rem] text-ink focus:outline-none focus:border-ink";

  return (
    <div className="page pt-10 md:pt-14 pb-16" id="influencer-directory-tab">
      <header className="max-w-3xl space-y-3">
        <p className="eyebrow">Directory</p>
        <h1 className="h-page">{route.heading}</h1>
        <p className="lede">{route.intro}</p>
      </header>

      <form
        role="search"
        aria-label="Search profiles"
        onSubmit={(e) => e.preventDefault()}
        className="mt-8 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-end border-y border-line py-5"
      >
        <div>
          <label htmlFor="directory-search" className="block text-[0.8125rem] font-semibold text-ink-2 mb-1.5">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id="directory-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, niche or city"
              autoComplete="off"
              className={`${selectClass} pl-9`}
            />
          </div>
        </div>
        <div>
          <label htmlFor="directory-category" className="block text-[0.8125rem] font-semibold text-ink-2 mb-1.5">Category</label>
          <select id="directory-category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass} disabled={!categories.length}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="directory-city" className="block text-[0.8125rem] font-semibold text-ink-2 mb-1.5">City</label>
          <select id="directory-city" value={city} onChange={(e) => setCity(e.target.value)} className={selectClass} disabled={!cities.length}>
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="directory-sort" className="block text-[0.8125rem] font-semibold text-ink-2 mb-1.5">Sort</label>
          <select id="directory-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selectClass}>
            <option value="listed">As listed</option>
            <option value="name">Name, A to Z</option>
          </select>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 min-h-9">
        <p className="text-[0.9375rem] text-ink-2" role="status" aria-live="polite">
          {status === "loading" ? "Loading profiles…" : `${results.length} ${results.length === 1 ? "profile" : "profiles"}${filtered ? " match" : ""}`}
        </p>
        {filtered && (
          <button type="button" onClick={clear} className="btn btn-sm btn-secondary">
            <X className="w-4 h-4" aria-hidden="true" /> Clear filters
          </button>
        )}
      </div>

      <RosterNotice status={status} onRetry={onRetry} className="mt-4" />

      {status === "loading" ? (
        <ul className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="space-y-3">
              <span className="block aspect-[4/5] bg-sunken" />
              <span className="block h-4 w-2/3 bg-sunken" />
              <span className="block h-3 w-1/2 bg-sunken" />
            </li>
          ))}
        </ul>
      ) : results.length ? (
        <>
          <ul className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
            {results.slice(0, visible).map((p, i) => (
              <li key={p.slug}>
                <ProfileCard profile={p} onOpen={onSelectProfile} headingLevel="h2" eager={i < 4} />
              </li>
            ))}
          </ul>
          {results.length > visible && (
            <div className="mt-10 flex justify-center">
              <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn btn-secondary">
                Show more ({results.length - visible} more)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-6 border border-line bg-surface px-6 py-12 text-center space-y-3">
          <p className="font-display text-[1.375rem] text-ink">{filtered ? "No profiles match these filters" : "No profiles are published yet"}</p>
          <p className="text-ink-2">{filtered ? "Try a different spelling, or clear the filters to see everyone." : "Creators appear here once our team approves their application."}</p>
          {filtered && (
            <button type="button" onClick={clear} className="btn btn-secondary">Clear filters</button>
          )}
        </div>
      )}

      <aside className="mt-16 grid gap-6 md:grid-cols-[1fr_auto] items-center border-t border-line pt-8">
        <div className="space-y-1">
          <h2 className="font-display text-[1.375rem] text-ink">Are you a creator?</h2>
          <p className="text-ink-2">{JOIN_RULE} Applying is free, and our team reviews every application.</p>
        </div>
        <button type="button" onClick={onApply} className="btn btn-primary justify-self-start">{APPLY_LABEL}</button>
      </aside>
    </div>
  );
}
