import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import { getDb, saveDb, logAction, hashPassword, verifyPassword, needsRehash, createDefaultDb, debrandValue, DB_PATH, GallerySection, Creator, Campaign, Registration } from "./server/db";
import { isValidEmail, isValidPhone, PHONE_ERROR } from "./server/validation";

// Initialize express app
const app = express();
app.disable("x-powered-by");
const PORT = Number(process.env.PORT) || 3000;

// Which proxies may report the visitor's IP (X-Forwarded-For). Default: only a proxy on
// this machine. Behind a hosting platform's proxy set TRUST_PROXY=1. Trusting every
// proxy would let visitors spoof their IP and dodge the login and submission limits.
const trustProxy = process.env.TRUST_PROXY || "loopback";
app.set("trust proxy", /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);
app.use(express.json({ limit: "5mb" }));

// API responses are data for the app, not pages: keep them out of search results
app.use("/api", (req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});

// ----------------------------------------------------
// SESSION MANAGEMENT
// Random per-login bearer tokens held in memory with a sliding expiry.
// ----------------------------------------------------
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
// Sessions slide while in use, but never outlive this absolute limit
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// restricted: signed in with the default password, which is public knowledge
const sessions = new Map<string, { username: string; expires: number; created: number; restricted: boolean }>();

function readToken(req: express.Request): string {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  const alt = req.headers["x-admin-token"];
  return typeof alt === "string" ? alt.trim() : "";
}

function adminSession(req: express.Request) {
  const token = readToken(req);
  const session = token ? sessions.get(token) : undefined;
  if (!session) return null;
  if (session.expires < Date.now() || Date.now() - session.created > SESSION_MAX_AGE_MS) {
    sessions.delete(token);
    return null;
  }
  session.expires = Date.now() + SESSION_TTL_MS;
  return session;
}

// Until the default password is changed, a session may only read its status and change it
const DEFAULT_PASSWORD_ROUTES = ["/api/auth/me", "/api/auth/change-password"];

const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const session = adminSession(req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized access. Authentication token is invalid or expired." });
  }
  if (session.restricted && !DEFAULT_PASSWORD_ROUTES.includes(req.path)) {
    return res.status(403).json({ error: "Change the default admin password first (Admin → Security & Data)." });
  }
  res.locals.adminUser = session.username;
  next();
};

// Simple per-IP brute-force throttle for the login endpoint
const loginAttempts = new Map<string, { count: number; first: number }>();
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function isThrottled(ip: string): boolean {
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > LOGIN_WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

// Public form limits (keep in sync with enforce_submission_limit() in php-backend/api/lib/helpers.php):
// every submission is stored, so spam must not be able to grow the database without bound
const MAX_PUBLIC_BODY_BYTES = 1_500_000;
const SUBMISSION_LIMIT = 12;
const SUBMISSION_WINDOW_MS = 10 * 60 * 1000;
const submissions = new Map<string, { count: number; first: number }>();

const MAX_DB_BYTES = 25_000_000;

// IPv6 visitors control a whole /64, so count it as one address
const visitorKey = (ip = "unknown") => (ip.includes(":") && !ip.startsWith("::ffff:") ? ip.split(":").slice(0, 4).join(":") + "::/64" : ip);

const limitSubmissions = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Measured after parsing too, so chunked uploads without Content-Length are covered
  if (Number(req.headers["content-length"] || 0) > MAX_PUBLIC_BODY_BYTES || JSON.stringify(req.body || {}).length > MAX_PUBLIC_BODY_BYTES) {
    return res.status(413).json({ error: "This submission is too large. Please use a smaller photo." });
  }
  // Form fields are plain values; only the portfolio list and enquiry details are nested
  for (const [key, value] of Object.entries(req.body || {})) {
    const nestedOk = (key === "portfolio" && Array.isArray(value)) || (key === "details" && value && typeof value === "object" && !Array.isArray(value));
    if (value !== null && typeof value === "object" && !nestedOk) {
      return res.status(400).json({ error: `Invalid value for ${key}.` });
    }
  }
  // Hard ceiling on the database size: past it, the forms pause instead of the whole site failing
  try {
    if (fs.statSync(DB_PATH).size > MAX_DB_BYTES) {
      console.error(`db.json is over ${MAX_DB_BYTES} bytes; public submissions are paused.`);
      return res.status(503).json({ error: "We are not accepting new submissions right now. Please try again later or email partner@fsia.in." });
    }
  } catch {}
  const now = Date.now();
  for (const [ip, entry] of submissions) if (now - entry.first > SUBMISSION_WINDOW_MS) submissions.delete(ip);
  const ip = visitorKey(req.ip);
  const entry = submissions.get(ip) || { count: 0, first: now };
  if (entry.count >= SUBMISSION_LIMIT) {
    return res.status(429).json({ error: "Too many submissions from your connection. Please wait a few minutes and try again." });
  }
  // Counted once the request is stored successfully
  res.on("finish", () => {
    if (res.statusCode === 201) submissions.set(ip, { count: entry.count + 1, first: entry.first });
  });
  next();
};

function recordFailedLogin(ip: string) {
  const entry = loginAttempts.get(ip);
  if (!entry || Date.now() - entry.first > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, first: Date.now() });
  } else {
    entry.count++;
  }
}

const isDefaultPassword = (hash: string) => verifyPassword("admin123", hash);
// Checked when a username does not exist, so a failed login takes the same time either way
const DUMMY_PASSWORD_HASH = hashPassword(crypto.randomBytes(16).toString("hex"));

// ----------------------------------------------------
// 1. AUTHENTICATION CONTROLLER
// ----------------------------------------------------
app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const ip = req.ip || "unknown";
    if (isThrottled(ip)) {
      return res.status(429).json({ error: "Too many failed attempts. Please wait 15 minutes and try again." });
    }

    const db = getDb();
    const user = db.admin_users.find((u) => u.username === username);
    if (!user) verifyPassword(String(password), DUMMY_PASSWORD_HASH);

    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      recordFailedLogin(ip);
      logAction(`Failed login attempt for user: ${username}`, ip);
      return res.status(401).json({ error: "Invalid credentials. Please verify your login details." });
    }

    loginAttempts.delete(ip);
    const mustChangePassword = isDefaultPassword(user.passwordHash);
    if (needsRehash(user.passwordHash)) {
      user.passwordHash = hashPassword(String(password));
    }
    user.lastLogin = new Date().toISOString();
    saveDb(db);

    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { username: user.username, expires: Date.now() + SESSION_TTL_MS, created: Date.now(), restricted: mustChangePassword });
    logAction(`Successful administrative login: ${username}`, ip);
    return res.json({
      success: true,
      token,
      username: user.username,
      mustChangePassword,
      message: "Session authenticated successfully"
    });
  } catch (error: any) {
    res.status(500).json({ error: "Internal authentication error: " + error.message });
  }
});

app.get("/api/auth/me", authenticateAdmin, (req, res) => {
  const db = getDb();
  const user = db.admin_users.find((u) => u.username === res.locals.adminUser);
  res.json({
    success: true,
    username: res.locals.adminUser,
    mustChangePassword: user ? isDefaultPassword(user.passwordHash) : false
  });
});

app.post("/api/auth/logout", (req, res) => {
  const token = readToken(req);
  if (token) sessions.delete(token);
  res.json({ success: true });
});

app.post("/api/auth/change-password", authenticateAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password are required." });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters long." });
  }
  if (String(newPassword) === "admin123") {
    return res.status(400).json({ error: "Choose a password other than the default one." });
  }
  const db = getDb();
  const user = db.admin_users.find((u) => u.username === res.locals.adminUser);
  if (!user || !verifyPassword(String(currentPassword), user.passwordHash)) {
    return res.status(401).json({ error: "Current password is incorrect." });
  }
  user.passwordHash = hashPassword(String(newPassword));
  saveDb(db);
  // Sign out every other session of this user
  const current = readToken(req);
  for (const [token, session] of sessions) {
    if (session.username === user.username && token !== current) sessions.delete(token);
  }
  const own = sessions.get(current);
  if (own) own.restricted = false;
  logAction(`Password changed for operator: ${user.username}`, req.ip);
  res.json({ success: true, message: "Password updated successfully." });
});

// ----------------------------------------------------
// 1B. ADMIN TEAM MANAGEMENT
// ----------------------------------------------------
app.get("/api/admin/users", authenticateAdmin, (req, res) => {
  const db = getDb();
  res.json(db.admin_users.map((u) => ({ username: u.username, createdAt: u.createdAt || null, lastLogin: u.lastLogin || null })));
});

app.post("/api/admin/users", authenticateAdmin, (req, res) => {
  const { username, password } = req.body || {};
  const name = String(username || "").trim();
  if (!name || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long." });
  }
  const db = getDb();
  if (db.admin_users.some((u) => u.username.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ error: "An operator with this username already exists." });
  }
  db.admin_users.push({ username: name, passwordHash: hashPassword(String(password)), createdAt: new Date().toISOString() });
  saveDb(db);
  logAction(`Created operator account: ${name} (by ${res.locals.adminUser})`, req.ip);
  res.status(201).json({ success: true });
});

app.delete("/api/admin/users/:username", authenticateAdmin, (req, res) => {
  const { username } = req.params;
  if (username === res.locals.adminUser) {
    return res.status(400).json({ error: "You cannot remove the account you are signed in with." });
  }
  const db = getDb();
  const before = db.admin_users.length;
  db.admin_users = db.admin_users.filter((u) => u.username !== username);
  if (db.admin_users.length === before) {
    return res.status(404).json({ error: "Operator not found." });
  }
  saveDb(db);
  for (const [token, session] of sessions) {
    if (session.username === username) sessions.delete(token);
  }
  logAction(`Removed operator account: ${username} (by ${res.locals.adminUser})`, req.ip);
  res.json({ success: true });
});

// ----------------------------------------------------
// 2. CREATORS CRUD ENGINE
// ----------------------------------------------------
app.get("/api/creators", (req, res) => {
  try {
    const db = getDb();
    res.json(debrandValue(db.creators));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to retrieve runway roster: " + error.message });
  }
});

app.post("/api/creators", authenticateAdmin, (req, res) => {
  try {
    const { sectionId, creator } = req.body;
    if (!sectionId || !creator || !creator.name) {
      return res.status(400).json({ error: "Invalid creator submission payload." });
    }

    const db = getDb();
    const section = db.creators.find((s) => s.id === sectionId);

    if (!section) {
      return res.status(404).json({ error: "Target runway section not found." });
    }

    // Avoid duplicate names in same section
    if (section.creators.some((c) => c.name.toLowerCase() === creator.name.toLowerCase())) {
      return res.status(400).json({ error: "A creator with this name already exists in this category." });
    }

    // Build default structured stats if not supplied
    const newCreator: Creator = {
      name: creator.name,
      role: creator.role || "Featured Star",
      city: creator.city || "Mumbai",
      image: creator.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format",
      bio: creator.bio || "FSIA elite brand ambassador.",
      stats: {
        reach: creator.stats?.reach || "100K",
        engagement: creator.stats?.engagement || "5.0%",
        verified: creator.stats?.verified !== false,
        ...creator.stats
      },
      quote: creator.quote || "Elegance is standard.",
      portfolio: creator.portfolio || [creator.image]
    };

    section.creators.push(newCreator);
    saveDb(db);
    logAction(`Added creator: ${newCreator.name} to section: ${section.title}`);
    res.status(201).json({ success: true, creator: newCreator });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to store creator: " + error.message });
  }
});

app.put("/api/creators", authenticateAdmin, (req, res) => {
  try {
    const { sectionId, originalName, updatedCreator } = req.body;
    if (!sectionId || !originalName || !updatedCreator) {
      return res.status(400).json({ error: "Missing required update fields." });
    }

    const db = getDb();
    const section = db.creators.find((s) => s.id === sectionId);

    if (!section) {
      return res.status(404).json({ error: "Target runway section not found." });
    }

    const idx = section.creators.findIndex((c) => c.name.toLowerCase() === originalName.toLowerCase());
    if (idx === -1) {
      return res.status(404).json({ error: "Target creator not found in section." });
    }

    section.creators[idx] = {
      ...section.creators[idx],
      ...updatedCreator,
      stats: {
        ...section.creators[idx].stats,
        ...updatedCreator.stats
      }
    };

    saveDb(db);
    logAction(`Updated creator profile: ${originalName}`);
    res.json({ success: true, creator: section.creators[idx] });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update creator: " + error.message });
  }
});

app.delete("/api/creators/:sectionId/:name", authenticateAdmin, (req, res) => {
  try {
    const { sectionId, name } = req.params;
    const db = getDb();
    const section = db.creators.find((s) => s.id === sectionId);

    if (!section) {
      return res.status(404).json({ error: "Target runway section not found." });
    }

    const initialLength = section.creators.length;
    section.creators = section.creators.filter((c) => c.name.toLowerCase() !== name.toLowerCase());

    if (section.creators.length === initialLength) {
      return res.status(404).json({ error: "Creator not found." });
    }

    saveDb(db);
    logAction(`Deleted creator profile: ${name} from section: ${sectionId}`);
    res.json({ success: true, message: "Creator successfully expunged." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete creator: " + error.message });
  }
});

// ----------------------------------------------------
// 2B. SECTIONS / CATEGORIES CRUD ENGINE
// ----------------------------------------------------
app.get(["/api/sections", "/api/creators/categories"], (req, res) => {
  try {
    const db = getDb();
    res.json(debrandValue(db.creators));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to retrieve runway sections: " + error.message });
  }
});

app.post(["/api/sections", "/api/creators/categories"], authenticateAdmin, (req, res) => {
  try {
    const { title, subtitle, primaryColor } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Category title is required." });
    }
    const db = getDb();
    const id = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "") || "cat-" + Date.now();
    
    // Check if category already exists
    if (db.creators.some((s) => s.id === id)) {
      return res.status(400).json({ error: "A category with this title already exists." });
    }

    // Determine zOffset
    const minOffset = db.creators.reduce((min, c) => Math.min(min, c.zOffset), 0);
    const zOffset = minOffset - 8;

    const newSection: GallerySection = {
      id,
      title,
      subtitle: subtitle || "Custom Runway Station",
      primaryColor: primaryColor || "#E1C699",
      creators: [],
      zOffset
    };

    db.creators.push(newSection);
    saveDb(db);
    logAction(`Created custom catwalk category: ${title}`);
    res.status(201).json({ success: true, section: newSection, creators: db.creators });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add custom category: " + error.message });
  }
});

app.delete(["/api/sections/:id", "/api/creators/categories/:id"], authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const idx = db.creators.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Category not found." });
    }

    const deletedTitle = db.creators[idx].title;
    db.creators.splice(idx, 1);
    
    // Re-adjust zOffsets
    db.creators.forEach((sec, index) => {
      sec.zOffset = index * -8;
    });

    saveDb(db);
    logAction(`Deleted catwalk category: ${deletedTitle}`);
    res.json({ success: true, message: "Category successfully deleted.", creators: db.creators });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete category: " + error.message });
  }
});

app.put(["/api/sections/:id", "/api/creators/categories/:id"], authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, primaryColor } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Category title is required." });
    }
    const db = getDb();
    const idx = db.creators.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Category not found." });
    }
    db.creators[idx] = {
      ...db.creators[idx],
      title,
      subtitle: subtitle || "Custom Runway Station",
      primaryColor: primaryColor || "#E1C699"
    };
    saveDb(db);
    logAction(`Updated catwalk category: ${title}`);
    res.json({ success: true, section: db.creators[idx], creators: db.creators });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update category: " + error.message });
  }
});

// ----------------------------------------------------
// 2C. MEMBERSHIP PLANS / PERKS CRUD ENGINE
// ----------------------------------------------------
app.get("/api/membership-plans", (req, res) => {
  try {
    const db = getDb();
    res.json(debrandValue(db.membership_plans || []));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch membership plans: " + error.message });
  }
});

app.post("/api/membership-plans", authenticateAdmin, (req, res) => {
  try {
    const plan = req.body;
    if (!plan || !plan.name || !plan.price) {
      return res.status(400).json({ error: "Invalid membership plan data." });
    }
    const db = getDb();
    if (!db.membership_plans) {
      db.membership_plans = [];
    }
    const id = plan.id || plan.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "") || "plan-" + Date.now();
    const newPlan = {
      ...plan,
      id,
      perks: plan.perks || []
    };
    db.membership_plans.push(newPlan);
    saveDb(db);
    logAction(`Created Membership Plan: ${newPlan.name}`);
    res.status(201).json({ success: true, plan: newPlan });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add membership plan: " + error.message });
  }
});

app.put("/api/membership-plans/:id", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const db = getDb();
    if (!db.membership_plans) {
      return res.status(404).json({ error: "No membership plans found." });
    }
    const idx = db.membership_plans.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Membership plan not found." });
    }
    db.membership_plans[idx] = { ...db.membership_plans[idx], ...updatedData };
    saveDb(db);
    logAction(`Modified Membership Plan: ${db.membership_plans[idx].name}`);
    res.json({ success: true, plan: db.membership_plans[idx] });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to modify membership plan: " + error.message });
  }
});

app.delete("/api/membership-plans/:id", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    if (!db.membership_plans) {
      return res.status(404).json({ error: "No membership plans found." });
    }
    const initialLength = db.membership_plans.length;
    db.membership_plans = db.membership_plans.filter((p) => p.id !== id);
    if (db.membership_plans.length === initialLength) {
      return res.status(404).json({ error: "Membership plan not found." });
    }
    saveDb(db);
    logAction(`Deleted Membership Plan: ${id}`);
    res.json({ success: true, message: "Membership plan successfully deleted." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete membership plan: " + error.message });
  }
});

// ----------------------------------------------------
// 3. CAMPAIGNS CRUD ENGINE
// ----------------------------------------------------
app.get("/api/campaigns", (req, res) => {
  try {
    const db = getDb();
    res.json(debrandValue(db.campaigns));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch campaigns: " + error.message });
  }
});

app.post("/api/campaigns", authenticateAdmin, (req, res) => {
  try {
    const campaign: Campaign = req.body;
    if (!campaign || !campaign.brand || !campaign.title) {
      return res.status(400).json({ error: "Invalid campaign payload data." });
    }

    const db = getDb();
    const id = campaign.id || "camp-" + Date.now();
    const newCampaign: Campaign = {
      ...campaign,
      id,
      perks: campaign.perks || ["Premium cover photo shoot", "Ambassador retainer contracts"]
    };

    db.campaigns.push(newCampaign);
    saveDb(db);
    logAction(`Created Brand Campaign: ${newCampaign.brand} - ${newCampaign.title}`);
    res.status(201).json({ success: true, campaign: newCampaign });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add campaign: " + error.message });
  }
});

app.put("/api/campaigns/:id", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const db = getDb();

    const idx = db.campaigns.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Campaign not found." });
    }

    db.campaigns[idx] = { ...db.campaigns[idx], ...updatedData };
    saveDb(db);
    logAction(`Modified Brand Campaign: ${db.campaigns[idx].brand}`);
    res.json({ success: true, campaign: db.campaigns[idx] });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to modify campaign: " + error.message });
  }
});

app.delete("/api/campaigns/:id", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const initialLength = db.campaigns.length;
    db.campaigns = db.campaigns.filter((c) => c.id !== id);

    if (db.campaigns.length === initialLength) {
      return res.status(404).json({ error: "Campaign not found." });
    }

    saveDb(db);
    logAction(`Archived Campaign: ${id}`);
    res.json({ success: true, message: "Campaign successfully archived." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete campaign: " + error.message });
  }
});

// ----------------------------------------------------
// 4. VIP REGISTRATIONS / MEMBERSHIP LOGS
// ----------------------------------------------------
app.get("/api/registrations", authenticateAdmin, (req, res) => {
  try {
    const db = getDb();
    res.json(db.registrations);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to read VIP applications: " + error.message });
  }
});

app.post("/api/registrations", limitSubmissions, (req, res) => {
  try {
    const { brandName, creatorName, budget, clientCity, contactEmail, contactPhone, gstin, scope, duration } = req.body;
    if (!brandName || !contactEmail || !contactPhone) {
      return res.status(400).json({ error: "Brand Name, email, and phone contact are mandatory." });
    }
    if (!isValidEmail(contactEmail)) {
      return res.status(400).json({ error: "Please provide a valid contact email address." });
    }
    if (!isValidPhone(contactPhone)) {
      return res.status(400).json({ error: PHONE_ERROR });
    }

    const db = getDb();
    const bookingId = "FSIA-VIP-" + Math.floor(100000 + Math.random() * 900000);
    const verificationHash = "0x" + crypto.randomBytes(4).toString("hex").toUpperCase() + "..." + crypto.randomBytes(2).toString("hex").toUpperCase();

    const newRegistration: Registration = {
      id: "reg-" + Date.now(),
      bookingId,
      timestamp: new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      brandName,
      creatorName: creatorName || "All VIP Roster",
      budget: budget || "Custom Escrow Quote",
      clientCity: clientCity || "Mumbai",
      contactEmail,
      contactPhone,
      gstin,
      scope,
      duration,
      verificationHash,
      status: "new"
    };

    db.registrations.unshift(newRegistration);
    saveDb(db);
    logAction(`Received VIP Collaboration Application from: ${brandName} targeting ${newRegistration.creatorName}`);

    res.status(201).json({ success: true, registration: newRegistration });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to secure VIP registration escrow: " + error.message });
  }
});

const REGISTRATION_STATUSES = ["new", "contacted", "confirmed", "closed"];

app.put("/api/registrations/:id", authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body || {};
  if (status !== undefined && !REGISTRATION_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid lead status." });
  }
  const db = getDb();
  const reg = db.registrations.find((r) => r.id === id);
  if (!reg) {
    return res.status(404).json({ error: "Registration not found." });
  }
  if (status !== undefined) reg.status = status;
  if (notes !== undefined) reg.notes = String(notes).slice(0, 2000);
  saveDb(db);
  logAction(`Updated VIP lead ${reg.bookingId}${status ? ` → ${status}` : ""}`, req.ip);
  res.json({ success: true, registration: reg });
});

app.delete("/api/registrations/:id", authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const reg = db.registrations.find((r) => r.id === id);
  if (!reg) {
    return res.status(404).json({ error: "Registration not found." });
  }
  db.registrations = db.registrations.filter((r) => r.id !== id);
  saveDb(db);
  logAction(`Deleted VIP lead ${reg.bookingId} (${reg.brandName})`, req.ip);
  res.json({ success: true });
});

// Largest embedded photo accepted from the public form (the browser resizes uploads well below this)
const MAX_DATA_IMAGE_BYTES = 700_000;

// Accept only http(s) URLs or embedded raster images
function safeImage(value: unknown, fallback: string, allowData = true): string {
  const v = typeof value === "string" ? value.trim() : "";
  if (/^https?:\/\//i.test(v) && v.length <= 2000) return v;
  if (allowData && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(v) && v.length <= MAX_DATA_IMAGE_BYTES) return v;
  return fallback;
}

// ----------------------------------------------------
// 4A. INFLUENCER/MODEL REGISTRATION APPLICATIONS
// ----------------------------------------------------
app.get("/api/influencer-applications", authenticateAdmin, (req, res) => {
  try {
    const db = getDb();
    res.json(db.influencer_applications || []);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load influencer applications: " + error.message });
  }
});

app.post("/api/influencer-applications", limitSubmissions, (req, res) => {
  try {
    const { name, category, role, city, image, bio, reach, engagement, portfolio, quote, email, phone } = req.body;
    if (!name || !email || !phone || !category) {
      return res.status(400).json({ error: "Full Name, Email, Phone Contact, and Runway Category are required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: PHONE_ERROR });
    }

    const db = getDb();
    const profileImage = safeImage(image, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format");
    // Portfolio entries are links; an embedded photo is only kept when it is the profile photo itself
    const portfolioArray = (Array.isArray(portfolio)
      ? portfolio
      : typeof portfolio === "string"
        ? portfolio.split(",").map(p => p.trim()).filter(Boolean)
        : []
    ).slice(0, 12).map((u: unknown) => (u === profileImage ? profileImage : safeImage(u, "", false))).filter(Boolean);

    const newApplication = {
      id: "inf-app-" + Date.now(),
      name,
      category: String(category).trim().slice(0, 100),
      // Without a title, the category describes the creator (and files them on the Talent page)
      role: role || String(category).trim().slice(0, 100) || "Featured Star Model",
      city: city || "Mumbai",
      image: profileImage,
      bio: bio || "Enthusiastic fashion icon looking to make an impact on the high-fashion runway.",
      reach: reach || "100K",
      engagement: engagement || "5.0%",
      portfolio: portfolioArray,
      quote: quote || "Elegance is standard.",
      email,
      phone,
      status: "pending" as const,
      timestamp: new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    };

    if (!db.influencer_applications) {
      db.influencer_applications = [];
    }
    db.influencer_applications.unshift(newApplication);
    saveDb(db);
    logAction(`Received new Influencer Registration request from: ${name} (Runway: ${category})`, req.ip);

    res.status(201).json({ success: true, application: newApplication });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to submit influencer application: " + error.message });
  }
});

app.post("/api/influencer-applications/:id/approve", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    
    if (!db.influencer_applications) {
      db.influencer_applications = [];
    }

    const appIndex = db.influencer_applications.findIndex((a) => a.id === id);
    if (appIndex === -1) {
      return res.status(404).json({ error: "Influencer application not found." });
    }

    const application = db.influencer_applications[appIndex];
    // The admin chooses the runway section; older applications stored a section id as their category
    const sectionId = typeof req.body?.sectionId === "string" && req.body.sectionId ? req.body.sectionId : application.category;
    const section = db.creators.find((s) => s.id === sectionId);
    if (!section) {
      return res.status(400).json({ error: "Choose the runway section this creator should join." });
    }
    application.status = "approved";

    // Inject model directly into the creators database category roster
    if (section) {
      // Check duplicate
      const alreadyExists = section.creators.some((c) => c.name.toLowerCase() === application.name.toLowerCase());
      if (!alreadyExists) {
        const newCreator: Creator = {
          name: application.name,
          role: application.role || "Featured Star Model",
          city: application.city || "Mumbai",
          image: application.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format",
          bio: application.bio || "FSIA certified elite runway influencer.",
          stats: {
            reach: application.reach || "100K",
            engagement: application.engagement || "5.0%",
            verified: true
          },
          quote: application.quote || "Elegance is standard.",
          portfolio: application.portfolio && application.portfolio.length > 0 ? application.portfolio : [application.image]
        };
        section.creators.push(newCreator);
        logAction(`Approved & added model registration: ${application.name} to Runway: ${section.title}`);
      } else {
        logAction(`Approved model registration: ${application.name} (already exists in runway section)`);
      }
    } else {
      logAction(`Approved model registration: ${application.name} but target runway section ${application.category} was not found.`);
    }

    saveDb(db);
    res.json({ success: true, application });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to approve influencer application: " + error.message });
  }
});

app.post("/api/influencer-applications/:id/decline", authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    
    if (!db.influencer_applications) {
      db.influencer_applications = [];
    }

    const appIndex = db.influencer_applications.findIndex((a) => a.id === id);
    if (appIndex === -1) {
      return res.status(404).json({ error: "Influencer application not found." });
    }

    db.influencer_applications[appIndex].status = "declined";
    saveDb(db);
    logAction(`Declined model registration application from: ${db.influencer_applications[appIndex].name}`);

    res.json({ success: true, application: db.influencer_applications[appIndex] });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to decline influencer application: " + error.message });
  }
});

app.delete("/api/influencer-applications/:id", authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const application = (db.influencer_applications || []).find((a) => a.id === id);
  if (!application) {
    return res.status(404).json({ error: "Influencer application not found." });
  }
  db.influencer_applications = db.influencer_applications.filter((a) => a.id !== id);
  saveDb(db);
  logAction(`Deleted model registration application from: ${application.name}`, req.ip);
  res.json({ success: true });
});

// ----------------------------------------------------
// ----------------------------------------------------
// 5. SERVER-SIDE GEMINI API INTEGRATION & SETTINGS
// ----------------------------------------------------
const maskKey = (key: string) =>
  key ? key.substring(0, 4) + "••••••••" + key.substring(key.length - 4) : "";

// Public settings: only appearance fields, never AI credentials or prompts
app.get("/api/settings", (req, res) => {
  try {
    const db = getDb();
    const { geminiApiKey, aiSystemPrompt, modelSelection, temperature, topK, ...publicSettings } = db.system_settings;
    res.json(debrandValue(publicSettings));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load system settings: " + error.message });
  }
});

app.get("/api/admin/settings", authenticateAdmin, (req, res) => {
  try {
    const db = getDb();
    res.json({ ...db.system_settings, geminiApiKey: maskKey(db.system_settings.geminiApiKey) });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load system settings: " + error.message });
  }
});

app.put("/api/settings", authenticateAdmin, (req, res) => {
  try {
    const db = getDb();
    const updated = req.body;
    let finalApiKey = updated.geminiApiKey;
    if (finalApiKey && finalApiKey.includes("••••")) {
      finalApiKey = db.system_settings.geminiApiKey;
    }
    db.system_settings = {
      ...db.system_settings,
      ...updated,
      geminiApiKey: finalApiKey || ""
    };
    saveDb(db);
    logAction("Modified dynamic system settings and appearance configurations", req.ip);
    res.json({ success: true, settings: { ...db.system_settings, geminiApiKey: maskKey(db.system_settings.geminiApiKey) } });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save settings: " + error.message });
  }
});

app.get("/api/prompt-logs", authenticateAdmin, (req, res) => {
  try {
    const db = getDb();
    res.json(db.prompt_logs || []);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load audit prompt logs: " + error.message });
  }
});

// Admin only: each call spends the site's Gemini API key
app.post("/api/gemini/optimize", authenticateAdmin, async (req, res) => {
  const db = getDb();
  const settings = db.system_settings;
  const { prompt, campaignTitle, brandName } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Application concept prompt is empty." });
  }

  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const errMsg = "Gemini API gateway is active but currently unconfigured. Please input an API key in the Admin Configuration Panel.";
    // Log error to audit logs
    db.prompt_logs.unshift({
      id: "p-log-" + Date.now(),
      timestamp: new Date().toISOString(),
      userPrompt: `Brand: ${brandName || "N/A"}, Campaign: ${campaignTitle || "N/A"}. Prompt: ${prompt}`,
      aiResponse: errMsg,
      modelUsed: settings.modelSelection || "gemini-3.5-flash",
      status: "error"
    });
    saveDb(db);
    return res.status(404).json({ error: errMsg });
  }

  const modelName = settings.modelSelection || "gemini-3.5-flash";
  const systemInstruction = settings.aiSystemPrompt || `
    You are an elite, world-class haute couture brand director and luxury media strategist for Forever Influencer.
    Your job is to optimize a creator's rough pitch/concept for a luxury brand sponsorship campaign into a majestic, highly professional premium proposal.
    Format the output beautifully in clean markdown. Keep it under 280 words.
  `;

  const userPrompt = `
    Brand Campaign context:
    - Brand: ${brandName || "Luxury Brand Partner"}
    - Campaign: ${campaignTitle || "Autumn Runway Series"}
    
    Creator's Raw Concept Draft:
    "${prompt}"
    
    Generate an upgraded 'Certified Haute Couture Creative Curation Proposal' that includes:
    1. REFINED EDITORIAL NARRATIVE (An elegant title and short aesthetic premise)
    2. VISUAL STYLE MOODBOARD DIRECTION (Color palettes, atmospheric lighting, and couture garment draping suggestions)
    3. INTEGRATED OUTREACH STRATEGY (Specifically designed to showcase high engagement metrics)
  `;

  try {
    // Initialize modern @google/genai SDK dynamically with current Admin settings key
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    // Query dynamic model configured from Admin panel
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: settings.temperature !== undefined ? Number(settings.temperature) : 0.7,
      }
    });

    const optimizedResult = response.text || "No response text generated from the AI model.";

    // Log successful dynamic AI prompt execution
    db.prompt_logs.unshift({
      id: "p-log-" + Date.now(),
      timestamp: new Date().toISOString(),
      userPrompt: `Brand: ${brandName || "N/A"}, Campaign: ${campaignTitle || "N/A"}. Prompt: ${prompt}`,
      aiResponse: optimizedResult,
      modelUsed: modelName,
      status: "success"
    });
    
    if (db.prompt_logs.length > 100) {
      db.prompt_logs = db.prompt_logs.slice(0, 100);
    }
    saveDb(db);

    res.json({ success: true, optimizedPitch: debrandValue(optimizedResult) });

  } catch (error: any) {
    console.error("Gemini optimization error:", error);
    let clientErrorMessage = "We encountered a temporary issue connecting to the FSIA AI engine: " + error.message;
    if (error.status === 429) {
      clientErrorMessage = "The FSIA AI Gateway is experiencing high traffic. Please wait a moment before re-optimizing.";
    }

    // Log failed dynamic AI prompt execution
    db.prompt_logs.unshift({
      id: "p-log-" + Date.now(),
      timestamp: new Date().toISOString(),
      userPrompt: `Brand: ${brandName || "N/A"}, Campaign: ${campaignTitle || "N/A"}. Prompt: ${prompt}`,
      aiResponse: `Error: ${error.message}`,
      modelUsed: modelName,
      status: "error"
    });
    
    if (db.prompt_logs.length > 100) {
      db.prompt_logs = db.prompt_logs.slice(0, 100);
    }
    saveDb(db);

    res.status(502).json({ error: clientErrorMessage, details: error.message });
  }
});

// Admin dashboard statistics metrics endpoint
app.get("/api/admin/stats", authenticateAdmin, (req, res) => {
  try {
    const db = getDb();
    const flatCreators = db.creators.flatMap((s) => s.creators);
    const totalReach = flatCreators.reduce((acc, c) => {
      const parsed = parseFloat(c.stats.reach || "0");
      return acc + (c.stats.reach.includes("M") ? parsed * 1000000 : parsed * 1000);
    }, 0);

    const totalPrompts = db.prompt_logs?.length || 0;
    const successfulPrompts = db.prompt_logs?.filter(l => l.status === "success").length || 0;
    const apiSuccessRate = totalPrompts > 0 ? Math.round((successfulPrompts / totalPrompts) * 100) : 100;

    const stats = {
      creatorsCount: flatCreators.length,
      categoriesCount: db.creators.length,
      campaignsCount: db.campaigns.length,
      applicationsCount: db.registrations.length,
      influencerApplicationsCount: db.influencer_applications?.length || 0,
      pendingApplicationsCount: (db.influencer_applications || []).filter((a) => a.status === "pending").length,
      newLeadsCount: db.registrations.filter((r) => !r.status || r.status === "new").length,
      newEnquiriesCount: (db.enquiries || []).filter((e) => e.status === "new").length,
      membershipPlansCount: db.membership_plans?.length || 0,
      estimatedRosterReach: (totalReach / 1000000).toFixed(1) + "M",
      totalPromptsCount: totalPrompts,
      apiSuccessRate: apiSuccessRate,
      logs: db.admin_logs.slice(0, 15) // send last 15 audit trail logs
    };
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to compile metrics: " + error.message });
  }
});

// ----------------------------------------------------
// ENQUIRIES (campaign applications, membership plan requests, contact messages
// and magazine bookings)
// ----------------------------------------------------
const ENQUIRY_TYPES = ["campaign", "membership", "contact", "booking"];
// The contact page is form-only (name, email, subject, message): no phone number asked
const PHONE_OPTIONAL_TYPES = ["contact"];
const clip = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

app.post("/api/enquiries", limitSubmissions, (req, res) => {
  const body = req.body || {};
  if (!ENQUIRY_TYPES.includes(body.type)) {
    return res.status(400).json({ error: "Unknown enquiry type." });
  }
  const phoneOptional = PHONE_OPTIONAL_TYPES.includes(body.type);
  if (!clip(body.name, 200) || !clip(body.email, 200) || (!phoneOptional && !clip(body.phone, 50))) {
    return res.status(400).json({ error: phoneOptional ? "Name and email are required." : "Name, email and phone are required." });
  }
  if (!isValidEmail(clip(body.email, 200))) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }
  if ((!phoneOptional || clip(body.phone, 50)) && !isValidPhone(clip(body.phone, 50))) {
    return res.status(400).json({ error: PHONE_ERROR });
  }
  const details: Record<string, string> = {};
  if (body.details && typeof body.details === "object") {
    for (const [key, value] of Object.entries(body.details).slice(0, 12)) {
      details[clip(key, 40)] = clip(value, 2000);
    }
  }
  const db = getDb();
  const enquiry = {
    id: "enq-" + Date.now(),
    type: body.type,
    subject: clip(body.subject, 300),
    refId: clip(body.refId, 100),
    name: clip(body.name, 200),
    email: clip(body.email, 200),
    phone: clip(body.phone, 50),
    details,
    status: "new" as const,
    timestamp: new Date().toISOString()
  };
  db.enquiries = [enquiry, ...(db.enquiries || [])].slice(0, 5000);
  saveDb(db);
  logAction(`New ${enquiry.type} enquiry from ${enquiry.name}: ${enquiry.subject}`, req.ip);
  res.status(201).json({ success: true, enquiry: { id: enquiry.id, timestamp: enquiry.timestamp } });
});

app.get("/api/enquiries", authenticateAdmin, (req, res) => {
  res.json(getDb().enquiries || []);
});

app.put("/api/enquiries/:id", authenticateAdmin, (req, res) => {
  const { status, notes } = req.body || {};
  if (status !== undefined && !REGISTRATION_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }
  const db = getDb();
  const enquiry = (db.enquiries || []).find((e) => e.id === req.params.id);
  if (!enquiry) return res.status(404).json({ error: "Enquiry not found." });
  if (status !== undefined) enquiry.status = status;
  if (notes !== undefined) enquiry.notes = clip(notes, 2000);
  saveDb(db);
  logAction(`Updated enquiry ${enquiry.id}${status ? ` → ${status}` : ""}`, req.ip);
  res.json({ success: true, enquiry });
});

app.delete("/api/enquiries/:id", authenticateAdmin, (req, res) => {
  const db = getDb();
  const before = (db.enquiries || []).length;
  db.enquiries = (db.enquiries || []).filter((e) => e.id !== req.params.id);
  if (db.enquiries.length === before) return res.status(404).json({ error: "Enquiry not found." });
  saveDb(db);
  logAction(`Deleted enquiry ${req.params.id}`, req.ip);
  res.json({ success: true });
});

// Full audit trail
app.get("/api/admin/logs", authenticateAdmin, (req, res) => {
  res.json(getDb().admin_logs || []);
});

// Backup: complete database export without operator credentials
app.get("/api/admin/backup", authenticateAdmin, (req, res) => {
  const { admin_users, ...data } = getDb();
  const { geminiApiKey, ...settings } = data.system_settings;
  logAction("Downloaded full database backup", req.ip);
  res.setHeader("Content-Disposition", `attachment; filename="fsia-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({ ...data, system_settings: settings, exportedAt: new Date().toISOString() });
});

// Restore: replace content collections from a backup file (operator accounts are kept)
app.post("/api/admin/restore", authenticateAdmin, (req, res) => {
  const backup = req.body || {};
  if (!Array.isArray(backup.creators) || !Array.isArray(backup.campaigns)) {
    return res.status(400).json({ error: "This file does not look like an FSIA backup." });
  }
  const db = getDb();
  const defaults = createDefaultDb();
  db.creators = backup.creators;
  db.campaigns = backup.campaigns;
  db.registrations = Array.isArray(backup.registrations) ? backup.registrations : [];
  db.influencer_applications = Array.isArray(backup.influencer_applications) ? backup.influencer_applications : [];
  db.membership_plans = Array.isArray(backup.membership_plans) ? backup.membership_plans : defaults.membership_plans;
  db.prompt_logs = Array.isArray(backup.prompt_logs) ? backup.prompt_logs : [];
  db.enquiries = Array.isArray(backup.enquiries) ? backup.enquiries : [];
  if (backup.system_settings && typeof backup.system_settings === "object") {
    // Masked keys in backups must not overwrite the real key
    const { geminiApiKey, ...rest } = backup.system_settings;
    db.system_settings = { ...db.system_settings, ...rest };
  }
  saveDb(db);
  logAction("Restored database from uploaded backup", req.ip);
  res.json({ success: true });
});

// ----------------------------------------------------
// 6. VITE & STATIC FILES INGRESS PORTAL
// ----------------------------------------------------
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "Endpoint not implemented: " + req.path.replace(/^\/api\//, "") });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Every public route is a prerendered folder (dist/talent/index.html …), so static
    // serving covers them and redirects /talent → /talent/. Anything else is a real 404.
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.status(404).sendFile(path.join(distPath, "404.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FSIA Full-Stack Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
