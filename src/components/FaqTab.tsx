import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle, Shield, FileText, Landmark, Users } from "lucide-react";

import { FAQS as faqs } from "../content/faqs";
import { routeForTab } from "../seo";

export default function FaqTab() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"All" | "General" | "Verification" | "Financials" | "Brands">("All");


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
        <h1 className="font-serif-display text-3xl md:text-5xl font-bold tracking-tight text-[#111]">
          {routeForTab("faq").heading}
        </h1>
        <p className="font-serif-text italic text-[#2e2c29] text-base md:text-lg leading-relaxed max-w-2xl">
          {routeForTab("faq").intro}
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none border-b border-black/5 pb-4" role="group" aria-label="Filter questions by topic">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat as any);
              setOpenIndex(null);
            }}
            aria-pressed={selectedCategory === cat}
            className={`px-4 py-2 rounded-full text-[13px] font-sans font-semibold tracking-wide transition-all cursor-pointer border ${
              selectedCategory === cat
                ? "bg-[#111] border-[#111] text-white"
                : "bg-white hover:bg-[#F3F3F1] border-black/15 text-[#2e2c29]"
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
              <h2 className="m-0">
              <button
                onClick={() => toggleOpen(idx)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${idx}`}
                id={`faq-question-${idx}`}
                className="w-full text-left p-5 flex justify-between items-center gap-4 hover:bg-white/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-black/5 flex items-center justify-center text-champagne shrink-0">
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
                  <ChevronDown className="w-5 h-5" aria-hidden="true" />
                </motion.div>
              </button>
              </h2>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-question-${idx}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-black/5 bg-white/30"
                  >
                    <div className="p-5 text-base md:text-lg text-[#2e2c29] font-serif-text leading-relaxed space-y-3">
                      <p>{faq.answer}</p>
                      <div className="flex items-center gap-2 text-[11px] font-sans font-bold tracking-widest text-[#8E8D8A] uppercase">
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
          <h2 className="font-serif-display text-lg font-bold text-[#111]">
            Have custom business enquiries or corporate proposals?
          </h2>
          <p className="text-sm text-[#2e2c29] leading-relaxed max-w-xl">
            Our luxury brand liaison desk is ready to organize custom agreements, Joint Runway Brand Campaign sponsorships, and legal brand integrations.
          </p>
        </div>
        <a
          href="mailto:partner@fsia.in"
          className="bg-[#d32f2f] hover:bg-[#b71c1c] text-[#FAF8F5] text-xs font-sans font-bold tracking-widest px-6 py-3.5 rounded-lg uppercase transition-all whitespace-nowrap active:scale-95"
        >
          CONTACT INDIA DESK
        </a>
      </div>
    </div>
  );
}
