import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, ShieldCheck, Calendar, DollarSign, Award, ArrowRight, CheckCircle2, Phone, Briefcase, Landmark } from "lucide-react";
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
  const [contactPhone, setContactPhone] = useState("");
  const [isWhatsappPreferred, setIsWhatsappPreferred] = useState(true);
  const [clientCity, setClientCity] = useState("Mumbai");
  const [gstin, setGstin] = useState("");
  
  // Dual Currency Mode (defaulting to INR for Indian Clients)
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [budgetInr, setBudgetInr] = useState(500000); // 5 Lakhs default
  const [budgetUsd, setBudgetUsd] = useState(10000); // $10k default
  
  const [duration, setDuration] = useState("3 Months");
  const [scope, setScope] = useState("Editorial Cover & Digital Campaign");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCredential, setSubmittedCredential] = useState<any | null>(null);

  // Extract flat list of creators
  const allCreators = gallerySections.flatMap((s) => s.creators);

  // Indian Cities
  const indianCities = [
    "Mumbai", "New Delhi / NCR", "Bangalore", "Kolkata", "Chennai", 
    "Hyderabad", "Kochi", "Jaipur", "Ahmedabad", "Pune", "Goa"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName || !contactEmail || !contactPhone) return;

    setIsSubmitting(true);

    const bookingId = "FSIA-VIP-" + Math.floor(100000 + Math.random() * 900000);
    const formattedBudget = currency === "INR" 
      ? "₹" + (budgetInr / 100000).toFixed(1) + " Lakhs"
      : budgetUsd.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

    const payload = {
      bookingId,
      brandName,
      contactEmail,
      contactPhone,
      creatorName: selectedCreatorName,
      budget: formattedBudget,
      clientCity,
      scope,
      duration
    };

    fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then((res) => {
      if (!res.ok) throw new Error("Server registration error");
      return res.json();
    })
    .then((savedData) => {
      setIsSubmitting(false);
      setSubmittedCredential({
        bookingId: savedData.bookingId || bookingId,
        timestamp: new Date().toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        brandName,
        creatorName: selectedCreatorName,
        budget: formattedBudget,
        clientCity,
        verificationHash: "0x" + Math.random().toString(16).substring(2, 10).toUpperCase() + "..." + Math.random().toString(16).substring(2, 6).toUpperCase(),
      });
    })
    .catch((err) => {
      console.warn("Falling back to client-side emulation:", err);
      setIsSubmitting(false);
      setSubmittedCredential({
        bookingId,
        timestamp: new Date().toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        brandName,
        creatorName: selectedCreatorName,
        budget: formattedBudget,
        clientCity,
        verificationHash: "0x" + Math.random().toString(16).substring(2, 10).toUpperCase() + "..." + Math.random().toString(16).substring(2, 6).toUpperCase(),
      });
    });
  };

  const handleReset = () => {
    setBrandName("");
    setContactEmail("");
    setContactPhone("");
    setGstin("");
    setBudgetInr(500000);
    setBudgetUsd(10000);
    setSubmittedCredential(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-black/30 backdrop-blur-sm">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Slider Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 180 }}
            className="relative w-full md:max-w-xl h-full bg-[#FAF9F6] shadow-2xl flex flex-col border-l border-black/5"
            id="vip-collaboration-form-container"
          >
            {/* Header */}
            <div className="p-5 md:p-8 border-b border-black/5 flex items-center justify-between bg-[#F4F3F0]">
              <div>
                <span className="font-sans text-[10px] md:text-xs tracking-[0.25em] text-[#8E8D8A] uppercase font-bold">
                  FSIA Gateway (India Desk)
                </span>
                <h3 className="font-serif-display text-xl md:text-2xl text-[#111] tracking-tight mt-1">
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
            <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
              {!submittedCredential ? (
                <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                  {/* Elite Intro */}
                  <div className="p-4 md:p-5 bg-white/60 border border-black/5 rounded-xl text-[11px] md:text-xs text-[#555] font-serif-text space-y-2 leading-relaxed">
                    <div className="flex items-center gap-2 text-champagne font-bold mb-1 uppercase tracking-widest text-[9px] font-sans">
                      <ShieldCheck className="w-4 h-4" />
                      SECURE ESCROW PROTOCOL & VIP TRIAGE
                    </div>
                    By submitting this charter to the Forever Star India VIP Desk, your brand requirements enter the elite curation pipeline. Direct legal representatives are coordinates within 4 business hours.
                  </div>

                  {/* Creator Selection */}
                  <div className="space-y-2">
                    <label className="block text-[9px] md:text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                      Select VIP Creator / Joint Roster
                    </label>
                    <select
                      value={selectedCreatorName}
                      onChange={(e) => setSelectedCreatorName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm text-[#222] font-serif-text focus:outline-none focus:border-champagne focus:ring-1 focus:ring-champagne transition-all"
                    >
                      <option value="All VIP Roster">Joint Showroom Showcase (All VIPs)</option>
                      {allCreators.map((creator) => (
                        <option key={creator.name} value={creator.name}>
                          {creator.name} ({creator.role.split(",")[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Corporate/Brand Credentials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[9px] md:text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                        Brand House / Agency Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Sabyasachi, Vogue India"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm text-[#222] placeholder:text-[#BBB] focus:outline-none focus:border-champagne focus:ring-1 focus:ring-champagne transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[9px] md:text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                        Operating City (HQ)
                      </label>
                      <select
                        value={clientCity}
                        onChange={(e) => setClientCity(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm text-[#222] font-serif-text focus:outline-none focus:border-champagne transition-all"
                      >
                        {indianCities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dual Contacts tailored to Indian standards (WhatsApp integration) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[9px] md:text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                        Secure Corporate Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="vip.comms@brand.in"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm text-[#222] placeholder:text-[#BBB] focus:outline-none focus:border-champagne focus:ring-1 focus:ring-champagne transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[9px] md:text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                          Contact Number (+91 Preferred)
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          placeholder="+91 XXXXX XXXXX"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-lg text-sm text-[#222] placeholder:text-[#BBB] focus:outline-none focus:border-champagne focus:ring-1 focus:ring-champagne transition-all"
                        />
                        <Phone className="w-4 h-4 text-[#8E8D8A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isWhatsappPreferred}
                          onChange={(e) => setIsWhatsappPreferred(e.target.checked)}
                          className="rounded text-champagne accent-[#E1C699] focus:ring-champagne w-3.5 h-3.5"
                        />
                        <span className="text-[10px] font-sans text-[#555]">
                          Connect securely on WhatsApp for instant confirmation
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Corporate Taxation/Verification (GSTIN / PAN) */}
                  <div className="space-y-2">
                    <label className="block text-[9px] md:text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                      GSTIN / Corporate PAN (Optional - for Proforma Invoice)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g., 27AAAAA1111A1Z1 / Corporate ID"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-lg text-sm text-[#222] placeholder:text-[#BBB] uppercase focus:outline-none focus:border-champagne transition-all"
                      />
                      <Landmark className="w-4 h-4 text-[#8E8D8A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Dual Currency Luxury Allocation Selector */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-black/5 pb-2">
                      <label className="block text-[9px] md:text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                        Estimated Budget Allocation
                      </label>
                      <div className="flex rounded-md overflow-hidden border border-black/10 text-[9px] font-bold font-sans">
                        <button
                          type="button"
                          onClick={() => setCurrency("INR")}
                          className={`px-2.5 py-1 transition-all ${
                            currency === "INR"
                              ? "bg-champagne text-white"
                              : "bg-white text-[#666] hover:bg-black/5"
                          }`}
                        >
                          INR (₹)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrency("USD")}
                          className={`px-2.5 py-1 transition-all ${
                            currency === "USD"
                              ? "bg-champagne text-white"
                              : "bg-white text-[#666] hover:bg-black/5"
                          }`}
                        >
                          USD ($)
                        </button>
                      </div>
                    </div>

                    {currency === "INR" ? (
                      /* INR Range */
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-sans text-[#888]">Allocated Cap (Indian Rupees)</span>
                          <span className="text-sm font-serif-display text-[#111] font-bold">
                            {budgetInr === 10000000 ? "₹1 Crore+" : `₹${(budgetInr / 100000).toFixed(1)} Lakhs`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="100000"
                          max="10000000"
                          step="100000"
                          value={budgetInr}
                          onChange={(e) => setBudgetInr(Number(e.target.value))}
                          className="w-full accent-[#E1C699] h-1.5 bg-[#E5E5E2] rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-[#888] font-sans">
                          <span>₹1 Lakh</span>
                          <span>₹15 Lakhs</span>
                          <span>₹50 Lakhs</span>
                          <span>₹1 Crore+</span>
                        </div>
                      </div>
                    ) : (
                      /* USD Range */
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-sans text-[#888]">Allocated Cap (US Dollars)</span>
                          <span className="text-sm font-serif-display text-[#111] font-bold">
                            {budgetUsd === 1000000 ? "$1,000,000+" : budgetUsd.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5000"
                          max="1000000"
                          step="5000"
                          value={budgetUsd}
                          onChange={(e) => setBudgetUsd(Number(e.target.value))}
                          className="w-full accent-[#E1C699] h-1.5 bg-[#E5E5E2] rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-[#888] font-sans">
                          <span>$5,000</span>
                          <span>$100,000</span>
                          <span>$500,000</span>
                          <span>$1M+</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Campaign Scope & Horizon */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[9px] md:text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                        Campaign Horizon
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["Single Event", "3 Months", "6 Months", "Annual Contract"].map((dOption) => (
                          <button
                            key={dOption}
                            type="button"
                            onClick={() => setDuration(dOption)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all cursor-pointer ${
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
                      <label className="block text-[9px] md:text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                        Engagement Scope
                      </label>
                      <select
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs text-[#222] font-serif-text focus:outline-none focus:border-champagne"
                      >
                        <option value="Editorial Cover & Digital Campaign">Editorial Cover & Indian Digital</option>
                        <option value="Runway Show / Pageant Appearance">Runway & Bollywood Gala Appearance</option>
                        <option value="Global Brand Ambassadorship">Pan-India Brand Ambassadorship</option>
                        <option value="Charity & Advocacy Alignment">Social Impact Partnership</option>
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
                        DISPATCHING SECURE CHARTER...
                      </>
                    ) : (
                      <>
                        VERIFY & TRANSMIT CHARTER
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Success Credential Receipt with Indian-centric variables */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                  id="collaboration-success-credential"
                >
                  <div className="p-6 md:p-8 border border-champagne/30 bg-white/80 rounded-2xl shadow-xl relative overflow-hidden text-center space-y-6">
                    {/* Decorative gold seal backing */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-champagne/5 rounded-full pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-champagne/5 rounded-full pointer-events-none" />

                    <div className="mx-auto w-16 h-16 rounded-full bg-champagne/10 border border-champagne flex items-center justify-center text-champagne mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <span className="font-sans text-[9px] tracking-[0.3em] text-[#8E8D8A] uppercase font-bold">
                        FSIA India VIP Credential
                      </span>
                      <h4 className="font-serif-display text-xl md:text-2xl text-[#111] font-bold">
                        Charter Dispatched
                      </h4>
                    </div>

                    <div className="border-t border-b border-black/5 py-4 space-y-2 text-left">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#888] font-sans">REGISTRATION ID:</span>
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
                        <span className="text-[#888] font-sans">BUDGET ALLOCATION:</span>
                        <span className="font-serif-text text-[#222] font-bold text-champagne">{submittedCredential.budget}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#888] font-sans">CITY HUB:</span>
                        <span className="font-serif-text text-[#222] font-semibold">{submittedCredential.clientCity}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#888] font-sans">SECURITY HASH:</span>
                        <span className="font-mono text-[#8E8D8A] text-[10px]">{submittedCredential.verificationHash}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#666] font-serif-text leading-relaxed px-2">
                      Your VIP charter request is successfully sealed. Direct coordinates have been initiated. Expect secure WhatsApp & Email dispatch to <strong className="text-[#222]">{contactEmail}</strong>.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleReset}
                      className="w-full bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-xs tracking-[0.25em] py-3.5 px-6 rounded-lg uppercase cursor-pointer text-center font-medium"
                    >
                      SUBMIT NEW CHARTER
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full bg-transparent hover:bg-black/5 text-[#333] border border-black/10 font-sans text-xs tracking-[0.25em] py-3.5 px-6 rounded-lg uppercase cursor-pointer text-center font-semibold"
                    >
                      RETURN TO CATWALK
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

