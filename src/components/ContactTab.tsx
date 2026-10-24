import React from "react";
import { Award, BookOpen, Briefcase, HelpCircle, MessageSquare, Star } from "lucide-react";
import { routeForTab, TabId } from "../seo";
import { CONTACT_TOPICS } from "../content/awards";
import EnquiryForm from "./EnquiryForm";
import TabLink from "./TabLink";

const HELP = [
  { icon: Award, title: "Awards & applications", text: "Categories, eligibility and your application status." },
  { icon: Star, title: "Star India membership", text: "Your Influencer ID profile and member support." },
  { icon: BookOpen, title: "Magazine booking", text: "Cover stories, features and digital spotlights." },
  { icon: Briefcase, title: "Brand deals", text: "Hiring awarded influencers for a campaign." }
];

// Form-only contact page: no street address, phone numbers or map, as set out in the
// redesign brief. Messages land in Admin → Enquiries.
export default function ContactTab({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const route = routeForTab("contact");
  return (
    <div className="w-full max-w-6xl mx-auto py-6 md:py-12 space-y-8">
      <div className="space-y-2 max-w-3xl">
        <span className="font-sans text-xs tracking-[0.3em] text-[#8E8D8A] uppercase font-bold block">Support</span>
        <h1 className="font-serif-display text-3xl md:text-5xl font-bold tracking-tight text-[#111]">{route.heading}</h1>
        <p className="font-serif-text text-[#2e2c29] text-lg leading-relaxed">{route.intro}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6 items-start">
        <aside aria-label="How we can help" className="surface-dark bg-gradient-to-br from-[#16233f] to-[#0b1426] text-white rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-[#E1C699] flex items-center justify-center" aria-hidden="true">
              <MessageSquare className="w-5 h-5 text-[#111]" />
            </span>
            <div>
              <p className="font-serif-display text-xl font-bold text-white">Email support</p>
              <p className="text-[14px] text-[#e9e6df]">Send the form and we'll reply to your email.</p>
            </div>
          </div>
          <ul className="space-y-4">
            {HELP.map((h) => (
              <li key={h.title} className="flex gap-3">
                <h.icon className="w-5 h-5 text-champagne shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <span className="block font-semibold text-white text-[15px]">{h.title}</span>
                  <span className="block text-[14px] text-[#e9e6df]">{h.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <TabLink
            tab="faq"
            onNavigate={onNavigate}
            className="inline-flex items-center gap-2 text-sm font-semibold text-champagne underline underline-offset-4 hover:no-underline"
          >
            <HelpCircle className="w-4 h-4" aria-hidden="true" /> Read the FAQs first
          </TabLink>
        </aside>
        <EnquiryForm
          type="contact"
          idPrefix="contact"
          subjectLabel="Subject"
          subjectOptions={CONTACT_TOPICS}
          phone="hidden"
          messageLabel="Message"
          submitLabel="Send message"
          successText="Your message has reached the FSIA support team. We'll reply to your email soon."
        />
      </div>
    </div>
  );
}
