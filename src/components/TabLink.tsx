import React from "react";
import { routeForTab, TabId } from "../seo";

// A real <a href> (so crawlers and "open in new tab" work) that switches tabs in place on a normal click
export default function TabLink({
  tab,
  onNavigate,
  className,
  children,
  ...rest
}: {
  tab: TabId;
  onNavigate: (tab: TabId) => void;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">) {
  return (
    <a
      {...rest}
      href={routeForTab(tab).path}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onNavigate(tab);
      }}
      className={className}
    >
      {children}
    </a>
  );
}
