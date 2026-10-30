// Unit checks for the brand rename and contact validation, plus Node ↔ PHP parity.
//   npx tsx scripts/test-unit.ts        (PHP checks are skipped when php is not installed)
import { execFileSync } from "child_process";
import path from "path";
import { debrandText } from "../server/db";
import { isValidEmail, isValidPhone } from "../server/validation";
import { csvCell } from "../src/lib/adminSession";
import { readableAccent } from "../src/lib/color";
import { roleCan, routeArea } from "../src/lib/adminRoles";
import { adsFor, cleanAds, cleanBrandSocial, cleanPopup, okLink, popupDue } from "../src/lib/siteExtras";
import { whatsappNumber } from "../src/components/ContactButtons";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `\n      ${detail}`}`);
};

// Team roles: which admin calls each role may make (same map in helpers.php)
const ROUTE_CASES: [string, string, string | null][] = [
  ["GET", "admin/users", "team"],
  ["DELETE", "admin/users/sam", "team"],
  ["GET", "admin/backup", "team"],
  ["POST", "admin/restore", "team"],
  ["GET", "admin/logs", "team"],
  ["GET", "registrations", "inbox"],
  ["PUT", "influencer-applications/inf-app-1", "inbox"],
  ["POST", "influencer-applications/x/approve", "inbox"],
  ["DELETE", "enquiries/enq-1", "inbox"],
  ["PUT", "settings", "website"],
  ["POST", "creators", "website"],
  ["DELETE", "sections/a", "website"],
  ["POST", "admin/upload", "website"],
  ["POST", "admin/settings-history/ver-1/restore", "website"],
  ["GET", "admin/settings", null],
  ["GET", "admin/settings-history", null],
  ["GET", "admin/stats", null],
  ["POST", "auth/change-password", null],
  ["GET", "creators", null]
];

const DEBRAND_CASES: [string, string][] = [
  // Only one award: older award-style section names and titles get neutral niche names
  ["Miss India 2026", "Fashion & Modelling"],
  ["Winner, Miss India 2026", "Fashion creator"],
  ["1st Runner Up, Miss India 2026", "Fashion creator"],
  ["Super Hero Awards", "Social Impact"],
  ["Verified VIP Influencers", "Lifestyle & Design"],
  ["Forever Influencer Portal", "Influencer Awards Portal"],
  ["FOREVER INFLUENCER", "INFLUENCER AWARDS"],
  ["FSIA INFLUENCER", "INFLUENCER AWARDS"],
  ["© 2026 Forever Influencer. All rights reserved.", "© 2026 Influencer Awards. All rights reserved."],
  ["© 2026 FSIA Influencer. All rights reserved.", "© 2026 Influencer Awards. All rights reserved."],
  ["The Forever Influencer Award", "The Influencer Award"],
  ["Apply for the FSIA Influencer Award", "Apply for the Influencer Award"],
  ["FSIA Influencer Awards 2026", "Influencer Awards 2026"],
  ["FSIA — Forever Star India Awards", "Influencer Awards"],
  ["Welcome to Forever Star India Association (FSIA)", "Welcome to Influencer Awards"],
  ["Forever Free plan", "Always Free plan"],
  ["Stay forever young", "Stay always young"],
  ["The Forever Gala", "The Gala"],
  ["fOrEvEr Icons", "Icons"],
  ["Foreverstar fashion week", "star fashion week"],
  ["FSIA Influencer Influencer awards", "Influencer Awards"],
  ["FSIA-24527 and the FSIA team", "FSIA-24527 and the Influencer Awards team"],
  ["Write to partner@fsia.in or visit influencer.fsia.in", "Write to partner@fsia.in or visit influencer.fsia.in"],
  ["Nothing to change here", "Nothing to change here"]
];

for (const [input, expected] of DEBRAND_CASES) {
  const out = debrandText(input);
  check(`debrandText(${JSON.stringify(input)})`, out === expected, `got ${JSON.stringify(out)}, expected ${JSON.stringify(expected)}`);
  check(`debrandText(${JSON.stringify(input)}) has no retired word`, !/forever/i.test(out) && !/\bFSIA\b(?![-.]\w)/.test(out));
}

// Must match isValidPhone() in server.ts and valid_phone() in helpers.php
const PHONE_CASES: [string, boolean][] = [
  ["+91 98765 43210", true],
  ["9876543210", true],
  ["(022) 2345-6789", true],
  ["022 2345 6789 0", true],
  ["12345", false],
  ["call me maybe", false],
  ["+91 98765 43210 ext 5", false],
  ["1234567890123456", false]
];

let php = true;
try {
  execFileSync("php", ["-v"], { stdio: "ignore" });
} catch {
  php = false;
  console.log("SKIP  PHP parity checks (php not installed)");
}

if (php) {
  const helpers = path.join(process.cwd(), "php-backend/api/lib/helpers.php");
  const runPhp = (code: string, input: unknown) =>
    execFileSync("php", ["-r", `require ${JSON.stringify(helpers)}; $in = json_decode(stream_get_contents(STDIN), true); ${code}`], {
      input: JSON.stringify(input)
    }).toString();

  const phpDebrand = JSON.parse(runPhp("echo json_encode(array_map('debrand_text', $in), JSON_UNESCAPED_UNICODE);", DEBRAND_CASES.map((c) => c[0])));
  DEBRAND_CASES.forEach(([input], i) =>
    check(`PHP debrand_text matches Node for ${JSON.stringify(input)}`, phpDebrand[i] === debrandText(input), `PHP: ${JSON.stringify(phpDebrand[i])}`)
  );

  const phpAreas = JSON.parse(runPhp("echo json_encode(array_map(function ($c) { return route_area($c[0], $c[1]); }, $in));", ROUTE_CASES));
  ROUTE_CASES.forEach(([m, r], i) => check(`PHP route_area(${m} ${r}) matches Node`, phpAreas[i] === routeArea(m, r), `PHP: ${phpAreas[i]}`));

  const phpPhones = JSON.parse(runPhp("echo json_encode(array_map('valid_phone', $in));", PHONE_CASES.map((c) => c[0])));
  PHONE_CASES.forEach(([input, expected], i) =>
    check(`PHP valid_phone(${JSON.stringify(input)}) is ${expected}`, phpPhones[i] === expected, `got ${phpPhones[i]}`)
  );
}

ROUTE_CASES.forEach(([m, r, area]) => check(`routeArea(${m} ${r}) is ${area}`, routeArea(m, r) === area));
check("Website editor cannot open team logins or the inbox", !roleCan("editor", "team") && !roleCan("editor", "inbox") && roleCan("editor", "website"));
check("Inbox role cannot change the website", !roleCan("inbox", "website") && !roleCan("inbox", "team") && roleCan("inbox", "inbox"));
check("Owner can do everything", roleCan("owner", "team") && roleCan("owner", "website") && roleCan("owner", "inbox"));
for (const [input, expected] of [["98765 43210", "919876543210"], ["+91 98765-43210", "919876543210"], ["09876543210", "919876543210"], ["0044 20 7946 0958", "442079460958"], ["12345", ""]] as const) {
  check(`whatsappNumber(${JSON.stringify(input)}) is ${JSON.stringify(expected)}`, whatsappNumber(input) === expected);
}

// Popup, ads and brand social links from Admin → Popup & ads / Site settings
for (const [input, ok] of [["/apply/", true], ["https://brand.com/x", true], ["javascript:alert(1)", false], ["//evil.com", false], ["data:text/html,x", false], ["brand.com", false]] as const) {
  check(`okLink(${JSON.stringify(input)}) is ${ok}`, !!okLink(input) === ok);
}
check("popup with no title, text or image stays off", cleanPopup({ enabled: true }).enabled === false);
check("popup delay is kept between 0 and 60 seconds", cleanPopup({ enabled: true, title: "x", delaySeconds: 999 }).delaySeconds === 60);
check("popup page list falls back to every page", cleanPopup({ pages: [] }).pages[0] === "*");
const mem = (v: string | null) => ({ getItem: () => v });
const pop = cleanPopup({ enabled: true, title: "Hi", pages: ["/"], frequency: "once", version: "v2" });
check("popup shows to a new visitor on its page", popupDue(pop, "/", mem(null)));
check("popup not shown on other pages", !popupDue(pop, "/faq/", mem(null)));
check("popup shown once only", !popupDue(pop, "/", mem("v2|" + Date.now())));
check("an edited popup shows again", popupDue(pop, "/", mem("v1|" + Date.now())));
check("a daily popup shows again after a day", popupDue({ ...pop, frequency: "daily" }, "/", mem("v2|" + (Date.now() - 25 * 3600e3))));
check("popup never shows in the admin", !popupDue({ ...pop, pages: ["*"] }, "/admin/", mem(null)));
const ads = cleanAds([{ image: "/uploads/a.jpg", pages: ["/"], position: "top" }, { image: "javascript:x" }, { image: "/uploads/b.jpg", pages: ["*"], position: "bottom", link: "javascript:alert(1)" }, { image: "/uploads/c.jpg", enabled: false }]);
check("ads without a valid image are dropped", ads.length === 3);
check("unsafe ad links are removed", ads[1].link === "");
check("ads appear only on their pages and place", adsFor(ads, "/", "top").length === 1 && adsFor(ads, "/faq/", "top").length === 0 && adsFor(ads, "/faq/", "bottom").length === 1);
check("switched-off ads are hidden", adsFor(ads, "/", "top").every((a) => a.enabled));
const bs = cleanBrandSocial({ links: { instagram: "@fsiainfluencer", youtube: "not a link!", x: "https://evil.com/x" } });
check("brand social links are saved as full https links", bs.links.instagram === "https://www.instagram.com/fsiainfluencer" && !bs.links.youtube && !bs.links.x);
check("brand social icons show in the footer by default, header only when chosen", bs.footer && !bs.header);

PHONE_CASES.forEach(([input, expected]) => check(`isValidPhone(${JSON.stringify(input)}) is ${expected}`, isValidPhone(input) === expected));
for (const [input, expected] of [["creator@example.com", true], [" brand@example.in ", true], ["no-at-sign.com", false], ["a@b", false]] as const) {
  check(`isValidEmail(${JSON.stringify(input)}) is ${expected}`, isValidEmail(input) === expected);
}

// Admin CSV exports must not let form input run as a spreadsheet formula
for (const [input, expected] of [
  ['=HYPERLINK("http://evil.example","x")', `"'=HYPERLINK(""http://evil.example"",""x"")"`],
  ["+91 98765 43210", "'+91 98765 43210"],
  ["@SUM(A1)", "'@SUM(A1)"],
  ["-2+3", "'-2+3"],
  ["Plain, text", '"Plain, text"'],
  ["Priya Sharma", "Priya Sharma"]
] as const) {
  check(`csvCell(${JSON.stringify(input)}) is safe`, csvCell(input) === expected, `got ${csvCell(input)}`);
}

// Admin accent colours must stay readable on the dark bars (≥ 4.5:1 against #333, the lightest dark surface)
const lum = (hex: string) => {
  const ch = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
for (const input of ["#2f2a23", "#000000", "#E1C699", "#123", "not-a-colour", ""]) {
  const out = readableAccent(input);
  const ratio = (lum(out) + 0.05) / (lum("#333333") + 0.05);
  check(`readableAccent(${JSON.stringify(input)}) = ${out} reads on #333 (${ratio.toFixed(2)}:1)`, ratio >= 4.5);
}
check("readableAccent keeps an already-readable colour unchanged", readableAccent("#E1C699").toLowerCase() === "#e1c699");

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll unit checks passed.");
process.exit(failures ? 1 : 0);
