import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, Star, Award, CheckCircle2, DollarSign, ArrowRight, HelpCircle } from "lucide-react";

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
    period: "Forever Free",
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
    accent: "#E1C699", // Champagne Gold
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
    if (!billingDetails.name || !billingDetails.email || !billingDetails.phone) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCheckoutStep("success");
    }, 1800);
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
        <h2 className="font-serif-display text-3xl md:text-5xl font-bold tracking-tight text-[#111]">
          Prestige Membership Tiers
        </h2>
        <p className="font-serif-text italic text-[#666] text-sm md:text-base max-w-2xl">
          Elevate your creative brand index. Unlock professional couture photo sessions, verified status crests, PR press distributions, and direct matching with elite labels.
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
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-champagne text-white text-[9px] font-sans font-bold tracking-widest px-3 py-1 rounded-full uppercase shadow">
                  MOST POPULAR SELECTION
                </div>
              )}

              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-sans text-[#8E8D8A] tracking-wider uppercase font-semibold block">
                      {plan.badge}
                    </span>
                    <h3 className="font-serif-display text-2xl font-bold text-[#111]">
                      {plan.name}
                    </h3>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border"
                    style={{ borderColor: plan.accent + "30", backgroundColor: plan.accent + "05" }}
                  >
                    <PlanIcon className="w-5 h-5" style={{ color: plan.accent === "#111111" ? "#E1C699" : plan.accent }} />
                  </div>
                </div>

                {/* Pricing block */}
                <div>
                  <span className="text-3xl font-serif-display font-bold text-[#111]">{plan.price}</span>
                  <span className="text-[10px] font-sans text-[#888] block mt-0.5">{plan.period}</span>
                </div>

                {/* Divider */}
                <div className="w-full h-[1px] bg-black/5" />

                {/* List of perks */}
                <ul className="space-y-2.5">
                  {plan.perks.map((perk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-[#555] font-serif-text">
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
                    alert("Standard entry is automatically granted with standard registration. Please submit the registration form.");
                  } else {
                    setSelectedPlan(plan);
                    setCheckoutStep("form");
                  }
                }}
                className={`w-full font-sans text-[10px] tracking-widest font-bold py-3 px-4 rounded-lg uppercase transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                  plan.accent === "#111111"
                    ? "bg-[#111] hover:bg-[#222] text-[#FAF9F6]"
                    : "bg-[#F3F3F1] hover:bg-champagne hover:text-white text-[#222]"
                }`}
              >
                {plan.price === "₹0" ? "STANDARD ACCESS" : `ENROLL IN ${plan.name.toUpperCase()}`}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Slide-over Payment Drawer */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-black/30 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setSelectedPlan(null)} />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 180 }}
              className="relative w-full md:max-w-xl h-full bg-[#FAF9F6] shadow-2xl flex flex-col border-l border-black/5 z-10"
              id="payment-portal-drawer"
            >
              {/* Header */}
              <div className="p-5 md:p-8 border-b border-black/5 flex items-center justify-between bg-[#F4F3F0]">
                <div>
                  <span className="font-sans text-[10px] tracking-[0.25em] text-[#8E8D8A] uppercase font-bold">
                    FSIA Secure Payment Desk
                  </span>
                  <h3 className="font-serif-display text-lg md:text-xl text-[#111] tracking-tight mt-1">
                    Join {selectedPlan.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center text-[#222] hover:bg-white transition-all cursor-pointer"
                >
                  ✖
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
                {checkoutStep === "form" ? (
                  <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                    {/* Invoice Pricing Calculator */}
                    <div className="p-5 bg-white border border-black/5 rounded-2xl shadow-sm space-y-4">
                      <span className="block text-[9px] font-sans tracking-[0.2em] text-[#8E8D8A] uppercase font-bold border-b border-black/5 pb-2">
                        Tax Invoice Summary
                      </span>
                      <div className="space-y-2 text-xs font-serif-text text-[#555]">
                        <div className="flex justify-between">
                          <span>{selectedPlan.name} Base Subscription</span>
                          <span className="font-semibold text-[#111]">{selectedPlan.price}.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Integrated GST (18%)</span>
                          <span className="font-semibold text-[#111]">
                            ₹{calculateTotal(selectedPlan.price).gst.toLocaleString("en-IN")}.00
                          </span>
                        </div>
                        <div className="w-full h-[1px] bg-black/5 my-2" />
                        <div className="flex justify-between text-sm font-sans font-bold text-[#111]">
                          <span>GRAND TOTAL (INR)</span>
                          <span className="text-champagne">
                            ₹{calculateTotal(selectedPlan.price).total.toLocaleString("en-IN")}.00
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Personal Billing details */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                          Full Name (For Invoice)
                        </label>
                        <input
                          type="text"
                          required
                          value={billingDetails.name}
                          onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Deepika Sharma"
                          className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm placeholder:text-[#BBB] focus:outline-none focus:border-champagne"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                            Billing Email Address
                          </label>
                          <input
                            type="email"
                            required
                            value={billingDetails.email}
                            onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="deepika@stylehouse.in"
                            className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm placeholder:text-[#BBB] focus:outline-none focus:border-champagne"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                            Phone Number (+91)
                          </label>
                          <input
                            type="tel"
                            required
                            value={billingDetails.phone}
                            onChange={(e) => setBillingDetails(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+91 XXXXX XXXXX"
                            className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm placeholder:text-[#BBB] focus:outline-none focus:border-champagne"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                            PAN Number (Optional)
                          </label>
                          <input
                            type="text"
                            value={billingDetails.pan}
                            onChange={(e) => setBillingDetails(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm placeholder:text-[#BBB] uppercase focus:outline-none focus:border-champagne font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                            GSTIN (Optional)
                          </label>
                          <input
                            type="text"
                            value={billingDetails.gstin}
                            onChange={(e) => setBillingDetails(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                            placeholder="27AAAAA1111A1Z1"
                            maxLength={15}
                            className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm placeholder:text-[#BBB] uppercase focus:outline-none focus:border-champagne font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sandbox Notice */}
                    <div className="p-4 bg-white border border-[#E1C699]/35 rounded-xl text-[11px] font-serif-text text-[#555] flex items-start gap-2 leading-relaxed">
                      <HelpCircle className="w-5 h-5 text-champagne shrink-0 mt-0.5" />
                      <span>
                        This is an official demonstration sandboxed payment. In the live environment, submitting triggers a secure UPI / credit card QR gateway, which verifies KYC details instantly against Indian banking networks.
                      </span>
                    </div>

                    {/* Pay button */}
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-xs tracking-[0.25em] font-bold py-4 rounded-lg uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-t-transparent border-[#FAF9F6] rounded-full animate-spin" />
                          LAUNCHING SECURE BANK GATE...
                        </>
                      ) : (
                        <>
                          SECURELY PROCESS PAYOUT
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Payment Success Screen */
                  <div className="p-6 md:p-8 border border-champagne/30 bg-white/80 rounded-2xl shadow-xl text-center space-y-6 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-champagne/5 rounded-full pointer-events-none" />
                    <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center text-champagne mx-auto">
                      <Award className="w-8 h-8 text-champagne" />
                    </div>

                    <div className="space-y-1">
                      <span className="font-sans text-[9px] tracking-[0.3em] text-[#8E8D8A] uppercase font-bold animate-pulse">
                        OBSIDIAN TRANSACTION SEALED
                      </span>
                      <h4 className="font-serif-display text-xl md:text-2xl text-[#111] font-bold">
                        Welcome to {selectedPlan.name}!
                      </h4>
                    </div>

                    <div className="bg-white/90 border border-black/5 p-4 rounded-xl text-left space-y-2.5 font-sans text-[11px] text-[#444]">
                      <div className="flex justify-between">
                        <span>SUBSCRIBER:</span>
                        <strong className="text-[#111]">{billingDetails.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>PLAN ASSIGNED:</span>
                        <strong className="text-champagne uppercase">{selectedPlan.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>RECEIPT NUMBER:</span>
                        <strong className="font-mono text-[#111]">FSIA-TAX-{Math.floor(100000 + Math.random() * 900000)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>GST PORTION:</span>
                        <strong className="text-[#111]">₹{calculateTotal(selectedPlan.price).gst.toLocaleString("en-IN")}.00</strong>
                      </div>
                    </div>

                    <p className="text-xs text-[#555] font-serif-text leading-relaxed">
                      Your premium tier account is officially signed. You will receive an official tax invoice containing full PDF credentials and your account setup link at <strong className="text-[#111]">{billingDetails.email}</strong>. Live talent manager matchmaking has been initialized.
                    </p>

                    <button
                      onClick={() => setSelectedPlan(null)}
                      className="w-full bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-xs tracking-[0.25em] py-3.5 px-6 rounded-lg uppercase cursor-pointer"
                    >
                      RETURN TO HOME
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
