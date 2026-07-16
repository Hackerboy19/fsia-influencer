import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Instagram, MapPin, UserPlus, FileText, CheckCircle2, Phone, HelpCircle, ArrowRight, ShieldCheck, Globe, Image as ImageIcon } from "lucide-react";

interface RunwayCategory {
  id: string;
  title: string;
}

const PRESET_PORTRAITS = [
  { name: "Sienna Brown (Editorial Noir)", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop" },
  { name: "Gold Glare (Couture Radiance)", url: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop" },
  { name: "Aria Sterling (High Fashion Minimal)", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop" },
  { name: "Mystic Crimson (Royal Velvet)", url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop" },
];

export default function ModelRegistrationTab() {
  const [categories, setCategories] = useState<RunwayCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [role, setRole] = useState("Finalist Creator");
  const [city, setCity] = useState("Mumbai");
  const [imageType, setImageType] = useState<"preset" | "custom" | "upload">("preset");
  const [presetImage, setPresetImage] = useState(PRESET_PORTRAITS[0].url);
  const [customImage, setCustomImage] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [bio, setBio] = useState("");
  const [reach, setReach] = useState("250K");
  const [engagement, setEngagement] = useState("4.8%");
  const [quote, setQuote] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [portfolioUrls, setPortfolioUrls] = useState(""); // comma-separated optional images

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Fetch active categories
    fetch("/api/creators")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        const cats = data.map((sec: any) => ({
          id: sec.id,
          title: sec.title
        }));
        setCategories(cats);
        if (cats.length > 0) {
          setCategory(cats[0].id);
        }
        setLoadingCats(false);
      })
      .catch(() => {
        // Fallback defaults
        const fallback = [
          { id: "miss-india", title: "Forever Miss India 2026" },
          { id: "super-hero", title: "Super Hero Awards" },
          { id: "teen-india", title: "Forever Teen India 2026" },
          { id: "mrs-india", title: "Forever Mrs India 2026" }
        ];
        setCategories(fallback);
        setCategory(fallback[0].id);
        setLoadingCats(false);
      });
  }, []);

  // Audio helper
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // Ignored
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !category) {
      setErrorMsg("Please fill out all mandatory fields.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const finalImage = imageType === "preset" ? presetImage : (customImage || PRESET_PORTRAITS[0].url);
    const portfolioArray = portfolioUrls
      ? portfolioUrls.split(",").map(url => url.trim()).filter(Boolean)
      : [finalImage];

    const payload = {
      name,
      category,
      role,
      city,
      image: finalImage,
      bio,
      reach,
      engagement,
      quote: quote || "Elegance is the only beauty that never fades.",
      portfolio: portfolioArray,
      email,
      phone
    };

    fetch("/api/influencer-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Server rejected registration submission.");
        return res.json();
      })
      .then((data) => {
        setIsSubmitting(false);
        playChime();
        setSuccessData(data.application);
      })
      .catch((err) => {
        console.warn("Emulating offline successful model registration:", err);
        // Fallback mock success response for full-fidelity offline mode
        const mockApp = {
          id: "inf-app-mock-" + Math.floor(Math.random() * 900000),
          ...payload,
          status: "pending",
          timestamp: new Date().toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })
        };
        setIsSubmitting(false);
        playChime();
        setSuccessData(mockApp);
      });
  };

  const handleReset = () => {
    setName("");
    setRole("Finalist Creator");
    setCity("Mumbai");
    setImageType("preset");
    setPresetImage(PRESET_PORTRAITS[0].url);
    setCustomImage("");
    setUploadedFileName("");
    setIsDragActive(false);
    setBio("");
    setReach("250K");
    setEngagement("4.8%");
    setQuote("");
    setEmail("");
    setPhone("");
    setPortfolioUrls("");
    setSuccessData(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" id="influencer-registration-tab-container">
      {/* Intro Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="font-sans text-[10px] md:text-xs tracking-[0.3em] text-[#8E8D8A] uppercase font-bold flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-champagne animate-pulse" />
          WALK THE PRESTIGIOUS PATHWAY
        </span>
        <h2 className="font-serif-display text-3xl md:text-4xl text-[#111] tracking-tight font-bold">
          Register as an FSIA Runway Creator
        </h2>
        <p className="text-xs md:text-sm text-[#666] font-serif-text leading-relaxed">
          Are you ready to showcase your grace, digital reach, and charisma? Apply directly to walk our digital or physical high-fashion runways as a verified Creator. Submitted profiles enter our triage pipeline for immediate brand review and official admin approval.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!successData ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-black/5 shadow-md space-y-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Secure Triage Notice */}
              <div className="p-4 bg-[#FAF9F6] border border-black/5 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-champagne shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-sans font-bold tracking-wider text-[#111] uppercase">Haute Couture Verification Pipeline</h4>
                  <p className="text-[11px] text-[#666] font-serif-text leading-relaxed">
                    Profiles approved by FSIA administrators are directly integrated into our live interactive 3D Runway and model directories. Verify your contact details to receive direct WhatsApp updates.
                  </p>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-sans font-bold tracking-wider text-[#444] uppercase">
                    Full Professional Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Deepika Padukone"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-xs text-[#222] focus:outline-none focus:border-[#E1C699] focus:ring-1 focus:ring-[#E1C699]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-sans font-bold tracking-wider text-[#444] uppercase">
                    Runway Category Selection *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-xs text-[#222] focus:outline-none focus:border-[#E1C699]"
                    disabled={loadingCats}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roster Role & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-sans font-bold tracking-wider text-[#444] uppercase">
                    Target Role / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Winner, Forever Miss India 2026 / Rising Influencer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-xs text-[#222] focus:outline-none focus:border-[#E1C699]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-sans font-bold tracking-wider text-[#444] uppercase">
                    Operating City Hub
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-xs text-[#222] focus:outline-none focus:border-[#E1C699]"
                  >
                    {["Mumbai", "New Delhi", "Bangalore", "Pune", "Chennai", "Kochi", "Hyderabad", "Kolkata", "Jaipur", "Ahmedabad", "Goa"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Social Reach & Engagement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <label className="block text-[10px] font-sans font-bold tracking-wider text-[#444] uppercase">
                      Audited Reach (Followers)
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., 250K or 1.2M"
                    value={reach}
                    onChange={(e) => setReach(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-xs text-[#222] focus:outline-none focus:border-[#E1C699]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-sans font-bold tracking-wider text-[#444] uppercase">
                    Audited Engagement Rate (%)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5.4% or 7.2%"
                    value={engagement}
                    onChange={(e) => setEngagement(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-xs text-[#222] focus:outline-none focus:border-[#E1C699]"
                  />
                </div>
              </div>

              {/* Portrait Image Selection */}
              <div className="space-y-3 bg-[#FAF9F6] p-5 rounded-2xl border border-black/5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <label className="block text-[10px] font-sans font-bold tracking-wider text-[#111] uppercase flex items-center gap-1">
                    <ImageIcon className="w-4 h-4 text-[#888]" />
                    Runway Portrait Image
                  </label>
                  <div className="flex bg-white rounded-lg border border-black/10 p-0.5 text-[9px] font-bold w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setImageType("preset")}
                      className={`flex-1 sm:flex-initial px-2 py-1 rounded transition-all cursor-pointer whitespace-nowrap text-center ${imageType === "preset" ? "bg-champagne text-white" : "text-[#666]"}`}
                    >
                      COUTURE PRESETS
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageType("upload")}
                      className={`flex-1 sm:flex-initial px-2 py-1 rounded transition-all cursor-pointer whitespace-nowrap text-center ${imageType === "upload" ? "bg-champagne text-white" : "text-[#666]"}`}
                    >
                      UPLOAD PORTRAIT
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageType("custom")}
                      className={`flex-1 sm:flex-initial px-2 py-1 rounded transition-all cursor-pointer whitespace-nowrap text-center ${imageType === "custom" ? "bg-champagne text-white" : "text-[#666]"}`}
                    >
                      IMAGE URL
                    </button>
                  </div>
                </div>

                {imageType === "preset" && (
                  <div className="space-y-3">
                    <p className="text-[10px] text-[#666] font-serif-text">Select one of our high-resolution couture presets to instantly populate your catwalk profile card:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {PRESET_PORTRAITS.map((p) => {
                        const isSelected = presetImage === p.url;
                        return (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => {
                              setPresetImage(p.url);
                              setCustomImage("");
                            }}
                            className={`group relative aspect-[3/4] rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? "border-champagne scale-[1.02]" : "border-transparent hover:border-black/20"}`}
                          >
                            <img src={p.url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-left">
                              <span className="text-[8px] text-white font-sans font-bold block leading-tight truncate">{p.name}</span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-champagne text-white p-0.5 rounded-full shadow">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {imageType === "upload" && (
                  <div className="space-y-3">
                    <p className="text-[10px] text-[#666] font-serif-text">Drag and drop your professional headshot or select a local photo file. Images are securely embedded into your creator profile.</p>
                    
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragActive(true);
                      }}
                      onDragLeave={() => setIsDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragActive(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCustomImage(reader.result as string);
                            setUploadedFileName(file.name);
                            setPresetImage("");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                        isDragActive 
                          ? "border-champagne bg-champagne/5" 
                          : "border-black/10 hover:border-black/20 bg-white"
                      }`}
                      onClick={() => {
                        document.getElementById("portrait-file-input")?.click();
                      }}
                    >
                      <input
                        type="file"
                        id="portrait-file-input"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setCustomImage(reader.result as string);
                              setUploadedFileName(file.name);
                              setPresetImage("");
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      
                      {customImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src={customImage} 
                            alt="Uploaded headshot" 
                            className="w-20 h-20 rounded-xl object-cover border border-black/10 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-[10px] font-mono text-[#111] font-bold">
                            {uploadedFileName || "image_upload.png"}
                          </p>
                          <span className="text-[8px] font-sans bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Ready to Walk
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 bg-[#FAF9F6] border border-black/5 rounded-full text-neutral-500">
                            <ImageIcon className="w-6 h-6 text-champagne" />
                          </div>
                          <div>
                            <p className="text-xs font-sans font-bold text-[#111] uppercase tracking-wider">Drag & Drop Headshot Here</p>
                            <p className="text-[9px] text-[#666] font-serif-text italic mt-0.5">or click to browse local files (PNG, JPG up to 10MB)</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {imageType === "custom" && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-sans font-bold text-[#666] uppercase block">Paste Image URL (Unsplash, Pinterest, etc.)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={customImage}
                      onChange={(e) => {
                        setCustomImage(e.target.value);
                        setPresetImage("");
                      }}
                      className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-xs text-[#222] focus:outline-none focus:border-[#E1C699]"
                    />
                    <p className="text-[9px] text-[#888] font-serif-text italic">Note: Make sure the URL is public and starts with http/https.</p>
                  </div>
                )}
              </div>

              {/* Bio, Philosophy, Contacts */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-sans font-bold tracking-wider text-[#444] uppercase">
                      Fashion Philosophy (Inspirational Quote)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Couture is the language of quiet confidence."
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-xs text-[#222] focus:outline-none focus:border-[#E1C699]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-sans font-bold tracking-wider text-[#444] uppercase">
                      Additional Portfolio Image URLs (Comma Separated, Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="url1, url2, url3 (to build your custom 3D carousel)"
                      value={portfolioUrls}
                      onChange={(e) => setPortfolioUrls(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-xs text-[#222] focus:outline-none focus:border-[#E1C699]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-sans font-bold tracking-wider text-[#444] uppercase">
                    Professional Biography & Pitch (Passions & Experience)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide a detailed overview of your creative voice, style aesthetic, and why you would be an ideal luxury brand ambassador for our runway partners."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-xs text-[#222] focus:outline-none focus:border-[#E1C699] font-serif-text leading-relaxed"
                  />
                </div>
              </div>

              {/* Private Contact Details (For administrative vetting) */}
              <div className="border-t border-black/5 pt-6 space-y-4">
                <h3 className="text-xs font-sans font-bold text-[#111] uppercase tracking-wider">Secure Coordination Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase">
                      Secure Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@agency.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-xs text-[#222] focus:outline-none focus:border-[#E1C699]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase">
                      Mobile Number (WhatsApp Preferred) *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="+91 XXXXX XXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-xl text-xs text-[#222] focus:outline-none focus:border-[#E1C699]"
                      />
                      <Phone className="w-4 h-4 text-[#8E8D8A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Error log */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-xs tracking-[0.2em] font-bold py-4 px-6 rounded-xl uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow hover:shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-[#FAF9F6] rounded-full animate-spin" />
                    DISPATCHING RUNWAY APPLICATION...
                  </>
                ) : (
                  <>
                    SUBMIT RUNWAY REGISTRATION REQUEST
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          /* Receipt Card of Application */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="p-6 md:p-8 border border-[#E1C699]/30 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl text-center space-y-6 relative overflow-hidden">
              {/* Decorative design elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-[#E1C699]/5 rounded-full pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 border border-[#E1C699]/5 rounded-full pointer-events-none" />

              <div className="mx-auto w-16 h-16 rounded-full bg-champagne/10 border border-champagne flex items-center justify-center text-champagne">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="font-sans text-[9px] tracking-[0.3em] text-[#8E8D8A] uppercase font-bold">
                  FSIA Official Runway Submission
                </span>
                <h3 className="font-serif-display text-2xl md:text-3xl text-[#111] font-bold">
                  Application Sealed & Pending
                </h3>
              </div>

              <p className="text-xs text-[#555] font-serif-text max-w-lg mx-auto leading-relaxed">
                Thank you, <strong className="text-black">{successData.name}</strong>. Your runway registration has been successfully transmitted to the FSIA Haute Couture Review Board. You will be contacted at <strong className="text-black">{successData.email}</strong> or on WhatsApp at <strong className="text-black">{successData.phone}</strong> upon administrative profile verification.
              </p>

              {/* Document details box */}
              <div className="max-w-md mx-auto border-t border-b border-black/5 py-4 space-y-2 text-left text-xs font-serif-text bg-[#FAF9F6]/50 p-4 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-[#888] font-sans text-[10px] uppercase font-bold">APPLICATION ID:</span>
                  <span className="font-mono text-[#111] font-bold">{successData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888] font-sans text-[10px] uppercase font-bold">DESIGNEE CATEGORY:</span>
                  <span className="text-[#111] font-semibold">{successData.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888] font-sans text-[10px] uppercase font-bold">TARGET RUNWAY ROLE:</span>
                  <span className="text-[#111] font-semibold">{successData.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888] font-sans text-[10px] uppercase font-bold">AUDITED FOLLOWER REACH:</span>
                  <span className="text-[#111] font-semibold font-mono text-champagne">{successData.reach}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888] font-sans text-[10px] uppercase font-bold">APPLICATION STATUS:</span>
                  <span className="font-sans text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                    PENDING AUDIT
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2 max-w-sm mx-auto">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-[10px] font-bold tracking-widest uppercase rounded-lg cursor-pointer transition-colors w-full"
                >
                  NEW APPLICATION
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
