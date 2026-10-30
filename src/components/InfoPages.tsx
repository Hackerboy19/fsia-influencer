import React, { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { routeForTab, TabId } from "../seo";
import { APPLY_LABEL, AWARD, AWARD_NAME, AWARD_BENEFITS, ELIGIBLE_NICHES } from "../content/awards";
import { ORGANISER, APPLICATIONS_OPEN, ANTI_FRAUD_NOTE } from "../content/organiser";
import type { ProfileView } from "../lib/profile";
import type { RosterStatus } from "./RosterNotice";
import Photo from "./Photo";
import TabLink from "./TabLink";
import { BRAND_STEPS, CREATOR_STEPS, countBy } from "./HomeTab";

// Pages that each menu item opens. The home page shows a short version of the same
// content; these pages hold the full version, so every menu item has its own address.

type Browse = (filters: { q?: string; category?: string; city?: string }) => void;

const inApp = (fn: () => void) => (e: React.MouseEvent) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  fn();
};

function PageHead({ tab, eyebrow, children }: { tab: TabId; eyebrow: string; children?: React.ReactNode }) {
  const route = routeForTab(tab);
  return (
    <header className="bg-ivory border-b border-line">
      <div className="page-wide pt-10 md:pt-16 pb-10 md:pb-14">
        <div className="max-w-3xl space-y-4">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="font-display font-medium tracking-[-0.02em] text-ink text-[2.5rem] md:text-[3.5rem] leading-[1.02]">{route.heading}</h1>
          <p className="text-[1.125rem] leading-relaxed text-ink-2 max-w-2xl">{route.intro}</p>
          {children && <div className="pt-3 flex flex-wrap items-center gap-3">{children}</div>}
        </div>
      </div>
    </header>
  );
}

function Steps({ steps }: { steps: readonly { title: string; text: string }[] }) {
  return (
    <ol className="border-t border-ink">
      {steps.map((s, i) => (
        <li key={s.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[3.5rem_14rem_minmax(0,1fr)] gap-x-4 gap-y-1 py-6 border-b border-line">
          <span className="font-display text-[1.75rem] leading-none text-bronze tabular-nums row-span-2 sm:row-span-1" aria-hidden="true">{i + 1}</span>
          <h3 className="font-semibold text-ink">{s.title}</h3>
          <p className="text-ink-2 leading-relaxed">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

function Split({ id, title, sub, children }: { id: string; title: string; sub?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="page-wide section grid gap-8 lg:gap-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
      <div className="space-y-3">
        <h2 id={id} className="h-section">{title}</h2>
        {sub && <div className="text-ink-2 max-w-md">{sub}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- awards */

export function AwardsTab({ onNavigate, onAwardEnquiry }: { onNavigate: (tab: TabId) => void; onAwardEnquiry: () => void }) {
  return (
    <div>
      <PageHead tab="awards" eyebrow={APPLICATIONS_OPEN ? "First edition · Registration open" : "First edition"}>
        <TabLink tab="apply" onNavigate={onNavigate} className="btn btn-primary h-12 px-6">{APPLY_LABEL} <ArrowRight className="w-4 h-4" aria-hidden="true" /></TabLink>
        <button type="button" onClick={onAwardEnquiry} className="btn btn-secondary h-12">Ask about the award</button>
      </PageHead>

      <Split id="award-about" title="About the award" sub={<p>Run by {ORGANISER.name}, {ORGANISER.location}. Separate from any other award.</p>}>
        <p className="font-display text-[1.375rem] md:text-[1.5rem] leading-[1.45] text-ink">{AWARD.text}</p>
        <p className="mt-6 text-ink-2">
          There are no past winners yet: this is the first edition. Results will be published on this site.
        </p>
      </Split>

      <div className="bg-sunken border-y border-line">
        <Split id="award-who" title="Who can apply" sub={<p>Indian influencers and digital creators. Pick the niche most of your content sits in.</p>}>
          <ul className="grid grid-cols-1 sm:grid-cols-2 border-t border-line">
            {ELIGIBLE_NICHES.map((n) => (
              <li key={n} className="py-3.5 border-b border-line text-ink">{n}</li>
            ))}
          </ul>
          <p className="mt-4 text-[0.9375rem] text-ink-3">These are niches, not separate award categories. There is one award.</p>
        </Split>
      </div>

      <Split id="award-get" title="What you get" sub={<p>What is part of the award is kept apart from services offered on request.</p>}>
        <div className="grid gap-10 sm:grid-cols-2">
          {AWARD_BENEFITS.map((group) => (
            <div key={group.title}>
              <h3 className="font-semibold text-ink pb-3 border-b border-ink">{group.title}</h3>
              <p className="mt-3 text-[0.875rem] text-ink-3">{group.note}</p>
              <ul className="mt-2 divide-y divide-line">
                {group.items.map((item) => (
                  <li key={item.title} className="py-4">
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="text-[0.9375rem] text-ink-2 mt-0.5">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Split>

      <div className="border-t border-line">
        <Split id="award-how" title="How applying works">
          <Steps steps={CREATOR_STEPS} />
        </Split>
      </div>

      <section aria-labelledby="award-fee" className="band-ink surface-dark">
        <div className="page-wide section grid gap-8 lg:gap-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <h2 id="award-fee" className="h-section">The fee</h2>
          <div className="space-y-6">
            <p className="text-[1.125rem] leading-relaxed text-[#E7E3DA] max-w-2xl">{ANTI_FRAUD_NOTE}</p>
            <div className="flex flex-wrap gap-3">
              <TabLink tab="apply" onNavigate={onNavigate} className="btn btn-light">{APPLY_LABEL}</TabLink>
              <TabLink tab="faq" onNavigate={onNavigate} className="btn btn-ghost-light">Questions and answers</TabLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------ categories */

export function CategoriesTab({ profiles, status, onBrowse, onNavigate }: { profiles: ProfileView[]; status: RosterStatus; onBrowse: Browse; onNavigate: (tab: TabId) => void }) {
  const categories = useMemo(() => countBy(profiles.map((p) => p.category)), [profiles]);
  const cities = useMemo(() => countBy(profiles.map((p) => p.city)), [profiles]);
  return (
    <div>
      <PageHead tab="categories" eyebrow="Discover creators" />
      <div className="page-wide section">
        {categories.length === 0 ? (
          <p className="text-ink-2" role="status">
            {status === "loading" ? "Loading categories…" : "Categories appear here once creator profiles are published."}{" "}
            <TabLink tab="directory" onNavigate={onNavigate} className="link">See all profiles</TabLink>
          </p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {categories.map(([name, n]) => {
              const inCat = profiles.filter((p) => p.category === name && p.image);
              return (
                <li key={name}>
                  <a href={`/creators/?category=${encodeURIComponent(name)}`} onClick={inApp(() => onBrowse({ category: name }))} className="group block">
                    <Photo src={inCat[0]?.image} name={name} ratio="aspect-[4/5]" sizes="(min-width: 1024px) 300px, 50vw" className="[&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-[1.03]" />
                    <span className="mt-3 flex items-baseline justify-between gap-3">
                      <span className="font-display text-[1.375rem] leading-tight text-ink group-hover:text-bronze">{name}</span>
                      <span className="text-[0.875rem] text-ink-3 tabular-nums shrink-0">{n} {n === 1 ? "creator" : "creators"}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}

        {cities.length > 0 && (
          <section aria-labelledby="cat-cities" className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] border-t border-line pt-10">
            <h2 id="cat-cities" className="h-section">By city</h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 border-t border-line">
              {cities.map(([name, n]) => (
                <li key={name} className="border-b border-line">
                  <a href={`/creators/?city=${encodeURIComponent(name)}`} onClick={inApp(() => onBrowse({ city: name }))} className="flex items-baseline justify-between gap-3 py-3.5 pr-4 text-ink hover:text-bronze">
                    {name} <span className="text-[0.875rem] text-ink-3 tabular-nums">{n}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ for brands */

export function ForBrandsTab({ onNavigate, onBrandEnquiry, onBrowse }: { onNavigate: (tab: TabId) => void; onBrandEnquiry: () => void; onBrowse: Browse }) {
  const [q, setQ] = useState("");
  return (
    <div>
      <PageHead tab="forbrands" eyebrow="For brands">
        <button type="button" onClick={onBrandEnquiry} className="btn btn-primary h-12 px-6">Send a brand enquiry</button>
        <TabLink tab="campaigns" onNavigate={onNavigate} className="btn btn-secondary h-12">Open campaigns</TabLink>
      </PageHead>

      <Split id="brands-search" title="Search yourself" sub={<p>Every profile in the directory was reviewed by our team before it went live.</p>}>
        <form
          role="search"
          aria-label="Search creator profiles"
          onSubmit={(e) => {
            e.preventDefault();
            onBrowse({ q: q.trim() });
          }}
          className="flex items-stretch bg-surface border border-line-strong rounded-[4px] p-1.5 focus-within:border-ink max-w-2xl"
        >
          <label htmlFor="brands-q" className="sr-only">Search creators by name, niche or city</label>
          <Search className="w-5 h-5 text-ink-3 self-center ml-2.5 shrink-0" aria-hidden="true" />
          <input id="brands-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, niche or city" className="flex-1 min-w-0 bg-transparent px-3 text-[1rem] text-ink outline-none" />
          <button type="submit" className="btn btn-primary h-11 px-6">Search</button>
        </form>
        <p className="mt-4 text-[0.9375rem] text-ink-2">
          Or <TabLink tab="categories" onNavigate={onNavigate} className="link">browse by category</TabLink>, or open the{" "}
          <TabLink tab="catwalk" onNavigate={onNavigate} className="link">3D gallery</TabLink>.
        </p>
      </Split>

      <div className="border-t border-line">
        <Split id="brands-how" title="Or send us a brief" sub={<p>Ask about one creator from their profile, or let us suggest several.</p>}>
          <Steps steps={BRAND_STEPS} />
          <button type="button" onClick={onBrandEnquiry} className="btn btn-primary mt-8">Send a brand enquiry</button>
        </Split>
      </div>

      <div className="bg-sunken border-y border-line">
        <Split id="brands-reviewed" title="What “Reviewed” means" sub={<p>A profile marked Reviewed was approved by our team. It is not an audit of the audience.</p>}>
          <dl className="border-t border-ink">
            {[
              ["Supplied by the creator", "Name, niche, city, bio, photos, follower count and engagement rate."],
              ["Checked by our team", "That the application is complete and that the creator’s public social profiles exist."],
              ["Not independently verified", "Audience figures. Confirm current numbers with the creator before agreeing a deal."]
            ].map(([t, d]) => (
              <div key={t} className="grid sm:grid-cols-[14rem_minmax(0,1fr)] gap-1 sm:gap-4 py-5 border-b border-line">
                <dt className="font-semibold text-ink">{t}</dt>
                <dd className="text-ink-2">{d}</dd>
              </div>
            ))}
          </dl>
        </Split>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- for creators */

export function ForCreatorsTab({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  return (
    <div>
      <PageHead tab="forcreators" eyebrow="For creators">
        <TabLink tab="apply" onNavigate={onNavigate} className="btn btn-primary h-12 px-6">{APPLY_LABEL} <ArrowRight className="w-4 h-4" aria-hidden="true" /></TabLink>
        <TabLink tab="awards" onNavigate={onNavigate} className="btn btn-secondary h-12">About the award</TabLink>
      </PageHead>

      <Split id="creators-how" title="How joining works" sub={<p>After the awards, the platform opens to every creator.</p>}>
        <Steps steps={CREATOR_STEPS} />
      </Split>

      <div className="bg-sunken border-y border-line">
        <Split id="creators-profile" title="Your public profile" sub={<p>What brands see when they open your profile.</p>}>
          <ul className="border-t border-ink">
            {[
              ["Shown", "Name, photos, niche, city, bio, audience figures and your motto, as you entered them."],
              ["Never shown", "Your email address and phone number. Brands contact you through our team."],
              ["Changes", `Ask us to correct or remove your profile at any time: ${ORGANISER.email}.`]
            ].map(([t, d]) => (
              <li key={t} className="grid sm:grid-cols-[10rem_minmax(0,1fr)] gap-1 sm:gap-4 py-5 border-b border-line">
                <span className="font-semibold text-ink">{t}</span>
                <span className="text-ink-2">{d}</span>
              </li>
            ))}
          </ul>
        </Split>
      </div>

      <Split id="creators-more" title="Also for creators">
        <ul className="grid sm:grid-cols-3 gap-6">
          {(
            [
              ["membership", "Membership plans", "Optional paid plans for branding and marketing support."],
              ["starindia", "Star India members", "The creator membership: profile, branding help and brand introductions."],
              ["greenlight", "Guides and magazine", "How to apply, build a media kit and work with brands."]
            ] as [TabId, string, string][]
          ).map(([tab, t, d]) => (
            <li key={tab} className="border-t border-ink pt-4">
              <TabLink tab={tab} onNavigate={onNavigate} className="group block">
                <span className="flex items-center justify-between font-semibold text-ink group-hover:text-bronze">{t} <ArrowRight className="w-4 h-4" aria-hidden="true" /></span>
                <span className="mt-1 block text-[0.9375rem] text-ink-2">{d}</span>
              </TabLink>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-[0.875rem] text-ink-3 border-l-2 border-line-strong pl-3 max-w-2xl">{ANTI_FRAUD_NOTE}</p>
      </Split>
    </div>
  );
}

