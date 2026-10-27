import React from "react";
import { isPreviewHost } from "../lib/preview";

export type RosterStatus = "loading" | "live" | "sample";

// Shown when the live profile list could not be loaded and the built-in sample list is used
// instead (for example on a preview deployment without the API), so nobody mistakes it for real data.
export default function RosterNotice({ status, onRetry, className = "" }: { status: RosterStatus; onRetry?: () => void; className?: string }) {
  if (status !== "sample") return null;
  return (
    <p role="note" className={`border border-line-strong bg-bronze-soft px-4 py-3 text-[0.875rem] text-ink ${className}`}>
      {isPreviewHost()
        ? "Preview: these are sample profiles. The live site shows the real directory."
        : "The live profile list could not be loaded, so sample profiles are shown."}{" "}
      {onRetry && !isPreviewHost() && (
        <button type="button" onClick={onRetry} className="link cursor-pointer">Try again</button>
      )}
    </p>
  );
}
