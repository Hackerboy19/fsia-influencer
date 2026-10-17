// Shared look and validation for the public forms (creator registration, brand
// enquiry, campaign application, membership request), so every form reads the same.

export const inputClass =
  "w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-[15px] text-[#111] focus:outline-none focus:border-[#111] focus:ring-2 focus:ring-[#E1C699]/60 aria-[invalid=true]:border-red-700 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-200";
export const labelClass = "block text-sm font-semibold text-[#111] mb-1.5";
export const helpClass = "text-[13px] text-[#47453f] mt-1";
export const optionalClass = "font-normal text-[#47453f]";
export const errorBoxClass = "p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg font-medium";

// Same rules as the API (server/validation.ts and php-backend/api/lib/helpers.php)
export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const isValidPhone = (value: string) => {
  const text = value.trim();
  const digits = text.replace(/\D/g, "").length;
  return /^\+?[\d\s().-]+$/.test(text) && digits >= 10 && digits <= 15;
};

export const EMAIL_ERROR = "Please enter a valid email address, e.g. name@example.com.";
export const PHONE_ERROR = "Please enter a valid mobile number with 10 to 15 digits, e.g. +91 98765 43210.";

/** Moves keyboard focus to the field that needs attention, so the error is announced in context. */
export function focusField(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}
