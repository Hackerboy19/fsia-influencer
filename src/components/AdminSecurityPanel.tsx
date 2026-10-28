import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { KeyRound, Users, Trash2, Download, Upload, ShieldCheck, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { downloadBlob } from "../lib/adminSession";
import { ADMIN_ROLES, type AdminRole } from "../lib/adminRoles";

interface Operator {
  username: string;
  role?: AdminRole;
  createdAt: string | null;
  lastLogin: string | null;
}

interface Props {
  token: string;
  currentUser: string;
  role: AdminRole;
  onPasswordChanged: () => void;
  onDataRestored: () => void;
}

const inputClass =
  "w-full px-3.5 py-2.5 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-champagne";
const labelClass = "text-[11px] font-sans font-bold tracking-wider text-[#666] uppercase block";
const cardClass = "bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-black/5 space-y-4";

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : "—");

export default function AdminSecurityPanel({ token, currentUser, role, onPasswordChanged, onDataRestored }: Props) {
  const isOwner = role === "owner";
  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  const [operators, setOperators] = useState<Operator[]>([]);
  const [newOperator, setNewOperator] = useState<{ username: string; password: string; role: AdminRole }>({ username: "", password: "", role: "editor" });

  const restoreInput = useRef<HTMLInputElement>(null);

  const loadOperators = async () => {
    if (!isOwner) return;
    const res = await fetch("/api/admin/users", { headers: authHeaders });
    if (res.ok) setOperators(await res.json());
  };

  useEffect(() => {
    loadOperators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isOwner]);

  const changeRole = async (username: string, next: AdminRole) => {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ role: next })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) toast.success(`${username} is now: ${ADMIN_ROLES.find((r) => r.id === next)?.label}.`);
    else toast.error(data.error || "Could not change the role.");
    loadOperators();
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error("The new passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.next })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Password updated. Other sessions were signed out.");
        setPasswordForm({ current: "", next: "", confirm: "" });
        onPasswordChanged();
      } else {
        toast.error(data.error || "Failed to update password.");
      }
    } catch {
      toast.error("Unable to reach the server.");
    } finally {
      setSavingPassword(false);
    }
  };

  const addOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(newOperator)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      toast.success(`Login "${newOperator.username}" created.`);
      setNewOperator({ username: "", password: "", role: "editor" });
      loadOperators();
    } else {
      toast.error(data.error || "Could not create the login.");
    }
  };

  const removeOperator = async (username: string) => {
    if (!window.confirm(`Remove the login "${username}"? They will be signed out immediately.`)) return;
    const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
      method: "DELETE",
      headers: authHeaders
    });
    const data = await res.json();
    if (res.ok && data.success) {
      toast.success("Login removed.");
      loadOperators();
    } else {
      toast.error(data.error || "Could not remove the login.");
    }
  };

  const downloadBackup = async () => {
    const res = await fetch("/api/admin/backup", { headers: authHeaders });
    if (!res.ok) {
      toast.error("Backup failed.");
      return;
    }
    const blob = await res.blob();
    downloadBlob(`fsia-backup-${new Date().toISOString().slice(0, 10)}.json`, blob);
    toast.success("Backup downloaded.");
  };

  const restoreBackup = async (file: File) => {
    if (!window.confirm("Restoring replaces all creators, campaigns, plans, leads and applications with the backup's contents. Continue?")) {
      return;
    }
    try {
      const payload = JSON.parse(await file.text());
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Backup restored.");
        window.dispatchEvent(new Event("sections-updated"));
        onDataRestored();
      } else {
        toast.error(data.error || "Restore failed.");
      }
    } catch {
      toast.error("That file is not valid JSON.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Change password */}
      <form onSubmit={changePassword} className={cardClass}>
        <div className="flex items-center gap-2 border-b border-black/5 pb-3">
          <KeyRound className="w-4 h-4 text-champagne" />
          <h3 className="font-serif-display text-lg font-bold text-[#111]">Change password</h3>
        </div>
        <p className="text-xs text-[#666] font-serif-text">
          Signed in as <strong className="text-black">{currentUser}</strong>. Use at least 8 characters.
        </p>
        <div className="space-y-1.5">
          <label className={labelClass}>Current password</label>
          <input type="password" required autoComplete="current-password" className={inputClass}
            value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>New password</label>
            <input type="password" required minLength={8} autoComplete="new-password" className={inputClass}
              value={passwordForm.next} onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Confirm new password</label>
            <input type="password" required minLength={8} autoComplete="new-password" className={inputClass}
              value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
          </div>
        </div>
        <button type="submit" disabled={savingPassword}
          className="bg-[#111] hover:bg-[#222] text-[#FAF9F6] text-xs tracking-[0.2em] font-bold px-5 py-3 rounded-xl uppercase cursor-pointer disabled:opacity-50">
          {savingPassword ? "Saving…" : "Update password"}
        </button>
      </form>

      {/* Team logins */}
      {isOwner && (
      <div className={cardClass} id="admin-team">
        <div className="flex items-center gap-2 border-b border-black/5 pb-3">
          <Users className="w-4 h-4 text-champagne" />
          <h3 className="font-serif-display text-lg font-bold text-[#111]">Team logins</h3>
        </div>
        <ul className="text-xs text-[#666] space-y-0.5">
          {ADMIN_ROLES.map((r) => (
            <li key={r.id}><strong className="text-[#111]">{r.label}:</strong> {r.help}</li>
          ))}
        </ul>
        <div className="divide-y divide-black/5 border border-black/5 rounded-xl bg-white/50">
          {operators.map((op) => (
            <div key={op.username} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-black truncate flex items-center gap-1.5">
                  {op.username}
                  {op.username === currentUser && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">You</span>
                  )}
                </div>
                <div className="text-[11px] text-[#888]">Last login: {formatDate(op.lastLogin)}</div>
              </div>
              <div className="flex items-center gap-1.5">
                {op.username === currentUser ? (
                  <span className="text-xs text-[#444]">{ADMIN_ROLES.find((r) => r.id === (op.role || "owner"))?.label}</span>
                ) : (
                  <>
                    <select
                      value={op.role || "owner"}
                      onChange={(e) => changeRole(op.username, e.target.value as AdminRole)}
                      aria-label={`Role of ${op.username}`}
                      className="px-2 py-1.5 bg-white border border-black/10 rounded-lg text-xs"
                    >
                      {ADMIN_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                    <button onClick={() => removeOperator(op.username)} title="Remove login"
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={addOperator} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end" id="add-login-form">
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="new-login-name">Username</label>
            <input id="new-login-name" required className={inputClass} value={newOperator.username}
              onChange={(e) => setNewOperator({ ...newOperator, username: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="new-login-password">Password</label>
            <input id="new-login-password" type="password" required minLength={8} autoComplete="new-password" className={inputClass}
              value={newOperator.password} onChange={(e) => setNewOperator({ ...newOperator, password: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="new-login-role">Role</label>
            <select id="new-login-role" className={inputClass} value={newOperator.role}
              onChange={(e) => setNewOperator({ ...newOperator, role: e.target.value as AdminRole })}>
              {ADMIN_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <button type="submit"
            className="bg-champagne/15 hover:bg-champagne/25 border border-champagne/40 text-[#111] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /> Add login
          </button>
        </form>
      </div>
      )}

      {/* Backup & restore */}
      {isOwner && (
      <div className={cardClass}>
        <div className="flex items-center gap-2 border-b border-black/5 pb-3">
          <ShieldCheck className="w-4 h-4 text-champagne" />
          <h3 className="font-serif-display text-lg font-bold text-[#111]">Backup and restore</h3>
        </div>
        <p className="text-xs text-[#666] font-serif-text leading-relaxed">
          Download a complete copy of creators, categories, campaigns, plans, applications, enquiries and site
          settings. Passwords are never included. Take a backup before every website update.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadBackup}
            className="bg-[#111] hover:bg-[#222] text-[#FAF9F6] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer">
            <Download className="w-4 h-4 text-champagne" /> Download backup
          </button>
          <button onClick={() => restoreInput.current?.click()}
            className="border border-black/10 bg-white hover:bg-black/5 text-[#111] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" /> Restore from file
          </button>
          <input ref={restoreInput} type="file" accept="application/json,.json" className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) restoreBackup(file);
              e.target.value = "";
            }} />
        </div>
      </div>
      )}
    </motion.div>
  );
}
