import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShieldCheck, ArrowRight, CheckCircle2, Phone, Landmark } from "lucide-react";
import { Creator, gallerySections } from "../data";
import { useDialog, Portal } from "../lib/dialog";
import {
  inputClass, labelClass, helpClass, optionalClass, errorBoxClass,
  isValidEmail, isValidPhone, EMAIL_ERROR, PHONE_ERROR, focusField
} from "../lib/forms";

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
  const [errorMsg, setErrorMsg] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);

  // Live roster (falls back to the bundled list until the API answers)
  const [allCreators, setAllCreators] = useState<Creator[]>(gallerySections.flatMap((s) => s.creators));
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/creators")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => Array.isArray(data) && setAllCreators(data.flatMap((s: any) => s.creators || [])))
      .catch(() => {});
  }, [isOpen]);

  // Follow the creator the visitor opened the form from
  useEffect(() => {
    if (isOpen) setSelectedCreatorName(preselectedCreator ? preselectedCreator.name : "All VIP Roster");
  }, [isOpen, preselectedCreator]);

  // Indian Cities
  const indianCities = [
    "Mumbai", "New Delhi / NCR", "Bangalore", "Kolkata", "Chennai", 
    "Hyderabad", "Kochi", "Jaipur", "Ahmedabad", "Pune", "Goa"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const problem =
      !brandName.trim() ? { field: "enquiry-brand", message: "Please enter your brand or agency name." } :
      !isValidEmail(contactEmail) ? { field: "enquiry-email", message: EMAIL_ERROR } :
      !isValidPhone(contactPhone) ? { field: "enquiry-phone", message: PHONE_ERROR } : null;
    if (problem) {
      setInvalidField(problem.field);
      setErrorMsg(problem.message);
      focusField(problem.field);
      return;
    }

    setIsSubmitting(true);
    setInvalidField("");
    setErrorMsg("");

    const formattedBudget = currency === "INR"
      ? "₹" + (budgetInr / 100000).toFixed(1) + " Lakhs"
      : budgetUsd.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

    fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: brandName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        creatorName: selectedCreatorName,
        budget: formattedBudget,
        clientCity,
        gstin,
        scope,
        duration
      })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Your enquiry could not be sent.");
        // Show exactly what was stored, so the reference matches the team's records
        const saved = data.registration || {};
        setSubmittedCredential({
          bookingId: saved.bookingId,
          timestamp: saved.timestamp,
          brandName,
          creatorName: selectedCreatorName,
          budget: formattedBudget,
          clientCity,
          verificationHash: saved.verificationHash
        });
      })
      .catch((err: Error) => {
        // Never show a fake confirmation: the brand must know to try again
        setErrorMsg((err.message || "Your enquiry could not be sent.") + " Your details are still here — please try again.");
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleReset = () => {
    setBrandName("");
    setContactEmail("");
    setContactPhone("");
    setGstin("");
    setBudgetInr(500000);
    setBudgetUsd(10000);
    setSubmittedCredential(null);
    setErrorMsg("");
    setInvalidField("");
  };

  const invalid = (id: string) => (invalidField === id ? true : undefined);
  const budgetLabel = currency === "INR"
    ? (budgetInr === 10000000 ? "₹1 Crore+" : `₹${(budgetInr / 100000).toFixed(1)} Lakhs`)
    : (budgetUsd === 1000000 ? "$1,000,000+" : budgetUsd.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));

  return (
    <Portal>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end overflow-hidden bg-black/30 backdrop-blur-sm">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

          {/* Slider Panel */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-dialog-title"
            tabIndex={-1}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 180 }}
            className="relative w-full md:max-w-xl h-full bg-[#FAF9F6] shadow-2xl flex flex-col border-l border-black/5 outline-none"
            id="vip-collaboration-form-container"
          >
            {/* Header */}
            <div className="p-5 md:p-8 border-b border-black/10 flex items-center justify-between bg-[#F4F3F0]">
              <div>
                <span className="font-sans text-[11px] md:text-xs tracking-[0.2em] text-[#47453f] uppercase font-bold">
                  Brand enquiry · India desk
                </span>
                <h2 id="enquiry-dialog-title" className="font-serif-display text-xl md:text-2xl text-[#111] tracking-tight mt-1">
                  VIP Collaboration Charter
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close brand enquiry"
                className="w-11 h-11 rounded-full border border-black/15 flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
                id="close-collaboration-form-btn"
              >
                <X className="w-5 h-5 text-[#333]" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 custom-scrollbar">
              {!submittedCredential ? (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Intro */}
                  <div className="p-4 md:p-5 bg-white border border-black/10 rounded-xl text-sm text-[#2e2c29] space-y-2 leading-relaxed">
                    <div className="flex items-center gap-2 text-champagne font-bold uppercase tracking-[0.15em] text-[11px] font-sans">
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                      Secure escrow protocol &amp; VIP triage
                    </div>
                    By submitting this charter to the Forever Influencer brand desk, your brand requirements enter the elite curation pipeline. Our team will contact you within 4 business hours.
                  </div>
                  <p className="text-[13px] text-[#47453f]">Fields marked * are required.</p>

                  {/* Creator Selection */}
                  <div>
                    <label htmlFor="enquiry-creator" className={labelClass}>Creator or roster</label>
                    <select
                      id="enquiry-creator"
                      value={selectedCreatorName}
                      onChange={(e) => setSelectedCreatorName(e.target.value)}
                      className={inputClass}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="enquiry-brand" className={labelClass}>Brand or agency name *</label>
                      <input
                        id="enquiry-brand"
                        type="text"
                        autoComplete="organization"
                        placeholder="e.g., Sabyasachi, Vogue India"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        aria-invalid={invalid("enquiry-brand")}
                        aria-required="true"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="enquiry-city" className={labelClass}>Operating city (HQ)</label>
                      <select
                        id="enquiry-city"
                        value={clientCity}
                        onChange={(e) => setClientCity(e.target.value)}
                        className={inputClass}
                      >
                        {indianCities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="enquiry-email" className={labelClass}>Work email *</label>
                      <input
                        id="enquiry-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="name@brand.in"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        aria-invalid={invalid("enquiry-email")}
                        aria-required="true"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="enquiry-phone" className={labelClass}>Phone (WhatsApp) *</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#47453f] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                        <input
                          id="enquiry-phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="+91 98765 43210"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          aria-invalid={invalid("enquiry-phone")}
                          aria-required="true"
                          aria-describedby="enquiry-phone-help"
                          className={inputClass + " pl-10"}
                        />
                      </div>
                      <p id="enquiry-phone-help" className={helpClass}>+91 preferred. 10 to 15 digits.</p>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isWhatsappPreferred}
                          onChange={(e) => setIsWhatsappPreferred(e.target.checked)}
                          className="accent-[#111] w-4 h-4"
                        />
                        <span className="text-[13px] text-[#2e2c29]">
                          Connect securely on WhatsApp for instant confirmation
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* GSTIN / PAN */}
                  <div>
                    <label htmlFor="enquiry-gstin" className={labelClass}>
                      GSTIN or corporate PAN <span className={optionalClass}>(optional, for a proforma invoice)</span>
                    </label>
                    <div className="relative">
                      <Landmark className="w-4 h-4 text-[#47453f] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                      <input
                        id="enquiry-gstin"
                        type="text"
                        placeholder="e.g., 27AAAAA1111A1Z1"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        className={inputClass + " pl-10 uppercase"}
                      />
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <label htmlFor="enquiry-budget" className={labelClass + " mb-0"}>
                        Estimated budget: <span className="font-serif-display font-bold">{budgetLabel}</span>
                      </label>
                      <div className="flex rounded-lg overflow-hidden border border-black/15 text-xs font-bold font-sans" role="group" aria-label="Budget currency">
                        {(["INR", "USD"] as const).map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setCurrency(code)}
                            aria-pressed={currency === code}
                            className={`px-3 py-1.5 transition-all cursor-pointer ${
                              currency === code ? "bg-[#111] text-white" : "bg-white text-[#2e2c29] hover:bg-black/5"
                            }`}
                          >
                            {code === "INR" ? "INR (₹)" : "USD ($)"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {currency === "INR" ? (
                      <div className="space-y-1">
                        <input
                          id="enquiry-budget"
                          type="range"
                          min="100000"
                          max="10000000"
                          step="100000"
                          value={budgetInr}
                          aria-valuetext={budgetLabel}
                          onChange={(e) => setBudgetInr(Number(e.target.value))}
                          className="w-full accent-[#111] h-2 cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-[#47453f] font-sans" aria-hidden="true">
                          <span>₹1 Lakh</span>
                          <span>₹50 Lakhs</span>
                          <span>₹1 Crore+</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <input
                          id="enquiry-budget"
                          type="range"
                          min="5000"
                          max="1000000"
                          step="5000"
                          value={budgetUsd}
                          aria-valuetext={budgetLabel}
                          onChange={(e) => setBudgetUsd(Number(e.target.value))}
                          className="w-full accent-[#111] h-2 cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-[#47453f] font-sans" aria-hidden="true">
                          <span>$5,000</span>
                          <span>$500,000</span>
                          <span>$1M+</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Campaign Scope & Horizon */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <p id="enquiry-duration-label" className={labelClass}>Campaign duration</p>
                      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="enquiry-duration-label">
                        {["Single Event", "3 Months", "6 Months", "Annual Contract"].map((dOption) => (
                          <button
                            key={dOption}
                            type="button"
                            onClick={() => setDuration(dOption)}
                            aria-pressed={duration === dOption}
                            className={`px-3 py-2 rounded-lg text-[13px] font-sans font-semibold transition-all cursor-pointer border ${
                              duration === dOption
                                ? "bg-[#111] border-[#111] text-white"
                                : "bg-white border-stone-300 text-[#2e2c29] hover:border-[#111]"
                            }`}
                          >
                            {dOption}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="enquiry-scope" className={labelClass}>Engagement scope</label>
                      <select
                        id="enquiry-scope"
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                        className={inputClass}
                      >
                        <option value="Editorial Cover & Digital Campaign">Editorial Cover & Indian Digital</option>
                        <option value="Runway Show / Brand Campaign Appearance">Runway & Bollywood Gala Appearance</option>
                        <option value="Global Brand Ambassadorship">Pan-India Brand Ambassadorship</option>
                        <option value="Charity & Advocacy Alignment">Social Impact Partnership</option>
                      </select>
                    </div>
                  </div>

                  {errorMsg && (
                    <div role="alert" className={errorBoxClass}>
                      {errorMsg}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="w-full bg-[#111] hover:bg-[#2e2c29] text-[#FAF9F6] font-sans text-sm tracking-[0.12em] font-bold py-4 px-6 rounded-xl uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
                    id="submit-collaboration-charter-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-t-transparent border-[#FAF9F6] rounded-full animate-spin" aria-hidden="true" />
                        Sending enquiry…
                      </>
                    ) : (
                      <>
                        Send enquiry
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Success receipt */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                  id="collaboration-success-credential"
                  role="status"
                >
                  <div className="p-6 md:p-8 border border-black/10 bg-white rounded-2xl shadow-xl relative overflow-hidden text-center space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
                      <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                    </div>

                    <div className="space-y-1">
                      <span className="font-sans text-[11px] tracking-[0.2em] text-[#47453f] uppercase font-bold">
                        Brand enquiry received
                      </span>
                      <h3 className="font-serif-display text-xl md:text-2xl text-[#111] font-bold">
                        Charter Dispatched
                      </h3>
                    </div>

                    <dl className="border-t border-b border-black/10 py-4 space-y-2 text-left text-sm">
                      {[
                        ["Reference", submittedCredential.bookingId, "font-mono font-bold"],
                        ["Brand", submittedCredential.brandName, "font-semibold"],
                        ["Creator", submittedCredential.creatorName === "All VIP Roster" ? "Joint showcase (all VIPs)" : submittedCredential.creatorName, "font-semibold"],
                        ["Budget", submittedCredential.budget, "font-bold"],
                        ["City", submittedCredential.clientCity, "font-semibold"]
                      ].map(([term, value, weight]) => (
                        <div key={term} className="flex justify-between gap-4">
                          <dt className="text-[#47453f]">{term}</dt>
                          <dd className={`text-[#111] text-right ${weight}`}>{value}</dd>
                        </div>
                      ))}
                    </dl>

                    <p className="text-sm text-[#2e2c29] leading-relaxed px-2">
                      Thank you. Our brand desk will contact you at <strong className="text-[#111]">{contactEmail}</strong>
                      {isWhatsappPreferred ? " or on WhatsApp" : ""}. Please keep your reference number for any follow-up.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full bg-[#111] hover:bg-[#2e2c29] text-[#FAF9F6] font-sans text-sm tracking-[0.12em] py-3.5 px-6 rounded-xl uppercase cursor-pointer text-center font-bold"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full bg-white hover:bg-black/5 text-[#111] border border-black/15 font-sans text-sm tracking-[0.12em] py-3.5 px-6 rounded-xl uppercase cursor-pointer text-center font-bold"
                    >
                      Send another enquiry
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </Portal>
  );
}
