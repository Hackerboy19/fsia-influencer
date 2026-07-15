import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Briefcase, Landmark, ShieldCheck, ArrowRight, CheckCircle2, Sparkles, Send, Users, TrendingUp } from "lucide-react";

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

  const handleApplyClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setSuccessMessage(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(true);
      if (selectedCampaign) {
        setAppliedCampaigns((prev) => [...prev, selectedCampaign.id]);
      }
      setFormData({
        name: "",
        email: "",
        phone: "",
        instagram: "",
        pitch: "",
        escrowConsent: true
      });
    }, 1500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-12 space-y-8" id="campaigns-tab-container">
      {/* Title */}
      <div className="text-center md:text-left space-y-2">
        <span className="font-sans text-xs tracking-[0.3em] text-[#8E8D8A] uppercase font-bold block">
          FSIA Collaboration Desk
        </span>
        <h2 className="font-serif-display text-3xl md:text-5xl font-bold tracking-tight text-[#111]">
          Live Brand Campaigns
        </h2>
        <p className="font-serif-text italic text-[#666] text-sm md:text-base max-w-2xl">
          Apply directly to premium brand sponsorships. Forever Star India operates 100% secure escrow contracts ensuring creators receive full payment within 24 hours of campaign verification.
        </p>
      </div>

      {/* Campaigns list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((campaign) => {
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
                    <span className="text-[10px] font-sans text-champagne font-bold tracking-widest uppercase block">
                      {campaign.brand}
                    </span>
                    <h3 className="font-serif-display text-xl font-bold text-[#111] mt-0.5">
                      {campaign.title}
                    </h3>
                  </div>
                  <span className="bg-[#111] text-[#FAF9F6] text-[10px] font-sans font-bold tracking-wider px-3 py-1 rounded-full whitespace-nowrap">
                    {campaign.budget}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 text-[10px] font-sans">
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
                <p className="text-xs text-[#555] font-serif-text leading-relaxed">
                  {campaign.description}
                </p>

                {/* Key perks */}
                <div className="space-y-1.5 pt-2">
                  <span className="block text-[8px] font-sans tracking-[0.2em] text-[#8E8D8A] uppercase font-bold">
                    VIP COMPENSATIONS & PERKS:
                  </span>
                  <ul className="text-[11px] font-serif-text text-[#444] space-y-1 pl-1">
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
                <span className="text-[9px] font-mono text-[#8E8D8A] uppercase">
                  LOC: {campaign.location}
                </span>
                {isApplied ? (
                  <span className="text-emerald-600 font-sans text-xs font-bold flex items-center gap-1 bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> APPLICATION SUBMITTED
                  </span>
                ) : (
                  <button
                    onClick={() => handleApplyClick(campaign)}
                    className="bg-[#111] hover:bg-[#222] text-[#FAF9F6] text-xs font-sans font-bold tracking-widest py-2 px-5 rounded-lg uppercase transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    APPLY NOW <ArrowRight className="w-3.5 h-3.5 text-champagne" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Slide-over Form Overlay for Campaign Application */}
      <AnimatePresence>
        {selectedCampaign && (
          <div className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-black/30 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setSelectedCampaign(null)} />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 180 }}
              className="relative w-full md:max-w-xl h-full bg-[#FAF9F6] shadow-2xl flex flex-col border-l border-black/5 z-10"
              id="campaign-application-drawer"
            >
              {/* Header */}
              <div className="p-5 md:p-8 border-b border-black/5 flex items-center justify-between bg-[#F4F3F0]">
                <div>
                  <span className="font-sans text-[10px] tracking-[0.25em] text-[#8E8D8A] uppercase font-bold">
                    Campaign Application Gate
                  </span>
                  <h3 className="font-serif-display text-lg md:text-xl text-[#111] tracking-tight mt-1">
                    Apply for {selectedCampaign.brand}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center text-[#222] hover:bg-white transition-all cursor-pointer"
                >
                  ✖
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
                {!successMessage ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Safe Escrow Info */}
                    <div className="p-4 bg-white border border-black/5 rounded-xl text-xs text-[#555] font-serif-text space-y-2">
                      <div className="flex items-center gap-2 text-champagne font-bold uppercase tracking-widest text-[9px] font-sans">
                        <ShieldCheck className="w-4 h-4 text-champagne" />
                        SECURED INR BANK WIRE GUARANTEE
                      </div>
                      FSIA acts as a central financial clearing agent. Upon contract signing, Sabyasachi / brand escrow secures 100% of the funds. Payout is processed instantly following visual content publication checks.
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                          Full Legal Name
                        </label>
                        <input
                          type="text"
                          required
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g., Deepika Sharma"
                          className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm placeholder:text-[#BBB] focus:outline-none focus:border-champagne"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                            Primary Email Address
                          </label>
                          <input
                            type="email"
                            required
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="creator@gmail.com"
                            className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm placeholder:text-[#BBB] focus:outline-none focus:border-champagne"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                            WhatsApp Phone Number
                          </label>
                          <input
                            type="tel"
                            required
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+91 XXXXX XXXXX"
                            className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm placeholder:text-[#BBB] focus:outline-none focus:border-champagne"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                          Social handle / Media links
                        </label>
                        <input
                          type="text"
                          required
                          name="instagram"
                          value={formData.instagram}
                          onChange={handleInputChange}
                          placeholder="instagram.com/username or youtube.com/@channel"
                          className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm placeholder:text-[#BBB] focus:outline-none focus:border-champagne"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                          Brief Pitch / Style Concept
                        </label>
                        <textarea
                          rows={4}
                          name="pitch"
                          value={formData.pitch}
                          onChange={handleInputChange}
                          placeholder="How would you creatively present Sabyasachi's wedding couture? Describe your editorial style, lighting preference, and aesthetic mood."
                          className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm placeholder:text-[#BBB] focus:outline-none focus:border-champagne font-serif-text"
                        />
                      </div>
                    </div>

                    {/* Escrow consent */}
                    <label className="flex items-start gap-2 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={formData.escrowConsent}
                        onChange={(e) => setFormData(prev => ({ ...prev, escrowConsent: e.target.checked }))}
                        className="rounded text-champagne accent-[#E1C699] focus:ring-champagne mt-0.5"
                      />
                      <span className="text-[10px] font-sans text-[#555] leading-relaxed">
                        I agree to the <strong>FSIA Verified escrow arbitration protocols</strong>. I authorize the board to review my social audit parameters and coordinate direct bank wiring contract upon compliance with campaign briefs.
                      </span>
                    </label>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-xs tracking-[0.25em] font-bold py-4 rounded-lg uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-t-transparent border-[#FAF9F6] rounded-full animate-spin" />
                          SEALING AUDIT...
                        </>
                      ) : (
                        <>
                          DISPATCH APPLICATION
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Success Screen */
                  <div className="p-6 md:p-8 border border-champagne/30 bg-white/80 rounded-2xl shadow-xl text-center space-y-6 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-champagne/5 rounded-full pointer-events-none" />
                    <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center text-champagne mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-champagne" />
                    </div>

                    <div className="space-y-1">
                      <span className="font-sans text-[9px] tracking-[0.3em] text-[#8E8D8A] uppercase font-bold">
                        Verification Seal Accepted
                      </span>
                      <h4 className="font-serif-display text-xl md:text-2xl text-[#111] font-bold">
                        Application Transmitted
                      </h4>
                    </div>

                    <p className="text-xs text-[#555] font-serif-text leading-relaxed">
                      Your Sabyasachi collaboration bid is signed and sealed on the FSIA Escrow Registry. The official brand representative and an FSIA liaison will evaluate your profile aesthetics and get in touch with you at <strong className="text-[#111]">{formData.email}</strong> or WhatsApp within 12 business hours.
                    </p>

                    <button
                      onClick={() => setSelectedCampaign(null)}
                      className="w-full bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-xs tracking-[0.25em] py-3.5 px-6 rounded-lg uppercase cursor-pointer"
                    >
                      RETURN TO LIVE CAMPAIGNS
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
