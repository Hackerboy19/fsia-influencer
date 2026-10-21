// End-to-end user journeys and form tests in a real browser.
//
//   node scripts/test-journeys.mjs [baseUrl] [--admin=user:password]
//
// Submits test enquiries, so it only runs against a local build (127.0.0.1 /
// localhost) with a throwaway database — never against the live site. Uses
// clearly fake contact details (example.com addresses, 90000 phone numbers) and,
// with the default local admin login, checks each submission was stored.
// Start from a fresh database (delete storage/db.json or server/db.json, restart
// the Node server): the run ends by using up the 10-minute submission limit.
import fs from "fs";

const args = process.argv.slice(2);
const BASE = (args.find((a) => !a.startsWith("--")) || "http://127.0.0.1:8080").replace(/\/+$/, "");
const [ADMIN_USER, ADMIN_PASS] = (args.find((a) => a.startsWith("--admin="))?.slice(8) || "admin:admin123").split(":");
const host = new URL(BASE).hostname;
if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
  console.error(`Refusing to submit test data to ${BASE}. Run this against a local build only.`);
  process.exit(2);
}

const RUN = Date.now().toString(36);
const TEST = {
  brand: `QA Test Brand ${RUN}`,
  creator: `QA Test Creator ${RUN}`,
  creatorCategory: `QA Astrology ${RUN}`,
  campaignApplicant: `QA Campaign Applicant ${RUN}`,
  member: `QA Member ${RUN}`,
  contact: `QA Contact ${RUN}`,
  booker: `QA Booker ${RUN}`,
  email: `qa+${RUN}@example.com`,
  phone: "+91 90000 00000"
};

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const { chromium } = await import("playwright");
const browser = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});

const h1 = (page) => page.locator("h1").first().innerText().catch(() => "");
// Polls briefly: React re-renders and focus moves land a frame or two after the click
async function poll(read, test, ms = 5000) {
  const end = Date.now() + ms;
  let value = await read();
  while (!test(value) && Date.now() < end) {
    await new Promise((r) => setTimeout(r, 100));
    value = await read();
  }
  return value;
}
const readAlert = (page) => page.locator('[role="alert"]').first().innerText().catch(() => "");
const alertMatches = async (page, re) => {
  const text = await poll(() => readAlert(page), (t) => re.test(t));
  if (!re.test(text)) console.log(`      (alert shown: ${JSON.stringify(text)})`);
  return re.test(text);
};
const focusIs = async (page, id) =>
  (await poll(() => page.evaluate(() => document.activeElement?.id || ""), (v) => v === id)) === id;

// ---------------------------------------------------------------------------
// 1. Navigation on desktop, tablet and mobile
// ---------------------------------------------------------------------------
for (const vp of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 812 }
]) {
  const context = await browser.newContext({ viewport: vp, reducedMotion: "reduce" });
  // Test traffic must never reach the site's real Google Analytics property
  await context.route(/google-analytics\.com|googletagmanager\.com/, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  check(`${vp.name}: home page shows the award agency heading`, /influencer award agency/i.test(await h1(page)));
  check(`${vp.name}: home page shows the header tabs`, (await page.locator("#main-nav-tabs").count()) === 1);
  await page.fill("#home-search", "best fashion");
  check(`${vp.name}: home search finds award categories`,
    (await page.locator("#home-search-results button", { hasText: "Best Fashion Influencer" }).count()) === 1);
  await page.fill("#home-search", "");
  await page.locator('a', { hasText: /^Walk the 3D gallery$/ }).click();
  await page.waitForTimeout(1500);
  check(`${vp.name}: "Walk the 3D gallery" opens /gallery/`, new URL(page.url()).pathname === "/gallery/");
  check(`${vp.name}: no admin button in the public header`,
    (await page.locator('header :is(button, a)').filter({ hasText: /admin/i }).count()) === 0 &&
    (await page.locator('header [aria-label*="admin" i], header [title*="admin" i]').count()) === 0);

  // Catwalk arrows move between sections and stay there (the 3D scene used to snap back)
  const sectionLabel = () => page.locator('[aria-live="polite"]').innerText().then((t) => t.replace(/\s+/g, " "));
  await page.click("#next-section-btn");
  const afterNext = await poll(sectionLabel, (t) => /2 \/ \d/.test(t), 4000);
  await page.waitForTimeout(2500);
  check(`${vp.name}: catwalk "next" arrow moves to section 2 and stays`, /2 \/ \d/.test(afterNext) && /2 \/ \d/.test(await sectionLabel()),
    `${afterNext} → ${await sectionLabel()}`);
  await page.click("#prev-section-btn");
  await page.waitForTimeout(2500);
  check(`${vp.name}: catwalk "previous" arrow returns to section 1`, /1 \/ \d/.test(await sectionLabel()), await sectionLabel());

  const expected = {
    Talent: "/talent/", Campaigns: "/campaigns/", "Star India": "/star-india/", "Green Light": "/green-light/",
    Membership: "/membership/", "Get Verified": "/join/", Contact: "/contact/"
  };
  for (const [label, path] of Object.entries(expected)) {
    await page.locator("#main-nav-tabs a", { hasText: new RegExp(`^${label}$`, "i") }).click();
    await page.waitForTimeout(700);
    const url = new URL(page.url()).pathname;
    check(`${vp.name}: header tab "${label}" → ${path}`, url === path, `landed on ${url}`);
    check(`${vp.name}: ${path} has a visible <h1>`, !!(await h1(page)));
    check(`${vp.name}: ${path} marks its tab as current`,
      (await page.locator('#main-nav-tabs [aria-current="page"]').innerText()).toLowerCase() === label.toLowerCase());
  }
  await page.goBack();
  await page.waitForTimeout(700);
  check(`${vp.name}: browser Back returns to the previous section`, new URL(page.url()).pathname === "/join/");

  await page.locator('a[aria-label="FSIA Influencer — home"]').click();
  await page.waitForTimeout(900);
  check(`${vp.name}: logo returns to the home page`, new URL(page.url()).pathname === "/");

  if (vp.name !== "desktop") {
    for (const [label, path] of [["Talent", "/talent/"], ["Star India", "/star-india/"], ["Join", "/join/"], ["Contact", "/contact/"], ["Home", "/"]]) {
      await page.locator('nav[aria-label="Quick links"] a', { hasText: new RegExp(`^${label}$`, "i") }).click();
      await page.waitForTimeout(700);
      check(`${vp.name}: bottom bar "${label}" → ${path}`, new URL(page.url()).pathname === path);
    }
  }

  // Footer links on a content page
  await page.goto(BASE + "/faq/", { waitUntil: "networkidle" });
  await page.locator('footer a', { hasText: "Membership Plans" }).last().click();
  await page.waitForTimeout(700);
  check(`${vp.name}: footer link "Membership Plans" → /membership/`, new URL(page.url()).pathname === "/membership/");

  // Keyboard: skip link is the first thing Tab reaches
  await page.goto(BASE + "/talent/", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  check(`${vp.name}: first Tab stop is "Skip to main content"`,
    (await page.evaluate(() => document.activeElement?.textContent?.trim())) === "Skip to main content");

  check(`${vp.name}: no JavaScript errors during navigation`, errors.length === 0, errors.join(" | "));
  await context.close();
}

// ---------------------------------------------------------------------------
// API validation first: rejected requests are never counted, but the browser forms
// below use up the per-connection submission allowance
// ---------------------------------------------------------------------------
const post = (path, body, headers = {}) =>
  fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

const badPhone = await post("/api/registrations", { brandName: TEST.brand, contactEmail: TEST.email, contactPhone: "123" });
check("API rejects a brand enquiry with an invalid phone (400)", badPhone.status === 400);
const badEmail = await post("/api/enquiries", { type: "campaign", name: "QA", email: "nope", phone: TEST.phone });
check("API rejects an enquiry with an invalid email (400)", badEmail.status === 400);
const bookingNoPhone = await post("/api/enquiries", { type: "booking", name: "QA", email: TEST.email });
check("API requires a phone number for magazine bookings (400)", bookingNoPhone.status === 400);
const badApp = await post("/api/influencer-applications", { name: "QA", category: "x", email: TEST.email, phone: "phone" });
check("API rejects a creator application with an invalid phone (400)", badApp.status === 400);

// ---------------------------------------------------------------------------
// 2. Forms (desktop + mobile)
// ---------------------------------------------------------------------------
async function brandEnquiry(page, label) {
  await page.goto(BASE + "/talent/", { waitUntil: "networkidle" });
  await page.locator("#open-collaboration-form-btn, #open-collaboration-form-btn-mobile").filter({ visible: true }).first().click();
  await page.waitForSelector("#enquiry-brand");
  await page.click("#submit-collaboration-charter-btn");
  check(`${label} brand enquiry: empty submit shows an error`, await alertMatches(page, /brand or agency name/i));
  check(`${label} brand enquiry: focus moves to the first missing field`, await focusIs(page, "enquiry-brand"));
  check(`${label} brand enquiry: field is marked invalid`, (await page.getAttribute("#enquiry-brand", "aria-invalid")) === "true");
  await page.fill("#enquiry-brand", TEST.brand);
  await page.fill("#enquiry-email", "not-an-email");
  await page.click("#submit-collaboration-charter-btn");
  check(`${label} brand enquiry: invalid email is rejected`, await alertMatches(page, /valid email/i));
  await page.fill("#enquiry-email", TEST.email);
  await page.fill("#enquiry-phone", "12345");
  await page.click("#submit-collaboration-charter-btn");
  check(`${label} brand enquiry: short phone number is rejected`, await alertMatches(page, /10 to 15 digits/i));
  await page.fill("#enquiry-phone", TEST.phone);

  // Failure state: the server is down → clear message, details kept
  await page.route("**/api/registrations", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Simulated outage." }) })
  );
  await page.click("#submit-collaboration-charter-btn");
  await page.waitForTimeout(500);
  check(`${label} brand enquiry: server failure shows an error`, await alertMatches(page, /simulated outage/i));
  check(`${label} brand enquiry: typed details survive a failure`, (await page.inputValue("#enquiry-brand")) === TEST.brand);
  await page.unroute("**/api/registrations");

  // Duplicate protection: a double click sends one request
  let posts = 0;
  page.on("request", (r) => r.method() === "POST" && r.url().endsWith("/api/registrations") && posts++);
  await page.dblclick("#submit-collaboration-charter-btn");
  await page.waitForSelector("#collaboration-success-credential", { timeout: 8000 });
  check(`${label} brand enquiry: success shows a reference number`, /FSIA-VIP-\d{6}/.test(await page.locator("#collaboration-success-credential").innerText()));
  check(`${label} brand enquiry: double click sends only one request`, posts === 1, `${posts} requests`);
}

async function creatorRegistration(page, label) {
  await page.goto(BASE + "/join/", { waitUntil: "networkidle" });
  await page.waitForSelector("#reg-name");
  check(`${label} registration: page load does not steal focus into the form`, (await page.evaluate(() => document.activeElement?.id || "")) !== "reg-name");
  await page.locator('button[type="submit"]', { hasText: "Continue" }).click();
  check(`${label} registration: step 1 requires a name`, await alertMatches(page, /full name/i));
  check(`${label} registration: focus moves to the name field`, await focusIs(page, "reg-name"));
  await page.fill("#reg-name", TEST.creator);
  await page.locator('button[type="submit"]', { hasText: "Continue" }).click();
  check(`${label} registration: a category is required`, await alertMatches(page, /choose a category/i));
  check(`${label} registration: the list offers more than 20 categories plus "Other"`,
    (await page.locator("#reg-category option").count()) > 20 && (await page.locator('#reg-category option[value="__other__"]').count()) === 1);
  await page.selectOption("#reg-category", "__other__");
  await page.locator('button[type="submit"]', { hasText: "Continue" }).click();
  check(`${label} registration: "Other" asks the creator to type their category`, await alertMatches(page, /type your category/i));
  check(`${label} registration: focus moves to the typed-category field`, await focusIs(page, "reg-category-other"));
  await page.fill("#reg-category-other", TEST.creatorCategory);
  await page.locator('button[type="submit"]', { hasText: "Continue" }).click();
  await page.waitForSelector("#reg-reach");
  await page.fill("#reg-reach", "12K");
  await page.locator('button[type="submit"]', { hasText: "Continue" }).click();
  await page.waitForSelector("#reg-email");

  // Draft survives a reload
  await page.fill("#reg-email", TEST.email);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("#reg-name");
  check(`${label} registration: unsent answers survive a reload`, (await page.inputValue("#reg-name")) === TEST.creator &&
    (await page.inputValue("#reg-category-other")) === TEST.creatorCategory);
  for (let i = 0; i < 2; i++) {
    await page.locator('button[type="submit"]', { hasText: "Continue" }).click();
    await page.waitForTimeout(300);
  }
  await page.waitForSelector("#reg-email");
  check(`${label} registration: restored email`, (await page.inputValue("#reg-email")) === TEST.email);
  await page.fill("#reg-phone", "abc");
  await page.locator('button[type="submit"]', { hasText: "Submit application" }).click();
  check(`${label} registration: invalid phone is rejected`, await alertMatches(page, /10 to 15 digits/i));
  await page.fill("#reg-phone", TEST.phone);
  await page.locator('button[type="submit"]', { hasText: "Submit application" }).click();
  await page.waitForSelector("text=Application received", { timeout: 8000 });
  check(`${label} registration: success screen with a reference`, /inf-app-/.test(await page.locator("main").innerText()));
  check(`${label} registration: draft cleared after success`,
    !(await page.evaluate(() => sessionStorage.getItem("fsia_registration_draft"))));
}

async function campaignApplication(page, label) {
  await page.goto(BASE + "/campaigns/", { waitUntil: "networkidle" });
  await page.locator('button[aria-label^="Apply now for"]').first().click();
  await page.waitForSelector("#campaign-name");
  await page.locator("#campaign-application-drawer button[type=submit]").click();
  check(`${label} campaign application: empty submit shows an error`, await alertMatches(page, /full name/i));
  await page.fill("#campaign-name", TEST.campaignApplicant);
  await page.fill("#campaign-email", TEST.email);
  await page.fill("#campaign-phone", TEST.phone);
  await page.locator("#campaign-application-drawer button[type=submit]").click();
  check(`${label} campaign application: social handle is required`, await alertMatches(page, /social handle/i));
  await page.fill("#campaign-social", "instagram.com/qa_test_account");
  await page.locator("#campaign-application-drawer button[type=submit]").click();
  await page.waitForSelector("text=Thank you for applying", { timeout: 8000 });
  check(`${label} campaign application: success confirmation`, true);
}

async function membershipRequest(page, label) {
  await page.goto(BASE + "/membership/", { waitUntil: "networkidle" });
  await page.locator('button:has-text("Enroll in")').first().click();
  await page.waitForSelector("#plan-name");
  await page.fill("#plan-name", TEST.member);
  await page.fill("#plan-email", TEST.email);
  await page.fill("#plan-phone", "98765");
  await page.locator("#payment-portal-drawer button[type=submit]").click();
  check(`${label} membership request: invalid phone is rejected`, await alertMatches(page, /10 to 15 digits/i));
  await page.fill("#plan-phone", TEST.phone);
  await page.locator("#payment-portal-drawer button[type=submit]").click();
  await page.waitForSelector("text=Request received", { timeout: 8000 });
  check(`${label} membership request: success confirmation with reference`, /enq-/.test(await page.locator("#payment-portal-drawer").innerText()));
}

async function contactMessage(page, label) {
  await page.goto(BASE + "/contact/", { waitUntil: "networkidle" });
  check(`${label} contact: form only, no address or phone field`,
    (await page.locator("#contact-phone").count()) === 0 && !/\b(road|street|floor|pin ?code)\b/i.test(await page.locator("main").innerText()));
  await page.locator("button[type=submit]", { hasText: "Send message" }).click();
  check(`${label} contact: empty submit asks for a name`, await alertMatches(page, /your name/i));
  check(`${label} contact: focus moves to the name field`, await focusIs(page, "contact-name"));
  await page.fill("#contact-name", TEST.contact);
  await page.fill("#contact-email", TEST.email);
  await page.selectOption("#contact-subject", "Brand deals");
  await page.locator("button[type=submit]", { hasText: "Send message" }).click();
  check(`${label} contact: a message is required`, await alertMatches(page, /short message/i));
  await page.fill("#contact-message", "QA test message");
  await page.locator("button[type=submit]", { hasText: "Send message" }).click();
  await page.waitForSelector("text=Reference:", { timeout: 8000 });
  check(`${label} contact: success shows a reference`, /enq-/.test(await page.locator("main").innerText()));
}

async function magazineBooking(page, label) {
  await page.goto(BASE + "/green-light/", { waitUntil: "networkidle" });
  await page.locator('button[aria-label="Book Inside Feature"]').click();
  await page.waitForTimeout(400);
  check(`${label} booking: "Book now" picks that package`, (await page.inputValue("#booking-subject")) === "Inside Feature");
  await page.fill("#booking-name", TEST.booker);
  await page.fill("#booking-email", TEST.email);
  await page.fill("#booking-phone", "123");
  await page.fill("#booking-message", "QA booking");
  await page.locator("button[type=submit]", { hasText: "Send booking request" }).click();
  check(`${label} booking: short phone number is rejected`, await alertMatches(page, /10 to 15 digits/i));
  await page.fill("#booking-phone", TEST.phone);
  await page.locator("button[type=submit]", { hasText: "Send booking request" }).click();
  await page.waitForSelector("text=Reference:", { timeout: 8000 });
  check(`${label} booking: success shows a reference`, true);
}

for (const vp of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 }
]) {
  const context = await browser.newContext({ viewport: vp, reducedMotion: "reduce" });
  // Test traffic must never reach the site's real Google Analytics property
  await context.route(/google-analytics\.com|googletagmanager\.com/, (route) => route.abort());
  const page = await context.newPage();
  await brandEnquiry(page, vp.name);
  await creatorRegistration(page, vp.name);
  await campaignApplication(page, vp.name);
  await membershipRequest(page, vp.name);
  await contactMessage(page, vp.name);
  await magazineBooking(page, vp.name);
  await context.close();
}
await browser.close();

// ---------------------------------------------------------------------------
// 3. API: server-side validation and persistence
// ---------------------------------------------------------------------------

const ai = await post("/api/gemini/optimize", { prompt: "test" });
check("AI endpoint requires an admin session (401)", ai.status === 401, `status ${ai.status}`);
const huge = await post("/api/influencer-applications", {
  name: "QA", category: "x", email: TEST.email, phone: TEST.phone, image: "data:image/jpeg;base64," + "A".repeat(1_600_000)
});
check("API rejects an oversized submission (413)", huge.status === 413, `status ${huge.status}`);
const health = await fetch(BASE + "/api/health");
check("API does not reveal server software versions",
  !/\/\d|"php"\s*:\s*"\d/i.test((health.headers.get("x-powered-by") || "") + (await health.text())) && !health.headers.get("x-powered-by"));

const login = await post("/api/auth/login", { username: ADMIN_USER, password: ADMIN_PASS });
if (login.ok) {
  const { token, mustChangePassword } = await login.json();
  const auth = { Authorization: `Bearer ${token}`, "X-Admin-Token": token };
  if (mustChangePassword) {
    // The default login is public knowledge: nothing else works until it is changed
    const locked = await fetch(BASE + "/api/registrations", { headers: auth });
    check("Default password: admin data stays locked until it is changed (403)", locked.status === 403, `status ${locked.status}`);
    const same = await post("/api/auth/change-password", { currentPassword: ADMIN_PASS, newPassword: "admin123" }, auth);
    check("Default password cannot be re-used as the new password", same.status === 400, `status ${same.status}`);
    const changed = await post("/api/auth/change-password", { currentPassword: ADMIN_PASS, newPassword: `qa-local-${RUN}` }, auth);
    check("Changing the default password unlocks the session", changed.ok, `status ${changed.status}`);
    console.log(`NOTE  local admin password is now qa-local-${RUN}`);
  }
  const get = async (path) => (await fetch(BASE + path, { headers: auth })).json();
  const regs = await get("/api/registrations");
  check("Brand enquiries were stored (one per run and viewport)", regs.filter((r) => r.brandName === TEST.brand).length === 2,
    `${regs.filter((r) => r.brandName === TEST.brand).length} found`);
  const apps = await get("/api/influencer-applications");
  const mine = apps.filter((a) => a.name === TEST.creator);
  check("Creator applications were stored with the typed category", mine.length === 2 && mine.every((a) => a.category === TEST.creatorCategory),
    mine.map((a) => a.category).join(", "));

  // Approval: the admin picks the runway section; without a valid one it is refused
  const sections = await (await fetch(BASE + "/api/creators")).json();
  const noSection = await post(`/api/influencer-applications/${mine[0].id}/approve`, {}, auth);
  check("Approval without a runway section is refused (400)", noSection.status === 400, `status ${noSection.status}`);
  const approved = await post(`/api/influencer-applications/${mine[0].id}/approve`, { sectionId: sections[1].id }, auth);
  const roster = await (await fetch(BASE + "/api/creators")).json();
  const placed = roster.find((sec) => sec.id === sections[1].id)?.creators.find((c) => c.name === TEST.creator);
  check("Approved creator joins the chosen runway section, described by their category", approved.ok && placed?.role === TEST.creatorCategory,
    `status ${approved.status}, role ${placed?.role}`);
  const enquiries = await get("/api/enquiries");
  check("Campaign applications were stored", enquiries.filter((e) => e.type === "campaign" && e.name === TEST.campaignApplicant).length === 2);
  check("Membership requests were stored", enquiries.filter((e) => e.type === "membership" && e.name === TEST.member).length === 2);
  check("Contact messages were stored without a phone number",
    enquiries.filter((e) => e.type === "contact" && e.name === TEST.contact && !e.phone && e.subject === "Brand deals").length === 2);
  check("Magazine bookings were stored", enquiries.filter((e) => e.type === "booking" && e.name === TEST.booker && e.subject === "Inside Feature").length === 2);
} else {
  console.log(`SKIP  persistence checks (admin login failed with ${login.status}; pass --admin=user:password)`);
}

// Last, because it uses up this IP's submission allowance for the next 10 minutes
let limited = false;
for (let i = 0; i < 14 && !limited; i++) {
  const r = await post("/api/enquiries", { type: "campaign", subject: "QA rate limit", name: `QA Rate ${RUN}`, email: TEST.email, phone: TEST.phone });
  limited = r.status === 429;
}
check("Public forms are rate limited per visitor (429)", limited);

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll journey checks passed.");
process.exit(failures ? 1 : 0);
