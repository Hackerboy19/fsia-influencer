import React, { useState, useEffect } from "react";
import { routeForTab } from "../seo";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { useDialog, Portal } from "../lib/dialog";
import {
  inputClass, labelClass, optionalClass, errorBoxClass,
  isValidEmail, isValidPhone, EMAIL_ERROR, PHONE_ERROR, focusField
} from "../lib/forms";
import FieldError, { errorProps } from "./FieldError";
import { isPreviewHost } from "../lib/preview";

interface Campaign {
  id: string;
  brand: string;
  title: string;
  niche: string;
  budget: string;
  requirements: string;
  duration: string;
  location: string;
  perks: string[];
  description: string;
}

export default function CampaignsTab() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [appliedCampaigns, setAppliedCampaigns] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    instagram: "",
    pitch: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [invalidField, setInvalidField] = useState("");
  const closeDrawer = () => setSelectedCampaign(null);
  const dialogRef = useDialog<HTMLDivElement>(!!selectedCampaign, closeDrawer);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        setActiveCampaigns(Array.isArray(data) ? data : []);
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, []);

  const handleApplyClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setSuccessMessage(false);
    setErrorMsg("");
    setInvalidField("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || isSubmitting) return;
    const problem =
      !formData.name.trim() ? { field: "campaign-name", message: "Please enter your full name." } :
      !isValidEmail(formData.email) ? { field: "campaign-email", message: EMAIL_ERROR } :
      !isValidPhone(formData.phone) ? { field: "campaign-phone", message: PHONE_ERROR } :
      !formData.instagram.trim() ? { field: "campaign-social", message: "Please add your social handle or a link to your profile." } : null;
    if (problem) {
      setInvalidField(problem.field);
      setErrorMsg(problem.message);
      focusField(problem.field);
      return;
    }

    setIsSubmitting(true);
    setInvalidField("");
    setErrorMsg("");

    fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "campaign",
        subject: `${selectedCampaign.brand} — ${selectedCampaign.title}`,
        refId: selectedCampaign.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        details: { instagram: formData.instagram, pitch: formData.pitch }
      })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Your application could not be sent.");
        setSubmittedEmail(formData.email);
        setSuccessMessage(true);
        setAppliedCampaigns((prev) => [...prev, selectedCampaign.id]);
        setFormData({ name: "", email: "", phone: "", instagram: "", pitch: "" });
      })
      .catch((err: Error) => {
        // Never show a fake confirmation
        setErrorMsg((err.message || "Your application could not be sent.") + " Your details are still here — please try again.");
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="page pt-10 md:pt-14 pb-16" id="campaigns-tab-container">
      <header className="max-w-3xl space-y-3">
        <p className="eyebrow">For creators</p>
        <h1 className="h-page">{routeForTab("campaigns").heading}</h1>
        <p className="lede">{routeForTab("campaigns").intro}</p>
      </header>

      <div className="mt-10" aria-live="polite">
        {loadState === "loading" && <p className="text-ink-2">Loading campaigns…</p>}
        {loadState === "error" && (
          <p className="border border-line bg-surface p-6 text-ink-2">
            {isPreviewHost()
              ? "Open campaigns are listed on the live site. This preview does not include campaign data."
              : "Campaigns could not be loaded right now. Please refresh the page or try again later."}
          </p>
        )}
        {loadState === "ready" && activeCampaigns.length === 0 && (
          <p className="border border-line bg-surface p-6 text-ink-2">
            There are no open campaigns at the moment. New briefs are added here as brands send them.
          </p>
        )}
      </div>

      {activeCampaigns.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {activeCampaigns.map((campaign) => {
            const isApplied = appliedCampaigns.includes(campaign.id);
            const facts = [
              ["Budget", campaign.budget],
              ["Niche", campaign.niche],
              ["Duration", campaign.duration],
              ["Location", campaign.location],
              ["Who can apply", campaign.requirements]
            ].filter(([, v]) => v && String(v).trim());
            return (
              <li key={campaign.id} className="py-8 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                <div className="space-y-3 min-w-0">
                  {campaign.brand && <p className="eyebrow">{campaign.brand}</p>}
                  <h2 className="font-display text-[1.625rem] leading-tight text-ink">{campaign.title}</h2>
                  {campaign.description && <p className="text-ink-2 leading-relaxed">{campaign.description}</p>}
                  {campaign.perks?.length > 0 && (
                    <div>
                      <h3 className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-2">Includes</h3>
                      <ul className="list-disc pl-5 space-y-1 text-[0.9375rem] text-ink-2 marker:text-ink-3">
                        {campaign.perks.map((perk, idx) => (
                          <li key={idx}>{perk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <dl className="divide-y divide-line border-y border-line text-[0.9375rem]">
                    {facts.map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-6 py-2.5">
                        <dt className="text-ink-3">{label}</dt>
                        <dd className="text-ink text-right font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {isApplied ? (
                    <p className="inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-[#2f6b45]">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Application sent
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApplyClick(campaign)}
                      aria-label={`Apply for ${campaign.brand ? `${campaign.brand}: ` : ""}${campaign.title}`}
                      className="btn btn-primary"
                    >
                      Apply for this campaign <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Slide-over Form Overlay for Campaign Application */}
      <Portal>
      <AnimatePresence>
        {selectedCampaign && (
          <div className="fixed inset-0 z-[60] flex justify-end overflow-hidden bg-black/30 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={closeDrawer} aria-hidden="true" />

            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="campaign-dialog-title"
              tabIndex={-1}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 180 }}
              className="relative w-full md:max-w-xl h-full bg-paper shadow-2xl flex flex-col border-l border-line z-10 outline-none"
              id="campaign-application-drawer"
            >
              {/* Header */}
              <div className="p-5 md:p-8 border-b border-black/10 flex items-center justify-between gap-4 bg-[#F4F3F0]">
                <div>
                  <span className="eyebrow">
                    Campaign application
                  </span>
                  <h2 id="campaign-dialog-title" className="font-serif-display text-lg md:text-xl text-[#111] tracking-tight mt-1">
                    Apply for {selectedCampaign.brand}
                  </h2>
                  <p className="text-sm text-[#2e2c29] mt-0.5">{selectedCampaign.title}</p>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label="Close campaign application"
                  className="w-11 h-11 shrink-0 rounded-[4px] flex items-center justify-center text-ink hover:bg-sunken transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
                {!successMessage ? (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <p className="text-[0.9375rem] text-ink-2 leading-relaxed">
                      Your application goes to our team. If your profile fits the brief, we share it with the brand and contact you about terms before any work starts.
                    </p>
                    <p className="text-[0.875rem] text-ink-3">Fields marked * are required.</p>

                    <div>
                      <label htmlFor="campaign-name" className={labelClass}>Full name *</label>
                      <input
                        id="campaign-name"
                        type="text"
                        name="name"
                        autoComplete="name"
                        aria-required="true"
                        {...errorProps("campaign-name", invalidField)}
                        value={formData.name}
                        onChange={handleInputChange}
                        
                        className={inputClass}
                      />
                      <FieldError fieldId="campaign-name" invalidField={invalidField} message={errorMsg} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="campaign-email" className={labelClass}>Email *</label>
                        <input
                          id="campaign-email"
                          type="email"
                          name="email"
                          inputMode="email"
                          autoComplete="email"
                          aria-required="true"
                          {...errorProps("campaign-email", invalidField)}
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="you@example.com"
                          className={inputClass}
                        />
                        <FieldError fieldId="campaign-email" invalidField={invalidField} message={errorMsg} />
                      </div>
                      <div>
                        <label htmlFor="campaign-phone" className={labelClass}>WhatsApp number *</label>
                        <input
                          id="campaign-phone"
                          type="tel"
                          name="phone"
                          inputMode="tel"
                          autoComplete="tel"
                          aria-required="true"
                          {...errorProps("campaign-phone", invalidField)}
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+91 98765 43210"
                          className={inputClass}
                        />
                        <FieldError fieldId="campaign-phone" invalidField={invalidField} message={errorMsg} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="campaign-social" className={labelClass}>Social handle or profile link *</label>
                      <input
                        id="campaign-social"
                        type="text"
                        name="instagram"
                        aria-required="true"
                        {...errorProps("campaign-social", invalidField)}
                        value={formData.instagram}
                        onChange={handleInputChange}
                        placeholder="instagram.com/username or youtube.com/@channel"
                        className={inputClass}
                      />
                      <FieldError fieldId="campaign-social" invalidField={invalidField} message={errorMsg} />
                    </div>

                    <div>
                      <label htmlFor="campaign-pitch" className={labelClass}>
                        Why you are a good fit <span className={optionalClass}>(optional)</span>
                      </label>
                      <textarea
                        id="campaign-pitch"
                        rows={4}
                        name="pitch"
                        value={formData.pitch}
                        onChange={handleInputChange}
                        placeholder="A few lines on why this brief suits you, and links to similar work."
                        className={inputClass}
                      />
                    </div>

                    {errorMsg && !invalidField && (
                      <div role="alert" className={errorBoxClass}>
                        {errorMsg}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                      className="btn btn-primary w-full disabled:opacity-70 disabled:cursor-wait"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-t-transparent border-[#FAF9F6] rounded-full animate-spin" aria-hidden="true" />
                          Sending…
                        </>
                      ) : (
                        <>
                          Send application
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Success Screen */
                  <div role="status" className="p-6 md:p-8 border border-line bg-surface text-center space-y-6 relative overflow-hidden">
                    <div className="w-12 h-12 flex items-center justify-center text-[#2f6b45] mx-auto">
                      <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                    </div>

                    <div className="space-y-1">
                      <span className="eyebrow">
                        Application received
                      </span>
                      <h3 className="font-serif-display text-xl md:text-2xl text-[#111] font-bold">
                        Thank you for applying
                      </h3>
                    </div>

                    <p className="text-sm text-[#2e2c29] leading-relaxed">
                      Your application for <strong className="text-[#111]">{selectedCampaign?.brand}</strong> has been sent to our team. We'll review your profile and get in touch at <strong className="text-[#111]">{submittedEmail}</strong> or on WhatsApp.
                    </p>

                    <button
                      type="button"
                      onClick={closeDrawer}
                      className="btn btn-primary w-full"
                    >
                      Back to campaigns
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </Portal>
    </div>
  );
}
