import React, { useEffect, useState } from "react";
import { UserPlus, Mail, Inbox, Users, Layout, PenLine, Globe, Settings, ArrowRight, Activity } from "lucide-react";
import type { AdminRole } from "../lib/adminRoles";

// Admin → Overview: what needs attention today and what came in this week. Only real counts.

interface Props {
  token: string;
  role: AdminRole;
  currentUser: string;
  stats: { creatorsCount?: number; categoriesCount?: number; campaignsCount?: number; membershipPlansCount?: number; logs?: { id: string; timestamp: string; action: string }[] } | null;
  registrations: { id: string; timestamp: string; status?: string }[];
  applications: { id: string; timestamp: string; status: string }[];
  openTab: (id: string) => void;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** When an item arrived: from the time in its id (reg-1730000000000), else its date text */
export function receivedAt(item: { id: string; timestamp?: string }): number {
  const fromId = item.id.match(/(\d{13})(?:-\d+)?$/);
  if (fromId) return Number(fromId[1]);
  const t = Date.parse(item.timestamp || "");
  return isNaN(t) ? 0 : t;
}

const when = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
};

const card = "bg-white border border-line rounded-[4px] p-5";

function Count({ label, value, icon: Icon, onClick, tone }: { label: string; value: number; icon: typeof Users; onClick?: () => void; tone?: "alert" }) {
  const body = (
    <>
      <Icon className={`w-5 h-5 ${tone === "alert" && value > 0 ? "text-[#a8742e]" : "text-ink-3"}`} aria-hidden="true" />
      <div className="font-display text-[2rem] leading-none mt-3">{value}</div>
      <div className="text-[0.875rem] text-ink-2 mt-1.5 flex items-center gap-1">
        {label}
        {onClick && <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />}
      </div>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={`${card} text-left hover:border-ink-3 transition-colors cursor-pointer`}>
      {body}
    </button>
  ) : (
    <div className={card}>{body}</div>
  );
}

export default function AdminDashboard({ token, role, currentUser, stats, registrations, applications, openTab }: Props) {
  const [enquiries, setEnquiries] = useState<{ id: string; timestamp: string; status: string }[]>([]);
  const inbox = role !== "editor";
  const website = role !== "inbox";

  useEffect(() => {
    if (!inbox) return;
    fetch("/api/enquiries", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setEnquiries(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [token, inbox, registrations, applications]);

  const since = Date.now() - WEEK_MS;
  const thisWeek = (list: { id: string; timestamp?: string }[]) => list.filter((x) => receivedAt(x) >= since).length;

  return (
    <div className="text-ink space-y-6" id="admin-dashboard">
      <div>
        <h2 className="font-display text-[1.75rem] leading-tight">Hello, {currentUser}</h2>
        <p className="text-[0.875rem] text-ink-3">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {inbox && (
        <section aria-labelledby="dash-attention">
          <h3 id="dash-attention" className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-3">Needs a reply</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Count label="Award applications to review" value={applications.filter((a) => a.status === "pending").length} icon={UserPlus} tone="alert" onClick={() => openTab("influencer_applications")} />
            <Count label="New brand enquiries" value={registrations.filter((r) => (r.status || "new") === "new").length} icon={Mail} tone="alert" onClick={() => openTab("registrations")} />
            <Count label="New messages" value={enquiries.filter((e) => e.status === "new").length} icon={Inbox} tone="alert" onClick={() => openTab("enquiries")} />
          </div>
        </section>
      )}

      {inbox && (
        <section aria-labelledby="dash-week">
          <h3 id="dash-week" className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-3">Received in the last 7 days</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Count label="Award applications" value={thisWeek(applications)} icon={UserPlus} />
            <Count label="Brand enquiries" value={thisWeek(registrations)} icon={Mail} />
            <Count label="Messages" value={thisWeek(enquiries)} icon={Inbox} />
          </div>
        </section>
      )}

      {website && (
        <section aria-labelledby="dash-site">
          <h3 id="dash-site" className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-3">On the website</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Count label="Creators shown" value={stats?.creatorsCount ?? 0} icon={Users} onClick={() => openTab("creators")} />
            <Count label="Creator categories" value={stats?.categoriesCount ?? 0} icon={Layout} onClick={() => openTab("content_manager")} />
            <Count label="Brand campaigns" value={stats?.campaignsCount ?? 0} icon={Globe} onClick={() => openTab("content_manager")} />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button type="button" onClick={() => openTab("page_content")} className="btn btn-secondary btn-sm"><PenLine className="w-4 h-4" aria-hidden="true" /> Change page text or photos</button>
            <button type="button" onClick={() => openTab("pages_seo")} className="btn btn-secondary btn-sm"><Globe className="w-4 h-4" aria-hidden="true" /> Google title and description</button>
            <button type="button" onClick={() => openTab("content")} className="btn btn-secondary btn-sm"><Settings className="w-4 h-4" aria-hidden="true" /> Logo and email alerts</button>
          </div>
        </section>
      )}

      {role === "owner" && !!stats?.logs?.length && (
        <section className={card} aria-labelledby="dash-activity">
          <h3 id="dash-activity" className="font-semibold text-[1.0625rem] flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4" aria-hidden="true" /> Recent activity
          </h3>
          <ul className="divide-y divide-line">
            {stats.logs.slice(0, 8).map((log) => (
              <li key={log.id} className="py-2 flex flex-wrap justify-between gap-x-4">
                <span className="text-[0.875rem]">{log.action}</span>
                <span className="text-[0.75rem] text-ink-3">{when(log.timestamp)}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => openTab("history")} className="link text-[0.875rem] mt-3 cursor-pointer">See all activity</button>
        </section>
      )}
    </div>
  );
}
