import React, { useState, useEffect } from "react";
import { routeForTab } from "../seo";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, Star, Award, CheckCircle2, DollarSign, ArrowRight, HelpCircle, X } from "lucide-react";
import { useDialog, Portal } from "../lib/dialog";
import {
  inputClass, labelClass, optionalClass, errorBoxClass,
  isValidEmail, isValidPhone, EMAIL_ERROR, PHONE_ERROR, focusField
} from "../lib/forms";

interface Plan {
  id?: string;
  name: string;
  badge: string;
  price: string;
  period: string;
  accent: string;
  icon: any;
  perks: string[];
  popular?: boolean;
}

const ICON_MAP: Record<string, any> = {
  Star,
  Shield,
  Award,
  Sparkles
};

const FALLBACK_PLANS: Plan[] = [
  {
    id: "elite-star",
    name: "Elite Star",
    badge: "Standard Entry",
    price: "₹0",
    period: "Always Free",
    accent: "#8E8D8A",
    icon: Star,
    perks: [
      "Registry inclusion in the standard FSIA database",
      "Basic creator profile page accessible to search queries",
      "Apply to general public brand campaigns",
      "Standard digital copy of your FSIA credentials"
    ]
  },
  {
    id: "silver-star",
    name: "Silver Star",
    badge: "Verified Status",
    price: "₹4,999",
    period: "per month (+18% GST)",
    accent: "#C5C3C0", // Brushed Platinum
    icon: Shield,
    popular: false,
    perks: [
      "Verified Silver Star verification badge on your profile",
      "Higher ranking in brand matching search inquiries",
      "Up to 3 automated direct matchmaking recommendations per month",
      "Invitations to state-level regional model meetups",
      "Priority support from the FSIA helpdesk"
    ]
  },
  {
    id: "gold-star",
    name: "Gold Star",
    badge: "Professional Spotlight",
    price: "₹9,999",
    period: "per month (+18% GST)",
    accent: "#F59E0B", // Champagne Gold
    icon: Award,
    popular: true,
    perks: [
      "Verified Gold Star profile badge and priority listing",
      "1 Professional couture portfolio shoot per year at local hub",
      "10 Guaranteed brand match pitches submitted by FSIA team",
      "Spotlight feature in the weekly FSIA Brand Newsletter",
      "Dedicated access to our partner digital agency network",
      "15% Discount on runway Brand Campaign entry vouchers"
    ]
  },
  {
    id: "royal-star",
    name: "Royal Star Club",
    badge: "The Ultimate Royal Crest",
    price: "₹24,999",
    period: "per month (+18% GST)",
    accent: "#111111", // Deep obsidian
    icon: Sparkles,
    perks: [
      "Bespoke Obsidian 'Royal Star Club' crest of excellence",
      "Dedicated personal talent manager & collaboration counsel",
      "1 Professional PR press release across Times of India / HT",
      "VIP front-row seating passes to national Brand Campaigns & runway shows",
      "Direct legal escrow protection on all brand assignments",
      "Unlimited direct pitch access to global luxury houses"
    ]
  }
];

export default function MembershipTab() {
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"form" | "success">("form");
  const [requestError, setRequestError] = useState("");
  const [requestRef, setRequestRef] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const closeDrawer = () => setSelectedPlan(null);
  const dialogRef = useDialog<HTMLDivElement>(!!selectedPlan, closeDrawer);
  const [billingDetails, setBillingDetails] = useState({
    name: "",
    email: "",
    phone: "",
    pan: "",
    gstin: ""
  });

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/membership-plans");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const mapped = data.map((p: any) => ({
              ...p,
              icon: ICON_MAP[p.icon] || Star
            }));
            setPlans(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch membership plans, falling back:", err);
      }
    }
    fetchPlans();
  }, []);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || isProcessing) return;
    const problem =
      !billingDetails.name.trim() ? { field: "plan-name", message: "Please enter your full name." } :
      !isValidEmail(billingDetails.email) ? { field: "plan-email", message: EMAIL_ERROR } :
      !isValidPhone(billingDetails.phone) ? { field: "plan-phone", message: PHONE_ERROR } : null;
    if (problem) {
      setInvalidField(problem.field);
      setRequestError(problem.message);
      focusField(problem.field);
      return;
    }
    setInvalidField("");

    // No payment is taken online: the request goes to the team, who send payment details
    setIsProcessing(true);
    setRequestError("");
    const totals = calculateTotal(selectedPlan.price);
    fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "membership",
        subject: `${selectedPlan.name} plan`,
        refId: selectedPlan.id,
        name: billingDetails.name.trim(),
        email: billingDetails.email.trim(),
        phone: billingDetails.phone.trim(),
        details: {
          plan: selectedPlan.name,
          price: `${selectedPlan.price} ${selectedPlan.period}`,
          totalWithGst: totals.total ? `₹${totals.total.toLocaleString("en-IN")}` : "Free",
          pan: billingDetails.pan,
          gstin: billingDetails.gstin
        }
      })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Your request could not be sent.");
        setRequestRef(data.enquiry?.id || "");
        setCheckoutStep("success");
      })
      .catch((err: Error) => setRequestError((err.message || "Your request could not be sent.") + " Your details are still here — please try again."))
      .finally(() => setIsProcessing(false));
  };

  const calculateTotal = (priceStr: string) => {
    const numeric = parseInt(priceStr.replace(/[^0-9]/g, ""));
    if (isNaN(numeric) || numeric === 0) return { price: 0, gst: 0, total: 0 };
    const gst = Math.round(numeric * 0.18);
    const total = numeric + gst;
    return {
      price: numeric,
      gst,
      total
    };
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-12 space-y-8" id="membership-tab-container">
      {/* Title */}
      <div className="text-center md:text-left space-y-2">
        <span className="font-sans text-xs tracking-[0.3em] text-[#8E8D8A] uppercase font-bold block">
          FSIA Premium Clubs
        </span>
        <h1 className="font-serif-display text-3xl md:text-5xl font-bold tracking-tight text-[#111]">
          {routeForTab("membership").heading}
        </h1>
        <p className="font-serif-text italic text-[#2e2c29] text-base md:text-lg leading-relaxed max-w-2xl">
          {routeForTab("membership").intro}
        </p>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const PlanIcon = plan.icon;
          return (
            <motion.div
              key={plan.name}
              className={`bg-white/60 border rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:shadow-lg transition-all relative ${
                plan.popular ? "border-champagne ring-2 ring-champagne/15" : "border-black/5"
              }`}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-champagne text-[#111] text-[11px] font-sans font-bold tracking-wider whitespace-nowrap px-3 py-1 rounded-full uppercase shadow">
                  MOST POPULAR SELECTION
                </div>
              )}

              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] font-sans text-[#8E8D8A] tracking-wider uppercase font-semibold block">
                      {plan.badge}
                    </span>
                    <h3 className="font-serif-display text-2xl font-bold text-[#111]">
                      {plan.name}
                    </h3>
                  </div>
                  <div
                    className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border"
                    style={{ borderColor: plan.accent + "30", backgroundColor: plan.accent + "05" }}
                  >
                    <PlanIcon className="w-5 h-5" style={{ color: plan.accent === "#111111" ? "#F59E0B" : plan.accent }} />
                  </div>
                </div>

                {/* Pricing block */}
                <div>
                  <span className="text-3xl font-serif-display font-bold text-[#111]">{plan.price}</span>
                  <span className="text-[11px] font-sans text-[#888] block mt-0.5">{plan.period}</span>
                </div>

                {/* Divider */}
                <div className="w-full h-[1px] bg-black/5" />

                {/* List of perks */}
                <ul className="space-y-2.5">
                  {plan.perks.map((perk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[13px] leading-relaxed text-[#2e2c29]">
                      <CheckCircle2 className="w-4 h-4 text-champagne shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action */}
              <button
                onClick={() => {
                  if (plan.price === "₹0") {
                    // The free tier comes with standard registration
                    window.dispatchEvent(new CustomEvent("change-tab", { detail: "apply" }));
                  } else {
                    setSelectedPlan(plan);
                    setCheckoutStep("form");
                    setRequestError("");
                    setInvalidField("");
                  }
                }}
                className={`w-full font-sans text-xs tracking-wider font-bold py-3 px-4 rounded-lg uppercase transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                  plan.accent === "#111111"
                    ? "bg-[#111] hover:bg-[#2e2c29] text-[#FAF8F5]"
                    : "bg-[#F3F3F1] border border-black/10 hover:bg-[#111] hover:text-white text-[#111]"
                }`}
              >
                {plan.price === "₹0" ? "STANDARD ACCESS" : `ENROLL IN ${plan.name.toUpperCase()}`}
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Slide-over request drawer */}
      <Portal>
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-[60] flex justify-end overflow-hidden bg-black/30 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={closeDrawer} aria-hidden="true" />

            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="plan-dialog-title"
              tabIndex={-1}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 180 }}
              className="relative w-full md:max-w-xl h-full bg-[#FAF8F5] shadow-2xl flex flex-col border-l border-black/5 z-10 outline-none"
              id="payment-portal-drawer"
            >
              {/* Header */}
              <div className="p-5 md:p-8 border-b border-black/10 flex items-center justify-between gap-4 bg-[#F4F3F0]">
                <div>
                  <span className="font-sans text-[11px] tracking-[0.2em] text-[#47453f] uppercase font-bold">
                    Membership request
                  </span>
                  <h2 id="plan-dialog-title" className="font-serif-display text-lg md:text-xl text-[#111] tracking-tight mt-1">
                    Join {selectedPlan.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label="Close membership request"
                  className="w-11 h-11 shrink-0 rounded-full border border-black/15 flex items-center justify-center text-[#222] hover:bg-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
                {checkoutStep === "form" ? (
                  <form onSubmit={handleCheckoutSubmit} noValidate className="space-y-5">
                    {/* Price summary */}
                    <div className="p-5 bg-white border border-black/10 rounded-2xl shadow-sm space-y-4">
                      <h3 className="text-[11px] font-sans tracking-[0.2em] text-[#47453f] uppercase font-bold border-b border-black/10 pb-2">
                        Price summary
                      </h3>
                      <dl className="space-y-2 text-sm text-[#2e2c29]">
                        <div className="flex justify-between gap-3">
                          <dt>{selectedPlan.name} base subscription</dt>
                          <dd className="font-semibold text-[#111]">{selectedPlan.price}.00</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt>Integrated GST (18%)</dt>
                          <dd className="font-semibold text-[#111]">
                            ₹{calculateTotal(selectedPlan.price).gst.toLocaleString("en-IN")}.00
                          </dd>
                        </div>
                        <div className="w-full h-[1px] bg-black/10 my-2" />
                        <div className="flex justify-between gap-3 font-bold text-[#111]">
                          <dt>Grand total (INR)</dt>
                          <dd>₹{calculateTotal(selectedPlan.price).total.toLocaleString("en-IN")}.00</dd>
                        </div>
                      </dl>
                    </div>
                    <p className="text-[13px] text-[#47453f]">Fields marked * are required.</p>

                    {/* Billing details */}
                    <div>
                      <label htmlFor="plan-name" className={labelClass}>Full name (for the invoice) *</label>
                      <input
                        id="plan-name"
                        type="text"
                        autoComplete="name"
                        aria-required="true"
                        aria-invalid={invalidField === "plan-name" || undefined}
                        value={billingDetails.name}
                        onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Deepika Sharma"
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="plan-email" className={labelClass}>Billing email *</label>
                        <input
                          id="plan-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          aria-required="true"
                          aria-invalid={invalidField === "plan-email" || undefined}
                          value={billingDetails.email}
                          onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="you@example.com"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="plan-phone" className={labelClass}>Phone (WhatsApp) *</label>
                        <input
                          id="plan-phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          aria-required="true"
                          aria-invalid={invalidField === "plan-phone" || undefined}
                          value={billingDetails.phone}
                          onChange={(e) => setBillingDetails(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+91 98765 43210"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="plan-pan" className={labelClass}>PAN <span className={optionalClass}>(optional)</span></label>
                        <input
                          id="plan-pan"
                          type="text"
                          value={billingDetails.pan}
                          onChange={(e) => setBillingDetails(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                          placeholder="ABCDE1234F"
                          maxLength={10}
                          className={inputClass + " uppercase font-mono"}
                        />
                      </div>
                      <div>
                        <label htmlFor="plan-gstin" className={labelClass}>GSTIN <span className={optionalClass}>(optional)</span></label>
                        <input
                          id="plan-gstin"
                          type="text"
                          value={billingDetails.gstin}
                          onChange={(e) => setBillingDetails(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                          placeholder="27AAAAA1111A1Z1"
                          maxLength={15}
                          className={inputClass + " uppercase font-mono"}
                        />
                      </div>
                    </div>

                    {/* Payment notice */}
                    <div className="p-4 bg-white border border-black/10 rounded-xl text-[13px] text-[#2e2c29] flex items-start gap-2 leading-relaxed">
                      <HelpCircle className="w-5 h-5 text-champagne shrink-0 mt-0.5" aria-hidden="true" />
                      <span>
                        No payment is taken on this page. After you send this request, our team will confirm your plan and share secure payment details by email or WhatsApp.
                      </span>
                    </div>

                    {requestError && (
                      <div role="alert" className={errorBoxClass}>
                        {requestError}
                      </div>
                    )}

                    {/* Request button */}
                    <button
                      type="submit"
                      disabled={isProcessing}
                      aria-busy={isProcessing}
                      className="w-full bg-[#111] hover:bg-[#2e2c29] text-[#FAF8F5] font-sans text-sm tracking-[0.12em] font-bold py-4 rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-70 disabled:cursor-wait"
                    >
                      {isProcessing ? (
                        <>
                          <span className="w-4 h-4 border-2 border-t-transparent border-[#FAF8F5] rounded-full animate-spin" aria-hidden="true" />
                          Sending request…
                        </>
                      ) : (
                        <>
                          Request this plan
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Payment Success Screen */
                  <div role="status" className="p-6 md:p-8 border border-black/10 bg-white rounded-2xl shadow-xl text-center space-y-6 relative overflow-hidden">
                    <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center text-champagne mx-auto">
                      <Award className="w-8 h-8 text-champagne" />
                    </div>

                    <div className="space-y-1">
                      <span className="font-sans text-[11px] tracking-[0.2em] text-[#47453f] uppercase font-bold">
                        Request received
                      </span>
                      <h3 className="font-serif-display text-xl md:text-2xl text-[#111] font-bold">
                        Thanks — we've received your {selectedPlan.name} request
                      </h3>
                    </div>

                    <div className="bg-white/90 border border-black/5 p-4 rounded-xl text-left space-y-2.5 font-sans text-sm text-[#2e2c29]">
                      <div className="flex justify-between gap-3">
                        <span>Name</span>
                        <strong className="text-[#111]">{billingDetails.name}</strong>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Plan requested</span>
                        <strong className="text-[#111]">{selectedPlan.name}</strong>
                      </div>
                      {requestRef && (
                        <div className="flex justify-between gap-3">
                          <span>Reference</span>
                          <strong className="font-mono text-[#111]">{requestRef}</strong>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-[#2e2c29] leading-relaxed">
                      Our team will contact you at <strong className="text-[#111]">{billingDetails.email}</strong> or on WhatsApp to confirm your plan and share payment details. Nothing has been charged.
                    </p>

                    <button
                      type="button"
                      onClick={closeDrawer}
                      className="w-full bg-[#111] hover:bg-[#2e2c29] text-[#FAF8F5] font-sans text-sm tracking-[0.12em] font-bold py-3.5 px-6 rounded-xl uppercase cursor-pointer"
                    >
                      Back to plans
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
