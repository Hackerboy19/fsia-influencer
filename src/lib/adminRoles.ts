// Team roles for the admin panel. The server checks every admin request against this map;
// the admin panel uses it to hide what a person cannot open.
// Keep in sync with route_area() in php-backend/api/lib/helpers.php.

export type AdminRole = "owner" | "editor" | "inbox";
export type AdminArea = "team" | "website" | "inbox";

export const ADMIN_ROLES: { id: AdminRole; label: string; help: string }[] = [
  { id: "owner", label: "Owner", help: "Everything, including team logins and backups" },
  { id: "editor", label: "Website editor", help: "Pages, text, photos, creators and settings" },
  { id: "inbox", label: "Inbox only", help: "Applications, brand enquiries and messages" }
];

export const normaliseRole = (role: unknown): AdminRole => (role === "editor" || role === "inbox" ? role : "owner");

/** The area an admin API call belongs to (route is the path after /api/), or null when every role may use it. */
export function routeArea(method: string, route: string): AdminArea | null {
  const r = route.replace(/^\/+|\/+$/g, "");
  const m = method.toUpperCase();
  if (/^admin\/(users|backup|restore|logs)(\/|$)/.test(r)) return "team";
  if (/^(registrations|influencer-applications|enquiries)(\/|$)/.test(r)) return "inbox";
  if (m !== "GET" && /^(settings|creators|sections|campaigns|membership-plans|admin\/upload|admin\/settings-history)(\/|$)/.test(r)) return "website";
  return null;
}

export function roleCan(role: AdminRole, area: AdminArea | null): boolean {
  if (!area || role === "owner") return true;
  return (role === "editor" && area === "website") || (role === "inbox" && area === "inbox");
}
