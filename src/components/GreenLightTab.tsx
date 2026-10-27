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
  const [bookingPackage, setBookingPackage] = useState<string>(PACKAGE_TITLES[0]);

  const book = (title: string) => {
    setBookingPackage(title);
    document.getElementById("magazine-booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => document.getElementById("booking-name")?.focus({ preventScroll: true }));
  };

  return (
    <div className="page pt-10 md:pt-14 pb-16">
      <header className="max-w-3xl space-y-3">
        <p className="eyebrow">Green Light</p>
        <h1 className="h-page">{route.heading}</h1>
        <p className="lede">{route.intro}</p>
      </header>

      <section aria-labelledby="blog" className="mt-12">
        <h2 id="blog" className="h-section pb-4 border-b border-line">Guides</h2>
        <ul className="divide-y divide-line border-b border-line">
          {BLOG_POSTS.map((post) => (
            <li key={post.id}>
              <details className="group">
                <summary className="grid gap-1 md:grid-cols-[10rem_minmax(0,1fr)_auto] md:gap-8 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="text-[0.8125rem] text-ink-3">
                    {post.category} · {post.readMinutes} min read
                  </span>
                  <span>
                    <h3 className="font-display text-[1.3125rem] leading-snug text-ink group-hover:underline underline-offset-4 decoration-1">{post.title}</h3>
                    <span className="block text-ink-2 mt-1">{post.excerpt}</span>
                  </span>
                  <span className="text-[0.875rem] font-semibold text-ink self-start md:pt-1">
                    <span className="group-open:hidden">Read</span>
                    <span className="hidden group-open:inline">Close</span>
                  </span>
                </summary>
                <div className="md:pl-[12rem] pb-6 max-w-3xl space-y-3 text-ink-2 leading-relaxed">
                  {post.body.map((para, i) => (
                    <p key={i}>{para}</p>
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
