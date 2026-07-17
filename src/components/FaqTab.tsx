import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle, Shield, FileText, Landmark, Users } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: "General" | "Verification" | "Financials" | "Brands";
}

export default function FaqTab() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"All" | "General" | "Verification" | "Financials" | "Brands">("All");

  const faqs: FAQItem[] = [
    {
      question: "What is the Forever Star India Association (FSIA) Influencer Platform?",
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
      answer: "Physical runways are integrated with national Brand Campaigns like Forever Miss India, Mrs India, and Teen India. Creators selected for major brand campaigns or holding Gold/Royal memberships receive priority invitations to walk and showcase collaborative couture collections.",
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

  const categories = ["All", "General", "Verification", "Financials", "Brands"];

  const filteredFaqs = faqs.filter(faq => selectedCategory === "All" || faq.category === selectedCategory);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-12 space-y-8" id="faq-tab-container">
      {/* Title */}
      <div className="text-center md:text-left space-y-2">
        <span className="font-sans text-xs tracking-[0.3em] text-[#8E8D8A] uppercase font-bold block">
          FSIA Information Desk
        </span>
        <h2 className="font-serif-display text-3xl md:text-5xl font-bold tracking-tight text-[#111]">
          Guidelines & Frequently Asked Questions
        </h2>
        <p className="font-serif-text italic text-[#666] text-sm md:text-base max-w-2xl">
          Everything you need to know about our elite influencer ecosystem, verified credentials, secure escrows, and runway opportunities.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none border-b border-black/5 pb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat as any);
              setOpenIndex(null);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-sans tracking-wide transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-champagne text-white font-semibold"
                : "bg-white hover:bg-[#F3F3F1] border border-black/5 text-[#555]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white/60 border border-black/5 rounded-2xl overflow-hidden transition-all shadow-sm"
            >
              <button
                onClick={() => toggleOpen(idx)}
                className="w-full text-left p-5 flex justify-between items-center gap-4 hover:bg-white/40 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-black/5 flex items-center justify-center text-champagne shrink-0">
                    {faq.category === "Financials" && <Landmark className="w-4 h-4" />}
                    {faq.category === "Verification" && <Shield className="w-4 h-4" />}
                    {faq.category === "Brands" && <Users className="w-4 h-4" />}
                    {faq.category === "General" && <HelpCircle className="w-4 h-4" />}
                  </div>
                  <span className="font-serif-display text-base font-bold text-[#111] leading-tight">
                    {faq.question}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[#8E8D8A]"
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-black/5 bg-white/30"
                  >
                    <div className="p-5 text-xs md:text-sm text-[#555] font-serif-text leading-relaxed space-y-3">
                      <p>{faq.answer}</p>
                      <div className="flex items-center gap-2 text-[10px] font-sans font-bold tracking-widest text-[#8E8D8A] uppercase">
                        <span>CATEGORY: {faq.category}</span>
                        <span>•</span>
                        <span>AUDITED: YES</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Support Box */}
      <div className="p-6 bg-white/80 border border-black/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <h4 className="font-serif-display text-lg font-bold text-[#111]">
            Have custom business enquiries or corporate proposals?
          </h4>
          <p className="font-serif-text text-xs text-[#555] max-w-xl">
            Our luxury brand liaison desk is ready to organize custom agreements, Joint Runway Brand Campaign sponsorships, and legal brand integrations.
          </p>
        </div>
        <a
          href="mailto:partner@fsia.in"
          className="bg-[#111] hover:bg-[#222] text-[#FAF9F6] text-xs font-sans font-bold tracking-widest px-6 py-3.5 rounded-lg uppercase transition-all whitespace-nowrap active:scale-95"
        >
          CONTACT INDIA DESK
        </a>
      </div>
    </div>
  );
}
