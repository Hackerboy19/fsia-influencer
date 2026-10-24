// Shared by the FAQ page and the FAQPage structured data generated at build time
export interface FAQItem {
  question: string;
  answer: string;
  category: "General" | "Verification" | "Financials" | "Brands";
}

export const FAQS: FAQItem[] = [
  {
    question: "How do I register as an influencer in India on FSIA?",
    answer: "Open the Get Verified page and complete the three-step form with your category, city, audience size, engagement rate and contact details. Registration is free and takes about two minutes. The FSIA team reviews each application; once approved, your profile can be listed on the Talent page where brands look for influencers to hire, and you can apply for paid brand collaborations.",
    category: "General"
  },
  {
    question: "What is the Forever Influencer Platform?",
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
    question: "Do influencers in India need GST registration to receive payouts?",
    answer: "It depends on your income. Under Indian GST law, a creator providing services must register once their aggregate turnover crosses ₹20 lakh in a financial year (₹10 lakh in special category states). Below that, registration is optional and payouts can be made against your PAN. Influencer services are generally taxed at 18% GST, and a GSTIN lets you raise tax invoices and claim input tax credit. Brands may also deduct TDS from payments, and free products or other benefits received for promotion can be taxable too. Tax rules change, so confirm your own position with a chartered accountant.",
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
  },
  {
    question: "What are the ASCI disclosure rules for influencers in India?",
    answer: "The Advertising Standards Council of India (ASCI) requires influencers to clearly label any post where they have a material connection with a brand, such as payment, free products, a barter deal or a family or employment link. Use a label such as #ad, #collab, #sponsored or #partnership, or the platform's paid-partnership tag, placed where viewers see it straight away rather than hidden among other hashtags or behind 'more'. In videos and Reels the disclosure should also appear in the video itself. The government's endorsement guidelines under the Consumer Protection Act require the same, so follow these rules on every brand collaboration, including those found through FSIA.",
    category: "Brands"
  },
  {
    question: "Can YouTube creators register, or only Instagram influencers?",
    answer: "Both. Instagram and YouTube creators can register, as can creators who are active on other platforms. Add your follower count, engagement rate and links to your best work in the registration form so brands can see where your audience is.",
    category: "General"
  },
  {
    question: "How much should I charge for a brand collaboration?",
    answer: "There is no fixed rate. Brands usually weigh your engagement rate, how well your audience matches their customers and locations, the number and type of deliverables (for example a Reel, a set of stories or a YouTube integration), usage rights, exclusivity and turnaround time. Many micro influencers start with barter collaborations and move to paid rates as they build results to show. Each campaign on FSIA lists its budget, so you can judge the fit before applying.",
    category: "Financials"
  }
];
