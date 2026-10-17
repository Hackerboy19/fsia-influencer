import React, { useState, useEffect, useRef } from "react";
import { resizeImageFile } from "../lib/image";
import {
  inputClass, labelClass, helpClass, optionalClass, errorBoxClass,
  isValidEmail, isValidPhone, EMAIL_ERROR, PHONE_ERROR, focusField
} from "../lib/forms";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Instagram,
  CheckCircle2,
  Phone,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Image as ImageIcon,
  Briefcase,
  Users,
  Mail,
  Upload,
  Link as LinkIcon
} from "lucide-react";

interface RunwayCategory {
  id: string;
  title: string;
}

const PRESET_PORTRAITS = [
  { 
    name: "Sienna Brown (Editorial Noir)", 
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
    alt: "Sienna Brown - FSIA verified Indian influencer on premier brand collaboration platform"
  },
  { 
    name: "Gold Glare (Couture Radiance)", 
    url: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop",
    alt: "Couture Radiance portrait representing creator economy monetization on the FSIA verified creator network"
  },
  { 
    name: "Aria Sterling (High Fashion Minimal)", 
    url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop",
    alt: "Aria Sterling - FSIA verified Indian influencer ready for elite brand collaborations"
  },
  { 
    name: "Mystic Crimson (Royal Velvet)", 
    url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop",
    alt: "Mystic Crimson portrait illustrating successful brand partnerships on the premium influencer marketing platform"
  },
];

const CITIES = ["Mumbai", "New Delhi", "Bangalore", "Pune", "Chennai", "Kochi", "Hyderabad", "Kolkata", "Jaipur", "Ahmedabad", "Goa", "Other"];

const STEPS = [
  { title: "About you", hint: "Name, category and city" },
  { title: "Your profile", hint: "Photo, audience and bio" },
  { title: "Contact & submit", hint: "How we reach you" }
];

// Unsent answers survive a reload or an accidental tab switch (cleared after a successful submit)
const DRAFT_KEY = "fsia_registration_draft";
const DRAFT_FIELDS = ["name", "category", "role", "city", "bio", "reach", "engagement", "quote", "email", "phone", "portfolioUrls"] as const;
type Draft = Partial<Record<(typeof DRAFT_FIELDS)[number], string>>;

function readDraft(): Draft {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}");
  } catch {
    return {};
  }
}

function navigateTo(tab: string) {
  window.dispatchEvent(new CustomEvent("change-tab", { detail: tab }));
}

function openBrandEnquiry() {
  window.dispatchEvent(new CustomEvent("open-vip-collaboration"));
}

export default function ModelRegistrationTab() {
  const [categories, setCategories] = useState<RunwayCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [step, setStep] = useState(0);
  const draft = useRef(readDraft()).current;

  // Form state
  const [name, setName] = useState(draft.name || "");
  const [category, setCategory] = useState(draft.category || "");
  const [role, setRole] = useState(draft.role || "");
  const [city, setCity] = useState(draft.city || "Mumbai");
  const [imageType, setImageType] = useState<"upload" | "preset" | "custom">("upload");
  const [presetImage, setPresetImage] = useState(PRESET_PORTRAITS[0].url);
  const [customImage, setCustomImage] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [bio, setBio] = useState(draft.bio || "");
  const [reach, setReach] = useState(draft.reach || "");
  const [engagement, setEngagement] = useState(draft.engagement || "");
  const [quote, setQuote] = useState(draft.quote || "");
  const [email, setEmail] = useState(draft.email || "");
  const [phone, setPhone] = useState(draft.phone || "");
  const [portfolioUrls, setPortfolioUrls] = useState(draft.portfolioUrls || "");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const invalid = (id: string) => (invalidField === id ? true : undefined);

  useEffect(() => {
    const values: Draft = { name, category, role, city, bio, reach, engagement, quote, email, phone, portfolioUrls };
    try {
      if (successData) sessionStorage.removeItem(DRAFT_KEY);
      else sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    } catch {}
  }, [name, category, role, city, bio, reach, engagement, quote, email, phone, portfolioUrls, successData]);

  // Moving between steps puts keyboard focus on the first field of the new step
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    focusField(["reg-name", "reg-reach", "reg-email"][step]);
  }, [step]);

  useEffect(() => {
    fetch("/api/creators")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        const cats = data.map((sec: any) => ({ id: sec.id, title: sec.title }));
        setCategories(cats);
        // Keep a category restored from the draft if it still exists
        if (cats.length > 0) setCategory((current) => (cats.some((c: RunwayCategory) => c.id === current) ? current : cats[0].id));
      })
      .catch(() => setErrorMsg("We couldn't load categories. Please refresh the page."))
      .finally(() => setLoadingCats(false));
  }, []);

  const handleFile = (file?: File) => {
    if (!file) return;
    resizeImageFile(file)
      .then((dataUrl) => {
        setCustomImage(dataUrl);
        setUploadedFileName(file.name);
      })
      .catch(() => toast.error("That file could not be read as an image."));
  };

  const finalImage =
    imageType === "preset" ? presetImage : customImage || (imageType === "upload" ? "" : "");

  // Per-step validation: the message names the problem and focus moves to the field
  type Problem = { field: string; message: string } | null;
  const validateStep = (index: number): Problem => {
    if (index === 0) {
      if (!name.trim()) return { field: "reg-name", message: "Please enter your full name." };
      if (!category) return { field: "reg-category", message: "Please choose a category." };
    }
    if (index === 1 && imageType === "custom" && customImage && !/^https?:\/\//i.test(customImage)) {
      return { field: "reg-image-link", message: "The image link must start with http:// or https://" };
    }
    if (index === 2) {
      if (!isValidEmail(email)) return { field: "reg-email", message: EMAIL_ERROR };
      if (!isValidPhone(phone)) return { field: "reg-phone", message: PHONE_ERROR };
    }
    return null;
  };

  const showProblem = (problem: Problem) => {
    setInvalidField(problem?.field || "");
    setErrorMsg(problem?.message || "");
    if (problem) focusField(problem.field);
  };

  const goNext = () => {
    const problem = validateStep(step);
    showProblem(problem);
    if (!problem) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    showProblem(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }
    const problem = validateStep(0) || validateStep(1) || validateStep(2);
    if (problem) {
      const problemStep = ["reg-name", "reg-category"].includes(problem.field) ? 0 : problem.field === "reg-image-link" ? 1 : 2;
      setStep(problemStep);
      showProblem(problem);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const image = finalImage || PRESET_PORTRAITS[0].url;
    const portfolio = portfolioUrls
      ? portfolioUrls.split(",").map((url) => url.trim()).filter(Boolean)
      : [image];

    fetch("/api/influencer-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        category,
        role: role.trim(),
        city,
        image,
        bio: bio.trim(),
        reach: reach.trim(),
        engagement: engagement.trim(),
        quote: quote.trim(),
        portfolio,
        email: email.trim(),
        phone: phone.trim()
      })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Your application could not be submitted.");
        setSuccessData(data.application);
      })
      .catch((err: Error) => {
        // Never pretend it worked: the applicant must know to try again
        setErrorMsg(
          (err.message || "Your application could not be submitted.") +
            " Your details are still here — please try again in a moment."
        );
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleReset = () => {
    setStep(0);
    setName("");
    setRole("");
    setCity("Mumbai");
    setImageType("upload");
    setPresetImage(PRESET_PORTRAITS[0].url);
    setCustomImage("");
    setUploadedFileName("");
    setBio("");
    setReach("");
    setEngagement("");
    setQuote("");
    setEmail("");
    setPhone("");
    setPortfolioUrls("");
    setErrorMsg("");
    setInvalidField("");
    setSuccessData(null);
  };

  const categoryTitle = categories.find((c) => c.id === category)?.title || category;

  return (
    <div className="w-full max-w-5xl mx-auto pb-8" id="influencer-registration-tab-container">
      {/* 1. INTRO */}
      <section className="text-center pt-8 pb-10 md:pt-14 md:pb-12 flex flex-col items-center space-y-5 max-w-3xl mx-auto px-2">
        <span className="font-sans text-xs tracking-[0.25em] text-[#47453f] uppercase font-bold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-champagne" />
          Creator registration
        </span>
        <h1 className="font-serif-display text-4xl md:text-6xl text-[#111] leading-tight">
          Register as a Creator and Get Verified
        </h1>
        <p className="text-base md:text-lg text-[#2e2c29] max-w-2xl leading-relaxed">
          Three quick steps, about two minutes. Verified creators get paid brand collaborations, campaign invitations and PR
          opportunities.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            href="#registration-form-section"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("registration-form-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center justify-center gap-2 bg-[#111] hover:bg-[#222] text-white font-semibold text-sm px-7 py-3.5 rounded-xl"
          >
            Start registration <ArrowRight className="w-4 h-4" />
          </a>
          <button
            onClick={openBrandEnquiry}
            className="inline-flex items-center justify-center gap-2 border-2 border-[#111] text-[#111] hover:bg-[#111] hover:text-white font-semibold text-sm px-6 py-3 rounded-xl cursor-pointer"
          >
            <Briefcase className="w-4 h-4" /> I'm a brand
          </button>
        </div>
      </section>

      {/* 2. STEP-BY-STEP FORM */}
      <section id="registration-form-section" className="max-w-2xl mx-auto scroll-mt-6">
        <AnimatePresence mode="wait">
          {!successData ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-stone-300 shadow-sm rounded-2xl p-6 md:p-8"
            >
              {/* Progress */}
              <ol className="grid grid-cols-3 gap-2 mb-8" aria-label="Registration progress">
                {STEPS.map((s, i) => {
                  const done = i < step;
                  const current = i === step;
                  return (
                    <li key={s.title} aria-current={current ? "step" : undefined}>
                      <div className={`h-1.5 rounded-full ${i <= step ? "bg-[#111]" : "bg-stone-200"}`} />
                      <p className={`mt-2 text-sm font-semibold ${current ? "text-[#111]" : done ? "text-[#2e2c29]" : "text-[#57554f]"}`}>
                        <span className="mr-1">{done ? "✓" : `${i + 1}.`}</span>
                        {s.title}
                      </p>
                      <p className="hidden sm:block text-xs text-[#57554f]">{s.hint}</p>
                    </li>
                  );
                })}
              </ol>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {step === 0 && (
                  <>
                    <div>
                      <label htmlFor="reg-name" className={labelClass}>Full name *</label>
                      <input id="reg-name" type="text" autoComplete="name" placeholder="e.g. Priya Sharma" aria-required="true"
                        aria-invalid={invalid("reg-name")} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="reg-category" className={labelClass}>Category *</label>
                        <select id="reg-category" value={category} onChange={(e) => setCategory(e.target.value)}
                          aria-required="true" aria-invalid={invalid("reg-category")} className={inputClass} disabled={loadingCats}>
                          {loadingCats && <option>Loading…</option>}
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="reg-city" className={labelClass}>City</label>
                        <select id="reg-city" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass}>
                          {CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="reg-role" className={labelClass}>Title or achievement <span className={optionalClass}>(optional)</span></label>
                      <input id="reg-role" type="text" placeholder="e.g. Fashion creator, Winner Miss India 2026"
                        value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div>
                      <p className={labelClass}>Profile photo</p>
                      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-3" role="tablist">
                        {([
                          ["upload", "Upload", Upload],
                          ["preset", "Choose a sample", ImageIcon],
                          ["custom", "Paste a link", LinkIcon]
                        ] as const).map(([id, label, Icon]) => (
                          <button key={id} type="button" role="tab" aria-selected={imageType === id}
                            onClick={() => setImageType(id)}
                            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-semibold cursor-pointer ${imageType === id ? "bg-[#111] text-white" : "text-[#2e2c29] hover:bg-white"}`}>
                            <Icon className="w-4 h-4" /> {label}
                          </button>
                        ))}
                      </div>

                      {imageType === "upload" && (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                          onDragLeave={() => setIsDragActive(false)}
                          onDrop={(e) => { e.preventDefault(); setIsDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}
                          onClick={() => document.getElementById("portrait-file-input")?.click()}
                          className={`border-2 border-dashed rounded-xl p-5 flex items-center gap-4 cursor-pointer ${isDragActive ? "border-[#111] bg-stone-50" : "border-stone-300 hover:border-[#111]"}`}
                        >
                          <input type="file" id="portrait-file-input" accept="image/*" className="hidden"
                            onChange={(e) => handleFile(e.target.files?.[0])} />
                          {customImage ? (
                            <img src={customImage} alt="Your uploaded profile photo" className="w-16 h-16 rounded-xl object-cover border border-stone-200" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-stone-100 flex items-center justify-center"><Upload className="w-6 h-6 text-[#2e2c29]" /></div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-[#111]">{customImage ? uploadedFileName || "Photo added" : "Tap to upload or drag a photo here"}</p>
                            <p className="text-[13px] text-[#47453f]">JPG or PNG. Large photos are resized automatically.</p>
                          </div>
                        </div>
                      )}

                      {imageType === "preset" && (
                        <div className="grid grid-cols-4 gap-2">
                          {PRESET_PORTRAITS.map((p) => (
                            <button key={p.name} type="button" onClick={() => setPresetImage(p.url)}
                              aria-label={p.name} aria-pressed={presetImage === p.url}
                              className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 cursor-pointer ${presetImage === p.url ? "border-[#111]" : "border-transparent hover:border-stone-400"}`}>
                              <img src={p.url} alt={p.alt || p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              {presetImage === p.url && (
                                <span className="absolute top-1.5 right-1.5 bg-[#111] text-white rounded-full p-0.5"><CheckCircle2 className="w-4 h-4" /></span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {imageType === "custom" && (
                        <div>
                          <input id="reg-image-link" type="url" placeholder="https://…" value={customImage}
                            aria-invalid={invalid("reg-image-link")}
                            onChange={(e) => setCustomImage(e.target.value)} className={inputClass} aria-label="Image link" />
                          <p className={helpClass}>Use a public link that starts with https://</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="reg-reach" className={labelClass}>
                          <span className="inline-flex items-center gap-1.5"><Instagram className="w-4 h-4" /> Followers</span>
                        </label>
                        <input id="reg-reach" type="text" inputMode="text" placeholder="e.g. 250K or 1.2M"
                          value={reach} onChange={(e) => setReach(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor="reg-engagement" className={labelClass}>Engagement rate</label>
                        <input id="reg-engagement" type="text" placeholder="e.g. 4.8%"
                          value={engagement} onChange={(e) => setEngagement(e.target.value)} className={inputClass} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-bio" className={labelClass}>Short bio <span className={optionalClass}>(optional)</span></label>
                      <textarea id="reg-bio" rows={3} placeholder="Your niche, style and the brands you'd love to work with."
                        value={bio} onChange={(e) => setBio(e.target.value)} className={inputClass} />
                    </div>

                    <details className="group">
                      <summary className="text-sm font-semibold text-[#111] cursor-pointer select-none">+ Add portfolio links (optional)</summary>
                      <input type="text" placeholder="https://… , https://…" value={portfolioUrls}
                        onChange={(e) => setPortfolioUrls(e.target.value)} className={inputClass + " mt-2"} aria-label="Portfolio links" />
                      <p className={helpClass}>Separate several links with commas.</p>
                    </details>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="reg-email" className={labelClass}>Email *</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#47453f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input id="reg-email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com"
                            aria-required="true" aria-invalid={invalid("reg-email")}
                            value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass + " pl-10"} />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="reg-phone" className={labelClass}>Mobile (WhatsApp) *</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-[#47453f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input id="reg-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210"
                            aria-required="true" aria-invalid={invalid("reg-phone")}
                            value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass + " pl-10"} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-quote" className={labelClass}>Your motto <span className={optionalClass}>(optional)</span></label>
                      <input id="reg-quote" type="text" placeholder="A line that sums up your style"
                        value={quote} onChange={(e) => setQuote(e.target.value)} className={inputClass} />
                    </div>

                    {/* Review before submitting */}
                    <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 flex gap-4 items-center">
                      <img src={finalImage || PRESET_PORTRAITS[0].url} alt="" className="w-14 h-14 rounded-lg object-cover border border-stone-200" referrerPolicy="no-referrer" />
                      <div className="min-w-0 text-sm">
                        <p className="font-semibold text-[#111] truncate">{name || "—"}</p>
                        <p className="text-[#2e2c29] truncate">{categoryTitle} · {city}{reach ? ` · ${reach} followers` : ""}</p>
                        <button type="button" onClick={() => setStep(0)} className="text-[13px] font-semibold text-[#111] underline underline-offset-2 cursor-pointer">Edit details</button>
                      </div>
                    </div>

                    <p className="flex items-start gap-2 text-[13px] text-[#2e2c29]">
                      <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                      Your email and phone number are only used by our team to contact you about verification.
                    </p>
                  </>
                )}

                {errorMsg && (
                  <div role="alert" className={errorBoxClass}>
                    {errorMsg}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  {step > 0 ? (
                    <button type="button" onClick={goBack}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-stone-300 text-[#111] font-semibold text-sm hover:bg-stone-50 cursor-pointer">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  ) : <span />}
                  <button type="submit" disabled={isSubmitting || loadingCats} aria-busy={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111] hover:bg-[#222] text-white font-semibold text-sm cursor-pointer disabled:opacity-60">
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…
                      </>
                    ) : step < STEPS.length - 1 ? (
                      <>Continue <ArrowRight className="w-4 h-4" /></>
                    ) : (
                      <>Submit application <CheckCircle2 className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#57554f] text-center">Step {step + 1} of {STEPS.length}</p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-stone-300 shadow-sm rounded-2xl p-6 md:p-8 text-center space-y-5"
            >
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="font-serif-display text-2xl md:text-3xl text-[#111] font-bold">Application received</h2>
                <p className="text-[15px] text-[#2e2c29] max-w-md mx-auto">
                  Thank you, <strong>{successData.name}</strong>. Our team will review your profile and contact you at{" "}
                  <strong>{successData.email}</strong> or on WhatsApp.
                </p>
              </div>
              <dl className="max-w-sm mx-auto text-left text-sm bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between gap-3"><dt className="text-[#47453f]">Reference</dt><dd className="font-mono font-semibold text-[#111]">{successData.id}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[#47453f]">Category</dt><dd className="font-semibold text-[#111]">{categoryTitle}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[#47453f]">Status</dt><dd className="font-semibold text-amber-800">Pending review</dd></div>
              </dl>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => navigateTo("campaigns")}
                  className="px-6 py-3 bg-[#111] hover:bg-[#222] text-white font-semibold text-sm rounded-xl cursor-pointer">
                  Browse brand campaigns
                </button>
                <button onClick={handleReset}
                  className="px-6 py-3 border border-stone-300 text-[#111] font-semibold text-sm rounded-xl hover:bg-stone-50 cursor-pointer">
                  Register someone else
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-sm text-[#2e2c29]">
          Want to see who's already verified?{" "}
          <a href="/talent/" onClick={(e) => { e.preventDefault(); navigateTo("directory"); }}
            className="font-semibold text-[#111] underline underline-offset-2 inline-flex items-center gap-1">
            <Users className="w-4 h-4" /> Browse the talent roster
          </a>
        </p>
      </section>
    </div>
  );
}
