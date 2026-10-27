import React from "react";
import type { ProfileView } from "../lib/profile";
import { profileHref } from "../lib/profileLink";
import Photo from "./Photo";

interface ProfileCardProps {
  profile: ProfileView;
  onOpen: (profile: ProfileView) => void;
  /** Heading level for the name, so the card fits the page outline */
  headingLevel?: "h2" | "h3";
  eager?: boolean;
  /** "feature" is the large lead card in an editorial grid */
  size?: "default" | "feature";
  /** Marks built-in sample profiles, so they are never mistaken for real ones */
  sample?: boolean;
  sizes?: string;
}

// Directory card: photo, name, one line of what they do, city and niche.
// A real link (shareable, opens in a new tab with Cmd/Ctrl-click); a normal click opens the profile in place.
export default function ProfileCard({ profile, onOpen, headingLevel = "h3", eager, size = "default", sample, sizes }: ProfileCardProps) {
  const Name = headingLevel;
  const line = profile.role || profile.category;
  const feature = size === "feature";
  const meta = [profile.city, profile.role ? profile.category : ""].filter(Boolean);
  return (
    <article className="group relative h-full flex flex-col">
      <div className={`relative overflow-hidden ${feature ? "lg:flex-1 lg:min-h-[30rem]" : ""}`}>
        <Photo
          src={profile.image}
          name={profile.name}
          eager={eager}
          ratio={feature ? "aspect-[4/5] lg:aspect-auto" : "aspect-[4/5]"}
          sizes={sizes || (feature ? "(min-width: 1024px) 560px, 100vw" : "(min-width: 1024px) 280px, 50vw")}
          className={`rounded-[2px] ${feature ? "lg:absolute lg:inset-0" : ""}`}
        />
        {sample && <span className="tag absolute top-2.5 left-2.5">Sample</span>}
      </div>
      <div className={feature ? "pt-4 space-y-1" : "pt-3 space-y-0.5"}>
        <Name className={feature ? "font-display text-[1.75rem] leading-tight text-ink" : "text-[1.0625rem] font-semibold leading-snug text-ink"}>
          <a
            href={profileHref(profile.slug)}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              onOpen(profile);
            }}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-bronze group-hover:underline underline-offset-4 decoration-1"
          >
            {profile.name}
          </a>
        </Name>
        {line && <p className={`${feature ? "text-[1rem]" : "text-[0.875rem]"} leading-snug text-ink-2 line-clamp-2`}>{line}</p>}
        {meta.length > 0 && <p className="text-[0.8125rem] text-ink-3">{meta.join(" · ")}</p>}
      </div>
    </article>
  );
}
