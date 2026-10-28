import React, { useState, useEffect, useRef } from "react";
import { getPageOverride, routeForTab } from "../seo";
import { resizeImageFile } from "../lib/image";
import {
  inputClass, labelClass, helpClass, optionalClass, errorBoxClass,
  isValidEmail, isValidPhone, EMAIL_ERROR, PHONE_ERROR, focusField
} from "../lib/forms";
import FieldError, { errorProps } from "./FieldError";
import { CREATOR_CATEGORIES, OTHER_CATEGORY } from "../content/creatorCategories";
import { toast } from "react-hot-toast";
import { ANTI_FRAUD_NOTE } from "../content/organiser";
import { motion, AnimatePresence } from "motion/react";
import {
  Instagram,
  CheckCircle2,
  Phone,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Mail,
  Upload,
  Link as LinkIcon
} from "lucide-react";

const CITIES = ["Mumbai", "New Delhi", "Bangalore", "Pune", "Chennai", "Kochi", "Hyderabad", "Kolkata", "Jaipur", "Ahmedabad", "Goa", "Other"];

const STEPS = [
  { title: "About you", hint: "Name, category and city" },
  { title: "Your profile", hint: "Photo, audience and bio" },
  { title: "Contact & submit", hint: "How we reach you" }
];

// Unsent answers survive a reload or an accidental tab switch (cleared after a successful submit)
const DRAFT_KEY = "fsia_registration_draft";
const DRAFT_FIELDS = ["name", "category", "categoryOther", "role", "city", "bio", "reach", "engagement", "quote", "email", "phone", "portfolioUrls"] as const;
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
  const [step, setStep] = useState(0);
  const draft = useRef(readDraft()).current;

  // Form state
  const [name, setName] = useState(draft.name || "");
  // A draft from before the category list existed may hold a runway section id: start over then
  const [category, setCategory] = useState(
    draft.category && (CREATOR_CATEGORIES.includes(draft.category) || draft.category === OTHER_CATEGORY) ? draft.category : ""
  );
  const [categoryOther, setCategoryOther] = useState(draft.categoryOther || "");
  const [role, setRole] = useState(draft.role || "");
  const [city, setCity] = useState(draft.city || "");
  const [imageType, setImageType] = useState<"upload" | "custom">("upload");
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

  useEffect(() => {
    const values: Draft = { name, category, categoryOther, role, city, bio, reach, engagement, quote, email, phone, portfolioUrls };
    try {
      if (successData) sessionStorage.removeItem(DRAFT_KEY);
      else sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    } catch {}
  }, [name, category, categoryOther, role, city, bio, reach, engagement, quote, email, phone, portfolioUrls, successData]);

  // Moving between steps puts keyboard focus on the first field of the new step
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    focusField(["reg-name", "reg-reach", "reg-email"][step]);
  }, [step]);

  const handleFile = (file?: File) => {
    if (!file) return;
    resizeImageFile(file)
      .then((dataUrl) => {
        setCustomImage(dataUrl);
        setUploadedFileName(file.name);
      })
      .catch(() => toast.error("That file could not be read as an image."));
  };

  const finalImage = customImage;

  // Per-step validation: the message names the problem and focus moves to the field
  type Problem = { field: string; message: string } | null;
  const validateStep = (index: number): Problem => {
    if (index === 0) {
      if (!name.trim()) return { field: "reg-name", message: "Please enter your full name." };
      if (!category) return { field: "reg-category", message: "Please choose a category." };
      if (category === OTHER_CATEGORY && categoryOther.trim().length < 2) {
        return { field: "reg-category-other", message: "Please type your category (for example, Astrology or Cricket)." };
      }
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
      const problemStep = ["reg-name", "reg-category", "reg-category-other"].includes(problem.field) ? 0 : problem.field === "reg-image-link" ? 1 : 2;
      setStep(problemStep);
      showProblem(problem);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    // No stand-in photo: a profile only ever shows the creator's own picture
    const image = finalImage;
    const portfolio = portfolioUrls
      ? portfolioUrls.split(",").map((url) => url.trim()).filter(Boolean)
      : image ? [image] : [];

    fetch("/api/influencer-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        category: categoryTitle,
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
    setCategory("");
    setCategoryOther("");
    setRole("");
    setCity("");
    setImageType("upload");
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

  const categoryTitle = category === OTHER_CATEGORY ? categoryOther.trim() : category;

  return (
    <div className="page pb-16" id="influencer-registration-tab-container">
      <header className="max-w-3xl space-y-3 pt-10 md:pt-14 pb-10">
        <p className="eyebrow">Award application</p>
        <h1 className="h-page">{routeForTab("apply").heading}</h1>
        <p className="lede">
          {getPageOverride(routeForTab("apply").path)?.intro ||
            "This is how creators join the directory. It takes about two minutes. Our team reads every application and calls you about the fee and next steps."}
        </p>
        <p className="text-[0.9375rem] text-ink-2">
          Representing a brand?{" "}
          <button type="button" onClick={openBrandEnquiry} className="link cursor-pointer">Send a brand enquiry instead</button>
        </p>
      </header>

      {/* 2. STEP-BY-STEP FORM */}
      <div className="grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
      <section id="registration-form-section" aria-label="Application form" className="max-w-2xl scroll-mt-6">
        <AnimatePresence mode="wait">
          {!successData ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-surface border border-line p-6 md:p-8"
            >
              {/* Progress */}
              <ol className="grid grid-cols-3 gap-2 mb-8" aria-label="Registration progress">
                {STEPS.map((s, i) => {
                  const done = i < step;
                  const current = i === step;
                  return (
                    <li key={s.title} aria-current={current ? "step" : undefined}>
                      <div className={`h-1 ${i <= step ? "bg-ink" : "bg-line"}`} />
                      <p className={`mt-2 text-sm font-semibold ${current ? "text-[#111]" : done ? "text-[#2e2c29]" : "text-[#57554f]"}`}>
                        <span className="mr-1">{done ? "✓" : `${i + 1}.`}</span>
                        {s.title}
                      </p>
                      <p className="hidden sm:block text-[0.8125rem] text-ink-3">{s.hint}</p>
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
                        {...errorProps("reg-name", invalidField)} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                      <FieldError fieldId="reg-name" invalidField={invalidField} message={errorMsg} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="reg-category" className={labelClass}>Category *</label>
                        <select id="reg-category" value={category} onChange={(e) => setCategory(e.target.value)}
                          aria-required="true" {...errorProps("reg-category", invalidField)} className={inputClass}>
                          <option value="" disabled>Choose your main category</option>
                          {CREATOR_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value={OTHER_CATEGORY}>Other (type your own)</option>
                        </select>
                        <FieldError fieldId="reg-category" invalidField={invalidField} message={errorMsg} />
                        {category === OTHER_CATEGORY && (
                          <div className="mt-3">
                            <label htmlFor="reg-category-other" className={labelClass}>Your category *</label>
                            <input id="reg-category-other" type="text" maxLength={60} placeholder="e.g. Astrology, Cricket, Agriculture"
                              aria-required="true" {...errorProps("reg-category-other", invalidField)}
                              value={categoryOther} onChange={(e) => setCategoryOther(e.target.value)} className={inputClass} />
                            <FieldError fieldId="reg-category-other" invalidField={invalidField} message={errorMsg} />
                          </div>
                        )}
                      </div>
                      <div>
                        <label htmlFor="reg-city" className={labelClass}>City</label>
                        <select id="reg-city" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass}>
                          <option value="">Choose your city</option>
                          {CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="reg-role" className={labelClass}>Title or achievement <span className={optionalClass}>(optional)</span></label>
                      <input id="reg-role" type="text" placeholder="e.g. Fashion creator, Mumbai"
                        value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div>
                      <p className={labelClass}>Profile photo</p>
                      <div className="flex gap-1 bg-sunken border border-line rounded-[4px] p-1 mb-3" role="tablist">
                        {([
                          ["upload", "Upload", Upload],
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
                          className={`border-2 border-dashed rounded-[4px] p-5 flex items-center gap-4 cursor-pointer ${isDragActive ? "border-[#111] bg-stone-50" : "border-field hover:border-ink"}`}
                        >
                          <input type="file" id="portrait-file-input" accept="image/*" className="hidden"
                            onChange={(e) => handleFile(e.target.files?.[0])} />
                          {customImage ? (
                            <img src={customImage} alt="Your uploaded profile photo" className="w-16 h-16 rounded-[2px] object-cover border border-stone-200" />
                          ) : (
                            <div className="w-16 h-16 rounded-[2px] bg-stone-100 flex items-center justify-center"><Upload className="w-6 h-6 text-[#2e2c29]" /></div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-[#111]">{customImage ? uploadedFileName || "Photo added" : "Tap to upload or drag a photo here"}</p>
                            <p className="text-[0.875rem] text-[#47453f]">JPG or PNG. Large photos are resized automatically.</p>
                          </div>
                        </div>
                      )}

                      {imageType === "custom" && (
                        <div>
                          <input id="reg-image-link" type="url" placeholder="https://…" value={customImage}
                            {...errorProps("reg-image-link", invalidField, "reg-image-link-help")}
                            onChange={(e) => setCustomImage(e.target.value)} className={inputClass} aria-label="Image link" />
                          <FieldError fieldId="reg-image-link" invalidField={invalidField} message={errorMsg} />
                          <p id="reg-image-link-help" className={helpClass}>Use a public link that starts with https://</p>
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
                          <Mail aria-hidden="true" className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input id="reg-email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com"
                            aria-required="true" {...errorProps("reg-email", invalidField)}
                            value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass + " pl-10"} />
                        </div>
                        <FieldError fieldId="reg-email" invalidField={invalidField} message={errorMsg} />
                      </div>
                      <div>
                        <label htmlFor="reg-phone" className={labelClass}>Mobile (WhatsApp) *</label>
                        <div className="relative">
                          <Phone aria-hidden="true" className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input id="reg-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210"
                            aria-required="true" {...errorProps("reg-phone", invalidField)}
                            value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass + " pl-10"} />
                        </div>
                        <FieldError fieldId="reg-phone" invalidField={invalidField} message={errorMsg} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-quote" className={labelClass}>Your motto <span className={optionalClass}>(optional)</span></label>
                      <input id="reg-quote" type="text" placeholder="A line that sums up your style"
                        value={quote} onChange={(e) => setQuote(e.target.value)} className={inputClass} />
                    </div>

                    {/* Review before submitting */}
                    <div className="bg-sunken border border-line p-4 flex gap-4 items-center">
                      {finalImage ? (
                        <img src={finalImage} alt="" className="w-14 h-14 rounded-[4px] object-cover border border-line" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="w-14 h-14 rounded-[4px] bg-sunken border border-line shrink-0" aria-hidden="true" />
                      )}
                      <div className="min-w-0 text-sm">
                        <p className="font-semibold text-[#111] truncate">{name || "—"}</p>
                        <p className="text-[#2e2c29] truncate">{[categoryTitle, city, reach ? `${reach} followers` : ""].filter(Boolean).join(" · ")}</p>
                        <button type="button" onClick={() => setStep(0)} className="text-[0.875rem] font-semibold text-[#111] underline underline-offset-2 cursor-pointer">Edit details</button>
                      </div>
                    </div>

                    <p className="flex items-start gap-2 text-[0.875rem] text-[#2e2c29]">
                      <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                      If we approve your application, your name, photo, category, city, bio, audience figures and motto are shown on a public profile. Your email and phone number are never published; our team uses them only to contact you.
                    </p>
                  </>
                )}

                {errorMsg && !invalidField && (
                  <div role="alert" className={errorBoxClass}>
                    {errorMsg}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  {step > 0 ? (
                    <button type="button" onClick={goBack}
                      className="btn btn-secondary">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  ) : <span />}
                  <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}
                    className="btn btn-primary disabled:opacity-60 disabled:cursor-wait">
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
                <p className="text-[0.8125rem] text-ink-3 text-center">Step {step + 1} of {STEPS.length}</p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface border border-line p-6 md:p-8 text-center space-y-5"
            >
              <div className="mx-auto w-12 h-12 flex items-center justify-center text-[#2f6b45]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="font-serif-display text-2xl md:text-3xl text-[#111] font-bold">Application received</h2>
                <p className="text-[15px] text-[#2e2c29] max-w-md mx-auto">
                  Thank you, <strong>{successData.name}</strong>. Our team will review your profile and contact you at{" "}
                  <strong>{successData.email}</strong> or on WhatsApp.
                </p>
              </div>
              <dl className="max-w-sm mx-auto text-left text-[0.9375rem] bg-sunken border border-line p-4 space-y-2">
                <div className="flex justify-between gap-3"><dt className="text-[#47453f]">Reference</dt><dd className="font-mono font-semibold text-[#111]">{successData.id}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[#47453f]">Category</dt><dd className="font-semibold text-[#111]">{categoryTitle}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[#47453f]">Status</dt><dd className="font-semibold text-amber-800">Pending review</dd></div>
              </dl>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => navigateTo("campaigns")}
                  className="btn btn-primary">
                  Browse brand campaigns
                </button>
                <button onClick={handleReset}
                  className="btn btn-secondary">
                  Register someone else
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-[0.9375rem] text-ink-2">
          Want to see published profiles first?{" "}
          <a href="/creators/" onClick={(e) => { e.preventDefault(); navigateTo("directory"); }} className="link">
            Browse the directory
          </a>
        </p>
      </section>

      {/* What is collected, why, and what happens next: only what the application workflow actually does */}
      <aside aria-labelledby="apply-info" className="lg:sticky lg:top-8 space-y-8 lg:border-l lg:border-line lg:pl-10">
        <div>
          <h2 id="apply-info" className="label-caps pb-3 border-b border-line">What we ask for and why</h2>
          <dl className="divide-y divide-line">
            {[
              ["Name, category, city, title", "Shown on your public profile so brands can find you."],
              ["Photo, bio, followers, engagement", "Shown on your profile. Audience figures are labelled as supplied by you."],
              ["Email and mobile", "Used by our team to contact you about your application. Not shown on your profile."]
            ].map(([term, text]) => (
              <div key={term} className="py-3.5">
                <dt className="font-semibold text-ink">{term}</dt>
                <dd className="text-[0.9375rem] text-ink-2 mt-0.5">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="label-caps pb-3 border-b border-line">What happens next</h2>
          <ol className="divide-y divide-line">
            {[
              "You get a reference number straight away.",
              "Our team reviews your application and calls you to explain the fee and next steps.",
              "If it is approved, your profile is published in the directory.",
              "You can ask us to correct or remove it at any time."
            ].map((text, i) => (
              <li key={text} className="py-3 flex gap-3 text-[0.9375rem] text-ink-2">
                <span className="font-display text-bronze tabular-nums w-5 shrink-0" aria-hidden="true">{i + 1}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[0.875rem] text-ink-3 border-l-2 border-line-strong pl-3">{ANTI_FRAUD_NOTE}</p>
        </div>
      </aside>
      </div>
    </div>
  );
}
