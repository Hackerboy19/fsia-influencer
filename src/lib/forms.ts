// Shared look and validation for the public forms (creator registration, brand
// enquiry, campaign application, membership request), so every form reads the same.

export const inputClass =
  "w-full min-h-11 px-3.5 py-2.5 bg-surface border border-field rounded-[4px] text-[0.9375rem] text-ink focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink aria-[invalid=true]:border-red-700 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-700";
export const labelClass = "block text-[0.875rem] font-semibold text-ink mb-1.5";
export const helpClass = "text-[0.8125rem] text-ink-3 mt-1";
export const optionalClass = "font-normal text-ink-3";
export const errorBoxClass = "p-3 bg-red-50 border border-red-300 text-red-800 text-[0.875rem] rounded-[4px] font-medium";

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
