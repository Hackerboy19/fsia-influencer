import React, { useState } from "react";
import { initials } from "../lib/profile";

// A profile photo in a fixed-ratio frame. While loading, and if the image is missing or
// broken, the frame shows the person's initials on a neutral background, so the layout
// never shifts and no broken-image icon appears.
export default function Photo({
  src,
  name,
  className = "",
  ratio = "aspect-[4/5]",
  sizes,
  eager = false,
  alt = ""
}: {
  src?: string;
  name: string;
  className?: string;
  ratio?: string;
  sizes?: string;
  eager?: boolean;
  alt?: string;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">(src ? "loading" : "failed");
  return (
    <span className={`relative block overflow-hidden bg-sunken ${ratio} ${className}`}>
      {state !== "loaded" && (
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-display text-[clamp(1.25rem,4vw,2.5rem)] text-ink-3 select-none">
          {initials(name)}
        </span>
      )}
      {src && state !== "failed" && (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          data-loaded={state === "loaded"}
          onLoad={() => setState("loaded")}
          onError={() => setState("failed")}
          className="img-fade absolute inset-0 w-full h-full object-cover"
        />
      )}
    </span>
  );
}
