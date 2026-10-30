import React, { useEffect, useState } from "react";
import { History, RotateCcw, Activity, Search, Download, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { downloadCsv } from "../lib/adminSession";
import type { AdminRole } from "../lib/adminRoles";

// Admin → Change history: every change to the site settings (texts, pages, SEO, logo…) is kept,
// newest first, so a mistake can be undone. Owners also see the full activity log.

interface Version {
  id: string;
  at: string;
  by: string;
  keys: string[];
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  ip?: string;
}

// What each settings key means, in plain words
const KEY_NAMES: Record<string, string> = {
  content: "Page content",
  pages: "Pages & SEO",
  homeHero: "Home page top",
  navLabels: "Menu names",
  logoUrl: "Logo",
  logoHidesName: "Logo",
  primaryColor: "Brand colour",
  footerText: "Footer line",
  notifyEmail: "Email alerts",
  brandSocial: "Your social media",
  popup: "Popup",
  ads: "Ads",
  restore: "Went back to an earlier version"
};

const describe = (keys: string[]) => {
  const names = Array.from(new Set(keys.map((k) => KEY_NAMES[k] || "Other settings")));
  return names.join(", ") || "Settings";
};

const when = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const card = "bg-white border border-line rounded-[4px] p-5 space-y-4";

export default function AdminHistoryPanel({ token, role, onRestored }: { token: string; role: AdminRole; onRestored: () => void }) {
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logQuery, setLogQuery] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/settings-history", { headers });
    setVersions(res.ok ? await res.json() : []);
    if (role === "owner") {
      const l = await fetch("/api/admin/logs", { headers });
      if (l.ok) setLogs(await l.json());
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role]);

  const restore = async (v: Version) => {
    if (!window.confirm(`Go back to the settings as they were before the change on ${when(v.at)}? The current settings are saved first, so this can be undone too.`)) return;
    setBusy(v.id);
    try {
      const res = await fetch(`/api/admin/settings-history/${encodeURIComponent(v.id)}/restore`, { method: "POST", headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not go back to this version.");
      toast.success("Done. The website now uses the earlier settings.");
      onRestored();
      load();
    } catch (e: any) {
      toast.error(e?.message || "Could not go back to this version.");
    } finally {
      setBusy("");
    }
  };

  const filteredLogs = logs.filter((l) => `${l.action} ${l.ip || ""}`.toLowerCase().includes(logQuery.toLowerCase()));

  return (
    <div className="text-ink space-y-6 max-w-4xl" id="admin-history">
      <div>
        <h2 className="font-display text-[1.75rem] leading-tight">Change history</h2>
        <p className="text-[0.875rem] text-ink-3">Made a mistake? Go back to how the website was before any change.</p>
      </div>

      <section className={card}>
        <h3 className="font-semibold text-[1.0625rem] flex items-center gap-2">
          <History className="w-4 h-4" aria-hidden="true" /> Website changes
        </h3>
        <p className="text-[0.8125rem] text-ink-3">
          Covers page text and photos, Pages &amp; SEO, menu names, logo, colour and footer (the last 20 changes).
          Creators, gallery and plans are not included here: use Backup on the Password &amp; team page for those.
        </p>
        {versions === null ? (
          <p className="text-ink-3 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading…</p>
        ) : versions.length === 0 ? (
          <p className="text-ink-3 text-sm">No changes saved yet. Each time someone presses Save, the previous version is kept here.</p>
        ) : (
          <ul className="divide-y divide-line border border-line rounded-[4px]" id="history-list">
            {versions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[0.9375rem] font-medium">{describe(v.keys)}</div>
                  <div className="text-[0.8125rem] text-ink-3">{when(v.at)} · by {v.by || "unknown"}</div>
                </div>
                <button type="button" onClick={() => restore(v)} disabled={!!busy} className="btn btn-secondary btn-sm disabled:opacity-50">
                  {busy === v.id ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="w-4 h-4" aria-hidden="true" />}
                  Undo this change
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {role === "owner" && (
        <section className={card}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-[1.0625rem] flex items-center gap-2">
              <Activity className="w-4 h-4" aria-hidden="true" /> Activity log
            </h3>
            <button type="button" onClick={() => downloadCsv("activity-log.csv", logs as unknown as Record<string, unknown>[])} className="link text-[0.875rem] flex items-center gap-1 cursor-pointer">
              <Download className="w-3.5 h-3.5" aria-hidden="true" /> Download CSV
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-ink-3" aria-hidden="true" />
            <input placeholder="Search the log…" aria-label="Search the log" className="field !pl-9" value={logQuery} onChange={(e) => setLogQuery(e.target.value)} />
          </div>
          <ul className="max-h-[360px] overflow-y-auto divide-y divide-line">
            {filteredLogs.map((log) => (
              <li key={log.id} className="py-2">
                <div className="text-[0.75rem] text-ink-3">{when(log.timestamp)}{log.ip ? ` · ${log.ip}` : ""}</div>
                <p className="text-[0.875rem]">{log.action}</p>
              </li>
            ))}
            {filteredLogs.length === 0 && <li className="py-2 text-sm text-ink-3">No matching entries.</li>}
          </ul>
        </section>
      )}
    </div>
  );
}
