import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, ShieldCheck, Calendar, DollarSign, Award, ArrowRight, CheckCircle2 } from "lucide-react";
import { Creator, gallerySections } from "../data";

interface VipCollaborationFormProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCreator: Creator | null;
}

export default function VipCollaborationForm({
  isOpen,
  onClose,
  preselectedCreator,
}: VipCollaborationFormProps) {
  const [selectedCreatorName, setSelectedCreatorName] = useState<string>(
    preselectedCreator ? preselectedCreator.name : "All VIP Roster"
  );
  const [brandName, setBrandName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [budget, setBudget] = useState(25000); // Luxury budget default
  const [duration, setDuration] = useState("3 Months");
  const [scope, setScope] = useState("Editorial Cover & Digital Campaign");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCredential, setSubmittedCredential] = useState<any | null>(null);

  // Extract flat list of creators
  const allCreators = gallerySections.flatMap((s) => s.creators);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName || !contactEmail) return;

    setIsSubmitting(true);

    // Simulate elite verification processing
    setTimeout(() => {
      setIsSubmitting(false);
      const bookingId = "FSIA-VIP-" + Math.floor(100000 + Math.random() * 900000);
      setSubmittedCredential({
        bookingId,
        timestamp: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        brandName,
        creatorName: selectedCreatorName,
        budget: budget.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
        verificationHash: "0x" + Math.random().toString(16).substring(2, 10).toUpperCase() + "..." + Math.random().toString(16).substring(2, 6).toUpperCase(),
      });
    }, 1800);
  };

  const handleReset = () => {
    setBrandName("");
    setContactEmail("");
    setBudget(25000);
    setSubmittedCredential(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-black/20 backdrop-blur-sm">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Slider Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 180 }}
            className="relative w-full max-w-xl h-full bg-[#FAF9F6] shadow-2xl flex flex-col border-l border-black/5"
            id="vip-collaboration-form-container"
          >
            {/* Header */}
            <div className="p-8 border-b border-black/5 flex items-center justify-between bg-[#F4F3F0]">
              <div>
                <span className="font-sans text-xs tracking-[0.25em] text-[#8E8D8A] uppercase font-semibold">
                  FSIA Gateway
                </span>
                <h3 className="font-serif-display text-2xl text-[#111] tracking-tight mt-1">
                  VIP Collaboration Charter
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
                id="close-collaboration-form-btn"
              >
                <X className="w-5 h-5 text-[#333]" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {!submittedCredential ? (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Elite Intro */}
                  <div className="p-5 bg-white/50 border border-black/5 rounded-xl text-xs text-[#555] font-serif-text space-y-2 leading-relaxed">
                    <div className="flex items-center gap-2 text-champagne font-semibold mb-1 uppercase tracking-widest text-[10px] font-sans">
                      <ShieldCheck className="w-4 h-4" />
                      Verified Escrow Protocol
                    </div>
                    By submitting this charter, your inquiry will enter the FSIA VIP triage. Once verified, a boutique consultant will establish direct secure contact with the creator's legal representatives within 4 business hours.
                  </div>

                  {/* Creator Selection */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                      Select VIP Creator / Roster
                    </label>
                    <select
                      value={selectedCreatorName}
                      onChange={(e) => setSelectedCreatorName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm text-[#222] font-serif-text focus:outline-none focus:border-champagne focus:ring-1 focus:ring-champagne transition-all"
                    >
                      <option value="All VIP Roster">Full Roster — Joint Showcase Inquiry</option>
                      {allCreators.map((creator) => (
                        <option key={creator.name} value={creator.name}>
                          {creator.name} ({creator.role.split(",")[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Credentials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                        Brand / House Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Chanel, Harper's Bazaar"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm text-[#222] placeholder:text-[#BBB] focus:outline-none focus:border-champagne focus:ring-1 focus:ring-champagne transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                        Secure Contact Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="comms@luxuryhouse.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm text-[#222] placeholder:text-[#BBB] focus:outline-none focus:border-champagne focus:ring-1 focus:ring-champagne transition-all"
                      />
                    </div>
                  </div>

                  {/* Luxury Budget Slider */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                      <span>Allocation Cap (USD)</span>
                      <span className="text-sm font-serif-display text-champagne font-bold tracking-tight">
                        {budget === 1000000 ? "$1,000,000+" : budget.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10000"
                      max="1000000"
                      step="5000"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full accent-[#E1C699] h-1.5 bg-[#E5E5E2] rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-[#888] font-sans">
                      <span>$10,000</span>
                      <span>$100,000</span>
                      <span>$500,000</span>
                      <span>$1,000,000+</span>
                    </div>
                  </div>

                  {/* Duration and Scope Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                        Campaign Horizon
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["Single Show", "3 Months", "6 Months", "Annual"].map((dOption) => (
                          <button
                            key={dOption}
                            type="button"
                            onClick={() => setDuration(dOption)}
                            className={`px-3 py-2 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                              duration === dOption
                                ? "bg-champagne/15 border border-champagne text-[#222] font-semibold"
                                : "bg-white border border-black/5 text-[#666] hover:bg-[#F3F3F1]"
                            }`}
                          >
                            {dOption}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                        Engagement Scope
                      </label>
                      <select
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs text-[#222] font-serif-text focus:outline-none focus:border-champagne"
                      >
                        <option value="Editorial Cover & Digital Campaign">Editorial Cover & Digital</option>
                        <option value="Runway Show / Pageant Appearance">Runway & Live Event</option>
                        <option value="Global Brand Ambassadorship">Global Ambassador Representation</option>
                        <option value="Charity & Advocacy Alignment">Social Advocacy Partner</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-xs tracking-[0.25em] font-medium py-4 px-6 rounded-lg uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.98]"
                    id="submit-collaboration-charter-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-[#FAF9F6] rounded-full animate-spin" />
                        SECURE ROUTING...
                      </>
                    ) : (
                      <>
                        VERIFY & DEPLOY CHARTER
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Success Credential Receipt */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                  id="collaboration-success-credential"
                >
                  <div className="p-8 border border-champagne/30 bg-white/80 rounded-2xl shadow-xl relative overflow-hidden text-center space-y-6">
                    {/* Decorative gold seal backing */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-champagne/5 rounded-full pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-champagne/5 rounded-full pointer-events-none" />

                    <div className="mx-auto w-16 h-16 rounded-full bg-champagne/10 border border-champagne flex items-center justify-center text-champagne mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <span className="font-sans text-[10px] tracking-[0.3em] text-[#8E8D8A] uppercase font-bold">
                        FSIA Prestige Credential
                      </span>
                      <h4 className="font-serif-display text-2xl text-[#111] font-bold">
                        Charter Transmitted
                      </h4>
                    </div>

                    <div className="border-t border-b border-black/5 py-4 space-y-2 text-left">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#888] font-sans">CREDENTIAL ID:</span>
                        <span className="font-mono text-[#222] font-bold">{submittedCredential.bookingId}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#888] font-sans">BRAND HOUSE:</span>
                        <span className="font-serif-text text-[#222] font-semibold">{submittedCredential.brandName}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#888] font-sans">VIP DESIGNEE:</span>
                        <span className="font-serif-text text-[#222] font-semibold">{submittedCredential.creatorName}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#888] font-sans">BUDGET PLEDGE:</span>
                        <span className="font-serif-text text-[#222] font-semibold">{submittedCredential.budget}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#888] font-sans">SECURITY HASH:</span>
                        <span className="font-mono text-[#8E8D8A]">{submittedCredential.verificationHash}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#888] font-sans">DATE SEALED:</span>
                        <span className="font-sans text-[#222] font-semibold">{submittedCredential.timestamp}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#666] font-serif-text leading-relaxed px-4">
                      Your charter has been cryptographically signed. The FSIA board of directors is executing triage checks. You will receive an encrypted direct link to the secure portal at <strong className="text-[#222]">{contactEmail}</strong>.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleReset}
                      className="w-full bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-xs tracking-[0.25em] py-3.5 px-6 rounded-lg uppercase cursor-pointer text-center font-medium"
                    >
                      SUBMIT NEW INQUIRY
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full bg-transparent hover:bg-black/5 text-[#333] border border-black/10 font-sans text-xs tracking-[0.25em] py-3.5 px-6 rounded-lg uppercase cursor-pointer text-center font-semibold"
                    >
                      RETURN TO RUNWAY
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
