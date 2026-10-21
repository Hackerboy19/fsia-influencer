import React, { useState } from "react";
import { BookOpen, ChevronDown, Clock, Newspaper } from "lucide-react";
import type { Creator } from "../data";
import { routeForTab } from "../seo";
import { BLOG_POSTS, MAGAZINE_PACKAGES } from "../content/awards";
import EnquiryForm from "./EnquiryForm";

const PACKAGE_TITLES = MAGAZINE_PACKAGES.map((p) => p.title);

function MagazineCover({ creator }: { creator?: Creator }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="surface-dark relative w-full max-w-xs mx-auto aspect-[3/4] rounded-xl overflow-hidden shadow-2xl bg-gradient-to-b from-[#123524] to-[#0b1f15] text-white">
      {creator?.image && !failed && (
        <img src={creator.image} alt="" onError={() => setFailed(true)} className="absolute inset-0 w-full h-full object-cover opacity-80" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" aria-hidden="true" />
      <div className="relative h-full flex flex-col p-5">
        <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#e9e6df]">FSIA Magazine · Creators &amp; Strategy</p>
        <p className="font-serif-display text-5xl font-bold tracking-tight text-champagne leading-none mt-1">EXPLORE</p>
        <p className="text-[11px] tracking-[0.4em] uppercase text-white">Magazine</p>
        <div className="mt-auto space-y-1">
          <p className="font-serif-display text-lg font-bold text-white">Influencer Success Stories</p>
          {creator && <p className="text-sm text-[#e9e6df]">Cover: {creator.name}</p>}
        </div>
      </div>
      <figcaption className="sr-only">Explore Magazine cover preview{creator ? ` featuring ${creator.name}` : ""}</figcaption>
    </figure>
  );
}

export default function GreenLightTab({ coverCreator }: { coverCreator?: Creator }) {
  const route = routeForTab("greenlight");
  const [openPost, setOpenPost] = useState<string | null>(null);
  const [bookingPackage, setBookingPackage] = useState<string>(PACKAGE_TITLES[0]);

  const book = (title: string) => {
    setBookingPackage(title);
    document.getElementById("magazine-booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => document.getElementById("booking-name")?.focus({ preventScroll: true }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 md:py-12 space-y-14">
      <div className="space-y-2 max-w-3xl">
        <span className="font-sans text-xs tracking-[0.3em] text-[#8E8D8A] uppercase font-bold block">Green Light</span>
        <h1 className="font-serif-display text-3xl md:text-5xl font-bold tracking-tight text-[#111]">{route.heading}</h1>
        <p className="font-serif-text text-[#2e2c29] text-lg leading-relaxed">{route.intro}</p>
      </div>

      {/* Explore Magazine: cover preview and packages */}
      <section aria-labelledby="magazine" className="grid md:grid-cols-[1fr_1.3fr] gap-8 items-center bg-[#F6EFE3] border border-[#E1C699]/50 rounded-3xl p-6 md:p-10">
        <MagazineCover creator={coverCreator} />
        <div className="space-y-5">
          <div>
            <h2 id="magazine" className="font-serif-display text-2xl md:text-3xl font-bold text-[#111]">Explore Magazine</h2>
            <p className="text-[15px] text-[#2e2c29] mt-1">
              Influencer success stories, award winners and brand strategy. Book a feature for yourself or your brand.
            </p>
          </div>
          <ul className="space-y-3">
            {MAGAZINE_PACKAGES.map((p) => (
              <li key={p.id} className="bg-white border border-black/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                  <p className="font-semibold text-[#111]">{p.title}</p>
                  <p className="text-sm text-[#2e2c29]">{p.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => book(p.title)}
                  className="shrink-0 bg-[#111] hover:bg-[#222] text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
                  aria-label={`Book ${p.title}`}
                >
                  Book now
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Blog */}
      <section aria-labelledby="blog" className="space-y-5">
        <h2 id="blog" className="font-serif-display text-2xl md:text-3xl font-bold text-[#111] inline-flex items-center gap-2">
          <Newspaper className="w-6 h-6" aria-hidden="true" /> Green Light blog
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BLOG_POSTS.map((post) => {
            const isOpen = openPost === post.id;
            return (
              <li key={post.id} className="bg-white border border-black/10 rounded-2xl overflow-hidden">
                <article>
                  <h3 className="m-0">
                    <button
                      type="button"
                      onClick={() => setOpenPost(isOpen ? null : post.id)}
                      aria-expanded={isOpen}
                      aria-controls={`post-${post.id}`}
                      className="w-full text-left p-5 cursor-pointer hover:bg-[#FAF9F6] flex items-start justify-between gap-4"
                    >
                      <span className="space-y-1.5">
                        <span className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-wider text-[#2e2c29]">
                          <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" aria-hidden="true" /> {post.category}</span>
                          <span className="inline-flex items-center gap-1 font-medium normal-case tracking-normal"><Clock className="w-3.5 h-3.5" aria-hidden="true" /> {post.readMinutes} min read</span>
                        </span>
                        <span className="block font-serif-display text-lg font-bold text-[#111]">{post.title}</span>
                        <span className="block text-sm text-[#2e2c29]">{post.excerpt}</span>
                      </span>
                      <ChevronDown className={`w-5 h-5 shrink-0 mt-1 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                  </h3>
                  <div id={`post-${post.id}`} hidden={!isOpen} className="px-5 pb-5 space-y-3 text-[15px] leading-relaxed text-[#2e2c29]">
                    {post.body.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Booking */}
      <section id="magazine-booking" aria-labelledby="booking-heading" className="space-y-5 max-w-3xl scroll-mt-6">
        <div>
          <h2 id="booking-heading" className="font-serif-display text-2xl md:text-3xl font-bold text-[#111]">Book a magazine feature</h2>
          <p className="text-[15px] text-[#2e2c29] mt-1">Tell us what you'd like to book. The Green Light team replies with dates and rates.</p>
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
