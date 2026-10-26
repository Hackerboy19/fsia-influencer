import React from "react";
import { routeForTab, TabId } from "../seo";
import { CONTACT_TOPICS } from "../content/awards";
import EnquiryForm from "./EnquiryForm";
import TabLink from "./TabLink";

const HELP: { topic: string; text: string }[] = [
  { topic: "Awards & applications", text: "Eligibility, how to apply and where your application stands." },
  { topic: "Star India membership", text: "Your profile and member support." },
  { topic: "Magazine booking", text: "Explore Magazine covers, features and digital spotlights." },
  { topic: "Brand deals", text: "Hiring creators for a campaign." },
  { topic: "Profile correction or removal", text: "Something on a profile is wrong, out of date, or should be taken down." }
];

// Form-only contact page: messages land in Admin → Enquiries and are answered by email.
// initialTopic may be "Topic|Profile name" when a visitor reports a problem from a profile.
export default function ContactTab({ onNavigate, initialTopic = "" }: { key?: React.Key; onNavigate: (tab: TabId) => void; initialTopic?: string }) {
  const route = routeForTab("contact");
  const [topic, profileName] = initialTopic.split("|");
  const message = profileName ? `Profile: ${profileName}\n\nWhat should change:\n` : "";

  return (
    <div className="page pt-10 md:pt-14 pb-16">
      <header className="max-w-3xl space-y-3">
        <p className="eyebrow">Contact</p>
        <h1 className="h-page">{route.heading}</h1>
        <p className="lede">{route.intro}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start">
        <aside aria-labelledby="contact-help" className="space-y-5">
          <h2 id="contact-help" className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-3">What you can write to us about</h2>
          <dl className="divide-y divide-line border-y border-line">
            {HELP.map((h) => (
              <div key={h.topic} className="py-3.5">
                <dt className="font-semibold text-ink">{h.topic}</dt>
                <dd className="text-[0.9375rem] text-ink-2">{h.text}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[0.9375rem] text-ink-2">
            For corrections, please write from the email address you applied with so we can confirm the profile is yours.
          </p>
          <TabLink tab="faq" onNavigate={onNavigate} className="link inline-block">Read the FAQ first</TabLink>
        </aside>

        <EnquiryForm
          type="contact"
          idPrefix="contact"
          subjectLabel="Subject"
          subjectOptions={CONTACT_TOPICS}
          initialSubject={topic || undefined}
          initialMessage={message}
          phone="hidden"
          messageLabel="Message"
          submitLabel="Send message"
          successText="Your message has reached our team. We'll reply to your email."
        />
      </div>
    </div>
  );
}
