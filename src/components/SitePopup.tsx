import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useDialog, Portal } from "../lib/dialog";
import { popupDue, type SitePopup as Popup } from "../lib/siteExtras";
import { safeLocal } from "../lib/safeStorage";

// The popup set in Admin → Site settings → Popup. Shown after a short delay on the chosen pages,
// once, once a day or on every visit. In the admin preview it opens straight away.
export default function SitePopup({ popup, path, preview = false }: { popup: Popup; path: string; preview?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    if (preview) {
      // Inside an admin preview frame: only the popup being edited opens
      if (popup.enabled && popup.version === "preview") setOpen(true);
      return;
    }
    if (!popupDue(popup, path, safeLocal)) return;
    const timer = window.setTimeout(() => {
      setOpen(true);
      safeLocal.setItem("fsia_popup_seen", `${popup.version}|${Date.now()}`);
    }, popup.delaySeconds * 1000);
    return () => window.clearTimeout(timer);
    // Only the first matching page of a visit shows it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popup.version, popup.enabled, preview, path]);

  const close = () => setOpen(false);
  const ref = useDialog<HTMLDivElement>(open, close);
  if (!open) return null;
  const external = /^https?:\/\//i.test(popup.buttonLink);

  return (
    <Portal>
      <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 bg-black/45" onClick={close} data-site-popup>
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={popup.title ? "site-popup-title" : undefined}
          aria-label={popup.title ? undefined : "Announcement"}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-paper text-ink border border-line shadow-xl outline-none max-h-[90vh] overflow-y-auto"
        >
          <button type="button" onClick={close} aria-label="Close" className="absolute top-2 right-2 w-10 h-10 inline-flex items-center justify-center bg-paper/90 hover:bg-white cursor-pointer z-10">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
          {popup.image && <img src={popup.image} alt="" className="w-full max-h-[50vh] object-cover" />}
          {(popup.title || popup.text || (popup.buttonLabel && popup.buttonLink)) && (
            <div className="p-6 space-y-3">
              {popup.title && <h2 id="site-popup-title" className="font-display text-[1.625rem] leading-tight pr-8">{popup.title}</h2>}
              {popup.text && <p className="text-[0.9375rem] text-ink-2 leading-relaxed whitespace-pre-line">{popup.text}</p>}
              {popup.buttonLabel && popup.buttonLink && (
                <a
                  href={popup.buttonLink}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  onClick={close}
                  className="btn btn-primary mt-2"
                >
                  {popup.buttonLabel}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
