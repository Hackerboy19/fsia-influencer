import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Search, Download, Trash2, Mail, Phone, Briefcase, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import { downloadCsv } from "../lib/adminSession";

type Status = "new" | "contacted" | "confirmed" | "closed";

interface Enquiry {
  id: string;
  type: "campaign" | "membership";
  subject: string;
  refId?: string;
  name: string;
  email: string;
  phone: string;
  details: Record<string, string>;
  status: Status;
  notes?: string;
  timestamp: string;
}

const STATUSES: { id: Status; label: string; className: string }[] = [
  { id: "new", label: "New", className: "bg-blue-50 text-blue-800 border-blue-200" },
  { id: "contacted", label: "Contacted", className: "bg-amber-50 text-amber-800 border-amber-200" },
  { id: "confirmed", label: "Confirmed", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "closed", label: "Closed", className: "bg-stone-100 text-stone-700 border-stone-300" }
];

const DETAIL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  pitch: "Pitch",
  plan: "Plan",
  price: "Price",
  totalWithGst: "Total incl. GST",
  pan: "PAN",
  gstin: "GSTIN"
};

export default function AdminEnquiriesPanel({ token, onChange }: { token: string; onChange?: () => void }) {
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const [items, setItems] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | Enquiry["type"]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/enquiries", { headers });
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const update = async (id: string, patch: { status?: Status; notes?: string }) => {
    setItems((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    const res = await fetch(`/api/enquiries/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(patch)
    });
    if (!res.ok) {
      toast.error("Failed to update enquiry.");
      load();
    } else {
      onChange?.();
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this enquiry permanently?")) return;
    const res = await fetch(`/api/enquiries/${encodeURIComponent(id)}`, { method: "DELETE", headers });
    if (res.ok) {
      toast.success("Enquiry deleted.");
      setItems((prev) => prev.filter((e) => e.id !== id));
      onChange?.();
    } else {
      toast.error("Failed to delete enquiry.");
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = items.filter(
    (e) =>
      (typeFilter === "all" || e.type === typeFilter) &&
      (statusFilter === "all" || e.status === statusFilter) &&
      (!q || [e.name, e.email, e.phone, e.subject, e.id].some((f) => (f || "").toLowerCase().includes(q)))
  );

  // Detail keys come from the visitor's request: prefix them so they can never replace the real columns
  const exportRows = filtered.map(({ details, ...rest }) => ({
    ...rest,
    ...Object.fromEntries(Object.entries(details || {}).map(([key, value]) => [`detail_${key}`, value]))
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/70 rounded-2xl border border-black/10 overflow-hidden">
      <div className="px-5 py-4 bg-[#F4F3F0] border-b border-black/10">
        <h4 className="font-serif-display text-base font-bold text-[#111]">Enquiries</h4>
        <p className="text-sm text-[#47453f]">Campaign applications from creators and membership plan requests.</p>
      </div>

      <div className="px-5 py-3 border-b border-black/10 flex flex-col md:flex-row gap-2 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#57554f]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone or subject…"
            className="w-full pl-9 pr-3 py-2 bg-white border border-black/15 rounded-lg text-sm focus:outline-none focus:border-[#111]"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="px-3 py-2 bg-white border border-black/15 rounded-lg text-sm">
          <option value="all">All types</option>
          <option value="campaign">Campaign applications</option>
          <option value="membership">Membership requests</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2 bg-white border border-black/15 rounded-lg text-sm">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={() => downloadCsv(`fsia-enquiries-${new Date().toISOString().slice(0, 10)}.csv`, exportRows)}
          disabled={filtered.length === 0}
          className="px-3 py-2 bg-[#111] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="divide-y divide-black/10">
        {filtered.map((e) => {
          const status = STATUSES.find((s) => s.id === e.status) || STATUSES[0];
          const Icon = e.type === "campaign" ? Briefcase : Sparkles;
          return (
            <div key={e.id} className="p-5 space-y-3">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#2e2c29]">
                      <Icon className="w-4 h-4" /> {e.type === "campaign" ? "Campaign application" : "Membership request"}
                    </span>
                    <select
                      value={e.status}
                      onChange={(ev) => update(e.id, { status: ev.target.value as Status })}
                      className={`text-xs font-bold uppercase px-2 py-0.5 rounded border cursor-pointer ${status.className}`}
                      aria-label="Status"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <p className="font-serif-display text-lg font-bold text-[#111]">{e.subject || "—"}</p>
                  <p className="text-sm text-[#2e2c29]">
                    <strong className="text-[#111]">{e.name}</strong> ·{" "}
                    <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1 underline underline-offset-2"><Mail className="w-3.5 h-3.5" />{e.email}</a> ·{" "}
                    <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1 underline underline-offset-2"><Phone className="w-3.5 h-3.5" />{e.phone}</a>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-[#47453f]">{new Date(e.timestamp).toLocaleString()}</span>
                  <button onClick={() => remove(e.id)} title="Delete enquiry" className="p-2 rounded-lg text-red-700 hover:bg-red-50 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {Object.entries(e.details || {}).some(([, v]) => v) && (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm bg-white/70 border border-black/10 rounded-xl p-3">
                  {Object.entries(e.details)
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className={k === "pitch" ? "sm:col-span-2" : ""}>
                        <dt className="text-xs font-bold uppercase tracking-wider text-[#47453f]">{DETAIL_LABELS[k] || k}</dt>
                        <dd className="text-[#111] whitespace-pre-wrap break-words">{v}</dd>
                      </div>
                    ))}
                </dl>
              )}

              <textarea
                defaultValue={e.notes || ""}
                onBlur={(ev) => {
                  if (ev.target.value !== (e.notes || "")) update(e.id, { notes: ev.target.value });
                }}
                placeholder="Private follow-up notes (saved when you click away)…"
                rows={2}
                className="w-full px-3 py-2 bg-white border border-black/15 rounded-lg text-sm focus:outline-none focus:border-[#111]"
              />
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <p className="p-12 text-center text-sm text-[#47453f]">
            {items.length === 0 ? "No enquiries yet." : "No enquiries match your filters."}
          </p>
        )}
      </div>
    </motion.div>
  );
}
