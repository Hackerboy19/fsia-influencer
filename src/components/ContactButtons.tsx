import React from "react";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { BRAND_NAME } from "../content/brand";

// One-tap WhatsApp, call and email buttons for an applicant or enquiry in the admin inbox.

/** wa.me needs the number with the country code and digits only; 10-digit numbers are Indian. */
export function whatsappNumber(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = "91" + digits;
  return digits.length >= 11 && digits.length <= 15 ? digits : "";
}

const btn =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-black/10 bg-white text-[#111] text-xs font-semibold hover:bg-black/[0.04] transition-colors";

export default function ContactButtons({ phone, email, name, about }: { phone?: string; email?: string; name?: string; about?: string }) {
  const wa = whatsappNumber(phone || "");
  const hello = `Hello${name ? " " + name.split(" ")[0] : ""}, this is the ${BRAND_NAME} team${about ? ` about ${about}` : ""}.`;
  if (!wa && !phone && !email) return null;
  return (
    <div className="flex flex-wrap gap-1.5" data-contact-buttons>
      {wa && (
        <a href={`https://wa.me/${wa}?text=${encodeURIComponent(hello)}`} target="_blank" rel="noopener noreferrer" className={btn}>
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> WhatsApp
        </a>
      )}
      {phone && (
        <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={btn}>
          <Phone className="w-3.5 h-3.5" aria-hidden="true" /> Call
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className={btn}>
          <Mail className="w-3.5 h-3.5" aria-hidden="true" /> Email
        </a>
      )}
    </div>
  );
}
