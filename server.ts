import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { getDb, saveDb, logAction, DatabaseSchema, GallerySection, Creator, Campaign, Registration } from "./server/db";

// Initialize express app
const app = express();
const PORT = 3000;

app.use(express.json());

// Create a simple token validation middleware
const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader === "Bearer fsia-admin-session-secure") {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized access. Authentication token is invalid or expired." });
  }
};

// ----------------------------------------------------
// 1. AUTHENTICATION CONTROLLER
// ----------------------------------------------------
app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const db = getDb();
    const user = db.admin_users.find((u) => u.username === username);

    if (!user) {
      logAction(`Failed login attempt for user: ${username}`, req.ip);
      return res.status(401).json({ error: "Invalid credentials. Please verify your login details." });
    }

    // Compute SHA-256 Hash of incoming password to protect user keys
    const hash = crypto.createHash("sha256").update(password).digest("hex");

    if (hash === user.passwordHash) {
      logAction(`Successful administrative login: ${username}`, req.ip);
      return res.json({
        success: true,
        token: "fsia-admin-session-secure",
        username: user.username,
        message: "Session authenticated successfully"
      });
    } else {
      logAction(`Invalid password entered for: ${username}`, req.ip);
      return res.status(401).json({ error: "Invalid credentials. Please verify your password." });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Internal authentication error: " + error.message });
  }
});

// ----------------------------------------------------
// 2. CREATORS CRUD ENGINE
// ----------------------------------------------------
app.get("/api/creators", (req, res) => {
  try {
    const db = getDb();
    res.json(db.creators);
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
app.post("/api/sections", authenticateAdmin, (req, res) => {
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

app.delete("/api/sections/:id", authenticateAdmin, (req, res) => {
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

app.put("/api/sections/:id", authenticateAdmin, (req, res) => {
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
    res.json(db.membership_plans || []);
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
    res.json(db.campaigns);
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

app.post("/api/registrations", (req, res) => {
  try {
    const { brandName, creatorName, budget, clientCity, contactEmail, contactPhone, gstin, scope, duration } = req.body;
    if (!brandName || !contactEmail || !contactPhone) {
      return res.status(400).json({ error: "Brand Name, email, and phone contact are mandatory." });
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
      verificationHash
    };

    db.registrations.unshift(newRegistration);
    saveDb(db);
    logAction(`Received VIP Collaboration Application from: ${brandName} targeting ${newRegistration.creatorName}`);

    res.status(201).json({ success: true, registration: newRegistration });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to secure VIP registration escrow: " + error.message });
  }
});

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

app.post("/api/influencer-applications", (req, res) => {
  try {
    const { name, category, role, city, image, bio, reach, engagement, portfolio, quote, email, phone } = req.body;
    if (!name || !email || !phone || !category) {
      return res.status(400).json({ error: "Full Name, Email, Phone Contact, and Runway Category are required." });
    }

    const db = getDb();
    const portfolioArray = Array.isArray(portfolio) 
      ? portfolio 
      : typeof portfolio === "string" 
        ? portfolio.split(",").map(p => p.trim()).filter(Boolean)
        : [];

    const newApplication = {
      id: "inf-app-" + Date.now(),
      name,
      category,
      role: role || "Featured Star Model",
      city: city || "Mumbai",
      image: image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format",
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
    application.status = "approved";

    // Inject model directly into the creators database category roster
    const section = db.creators.find((s) => s.id === application.category);
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

// ----------------------------------------------------
// ----------------------------------------------------
// 5. SERVER-SIDE GEMINI API INTEGRATION & SETTINGS
// ----------------------------------------------------
app.get("/api/settings", (req, res) => {
  try {
    const db = getDb();
    const settings = { ...db.system_settings };
    if (settings.geminiApiKey) {
      // Return a safe masked version
      settings.geminiApiKey = settings.geminiApiKey.substring(0, 4) + "••••••••" + settings.geminiApiKey.substring(settings.geminiApiKey.length - 4);
    } else {
      settings.geminiApiKey = "";
    }
    res.json(settings);
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
    res.json({ success: true, settings: db.system_settings });
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

app.post("/api/gemini/optimize", async (req, res) => {
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
    You are an elite, world-class haute couture brand director and luxury media strategist for FSIA (Forever Star India).
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

    res.json({ success: true, optimizedPitch: optimizedResult });

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
// 6. VITE & STATIC FILES INGRESS PORTAL
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FSIA Full-Stack Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
