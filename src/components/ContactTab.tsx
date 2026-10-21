import React from "react";
import { routeForTab } from "../seo";
import { CONTACT_TOPICS } from "../content/awards";
import EnquiryForm from "./EnquiryForm";

// Form-only contact page: no street address, phone numbers or map, as set out in the
// redesign brief. Messages land in Admin → Enquiries.
export default function ContactTab() {
  const route = routeForTab("contact");
  return (
    <div className="w-full max-w-3xl mx-auto px-1 py-6 md:py-12 space-y-8">
      <div className="space-y-2">
        <span className="font-sans text-xs tracking-[0.3em] text-[#8E8D8A] uppercase font-bold block">Support</span>
        <h1 className="font-serif-display text-3xl md:text-5xl font-bold tracking-tight text-[#111]">{route.heading}</h1>
        <p className="font-serif-text text-[#2e2c29] text-lg leading-relaxed">{route.intro}</p>
      </div>
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
  );
}
