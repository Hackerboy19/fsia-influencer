import React from "react";

// The validation message shown directly under the field it belongs to. Inputs point at it
// with aria-describedby (see errorProps), so screen readers read it when the field gets focus.
export const errorId = (fieldId: string) => `${fieldId}-error`;

export function errorProps(fieldId: string, invalidField: string, describedBy?: string) {
  const invalid = invalidField === fieldId;
  const ids = [invalid ? errorId(fieldId) : "", describedBy || ""].filter(Boolean).join(" ");
  return { "aria-invalid": invalid || undefined, "aria-describedby": ids || undefined } as const;
}

export default function FieldError({ fieldId, invalidField, message }: { fieldId: string; invalidField: string; message: string }) {
  if (invalidField !== fieldId || !message) return null;
  return (
    <p id={errorId(fieldId)} role="alert" className="mt-1.5 text-[0.875rem] font-medium text-[#A12A1F]">
      {message}
    </p>
  );
}
