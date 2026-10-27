// Shared by the FAQ page and the FAQPage structured data generated at build time
import { AWARD_NAME, BRAND_NAME } from "./brand";
export interface FAQItem {
  question: string;
  answer: string;
  category: "General" | "Verification" | "Financials" | "Brands";
}

export const FAQS: FAQItem[] = [
  {
    question: `What is ${BRAND_NAME}?`,
    answer: `${BRAND_NAME} is a website for Indian creators and the brands that work with them. Creators join by applying for the ${AWARD_NAME}: once our team approves the application, they get a public profile. After the awards, the platform opens to every creator. Brands browse those profiles, see open campaigns and send collaboration enquiries, which our team follows up by email or phone.`,
    category: "General"
  },
  {
    question: "How do I register as an influencer in India?",
    answer: `Right now you register by applying for the ${AWARD_NAME}. Open the Apply page and complete the three-step form with your category, city, audience size, engagement rate and contact details. Registration is free and takes about two minutes. Our team reviews each application; once approved, your profile is published in the profile directory where brands look for influencers to hire, and you can apply for paid brand collaborations. After the awards, registration opens to every creator.`,
    category: "General"
  },
  {
    question: "What does the \"Reviewed\" mark on a profile mean?",
    answer: "It means our team read the creator's application and approved the profile before it was published. Follower and engagement figures on profiles are supplied by the creator. They are not independently audited, so brands should confirm current numbers with the creator before signing a deal.",
    category: "Verification"
  },
  {
    question: "How do I correct or remove my profile?",
    answer: "Use the Contact page, choose \"Profile correction or removal\" and tell us which profile it is and what should change. Please write from the email address you used to apply so we can confirm the profile is yours.",
    category: "Verification"
  },
  {
    question: "Do influencers in India need GST registration to receive payouts?",
    answer: "It depends on your income. Under Indian GST law, a creator providing services must register once their aggregate turnover crosses ₹20 lakh in a financial year (₹10 lakh in special category states). Below that, registration is optional and payouts can be made against your PAN. Influencer services are generally taxed at 18% GST, and a GSTIN lets you raise tax invoices and claim input tax credit. Brands may also deduct TDS from payments, and free products or other benefits received for promotion can be taxable too. Tax rules change, so confirm your own position with a chartered accountant.",
    category: "Financials"
  },
  {
    question: "Can micro-influencers apply for brand campaigns?",
    answer: "Yes, where you meet the campaign's requirements. Each campaign lists its own eligibility, so read it before you apply.",
    category: "Brands"
  },
  {
    question: "How do brands check a creator's numbers?",
    answer: "Ask the creator for recent screenshots from their Instagram or YouTube analytics, or a media kit, before you agree terms. The figures on profiles are what the creator submitted when they applied.",
    category: "Brands"
  },
  {
    question: "What are the ASCI disclosure rules for influencers in India?",
    answer: "The Advertising Standards Council of India (ASCI) requires influencers to clearly label any post where they have a material connection with a brand, such as payment, free products, a barter deal or a family or employment link. Use a label such as #ad, #collab, #sponsored or #partnership, or the platform's paid-partnership tag, placed where viewers see it straight away rather than hidden among other hashtags or behind 'more'. In videos and Reels the disclosure should also appear in the video itself. The government's endorsement guidelines under the Consumer Protection Act require the same, so follow these rules on every brand collaboration, including those found through this site.",
    category: "Brands"
  },
  {
    question: "Can YouTube creators register, or only Instagram influencers?",
    answer: "Both. Instagram and YouTube creators can register, as can creators who are active on other platforms. Add your follower count, engagement rate and links to your best work in the registration form so brands can see where your audience is.",
    category: "General"
  },
  {
    question: "How much should I charge for a brand collaboration?",
    answer: "There is no fixed rate. Brands usually weigh your engagement rate, how well your audience matches their customers and locations, the number and type of deliverables (for example a Reel, a set of stories or a YouTube integration), usage rights, exclusivity and turnaround time. Many micro influencers start with barter collaborations and move to paid rates as they build results to show. Each campaign listed here shows its budget, so you can judge the fit before applying.",
    category: "Financials"
  }
];
