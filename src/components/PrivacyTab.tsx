import React from "react";
import { routeForTab, TabId } from "../seo";
import { BRAND_NAME } from "../content/brand";
import { ORGANISER } from "../content/organiser";
import TabLink from "./TabLink";

// Plain-language notice describing what the site's forms and pages actually do.
// Keep it in step with the code: ModelRegistrationTab (application), EnquiryForm / VipCollaborationForm
// (enquiries), server approve step (what becomes public), index.html (Google Analytics).
const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "What we collect",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong className="font-semibold text-ink">Award application:</strong> name, category, title, city, bio, follower and engagement figures, motto, photos, email and mobile number.</li>
        <li><strong className="font-semibold text-ink">Brand enquiries, campaign and membership requests, bookings and contact messages:</strong> name, email, phone (where asked), company and your message.</li>
        <li><strong className="font-semibold text-ink">Visits:</strong> Google Analytics measures page visits with cookies. Your IP address is used briefly to limit repeated form submissions.</li>
      </ul>
    )
  },
  {
    title: "What is made public",
    body: (
      <p>
        Only if our team approves an application: name, photo, category, city, bio, audience figures and motto appear on a public profile.
        Email addresses and phone numbers are never published. Enquiries and messages are never published.
      </p>
    )
  },
  {
    title: "How we use it",
    body: (
      <p>
        To review applications, publish approved profiles, reply to enquiries, pass a brand enquiry to the creator it is about,
        and contact you by email, phone or WhatsApp about something you sent us. We do not sell your information.
      </p>
    )
  },
  {
    title: "Stored in your browser",
    body: (
      <p>
        An unfinished application and photos you save while browsing are kept in your browser for the current tab only, and are cleared when you close it.
      </p>
    )
  },
  {
    title: "Correcting or removing your information",
    body: (
      <p>
        Write to us at <a href={`mailto:${ORGANISER.email}`} className="link">{ORGANISER.email}</a> or call{" "}
        <a href={ORGANISER.phoneHref} className="link">{ORGANISER.phoneDisplay}</a>. Please write from the email address you applied with,
        so we can confirm the profile is yours. We will correct or remove it.
      </p>
    )
  }
];

export default function PrivacyTab({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const route = routeForTab("privacy");
  return (
    <div className="page pt-10 md:pt-14 pb-16">
      <header className="max-w-3xl space-y-3">
        <p className="eyebrow">Privacy</p>
        <h1 className="h-page">{route.heading}</h1>
        <p className="lede">
          {BRAND_NAME} is run by {ORGANISER.name}, {ORGANISER.location}. This page explains, in plain words, what happens to the information you give us.
        </p>
      </header>
      <div className="mt-10 max-w-3xl divide-y divide-line border-y border-line">
        {SECTIONS.map((s) => (
          <section key={s.title} className="py-6 grid gap-2 md:grid-cols-[14rem_1fr] md:gap-8">
            <h2 className="font-semibold text-ink">{s.title}</h2>
            <div className="text-ink-2 leading-relaxed">{s.body}</div>
          </section>
        ))}
      </div>
      <p className="mt-8 text-[0.9375rem] text-ink-2">
        Questions about this notice? <TabLink tab="contact" onNavigate={onNavigate} className="link">Contact us</TabLink>
      </p>
    </div>
  );
}
