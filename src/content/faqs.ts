// Shared by the FAQ page and the FAQPage structured data generated at build time
export interface FAQItem {
  question: string;
  answer: string;
  category: "General" | "Verification" | "Financials" | "Brands";
}

export const FAQS: FAQItem[] = [
  {
    question: "What is the FSIA Influencer Platform?",
    answer: "FSIA is India's leading elite networking platform bridging verified Brand Campaign victors, national awards laureates, social impact champions, and top-tier digital authorities with premier luxury brand houses. We run structured physical catwalks, editorial magazines, and secure collaboration escrow models.",
    category: "General"
  },
  {
    question: "How do I secure the FSIA Verified Star Badge on my profile?",
    answer: "The Star verification is reserved for creators who pass our comprehensive digital aesthetic audit. We evaluate alignment with high-fashion, clean brand guidelines, audience authenticity, and real-time engagement indexes. Members enrolled in our Silver, Gold, or Royal plans undergo fast-track verification.",
    category: "Verification"
  },
  {
    question: "How does the secure Escrow Payment protocol operate?",
    answer: "To shield creators from unpaid campaigns, brands must secure 100% of the allocated budget in our escrow registry before content creation starts. Once the creator publishes the content and passes automated verification checks, the funds are wired directly to their linked bank account within 24 business hours.",
    category: "Financials"
  },
  {
    question: "Is GSTIN registration mandatory for Indian creators to receive payouts?",
    answer: "No, a GSTIN is not mandatory for individual creators. If you do not have a GSTIN, payouts are computed based on individual PAN cards. However, if you have a registered agency or corporate structure, submitting your GSTIN allows you to raise tax-compliant invoices and claim input tax credit (ITC).",
    category: "Financials"
  },
  {
    question: "Can micro-influencers apply for brand campaigns on FSIA?",
    answer: "Absolutely! FSIA supports creators across multiple tiers (Nano, Micro, Macro, and Mega). Brands are increasingly looking for highly engaged micro-influencers (10k to 50k followers) who maintain deep, authentic community connections.",
    category: "Brands"
  },
  {
    question: "What are the core requirements for walking the FSIA Physical Runway?",
    answer: "Physical runways are integrated with national brand campaigns and pageants such as Miss India, Mrs India and Teen India. Creators selected for major brand campaigns or holding Gold/Royal memberships receive priority invitations to walk and showcase collaborative couture collections.",
    category: "General"
  },
  {
    question: "How do brands verify influencer statistics on the FSIA platform?",
    answer: "Our engine performs daily API sync audits directly with social networks (Instagram, YouTube, Threads). We analyze historical engagement curves, comment authenticity ratios, active follower distribution, and localized city hubs to present verified data metrics to brands.",
    category: "Verification"
  },
  {
    question: "What legal agreements govern collaborations on the FSIA portal?",
    answer: "All collaborations are bound by our standard digital 'VIP Collaboration Charter' which outlines copyright assignments, exclusivity durations, content standards, and payment timelines. Both parties sign this digitally prior to launch, making it legally enforceable.",
    category: "Brands"
  }
];
