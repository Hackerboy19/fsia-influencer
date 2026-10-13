// Admin API plumbing shared by the admin panel.
//
// 1. Many shared hosts (CGI/FastCGI PHP) strip the Authorization header, so
//    every authenticated /api request also carries the token in X-Admin-Token.
// 2. A 401 on an authenticated request means the session expired or was
//    revoked: broadcast it so the admin panel can sign out cleanly.

export const ADMIN_TOKEN_KEY = "fsia_admin_token";
export const ADMIN_UNAUTHORIZED_EVENT = "fsia-admin-unauthorized";

export function installAdminFetch() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.includes("/api/") || !init?.headers) {
      return originalFetch(input, init);
    }

    const headers = new Headers(init.headers);
    const auth = headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return originalFetch(input, init);
    }

    headers.set("X-Admin-Token", auth.slice(7));
    const res = await originalFetch(input, { ...init, headers });
    if (res.status === 401 && !url.includes("/api/auth/")) {
      window.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT));
    }
    return res;
  };
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (value: unknown) => {
    const text = Array.isArray(value) ? value.join(" | ") : value == null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [columns.join(","), ...rows.map((r) => columns.map((c) => escape(r[c])).join(","))].join("\n");
  // BOM so Excel opens UTF-8 (₹, names) correctly
  downloadBlob(filename, new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
