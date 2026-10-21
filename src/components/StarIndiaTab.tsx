import React, { useMemo, useState } from "react";
import { Award, BadgeCheck, Handshake, Megaphone, UserRound, IdCard, Trophy } from "lucide-react";
import type { Creator } from "../data";
import { routeForTab, TabId } from "../seo";
import { influencerId, parseReach } from "../content/awards";
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

const Photo: React.FC<{ creator: Creator; size?: string }> = ({ creator, size = "w-24 h-24" }) => {
  const [failed, setFailed] = useState(false);
  return (
    <span className="relative inline-block">
      {creator.image && !failed ? (
        <img src={creator.image} alt="" loading="lazy" onError={() => setFailed(true)} className={`${size} rounded-full object-cover border-4 border-white ring-2 ring-[#F59E0B] shadow-lg`} />
      ) : (
        <span className={`${size} rounded-full bg-[#F3F3F1] border-4 border-white ring-2 ring-[#F59E0B] shadow-lg flex items-center justify-center`} aria-hidden="true">
          <UserRound className="w-1/3 h-1/3 text-[#8E8D8A]" />
        </span>
      )}
      {/* Gold award medal */}
      <span aria-hidden="true" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-b from-[#FDE68A] to-[#D97706] border-2 border-white shadow flex items-center justify-center">
        <Trophy className="w-4 h-4 text-[#3b2a0c]" />
      </span>
    </span>
  );
};

const Laurel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-[#D97706]/50 bg-[#FBF6EC] px-2.5 py-1 text-[12px] font-semibold text-[#3b2a0c]">
    <span aria-hidden="true">❦</span>
    {children}
    <span aria-hidden="true" className="inline-block -scale-x-100">❦</span>
  </span>
);

// Large Influencer ID card for the member with the biggest audience, as in the brand brief
function SpotlightCard({ creator, award, awards, onOpen }: { creator: Creator; award: string; awards: string[]; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`View ${creator.name}`}
      className="group w-full max-w-sm mx-auto text-left bg-white text-[#111] rounded-3xl shadow-2xl overflow-hidden cursor-pointer transition-transform duration-500 hover:-translate-y-1 md:rotate-[2deg] md:hover:rotate-0"
    >
      <span className="relative block h-24 bg-gradient-to-br from-[#1f5a3d] via-[#121824] to-[#0d111a]" aria-hidden="true">
        <span className="absolute top-3 left-4 text-[#F59E0B] text-xs fsia-twinkle">✦</span>
        <span className="absolute top-6 right-6 text-[#F59E0B] text-sm fsia-twinkle" style={{ animationDelay: "1s" }}>✦</span>
      </span>
      <span className="flex flex-col items-center text-center px-6 pb-6 -mt-14 gap-2">
        <Photo creator={creator} size="w-28 h-28" />
        <span className="mt-2 inline-flex items-center gap-1 font-serif-display text-xl font-bold">
          {creator.name}
          {creator.stats?.verified && <BadgeCheck className="w-5 h-5 text-[#1f5a3d]" aria-hidden="true" />}
        </span>
        <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#47453f]">Influencer ID</span>
        <span className="font-mono text-sm bg-[#F3F3F1] px-2 py-0.5 rounded">{influencerId(creator.name)}</span>
        <span className="grid grid-cols-3 w-full border-y border-black/10 py-3 my-1">
          <span><b className="block text-lg">{creator.stats?.reach ? String(creator.stats.reach) : "—"}</b><span className="text-[12px] text-[#47453f]">Followers</span></span>
          <span><b className="block text-lg">{creator.stats?.engagement ? String(creator.stats.engagement) : "—"}</b><span className="text-[12px] text-[#47453f]">Engagement</span></span>
          <span><b className="block text-lg">{awards.length}</b><span className="text-[12px] text-[#47453f]">{awards.length === 1 ? "Award" : "Awards"}</span></span>
        </span>
        <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#47453f]">Awards won</span>
        <span className="flex flex-wrap justify-center gap-2">
          {(awards.length ? awards : [award]).map((a) => (
            <Laurel key={a}>{a}</Laurel>
          ))}
        </span>
      </span>
    </button>
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
  const awardsOf = (name: string) => members.filter((m) => m.creator.name === name).map((m) => m.award);
  const spotlight = members.reduce<(typeof members)[number] | undefined>(
    (best, m) => (!best || parseReach(m.creator.stats?.reach) > parseReach(best.creator.stats?.reach) ? m : best),
    undefined
  );

  return (
    <div className="w-full max-w-6xl mx-auto py-6 md:py-12 space-y-12">
      <div className="surface-dark relative overflow-hidden bg-gradient-to-br from-[#1f5a3d] via-[#143d2a] to-[#0d111a] text-white rounded-3xl p-6 md:p-10 grid md:grid-cols-[1.3fr_1fr] gap-10 items-center">
        <span aria-hidden="true" className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(243,220,166,0.25),transparent_70%)]" />
        <div className="relative space-y-4">
          <span className="font-sans text-xs tracking-[0.3em] uppercase font-bold block text-champagne">Membership &amp; Profiles</span>
          <h1 className="font-serif-display text-3xl md:text-5xl font-bold tracking-tight text-white">{route.heading}</h1>
          <p className="font-serif-text text-lg md:text-xl text-[#e9e6df] leading-relaxed">{route.intro}</p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <TabLink tab="membership" onNavigate={onNavigate} className="inline-flex justify-center items-center gap-2 bg-[#F59E0B] hover:bg-[#F59E0B] text-[#111] font-semibold text-sm px-5 py-3 rounded-xl">
              Become a member
            </TabLink>
            <TabLink tab="apply" onNavigate={onNavigate} className="inline-flex justify-center items-center gap-2 border border-white/60 hover:bg-white/10 text-white font-semibold text-sm px-5 py-3 rounded-xl">
              Apply for an award
            </TabLink>
          </div>
        </div>
        {spotlight && (
          <SpotlightCard
            creator={spotlight.creator}
            award={spotlight.award}
            awards={awardsOf(spotlight.creator.name)}
            onOpen={() => onSelectCreator(spotlight.creator)}
          />
        )}
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {BENEFITS.map((b) => (
          <li key={b.title} className="bg-white border border-black/10 rounded-2xl p-5 space-y-2 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <span className="w-10 h-10 rounded-full bg-[#F6EFE3] flex items-center justify-center" aria-hidden="true">
              <b.icon className="w-5 h-5 text-[#1f5a3d]" />
            </span>
            <p className="font-semibold text-[#111] text-[15px]">{b.title}</p>
            <p className="text-[14px] text-[#2e2c29] leading-relaxed">{b.text}</p>
          </li>
        ))}
      </ul>

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
                  className="group w-full h-full text-left bg-white border border-black/10 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                >
                  <span className="block h-16 bg-gradient-to-r from-[#1f5a3d] via-[#121824] to-[#1a2233]" aria-hidden="true" />
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
                    <Laurel>{award}</Laurel>
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
