import React, { useState } from "react";
import type { Creator } from "../data";
import { routeForTab } from "../seo";
import { BLOG_POSTS, MAGAZINE_PACKAGES } from "../content/awards";
import EnquiryForm from "./EnquiryForm";

const PACKAGE_TITLES = MAGAZINE_PACKAGES.map((p) => p.title);

// Guides (expandable, all text in the page) and Explore Magazine bookings.
// coverCreator is accepted for compatibility but no longer used: a mock magazine cover
// with a real creator's photo implied a feature that may not exist.
export default function GreenLightTab(_props: { coverCreator?: Creator }) {
  const route = routeForTab("greenlight");
  const [lead, ...rest] = BLOG_POSTS;
  const [bookingPackage, setBookingPackage] = useState<string>(PACKAGE_TITLES[0]);

  const book = (title: string) => {
    setBookingPackage(title);
    document.getElementById("magazine-booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => document.getElementById("booking-name")?.focus({ preventScroll: true }));
  };

  return (
    <div className="page pt-10 md:pt-14 pb-16">
      <header className="max-w-3xl space-y-3">
        <p className="eyebrow">Magazine</p>
        <h1 className="h-page">{route.heading}</h1>
        <p className="lede">{route.intro}</p>
      </header>

      {/* Featured guide, shown in full; the others open in place */}
      {lead && (
        <article id={`guide-${lead.id}`} aria-labelledby="featured-guide" className="mt-10 grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-stretch scroll-mt-6">
          <div className="surface-dark relative flex flex-col justify-between bg-[linear-gradient(160deg,#2A241C,#14120F)] text-white p-6 sm:p-8 rounded-[4px] min-h-[20rem]">
            <p className="font-display leading-[0.9] text-[#E1C699]" aria-hidden="true">
              <span className="block text-[0.8125rem] tracking-[0.3em] uppercase text-[#CFCAC0] font-sans font-semibold">Green Light</span>
              <span className="block text-[3.5rem] sm:text-[4.5rem] italic mt-2">Guides</span>
            </p>
            <p className="text-[0.8125rem] uppercase tracking-[0.12em] text-[#CFCAC0]">Featured · {lead.category} · {lead.readMinutes} min read</p>
          </div>
          <div className="flex flex-col justify-center">
            <p className="eyebrow">Featured guide</p>
            <h2 id="featured-guide" className="h-section mt-2">{lead.title}</h2>
            <p className="lede mt-3">{lead.excerpt}</p>
            <div className="mt-5 space-y-3 text-ink-2 leading-relaxed border-t border-line pt-5">
              {lead.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </article>
      )}

      <section aria-labelledby="blog-heading" className="mt-16 scroll-mt-6" id="blog">
        <div className="flex items-end justify-between gap-4 pb-4 border-b-2 border-ink">
          <h2 id="blog-heading" className="h-section">More guides</h2>
          <p className="text-[0.875rem] text-ink-3">{rest.length} guides · select one to read it here</p>
        </div>
        <ul className="grid md:grid-cols-2 gap-x-10">
          {rest.map((post, i) => (
            <li key={post.id} className="border-b border-line">
              <details id={`guide-${post.id}`} className="group scroll-mt-6">
                <summary className="py-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="text-[0.8125rem] text-bronze font-semibold uppercase tracking-[0.06em]">
                    {post.category} <span className="text-ink-3 font-normal normal-case tracking-normal">· {post.readMinutes} min read</span>
                  </span>
                  <h3 className={`font-display leading-snug text-ink group-hover:underline underline-offset-4 decoration-1 mt-1.5 text-[1.5rem]`}>{post.title}</h3>
                  <span className="block text-ink-2 mt-1.5 max-w-2xl">{post.excerpt}</span>
                  <span className="mt-3 inline-block text-[0.875rem] font-semibold text-ink">
                    <span className="group-open:hidden">Read guide</span>
                    <span className="hidden group-open:inline">Close</span>
                  </span>
                </summary>
                <div className="pb-6 max-w-3xl space-y-3 text-ink-2 leading-relaxed">
                  {post.body.map((para, j) => (
                    <p key={j}>{para}</p>
                  ))}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="magazine" className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-3">
          <h2 id="magazine" className="h-section">Explore Magazine</h2>
          <p className="text-ink-2">Book a cover story, an inside feature or a digital spotlight for yourself or your brand. We reply with dates and rates.</p>
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {MAGAZINE_PACKAGES.map((p) => (
            <li key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{p.title}</p>
                <p className="text-[0.9375rem] text-ink-2">{p.text}</p>
              </div>
              <button type="button" onClick={() => book(p.title)} className="btn btn-sm btn-secondary shrink-0" aria-label={`Book ${p.title}`}>
                Book
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section id="magazine-booking" aria-labelledby="booking-heading" className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] scroll-mt-6">
        <div className="space-y-3">
          <h2 id="booking-heading" className="h-section">Booking request</h2>
          <p className="text-ink-2">Tell us which package you are interested in and a little about you or your brand.</p>
        </div>
        <EnquiryForm
          type="booking"
          idPrefix="booking"
          subjectLabel="Package"
          subjectOptions={PACKAGE_TITLES}
          initialSubject={bookingPackage}
          phone="required"
          messageLabel="About you or your brand"
          submitLabel="Send booking request"
          successText="Your booking request has reached the Green Light team. We'll email you with dates and rates."
        />
      </section>
    </div>
  );
}
