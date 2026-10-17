import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Briefcase, ShieldCheck, ArrowRight, CheckCircle2, Users, X } from "lucide-react";
import { useDialog, Portal } from "../lib/dialog";
import {
  inputClass, labelClass, optionalClass, errorBoxClass,
  isValidEmail, isValidPhone, EMAIL_ERROR, PHONE_ERROR, focusField
} from "../lib/forms";

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
    pitch: "",
    escrowConsent: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [invalidField, setInvalidField] = useState("");
  const closeDrawer = () => setSelectedCampaign(null);
  const dialogRef = useDialog<HTMLDivElement>(!!selectedCampaign, closeDrawer);

  const campaigns: Campaign[] = [
    {
      id: "sabya-2026",
      brand: "Sabyasachi Heritage",
      title: "Royal Couture & Bridal Campaign Showcase",
      niche: "Royal Ethnic Couture",
      budget: "₹3,50,000 - ₹8,00,000",
      requirements: "150K+ Reach with verified lifestyle aesthetics",
      duration: "3 Weeks",
      location: "Jaipur Palace / Mumbai Studio",
      perks: [
        "Private runway session with brand curators",
        "Keep 1 custom-tailored bespoke ensemble (valued at ₹4L)",
        "Premium cover photography in Vogue India",
        "Direct verified star bank wire escort"
      ],
      description: "Step into the royal lineage of Indian haute couture. Sabyasachi Heritage is selecting 5 elite creators nationwide for our prestigious Autumn Bridal Collection. Creators will walk the historic courtyards of Jaipur palace and showcase intricate hand-woven zardozi creations."
    },
    {
      id: "taj-2026",
      brand: "Taj Luxury Hotels",
      title: "The Art of Slow Living - Summer Retreat",
      niche: "Premium Hospitality & Travel",
      budget: "₹2,00,000 + Luxe Stay",
      requirements: "80K+ Reach, premium travel videography focus",
      duration: "4 Days (Active)",
      location: "Udaipur & Goa Properties",
      perks: [
        "4-Night presidential suite hospitality",
        "Fully covered premium culinary curation and spa treatments",
        "Travel cost allowances (Business Class flights covered)",
        "Long-term ambassador options"
      ],
      description: "Immerse in unmatched Indian hospitality. Taj Luxury Hotels invites 6 travel and lifestyle connoisseurs to capture the quiet, warm essence of our iconic heritage properties. High-definition cinematic reels and photo essays are expected."
    },
    {
      id: "vogue-2026",
      brand: "Vogue India",
      title: "Avant-Garde digital cover shoot",
      niche: "High Fashion & Editorial",
      budget: "₹5,00,000",
      requirements: "300K+ Reach, professional editorial experience",
      duration: "Single Cover Event",
      location: "Mumbai Studios",
      perks: [
        "Primary model feature on the Digital Cover edition",
        "Full publicity and editorial interview with Chief Curator",
        "High-definition photography asset usage rights",
        "VIP invitations to the Vogue Fashion Gala 2026"
      ],
      description: "Break the barriers of convention. Vogue India is curating a special digital cover celebrating 'Indo-Futurism'. We are seeking a verified creator with deep expressive posture and bold stylistic integrity to lead the campaign."
    },
    {
      id: "oneplus-2026",
      brand: "OnePlus Elite",
      title: "Nord Creator Wave: Fusing Tech & Style",
      niche: "Premium Tech & Lifestyle",
      budget: "₹1,80,000 + Flagship Device",
      requirements: "50K+ Reach, high-quality unboxing and transition reels",
      duration: "2 Months",
      location: "Pan-India Digital Campaign",
      perks: [
        "Keep OnePlus Flagship ecosystem (Phone, Watch, Buds valued at ₹1.2L)",
        "Featured on official OnePlus India social accounts",
        "Direct contract for upcoming device launches",
        "Sponsored tech-setup makeover"
      ],
      description: "OnePlus is looking for 10 creators who represent the perfect convergence of high technology and daily style. Review, unbox, and design interactive transition reels showcasing our upcoming Nord ecosystem with minimal aesthetics."
    }
  ];

  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setActiveCampaigns(data);
        } else {
          setActiveCampaigns(campaigns);
        }
      })
      .catch(() => {
        setActiveCampaigns(campaigns);
      });
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
        setFormData({ name: "", email: "", phone: "", instagram: "", pitch: "", escrowConsent: true });
      })
      .catch((err: Error) => {
        // Never show a fake confirmation
        setErrorMsg((err.message || "Your application could not be sent.") + " Your details are still here — please try again.");
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-12 space-y-8" id="campaigns-tab-container">
      {/* Title */}
      <div className="text-center md:text-left space-y-2">
        <span className="font-sans text-xs tracking-[0.3em] text-[#8E8D8A] uppercase font-bold block">
          FSIA Collaboration Desk
        </span>
        <h1 className="font-serif-display text-3xl md:text-5xl font-bold tracking-tight text-[#111]">
          Live Brand Campaigns
        </h1>
        <p className="font-serif-text italic text-[#2e2c29] text-base md:text-lg leading-relaxed max-w-2xl">
          Apply directly to premium brand sponsorships. FSIA Influencer operates 100% secure escrow contracts ensuring creators receive full payment within 24 hours of campaign verification.
        </p>
      </div>

      {/* Campaigns list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeCampaigns.map((campaign) => {
          const isApplied = appliedCampaigns.includes(campaign.id);
          return (
            <motion.div
              key={campaign.id}
              className="bg-white/60 border border-black/5 rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:shadow-md transition-all relative overflow-hidden"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                {/* Brand Name & Budget */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-sans text-champagne font-bold tracking-widest uppercase block">
                      {campaign.brand}
                    </span>
                    <h3 className="font-serif-display text-xl font-bold text-[#111] mt-0.5">
                      {campaign.title}
                    </h3>
                  </div>
                  <span className="bg-[#111] text-[#FAF9F6] text-[11px] font-sans font-bold tracking-wider px-3 py-1 rounded-full whitespace-nowrap">
                    {campaign.budget}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 text-[11px] font-sans">
                  <span className="bg-[#FAF9F6] border border-black/5 text-[#555] px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold">
                    <Briefcase className="w-3.5 h-3.5 text-champagne" /> {campaign.niche}
                  </span>
                  <span className="bg-[#FAF9F6] border border-black/5 text-[#555] px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-champagne" /> {campaign.duration}
                  </span>
                  <span className="bg-[#FAF9F6] border border-black/5 text-[#555] px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold">
                    <Users className="w-3.5 h-3.5 text-champagne" /> {campaign.requirements}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-[#2e2c29] leading-relaxed">
                  {campaign.description}
                </p>

                {/* Key perks */}
                <div className="space-y-1.5 pt-2">
                  <span className="block text-[11px] font-sans tracking-[0.2em] text-[#8E8D8A] uppercase font-bold">
                    VIP COMPENSATIONS & PERKS:
                  </span>
                  <ul className="text-[13px] text-[#2e2c29] space-y-1.5 pl-1">
                    {campaign.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-tight">
                        <span className="text-champagne mt-0.5">•</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#8E8D8A] uppercase">
                  LOC: {campaign.location}
                </span>
                {isApplied ? (
                  <span className="text-emerald-600 font-sans text-xs font-bold flex items-center gap-1 bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> APPLICATION SUBMITTED
                  </span>
                ) : (
                  <button
                    onClick={() => handleApplyClick(campaign)}
                    aria-label={`Apply now for ${campaign.brand}: ${campaign.title}`}
                    className="bg-[#111] hover:bg-[#222] text-[#FAF9F6] text-xs font-sans font-bold tracking-widest py-2.5 px-5 rounded-lg uppercase transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    APPLY NOW <ArrowRight className="w-3.5 h-3.5 text-champagne" aria-hidden="true" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

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
              className="relative w-full md:max-w-xl h-full bg-[#FAF9F6] shadow-2xl flex flex-col border-l border-black/5 z-10 outline-none"
              id="campaign-application-drawer"
            >
              {/* Header */}
              <div className="p-5 md:p-8 border-b border-black/10 flex items-center justify-between gap-4 bg-[#F4F3F0]">
                <div>
                  <span className="font-sans text-[11px] tracking-[0.2em] text-[#47453f] uppercase font-bold">
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
                  className="w-11 h-11 shrink-0 rounded-full border border-black/15 flex items-center justify-center text-[#222] hover:bg-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
                {!successMessage ? (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    {/* Safe Escrow Info */}
                    <div className="p-4 bg-white border border-black/10 rounded-xl text-sm text-[#2e2c29] leading-relaxed space-y-2">
                      <div className="flex items-center gap-2 text-champagne font-bold uppercase tracking-[0.15em] text-[11px] font-sans">
                        <ShieldCheck className="w-4 h-4 text-champagne" aria-hidden="true" />
                        Secured INR bank wire guarantee
                      </div>
                      FSIA acts as a central financial clearing agent. Upon contract signing, the {selectedCampaign.brand} escrow secures 100% of the funds. Payout is processed instantly following visual content publication checks.
                    </div>
                    <p className="text-[13px] text-[#47453f]">Fields marked * are required.</p>

                    <div>
                      <label htmlFor="campaign-name" className={labelClass}>Full legal name *</label>
                      <input
                        id="campaign-name"
                        type="text"
                        name="name"
                        autoComplete="name"
                        aria-required="true"
                        aria-invalid={invalidField === "campaign-name" || undefined}
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Deepika Sharma"
                        className={inputClass}
                      />
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
                          aria-invalid={invalidField === "campaign-email" || undefined}
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="you@example.com"
                          className={inputClass}
                        />
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
                          aria-invalid={invalidField === "campaign-phone" || undefined}
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+91 98765 43210"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="campaign-social" className={labelClass}>Social handle or profile link *</label>
                      <input
                        id="campaign-social"
                        type="text"
                        name="instagram"
                        aria-required="true"
                        aria-invalid={invalidField === "campaign-social" || undefined}
                        value={formData.instagram}
                        onChange={handleInputChange}
                        placeholder="instagram.com/username or youtube.com/@channel"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label htmlFor="campaign-pitch" className={labelClass}>
                        Brief pitch or style concept <span className={optionalClass}>(optional)</span>
                      </label>
                      <textarea
                        id="campaign-pitch"
                        rows={4}
                        name="pitch"
                        value={formData.pitch}
                        onChange={handleInputChange}
                        placeholder={`How would you present ${selectedCampaign.brand}? Describe your style, lighting and mood.`}
                        className={inputClass}
                      />
                    </div>

                    {/* Escrow consent */}
                    <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={formData.escrowConsent}
                        onChange={(e) => setFormData(prev => ({ ...prev, escrowConsent: e.target.checked }))}
                        className="accent-[#111] w-4 h-4 mt-0.5 shrink-0"
                      />
                      <span className="text-[13px] text-[#2e2c29] leading-relaxed">
                        I agree to the <strong>FSIA Verified escrow arbitration protocols</strong>. I authorize the board to review my social audit parameters and coordinate direct bank wiring contract upon compliance with campaign briefs.
                      </span>
                    </label>

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
                      className="w-full bg-[#111] hover:bg-[#2e2c29] text-[#FAF9F6] font-sans text-sm tracking-[0.12em] font-bold py-4 rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-70 disabled:cursor-wait"
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
                  <div role="status" className="p-6 md:p-8 border border-black/10 bg-white rounded-2xl shadow-xl text-center space-y-6 relative overflow-hidden">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto">
                      <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                    </div>

                    <div className="space-y-1">
                      <span className="font-sans text-[11px] tracking-[0.2em] text-[#47453f] uppercase font-bold">
                        Application received
                      </span>
                      <h3 className="font-serif-display text-xl md:text-2xl text-[#111] font-bold">
                        Thank you for applying
                      </h3>
                    </div>

                    <p className="text-sm text-[#2e2c29] leading-relaxed">
                      Your application for <strong className="text-[#111]">{selectedCampaign?.brand}</strong> has been sent to the FSIA Influencer team. We'll review your profile and get in touch at <strong className="text-[#111]">{submittedEmail}</strong> or on WhatsApp.
                    </p>

                    <button
                      type="button"
                      onClick={closeDrawer}
                      className="w-full bg-[#111] hover:bg-[#2e2c29] text-[#FAF9F6] font-sans text-sm tracking-[0.12em] font-bold py-3.5 px-6 rounded-xl uppercase cursor-pointer"
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
