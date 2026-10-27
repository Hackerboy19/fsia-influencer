import React, { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronDown, Menu, Search, X } from "lucide-react";
import { routeForTab, TabId } from "../seo";
import { BRAND_NAME } from "../content/brand";
import { APPLY_LABEL } from "../content/awards";
import { useDialog, Portal } from "../lib/dialog";

/** A place on the site: a page, optionally a section on it (#id) */
export type NavTarget = { tab: TabId; hash?: string };

type LinkItem = { label: string; target: NavTarget; note?: string };
type ActionItem = { label: string; action: "enquiry" | "search"; note?: string };
type MenuItem = LinkItem | ActionItem;

const hrefOf = (t: NavTarget) => routeForTab(t.tab).path + (t.hash ? `#${t.hash}` : "");
const isAction = (i: MenuItem): i is ActionItem => "action" in i;

interface SiteHeaderProps {
  activeTab: TabId;
  /** Categories from the published profiles, with counts */
  categories: [string, number][];
  onGo: (target: NavTarget) => void;
  onBrowse: (filters: { q?: string; category?: string; city?: string }) => void;
  onBrandEnquiry: () => void;
}

// Every item points at a page or section that exists. "Awards" is the award section on the
// home page; "Categories" lists the categories that have published profiles.
const BRANDS: MenuItem[] = [
  { label: "Send a brand enquiry", action: "enquiry", note: "Free. Our team replies by email or phone." },
  { label: "Search creators", action: "search", note: "By name, niche or city" },
  { label: "How enquiries work", target: { tab: "home", hash: "for-brands" } },
  { label: "Open campaigns", target: { tab: "campaigns" } }
];
const CREATORS: MenuItem[] = [
  { label: APPLY_LABEL, target: { tab: "apply" }, note: "Free. Approved creators get a public profile." },
  { label: "How applying works", target: { tab: "home", hash: "for-creators" } },
  { label: "Membership plans", target: { tab: "membership" } },
  { label: "Star India members", target: { tab: "starindia" } }
];
const RESOURCES: MenuItem[] = [
  { label: "Guides for creators", target: { tab: "greenlight", hash: "blog" } },
  { label: "Questions and answers", target: { tab: "faq" } },
  { label: "Contact us", target: { tab: "contact" } },
  { label: "Privacy notice", target: { tab: "privacy" } }
];

function Wordmark({ onHome, dark }: { onHome: () => void; dark?: boolean }) {
  return (
    <a
      href="/"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        onHome();
      }}
      aria-label={`${BRAND_NAME}, home`}
      className="flex items-center gap-2.5 shrink-0"
    >
      <img src="/favicon.svg" alt="" width={32} height={32} className="w-8 h-8 rounded-[6px]" />
      <span className={`wordmark ${dark ? "text-white" : "text-ink"}`} aria-hidden="true">
        {BRAND_NAME.split(" ").map((w) => (
          <span key={w} className="block">{w}</span>
        ))}
      </span>
    </a>
  );
}

/** A plain disclosure: button + list of links. Escape or a click outside closes it. */
function Dropdown({ label, active, children, wide }: { label: string; active?: boolean; children: (close: () => void) => React.ReactNode; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div
      ref={box}
      className="relative h-full"
      onBlur={(e) => {
        if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`nav-link ${active ? "is-active" : ""} gap-1 cursor-pointer`}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div id={id} hidden={!open} className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 z-40 ${wide ? "w-[30rem]" : "w-72"}`}>
        <div className="panel p-2">{children(() => setOpen(false))}</div>
      </div>
    </div>
  );
}

export default function SiteHeader({ activeTab, categories, onGo, onBrowse, onBrandEnquiry }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useDialog<HTMLDivElement>(menuOpen, () => setMenuOpen(false));

  const go = (t: NavTarget) => {
    setMenuOpen(false);
    onGo(t);
  };
  const runAction = (a: ActionItem["action"]) => {
    setMenuOpen(false);
    if (a === "enquiry") onBrandEnquiry();
    else setSearchOpen(true);
  };

  // A normal click stays in the app; Cmd/Ctrl-click opens a new tab
  const linkProps = (t: NavTarget, after?: () => void) => ({
    href: hrefOf(t),
    onClick: (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      after?.();
      go(t);
    }
  });

  const DropItems = ({ items, close }: { items: MenuItem[]; close: () => void }) => (
    <ul>
      {items.map((item) => (
        <li key={item.label}>
          {isAction(item) ? (
            <button type="button" onClick={() => { close(); runAction(item.action); }} className="drop-item w-full text-left cursor-pointer">
              <span className="font-semibold text-ink">{item.label}</span>
              {item.note && <span className="block text-[0.8125rem] text-ink-3 font-normal">{item.note}</span>}
            </button>
          ) : (
            <a {...linkProps(item.target, close)} className="drop-item" aria-current={!item.target.hash && activeTab === item.target.tab ? "page" : undefined}>
              <span className="font-semibold text-ink">{item.label}</span>
              {item.note && <span className="block text-[0.8125rem] text-ink-3 font-normal">{item.note}</span>}
            </a>
          )}
        </li>
      ))}
    </ul>
  );

  const NavLink = ({ t, label, active }: { t: NavTarget; label: string; active: boolean }) => (
    <a {...linkProps(t)} aria-current={active ? "page" : undefined} className={`nav-link ${active ? "is-active" : ""}`}>
      {label}
    </a>
  );

  return (
    <>
      <header className="absolute top-0 inset-x-0 z-30 h-16 bg-paper/95 backdrop-blur border-b border-line">
        <div className="page-wide h-full flex items-center justify-between gap-5">
          <Wordmark onHome={() => go({ tab: "home" })} />

          <nav aria-label="Main" id="main-nav-tabs" className="hidden min-[1360px]:flex items-center gap-[1.125rem] h-full">
            <NavLink t={{ tab: "home" }} label="Home" active={activeTab === "home"} />
            <NavLink t={{ tab: "directory" }} label="Discover Creators" active={activeTab === "directory"} />
            <Dropdown label="Categories" wide>
              {(close) => (
                <div className="p-2">
                  <p className="label-caps px-1 pb-2">Browse by category</p>
                  {categories.length ? (
                    <ul className="grid grid-cols-2 gap-1">
                      {categories.map(([name, n]) => (
                        <li key={name}>
                          <a
                            href={`/talent/?category=${encodeURIComponent(name)}`}
                            onClick={(e) => {
                              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                              e.preventDefault();
                              close();
                              onBrowse({ category: name });
                            }}
                            className="drop-item flex items-baseline justify-between gap-2"
                          >
                            <span className="font-semibold text-ink">{name}</span>
                            <span className="text-[0.8125rem] text-ink-3 tabular-nums">{n}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-1 text-[0.875rem] text-ink-2">Categories appear once profiles are published.</p>
                  )}
                  <a {...linkProps({ tab: "home", hash: "categories" }, close)} className="link inline-flex items-center gap-1 mt-3 px-1 text-[0.875rem]">
                    All categories <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              )}
            </Dropdown>
            <NavLink t={{ tab: "catwalk" }} label="3D Gallery" active={activeTab === "catwalk"} />
            <NavLink t={{ tab: "greenlight" }} label="Magazine" active={activeTab === "greenlight"} />
            <NavLink t={{ tab: "home", hash: "the-award" }} label="Awards" active={false} />
            <NavLink t={{ tab: "campaigns" }} label="Campaigns" active={activeTab === "campaigns"} />
            <Dropdown label="For Brands">{(close) => <DropItems items={BRANDS} close={close} />}</Dropdown>
            <Dropdown label="For Creators" active={["membership", "starindia"].includes(activeTab)}>
              {(close) => <DropItems items={CREATORS} close={close} />}
            </Dropdown>
            <Dropdown label="Resources" active={["faq", "contact", "privacy"].includes(activeTab)}>
              {(close) => <DropItems items={RESOURCES} close={close} />}
            </Dropdown>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search creators"
              className="w-10 h-10 inline-flex items-center justify-center rounded-[4px] text-ink hover:bg-sunken cursor-pointer"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>
            <a {...linkProps({ tab: "apply" })} aria-current={activeTab === "apply" ? "page" : undefined} className="hidden sm:inline-flex btn btn-sm btn-primary">
              {APPLY_LABEL} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              className="min-[1360px]:hidden inline-flex items-center gap-2 h-10 px-3 rounded-[4px] border border-field text-ink text-[0.9375rem] font-semibold cursor-pointer"
            >
              <Menu className="w-5 h-5" aria-hidden="true" /> Menu
            </button>
          </div>
        </div>
      </header>

      {/* Menu for phones, tablets and small laptops */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-[60] min-[1360px]:hidden" onClick={() => setMenuOpen(false)}>
            <div className="absolute inset-0 bg-ink/30" aria-hidden="true" />
            <motion.div
              ref={menuRef}
              id="site-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-x-0 top-0 bg-paper border-b border-line shadow-[0_12px_30px_-12px_rgba(27,26,23,0.3)] outline-none max-h-[100dvh] overflow-y-auto"
            >
              <div className="page h-16 flex items-center justify-between">
                <Wordmark onHome={() => go({ tab: "home" })} />
                <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="w-10 h-10 inline-flex items-center justify-center rounded-[4px] text-ink hover:bg-sunken cursor-pointer">
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <nav aria-label="Menu" className="page pb-8">
                <ul className="divide-y divide-line border-y border-line">
                  {(
                    [
                      ["Home", { tab: "home" }],
                      ["Discover Creators", { tab: "directory" }],
                      ["3D Gallery", { tab: "catwalk" }],
                      ["Magazine", { tab: "greenlight" }],
                      ["Awards", { tab: "home", hash: "the-award" }],
                      ["Campaigns", { tab: "campaigns" }]
                    ] as [string, NavTarget][]
                  ).map(([label, t]) => {
                    const current = !t.hash && activeTab === t.tab;
                    return (
                      <li key={label}>
                        <a {...linkProps(t)} aria-current={current ? "page" : undefined} className={`flex items-center justify-between py-3.5 text-[1.0625rem] ${current ? "font-semibold text-ink" : "text-ink-2"}`}>
                          {label}
                          {current && <span className="text-[0.8125rem] text-ink-3 font-normal">Current page</span>}
                        </a>
                      </li>
                    );
                  })}
                </ul>

                {categories.length > 0 && (
                  <div className="mt-6">
                    <p className="label-caps pb-2">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(([name, n]) => (
                        <a
                          key={name}
                          href={`/talent/?category=${encodeURIComponent(name)}`}
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                            e.preventDefault();
                            setMenuOpen(false);
                            onBrowse({ category: name });
                          }}
                          className="chip"
                        >
                          {name} <span className="count">{n}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-6 sm:grid-cols-3">
                  {(
                    [
                      ["For brands", BRANDS],
                      ["For creators", CREATORS],
                      ["Resources", RESOURCES]
                    ] as [string, MenuItem[]][]
                  ).map(([title, items]) => (
                    <div key={title}>
                      <p className="label-caps pb-2 border-b border-line">{title}</p>
                      <ul className="mt-1">
                        {items.map((item) => (
                          <li key={item.label}>
                            {isAction(item) ? (
                              <button type="button" onClick={() => runAction(item.action)} className="block py-2 text-[0.9375rem] text-ink-2 hover:text-ink cursor-pointer text-left">
                                {item.label}
                              </button>
                            ) : (
                              <a {...linkProps(item.target)} className="block py-2 text-[0.9375rem] text-ink-2 hover:text-ink">
                                {item.label}
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <a {...linkProps({ tab: "apply" })} className="btn btn-primary">{APPLY_LABEL}</a>
                  <button type="button" onClick={() => runAction("enquiry")} className="btn btn-secondary">Brand enquiry</button>
                </div>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        categories={categories}
        onBrowse={(f) => {
          setSearchOpen(false);
          onBrowse(f);
        }}
      />
    </>
  );
}

function SearchDialog({ open, onClose, categories, onBrowse }: { open: boolean; onClose: () => void; categories: [string, number][]; onBrowse: SiteHeaderProps["onBrowse"] }) {
  const ref = useDialog<HTMLDivElement>(open, onClose);
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) requestAnimationFrame(() => input.current?.focus());
  }, [open]);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-[65]" onClick={onClose}>
        <div className="absolute inset-0 bg-ink/40" aria-hidden="true" />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby="site-search-title"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className="relative mx-auto mt-[10vh] w-[calc(100%-2rem)] max-w-2xl bg-paper border border-line shadow-[0_24px_60px_-20px_rgba(27,26,23,.45)] p-5 sm:p-6 outline-none"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 id="site-search-title" className="font-semibold text-ink text-[1.0625rem]">Search creators</h2>
            <button type="button" onClick={onClose} aria-label="Close search" className="w-10 h-10 inline-flex items-center justify-center rounded-[4px] hover:bg-sunken cursor-pointer">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <form
            role="search"
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onBrowse({ q: q.trim() });
            }}
          >
            <label htmlFor="site-search" className="sr-only">Name, niche or city</label>
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input ref={input} id="site-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, niche or city" autoComplete="off" className="field h-12 pl-9 text-[1rem]" />
            </div>
            <button type="submit" className="btn btn-primary h-12 px-5">Search</button>
          </form>
          {categories.length > 0 && (
            <div className="mt-5">
              <p className="label-caps pb-2">Or pick a category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(([name, n]) => (
                  <button key={name} type="button" className="chip" onClick={() => onBrowse({ category: name })}>
                    {name} <span className="count">{n}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
