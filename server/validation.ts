// Shared contact validation for the public forms.
// Keep in sync with valid_email() / valid_phone() in php-backend/api/lib/helpers.php
export const isValidEmail = (value: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());

// 10–15 digits; spaces, dashes, dots, brackets and a leading + allowed
export const isValidPhone = (value: unknown) => {
  const text = String(value ?? "").trim();
  const digits = text.replace(/\D/g, "").length;
  return /^\+?[\d\s().-]+$/.test(text) && digits >= 10 && digits <= 15;
};

export const PHONE_ERROR = "Please provide a valid phone number (10 to 15 digits, e.g. +91 98765 43210).";
