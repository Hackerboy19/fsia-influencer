import React from "react";
import { routeForTab, TabId } from "../seo";
import type { ProfileView } from "../lib/profile";
import ProfileCard from "./ProfileCard";
import TabLink from "./TabLink";
import type { RosterStatus } from "./RosterNotice";
import RosterNotice from "./RosterNotice";

const BENEFITS = [
  { title: "A public profile", text: "Your photo, niche, city, biography and work, in the directory brands use." },
  { title: "Branding and marketing help", text: "Support with your bio, media kit and digital marketing." },
  { title: "Brand introductions", text: "When a brand brief fits your niche and city, our team introduces you." },
  { title: "Open to any creator", text: "You do not need to win an award to become a member." }
];

export default function StarIndiaTab({
  profiles,
  status,
  onNavigate,
  onSelectProfile,
  onRetry
}: {
  profiles: ProfileView[];
  status: RosterStatus;
  onNavigate: (tab: TabId) => void;
  onSelectProfile: (profile: ProfileView) => void;
  onRetry: () => void;
}) {
  const route = routeForTab("starindia");

  return (
    <div className="page pt-10 md:pt-14 pb-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <header className="space-y-4 max-w-2xl">
          <p className="eyebrow">Membership</p>
          <h1 className="h-page">{route.heading}</h1>
          <p className="lede">{route.intro}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <TabLink tab="apply" onNavigate={onNavigate} className="btn btn-primary">Join as a creator</TabLink>
            <TabLink tab="membership" onNavigate={onNavigate} className="btn btn-secondary">Membership plans</TabLink>
          </div>
        </header>
        <section aria-labelledby="member-benefits">
          <h2 id="member-benefits" className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-3 pb-3 border-b border-line">What members get</h2>
          <dl className="divide-y divide-line border-b border-line">
            {BENEFITS.map((b) => (
              <div key={b.title} className="py-4">
                <dt className="font-semibold text-ink">{b.title}</dt>
                <dd className="text-[0.9375rem] text-ink-2 mt-0.5">{b.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section aria-labelledby="member-profiles" className="mt-16 border-t border-line pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 id="member-profiles" className="h-section">Member profiles</h2>
            <p className="text-ink-2">{status === "loading" ? "Loading profiles…" : `${profiles.length} ${profiles.length === 1 ? "profile" : "profiles"}`}</p>
          </div>
          <TabLink tab="directory" onNavigate={onNavigate} className="link">Search all profiles</TabLink>
        </div>
        <RosterNotice status={status} onRetry={onRetry} className="mt-6" />
        {profiles.length > 0 ? (
          <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
            {profiles.map((p) => (
              <li key={p.slug}>
                <ProfileCard profile={p} onOpen={onSelectProfile} />
              </li>
            ))}
          </ul>
        ) : (
          status !== "loading" && <p className="mt-8 text-ink-2">No member profiles are published yet.</p>
        )}
      </section>
    </div>
  );
}
