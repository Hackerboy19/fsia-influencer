import React, { useMemo, useState } from "react";
import { Award, BadgeCheck, Handshake, Megaphone, UserRound, IdCard } from "lucide-react";
import type { Creator } from "../data";
import { routeForTab, TabId } from "../seo";
import { influencerId } from "../content/awards";
import TabLink from "./TabLink";

interface Section {
  id: string;
  title: string;
  creators: Creator[];
}

const BENEFITS = [
  { icon: IdCard, title: "Influencer ID profile", text: "A dedicated profile page with your awards, audience and work." },
  { icon: Megaphone, title: "Branding & marketing", text: "Endorsement representation and digital marketing support." },
  { icon: Handshake, title: "Brand introductions", text: "Direct introductions when a brand brief fits your category." },
  { icon: Award, title: "Awards on record", text: "Your FSIA awards shown on your profile for brands to see." }
];

function Photo({ creator }: { creator: Creator }) {
  const [failed, setFailed] = useState(false);
  return creator.image && !failed ? (
    <img src={creator.image} alt="" loading="lazy" onError={() => setFailed(true)} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow" />
  ) : (
    <div className="w-24 h-24 rounded-full bg-[#F3F3F1] border-4 border-white shadow flex items-center justify-center" aria-hidden="true">
      <UserRound className="w-9 h-9 text-[#8E8D8A]" />
    </div>
  );
}

export default function StarIndiaTab({
  sections,
  onNavigate,
  onSelectCreator
}: {
  sections: Section[];
  onNavigate: (tab: TabId) => void;
  onSelectCreator: (creator: Creator) => void;
}) {
  const route = routeForTab("starindia");
  const [filter, setFilter] = useState("all");
  const members = useMemo(
    () =>
      sections.flatMap((s) =>
        (s.creators || []).filter((c) => c && c.name).map((c) => ({ creator: c, sectionId: s.id, award: s.title }))
      ),
    [sections]
  );
  const shown = filter === "all" ? members : members.filter((m) => m.sectionId === filter);

  return (
    <div className="w-full max-w-6xl mx-auto py-6 md:py-12 space-y-12">
      <div className="surface-dark bg-gradient-to-br from-[#1f5a3d] to-[#123524] text-white rounded-3xl p-6 md:p-10 grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
        <div className="space-y-4">
          <span className="font-sans text-xs tracking-[0.3em] uppercase font-bold block text-champagne">Membership &amp; Profiles</span>
          <h1 className="font-serif-display text-3xl md:text-5xl font-bold tracking-tight text-white">{route.heading}</h1>
          <p className="font-serif-text text-lg md:text-xl text-[#e9e6df] leading-relaxed">{route.intro}</p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <TabLink tab="membership" onNavigate={onNavigate} className="inline-flex justify-center items-center gap-2 bg-[#E1C699] hover:bg-[#d4b57f] text-[#111] font-semibold text-sm px-5 py-3 rounded-xl">
              Become a member
            </TabLink>
            <TabLink tab="apply" onNavigate={onNavigate} className="inline-flex justify-center items-center gap-2 border border-white/60 hover:bg-white/10 text-white font-semibold text-sm px-5 py-3 rounded-xl">
              Apply for an award
            </TabLink>
          </div>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BENEFITS.map((b) => (
            <li key={b.title} className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-1.5">
              <b.icon className="w-5 h-5 text-champagne" aria-hidden="true" />
              <p className="font-semibold text-white text-[15px]">{b.title}</p>
              <p className="text-[13px] text-[#e9e6df] leading-relaxed">{b.text}</p>
            </li>
          ))}
        </ul>
      </div>

      <section aria-labelledby="member-profiles" className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 id="member-profiles" className="font-serif-display text-2xl md:text-3xl font-bold text-[#111]">Influencer ID profiles</h2>
            <p className="text-[15px] text-[#2e2c29] mt-1">Awardees and verified members. Open a card to see the full profile.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none" role="group" aria-label="Filter by award category">
            {[{ id: "all", title: "All" }, ...sections].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilter(s.id)}
                aria-pressed={filter === s.id}
                className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold border cursor-pointer ${
                  filter === s.id ? "bg-[#111] border-[#111] text-white" : "bg-white border-black/15 text-[#2e2c29] hover:bg-[#F3F3F1]"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {shown.length ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {shown.map(({ creator, award }) => (
              <li key={`${creator.name}-${award}`}>
                <button
                  type="button"
                  onClick={() => onSelectCreator(creator)}
                  aria-label={`View ${creator.name}`}
                  className="w-full h-full text-left bg-white border border-black/10 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                >
                  <span className="block h-16 bg-gradient-to-r from-[#1f5a3d] to-[#1e2a4a]" aria-hidden="true" />
                  <span className="flex flex-col items-center text-center px-5 pb-5 -mt-12 gap-2 flex-1">
                    <Photo creator={creator} />
                    <span className="inline-flex items-center gap-1 font-serif-display text-lg font-bold text-[#111]">
                      {creator.name}
                      {creator.stats?.verified && <BadgeCheck className="w-4 h-4 text-[#1f5a3d]" aria-label="Verified" />}
                    </span>
                    <span className="font-mono text-[12px] text-[#2e2c29] bg-[#F3F3F1] px-2 py-0.5 rounded">Influencer ID {influencerId(creator.name)}</span>
                    <span className="text-[13px] text-[#47453f] line-clamp-2">{creator.role}</span>
                    <span className="grid grid-cols-2 w-full border-t border-black/10 pt-3 mt-auto">
                      <span>
                        <span className="block font-bold text-[#111]">{creator.stats?.reach || "—"}</span>
                        <span className="block text-[12px] text-[#47453f]">Reach</span>
                      </span>
                      <span>
                        <span className="block font-bold text-[#111]">{creator.stats?.engagement || "—"}</span>
                        <span className="block text-[12px] text-[#47453f]">Engagement</span>
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#111]">
                      <Award className="w-4 h-4" aria-hidden="true" /> {award}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-[#2e2c29]">No members in this category yet.</p>
        )}
      </section>
    </div>
  );
}
