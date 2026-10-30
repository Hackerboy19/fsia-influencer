import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, CheckCircle2, Phone, Landmark, MapPin } from "lucide-react";
import { Creator, gallerySections } from "../data";
import { useDialog, Portal } from "../lib/dialog";
import { initials } from "../lib/profile";
import {
  inputClass, labelClass, helpClass, optionalClass, errorBoxClass,
  isValidEmail, isValidPhone, EMAIL_ERROR, PHONE_ERROR, focusField
} from "../lib/forms";
import FieldError, { errorProps } from "./FieldError";

interface VipCollaborationFormProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCreator: Creator | null;
}

// The value the API and admin already use for "no specific creator"
const ANY_CREATOR = "All VIP Roster";

const CITIES = [
  "Mumbai", "New Delhi / NCR", "Bangalore", "Kolkata", "Chennai", "Hyderabad",
  "Pune", "Ahmedabad", "Jaipur", "Kochi", "Goa", "Lucknow", "Chandigarh", "Indore",
  "Other city in India", "Outside India"
];

// Ranges that fit Indian creator work, from one reel to a long campaign
const BUDGETS = ["Under ₹25,000", "₹25,000 – ₹1 lakh", "₹1 – 5 lakh", "₹5 – 25 lakh", "Above ₹25 lakh", "Not sure yet"];

const CAMPAIGN_TYPES = [
  "Instagram Reels or posts",
  "YouTube video",
  "Event or store appearance",
  "Brand ambassador",
  "Product review or barter",
  "Something else"
];

const DURATIONS = ["One post or event", "1 month", "3 months", "6 months or longer"];

const chipClass = (on: boolean) =>
  `min-h-10 px-3 py-2 rounded-[4px] text-[0.875rem] font-medium transition-colors cursor-pointer border text-left ${
    on ? "bg-bronze-fill border-bronze-fill text-white" : "bg-surface border-line-strong text-ink hover:border-ink"
  }`;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <legend className="flex items-center gap-2.5 font-semibold text-ink text-[1.0625rem] float-left w-full mb-4">
        <span className="w-6 h-6 rounded-full bg-ink text-white text-[0.75rem] inline-flex items-center justify-center tabular-nums" aria-hidden="true">{n}</span>
        {title}
      </legend>
      <div className="clear-both space-y-4">{children}</div>
    </fieldset>
  );
}

export default function VipCollaborationForm({ isOpen, onClose, preselectedCreator }: VipCollaborationFormProps) {
  const [selectedCreatorName, setSelectedCreatorName] = useState<string>(preselectedCreator ? preselectedCreator.name : ANY_CREATOR);
  const [brandName, setBrandName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isWhatsappPreferred, setIsWhatsappPreferred] = useState(true);
  const [clientCity, setClientCity] = useState("Mumbai");
  const [gstin, setGstin] = useState("");
  const [budget, setBudget] = useState("Not sure yet");
  const [campaignType, setCampaignType] = useState(CAMPAIGN_TYPES[0]);
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [brief, setBrief] = useState("");
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
    if (isOpen) setSelectedCreatorName(preselectedCreator ? preselectedCreator.name : ANY_CREATOR);
  }, [isOpen, preselectedCreator]);

  const selected = useMemo(
    () => (selectedCreatorName === ANY_CREATOR ? null : allCreators.find((c) => c.name === selectedCreatorName) || preselectedCreator),
    [selectedCreatorName, allCreators, preselectedCreator]
  );

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

    // The API stores one "scope" text (up to 1000 characters): campaign type, WhatsApp choice and brief
    const scope = [
      campaignType,
      isWhatsappPreferred ? "WhatsApp OK" : "No WhatsApp",
      brief.trim() ? `Brief: ${brief.trim()}` : ""
    ].filter(Boolean).join(" · ").slice(0, 990);

    fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: brandName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        creatorName: selectedCreatorName,
        budget,
        clientCity,
        gstin: gstin.trim().toUpperCase(),
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
          brandName,
          creatorName: selectedCreatorName,
          budget,
          campaignType,
          clientCity
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
    setBrief("");
    setBudget("Not sure yet");
    setSubmittedCredential(null);
    setErrorMsg("");
    setInvalidField("");
  };

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex justify-end overflow-hidden bg-black/35">
            <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

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
              className="relative w-full md:max-w-xl h-full bg-paper shadow-2xl flex flex-col border-l border-line outline-none"
              id="vip-collaboration-form-container"
            >
              {/* Header: dark band, so the drawer reads as its own space */}
              <div className="surface-dark bg-[#1B1A17] text-white px-5 md:px-8 pt-5 pb-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#E1C699]">For brands and agencies</p>
                    <h2 id="enquiry-dialog-title" className="font-display text-[1.75rem] leading-tight mt-1 text-white">
                      {selected ? `Book ${selected.name.split(" ")[0]}` : "Brand enquiry"}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close brand enquiry"
                    className="w-11 h-11 -mr-2 rounded-[4px] flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
                    id="close-collaboration-form-btn"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
                {!submittedCredential && (
                  <p className="mt-2 text-[0.875rem] leading-snug text-[#CFCAC0]">Someone from our team reads it and replies by email or phone. We don't publish your details.</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {!submittedCredential ? (
                  <form id="brand-enquiry-form" onSubmit={handleSubmit} noValidate className="p-5 md:p-8 space-y-6">
                    <Step n={1} title="Who would you like to work with?">
                      {selected ? (
                        <div className="flex items-center gap-3.5 p-3 bg-surface border border-line rounded-[4px]">
                          {selected.image ? (
                            <img src={selected.image} alt="" className="w-16 h-20 object-cover rounded-[3px] bg-sunken shrink-0" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="w-16 h-20 rounded-[3px] bg-sunken shrink-0 inline-flex items-center justify-center font-display text-ink-3 text-[1.25rem]" aria-hidden="true">{initials(selected.name)}</span>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-ink leading-tight">{selected.name}</p>
                            {selected.role && <p className="text-[0.875rem] text-ink-2 truncate">{selected.role}</p>}
                            {selected.city && (
                              <p className="text-[0.8125rem] text-ink-3 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" aria-hidden="true" /> {selected.city}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[0.9375rem] text-ink-2 p-3 bg-surface border border-line rounded-[4px]">
                          Not sure yet? Tell us the brief and our team will suggest creators who fit.
                        </p>
                      )}
                      <div>
                        <label htmlFor="enquiry-creator" className={labelClass}>{selected ? "Change creator" : "Creator"} <span className={optionalClass}>(optional)</span></label>
                        <select id="enquiry-creator" value={selectedCreatorName} onChange={(e) => setSelectedCreatorName(e.target.value)} className={inputClass}>
                          <option value={ANY_CREATOR}>Not sure yet: suggest creators for me</option>
                          {allCreators.map((creator) => (
                            <option key={creator.name} value={creator.name}>
                              {creator.name}{creator.role ? ` (${creator.role.split(",")[0]})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Step>

                    <Step n={2} title="Your campaign">
                      <div>
                        <p id="enquiry-type-label" className={labelClass}>What do you need?</p>
                        <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="enquiry-type-label">
                          {CAMPAIGN_TYPES.map((t) => (
                            <button key={t} type="button" onClick={() => setCampaignType(t)} aria-pressed={campaignType === t} className={chipClass(campaignType === t)}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p id="enquiry-budget-label" className={labelClass}>Budget</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-labelledby="enquiry-budget-label">
                          {BUDGETS.map((b) => (
                            <button key={b} type="button" onClick={() => setBudget(b)} aria-pressed={budget === b} className={chipClass(budget === b)}>
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p id="enquiry-duration-label" className={labelClass}>How long?</p>
                        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="enquiry-duration-label">
                          {DURATIONS.map((d) => (
                            <button key={d} type="button" onClick={() => setDuration(d)} aria-pressed={duration === d} className={chipClass(duration === d)}>
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="enquiry-brief" className={labelClass}>Brief <span className={optionalClass}>(optional)</span></label>
                        <textarea
                          id="enquiry-brief"
                          rows={3}
                          maxLength={700}
                          value={brief}
                          onChange={(e) => setBrief(e.target.value)}
                          placeholder="Product, audience, dates, deliverables…"
                          className={inputClass + " resize-y min-h-[5.5rem]"}
                        />
                      </div>
                    </Step>

                    <Step n={3} title="Your details">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="enquiry-brand" className={labelClass}>Brand or agency name *</label>
                          <input
                            id="enquiry-brand"
                            type="text"
                            autoComplete="organization"
                            placeholder="Your brand or agency"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            {...errorProps("enquiry-brand", invalidField)}
                            aria-required="true"
                            className={inputClass}
                          />
                          <FieldError fieldId="enquiry-brand" invalidField={invalidField} message={errorMsg} />
                        </div>
                        <div>
                          <label htmlFor="enquiry-city" className={labelClass}>City</label>
                          <select id="enquiry-city" value={clientCity} onChange={(e) => setClientCity(e.target.value)} className={inputClass}>
                            {CITIES.map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
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
                            {...errorProps("enquiry-email", invalidField)}
                            aria-required="true"
                            className={inputClass}
                          />
                          <FieldError fieldId="enquiry-email" invalidField={invalidField} message={errorMsg} />
                        </div>
                        <div>
                          <label htmlFor="enquiry-phone" className={labelClass}>Mobile *</label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                            <input
                              id="enquiry-phone"
                              type="tel"
                              inputMode="tel"
                              autoComplete="tel"
                              placeholder="+91 98765 43210"
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                              {...errorProps("enquiry-phone", invalidField, "enquiry-phone-help")}
                              aria-required="true"
                              className={inputClass + " pl-10"}
                            />
                          </div>
                          <FieldError fieldId="enquiry-phone" invalidField={invalidField} message={errorMsg} />
                          <p id="enquiry-phone-help" className={helpClass}>10 to 15 digits, +91 preferred.</p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={isWhatsappPreferred} onChange={(e) => setIsWhatsappPreferred(e.target.checked)} className="accent-[#94652A] w-4 h-4" />
                        <span className="text-[0.9375rem] text-ink-2">You can also contact me on WhatsApp</span>
                      </label>
                      <details className="group">
                        <summary className="cursor-pointer text-[0.875rem] font-semibold text-ink list-none [&::-webkit-details-marker]:hidden">
                          <span className="underline underline-offset-4 decoration-line-strong">Add GSTIN or PAN</span> <span className={optionalClass}>(optional, for a proforma invoice)</span>
                        </summary>
                        <div className="relative mt-3">
                          <label htmlFor="enquiry-gstin" className="sr-only">GSTIN or corporate PAN</label>
                          <Landmark className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                          <input
                            id="enquiry-gstin"
                            type="text"
                            placeholder="e.g. 27AAAAA1111A1Z1"
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value)}
                            className={inputClass + " pl-10 uppercase"}
                          />
                        </div>
                      </details>
                    </Step>

                    {errorMsg && !invalidField && (
                      <div role="alert" className={errorBoxClass}>
                        {errorMsg}
                      </div>
                    )}
                  </form>
                ) : (
                  /* Success receipt */
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 md:p-8 space-y-6" id="collaboration-success-credential" role="status">
                    <div className="p-6 md:p-8 border border-line bg-surface text-center space-y-5">
                      <div className="mx-auto w-12 h-12 flex items-center justify-center text-[#2f6b45]">
                        <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <p className="eyebrow">Enquiry received</p>
                        <h3 className="font-display text-[1.625rem] text-ink">Thank you, we have your enquiry</h3>
                      </div>
                      <dl className="border-t border-b border-line py-4 space-y-2 text-left text-[0.9375rem]">
                        {[
                          ["Reference", submittedCredential.bookingId, "font-mono font-bold"],
                          ["Brand", submittedCredential.brandName, "font-semibold"],
                          ["Creator", submittedCredential.creatorName === ANY_CREATOR ? "Suggest creators" : submittedCredential.creatorName, "font-semibold"],
                          ["Campaign", submittedCredential.campaignType, "font-semibold"],
                          ["Budget", submittedCredential.budget, "font-semibold"],
                          ["City", submittedCredential.clientCity, "font-semibold"]
                        ].map(([term, value, weight]) => (
                          <div key={term} className="flex justify-between gap-4">
                            <dt className="text-ink-3">{term}</dt>
                            <dd className={`text-ink text-right ${weight}`}>{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="text-[0.9375rem] text-ink-2 leading-relaxed">
                        Our team will contact you at <strong className="text-ink">{contactEmail}</strong>
                        {isWhatsappPreferred ? " or on WhatsApp" : ""}. Please keep your reference number for any follow-up.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button type="button" onClick={onClose} className="btn btn-primary w-full">Done</button>
                      <button type="button" onClick={handleReset} className="btn btn-secondary w-full">Send another enquiry</button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Send button stays in view while the form scrolls */}
              {!submittedCredential && (
                <div className="border-t border-line bg-paper px-5 md:px-8 py-4 space-y-2">
                  <button
                    type="submit"
                    form="brand-enquiry-form"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="btn btn-primary w-full h-12 disabled:opacity-70 disabled:cursor-wait"
                    id="submit-collaboration-charter-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-t-transparent border-[#FAF9F6] rounded-full animate-spin" aria-hidden="true" />
                        Sending enquiry…
                      </>
                    ) : (
                      <>
                        Send enquiry <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                  <p className="text-[0.75rem] text-ink-3 text-center">Fees and dates are agreed with the creator. We do not promise availability or results.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
