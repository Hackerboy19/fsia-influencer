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
}

// Compact directory card: photo, name, one line of what they do, city.
// A real link (shareable, opens in a new tab with Cmd/Ctrl-click); a normal click opens the profile in place.
export default function ProfileCard({ profile, onOpen, headingLevel = "h3", eager }: ProfileCardProps) {
  const Name = headingLevel;
  const line = profile.role || profile.category;
  return (
    <article className="group relative">
      <Photo src={profile.image} name={profile.name} eager={eager} sizes="(min-width: 1024px) 280px, 50vw" className="rounded-[2px]" />
      <div className="pt-3 space-y-0.5">
        <Name className="text-[1.0625rem] font-semibold leading-snug text-ink">
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
        {line && <p className="text-[0.875rem] leading-snug text-ink-2 line-clamp-2">{line}</p>}
        {profile.city && <p className="text-[0.8125rem] text-ink-3">{profile.city}</p>}
      </div>
    </article>
  );
}
