import React, { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import {
  inputClass,
  labelClass,
  optionalClass,
  errorBoxClass,
  isValidEmail,
  isValidPhone,
  EMAIL_ERROR,
  PHONE_ERROR,
  focusField
} from "../lib/forms";

interface EnquiryFormProps {
  /** Enquiry type stored by the API (shown in Admin → Enquiries) */
  type: "contact" | "booking";
  /** Prefix for field ids, so two forms can share a page */
  idPrefix: string;
  subjectLabel: string;
  subjectOptions: readonly string[];
  initialSubject?: string;
  /** Contact asks only for name, email, subject and message; bookings also need a phone number */
  phone: "required" | "hidden";
  messageLabel: string;
  submitLabel: string;
  successText: string;
}

type Field = "name" | "email" | "phone" | "message";

export default function EnquiryForm({
  type,
  idPrefix,
  subjectLabel,
  subjectOptions,
  initialSubject,
  phone,
  messageLabel,
  submitLabel,
  successText
}: EnquiryFormProps) {
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    subject: initialSubject && subjectOptions.includes(initialSubject) ? initialSubject : subjectOptions[0],
    message: ""
  });
  const [invalid, setInvalid] = useState<Field | "">("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState("");

  // Lets a parent (e.g. a "Book" button on a package card) change the chosen subject
  React.useEffect(() => {
    if (initialSubject && subjectOptions.includes(initialSubject)) {
      setValues((v) => ({ ...v, subject: initialSubject }));
    }
  }, [initialSubject, subjectOptions]);

  const id = (field: string) => `${idPrefix}-${field}`;
  const set = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const problem: { field: Field; message: string } | null =
      !values.name.trim() ? { field: "name", message: "Please enter your name." } :
      !isValidEmail(values.email) ? { field: "email", message: EMAIL_ERROR } :
      phone === "required" && !isValidPhone(values.phone) ? { field: "phone", message: PHONE_ERROR } :
      !values.message.trim() ? { field: "message", message: "Please write a short message." } : null;
    if (problem) {
      setInvalid(problem.field);
      setError(problem.message);
      focusField(id(problem.field));
      return;
    }
    setInvalid("");
    setError("");
    setSending(true);
    fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        subject: values.subject,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: phone === "required" ? values.phone.trim() : "",
        details: { message: values.message.trim() }
      })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Your message could not be sent.");
        setReference(data.enquiry?.id || "");
      })
      .catch((err: Error) =>
        setError((err.message || "Your message could not be sent.") + " Your details are still here — please try again.")
      )
      .finally(() => setSending(false));
  };

  if (reference) {
    return (
      <div role="status" className="bg-white border border-black/10 rounded-2xl p-6 md:p-8 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-700" aria-hidden="true" />
        <p className="font-serif-display text-2xl font-bold text-[#111]">Thank you, {values.name.trim().split(" ")[0]}</p>
        <p className="text-[15px] text-[#2e2c29]">{successText}</p>
        <p className="text-sm text-[#47453f]">
          Reference: <span className="font-mono font-semibold text-[#111]">{reference}</span>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="bg-white border border-black/10 rounded-2xl p-5 md:p-8 space-y-5 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={id("name")} className={labelClass}>Name</label>
          <input id={id("name")} className={inputClass} autoComplete="name" value={values.name} onChange={set("name")}
            aria-invalid={invalid === "name" || undefined} />
        </div>
        <div>
          <label htmlFor={id("email")} className={labelClass}>Email</label>
          <input id={id("email")} type="email" className={inputClass} autoComplete="email" value={values.email} onChange={set("email")}
            aria-invalid={invalid === "email" || undefined} />
        </div>
      </div>
      {phone === "required" && (
        <div>
          <label htmlFor={id("phone")} className={labelClass}>Mobile number</label>
          <input id={id("phone")} type="tel" className={inputClass} autoComplete="tel" placeholder="+91 98765 43210" value={values.phone}
            onChange={set("phone")} aria-invalid={invalid === "phone" || undefined} />
        </div>
      )}
      <div>
        <label htmlFor={id("subject")} className={labelClass}>{subjectLabel}</label>
        <select id={id("subject")} className={inputClass} value={values.subject} onChange={set("subject")}>
          {subjectOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={id("message")} className={labelClass}>
          {messageLabel}
        </label>
        <textarea id={id("message")} rows={5} maxLength={2000} className={inputClass} value={values.message} onChange={set("message")}
          aria-invalid={invalid === "message" || undefined} />
      </div>
      {error && <div role="alert" className={errorBoxClass}>{error}</div>}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[13px] text-[#47453f]">
          We reply by email. <span className={optionalClass}>Please don't share passwords or payment details here.</span>
        </p>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-semibold text-sm px-6 py-3 rounded-xl cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          {sending ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
