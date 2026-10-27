// API plumbing shared by the whole app.
//
// 1. Many shared hosts (CGI/FastCGI PHP) strip the Authorization header, so
//    every authenticated /api request also carries the token in X-Admin-Token.
// 2. A 401 on an authenticated request means the session expired or was
//    revoked: broadcast it so the admin panel can sign out cleanly.
// 3. Some hosts' firewalls drop a share of connections before the request is
//    sent. Reads and the login call are retried a few times with a short
//    back-off; other writes are not, so a form is never submitted twice.

export const ADMIN_TOKEN_KEY = "fsia_admin_token";
export const ADMIN_UNAUTHORIZED_EVENT = "fsia-admin-unauthorized";

const RETRY_DELAYS_MS = [300, 900, 1800];
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function installAdminFetch() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.includes("/api/")) {
      return originalFetch(input, init);
    }

    const headers = new Headers(init?.headers);
    const auth = headers.get("Authorization") || "";
    const isAdminCall = auth.startsWith("Bearer ");
    if (isAdminCall) headers.set("X-Admin-Token", auth.slice(7));

    const method = (init?.method || "GET").toUpperCase();
    const retryable = method === "GET" || method === "HEAD" || url.includes("/api/auth/login");

    let res: Response | undefined;
    for (let attempt = 0; ; attempt++) {
      try {
        res = await originalFetch(input, { ...init, headers });
        break;
      } catch (error) {
        // Network-level failure (connection reset/refused): nothing reached the server
        if (!retryable || attempt >= RETRY_DELAYS_MS.length) throw error;
        await wait(RETRY_DELAYS_MS[attempt]);
      }
    }

    if (isAdminCall && res.status === 401 && !url.includes("/api/auth/")) {
      window.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT));
    }
    return res;
  };
}

// One CSV cell. Values come from public forms: a leading = + - @ would run as a
// spreadsheet formula (e.g. =HYPERLINK(...)) when the export is opened in Excel.
export function csvCell(value: unknown): string {
  let text = Array.isArray(value) ? value.join(" | ") : value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const csv = [columns.map(csvCell).join(","), ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(","))].join("\n");
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
