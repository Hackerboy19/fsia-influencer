import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQS, FAQItem } from "../content/faqs";
import { routeForTab, TabId } from "../seo";
import TabLink from "./TabLink";

const TOPICS: { id: FAQItem["category"]; label: string }[] = [
  { id: "General", label: "Getting started" },
  { id: "Verification", label: "Profiles and review" },
  { id: "Financials", label: "Tax and payments" },
  { id: "Brands", label: "Working with brands" }
];

// Answers grouped by topic. Each question uses native <details>, so it works with the
// keyboard and screen readers without extra scripting and every answer is in the page source.
export default function FaqTab({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const route = routeForTab("faq");
  const [openAll, setOpenAll] = useState(false);

  return (
    <div className="page pt-10 md:pt-14 pb-16" id="faq-tab-container">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <header className="space-y-4 lg:sticky lg:top-8 self-start">
          <p className="eyebrow">Help</p>
          <h1 className="h-page">{route.heading}</h1>
          <p className="lede">{route.intro}</p>
          <nav aria-label="Topics" className="pt-2">
            <ul className="space-y-2">
              {TOPICS.map((t) => (
                <li key={t.id}>
                  <a href={`#faq-${t.id.toLowerCase()}`} className="link font-normal">{t.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <div className="space-y-12 min-w-0">
          <div className="flex justify-end">
            <button type="button" onClick={() => setOpenAll((v) => !v)} className="btn btn-sm btn-secondary">
              {openAll ? "Close all answers" : "Open all answers"}
            </button>
          </div>
          {TOPICS.map((t) => {
            const items = FAQS.filter((f) => f.category === t.id);
            if (!items.length) return null;
            return (
              <section key={t.id} id={`faq-${t.id.toLowerCase()}`} aria-labelledby={`faq-h-${t.id}`} className="scroll-mt-6">
                <h2 id={`faq-h-${t.id}`} className="font-display text-[1.5rem] text-ink pb-3 border-b border-line">{t.label}</h2>
                <div className="divide-y divide-line border-b border-line">
                  {items.map((f) => (
                    <details key={f.question} open={openAll || undefined} className="group">
                      <summary className="flex items-start justify-between gap-6 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <h3 className="font-semibold text-ink text-[1.0625rem] leading-snug">{f.question}</h3>
                        <ChevronDown className="w-5 h-5 mt-0.5 shrink-0 text-ink-3 transition-transform group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <p className="pb-5 pr-10 text-ink-2 leading-relaxed">{f.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}

          <aside className="bg-surface border border-line p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-ink">Didn't find your answer?</h2>
              <p className="text-ink-2 text-[0.9375rem]">Write to us and we'll reply by email.</p>
            </div>
            <TabLink tab="contact" onNavigate={onNavigate} className="btn btn-primary">Contact us</TabLink>
          </aside>
        </div>
      </div>
    </div>
  );
}
