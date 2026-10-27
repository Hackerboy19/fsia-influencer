import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface Creator {
  name: string;
  role: string;
  city: string;
  image: string;
  bio: string;
  stats: {
    reach: string;
    engagement: string;
    verified: boolean;
    [key: string]: string | boolean;
  };
  quote: string;
  portfolio: string[];
}

export interface GallerySection {
  id: string;
  title: string;
  subtitle: string;
  creators: Creator[];
  zOffset: number;
  primaryColor: string;
}

export interface Campaign {
  id: string;
  brand: string;
  title: string;
  niche: string;
  budget: string;
  requirements: string;
  duration: string;
  location: string;
  perks: string[];
  description: string;
}

export interface Registration {
  id: string;
  bookingId: string;
  timestamp: string;
  brandName: string;
  creatorName: string;
  budget: string;
  clientCity: string;
  contactEmail: string;
  contactPhone: string;
  gstin?: string;
  scope?: string;
  duration?: string;
  verificationHash: string;
  status?: "new" | "contacted" | "confirmed" | "closed";
  notes?: string;
}

export interface AdminUser {
  username: string;
  passwordHash: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface AdminLog {
  id: string;
  timestamp: string;
  action: string;
  ip?: string;
}

export interface SystemSettings {
  websiteTitle: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  footerText: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  geminiApiKey: string;
  aiSystemPrompt: string;
  modelSelection: string;
  temperature: number;
  topK: number;
}

export interface PromptLog {
  id: string;
  timestamp: string;
  userPrompt: string;
  aiResponse: string;
  modelUsed: string;
  status: "success" | "error";
}

export interface InfluencerApplication {
  id: string;
  name: string;
  category: string; // The category ID (e.g., 'miss-india')
  role: string;
  city: string;
  image: string; // profile picture URL
  bio: string;
  reach: string; // reach (e.g. "500K")
  engagement: string; // engagement rate (e.g. "4.5%")
  portfolio: string[]; // list of photo URLs
  quote: string;
  email: string;
  phone: string;
  status: "pending" | "approved" | "declined";
  timestamp: string;
  notes?: string;
}

// Campaign applications and membership plan requests sent from the public site
export interface Enquiry {
  id: string;
  type: "campaign" | "membership";
  subject: string;
  refId?: string;
  name: string;
  email: string;
  phone: string;
  details: Record<string, string>;
  status: "new" | "contacted" | "confirmed" | "closed";
  notes?: string;
  timestamp: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  badge: string;
  price: string;
  period: string;
  accent: string;
  icon: string;
  perks: string[];
  popular?: boolean;
}

export interface DatabaseSchema {
  creators: GallerySection[];
  campaigns: Campaign[];
  registrations: Registration[];
  admin_users: AdminUser[];
  admin_logs: AdminLog[];
  system_settings: SystemSettings;
  prompt_logs: PromptLog[];
  influencer_applications: InfluencerApplication[];
  membership_plans?: MembershipPlan[];
  enquiries?: Enquiry[];
  migrations?: Record<string, string>;
}

export const DB_PATH = path.join(process.cwd(), "server", "db.json");

// Seed Initial Data
const INITIAL_CREATORS: GallerySection[] = [
  {
    id: "miss-india",
    title: "Fashion & Modelling",
    subtitle: "Fashion, beauty and runway creators",
    zOffset: 0,
    primaryColor: "#E1C699",
    creators: [
      {
        name: "Aishwarya Sen",
        role: "Fashion creator",
        city: "Mumbai",
        image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop",
        bio: "An epitome of modern intellect and poise, Aishwarya championed rural girls' education and visual arts while walking the runways of Milan and Paris Couture Weeks. Her advocacy combined with high-fashion presence sets a new gold standard.",
        stats: {
          reach: "2.4M",
          engagement: "6.8%",
          verified: true,
          "Runway Events": "18 Appearances",
          "Couture Shows": "Milan, Paris, Mumbai"
        },
        quote: "Prestige is not inherited; it is sculpted with intention, compassion, and relentless grace.",
        portfolio: [
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=500&auto=format&fit=crop"
        ]
      },
      {
        name: "Meera Deshmukh",
        role: "Classical dancer and fashion creator",
        city: "New Delhi",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
        bio: "A classical Odissi dancer and high-fashion enthusiast, Meera blends deep-rooted cultural heritage with sharp, high-fashion styling. She represents the seamless dialogue between classical antiquity and modern avant-garde design.",
        stats: {
          reach: "1.2M",
          engagement: "7.1%",
          verified: true,
          "Campaigns": "12 Global Brands"
        },
        quote: "True elegance is a resonance between our ancestral rhythms and the modern canvas.",
        portfolio: [
          "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=500&auto=format&fit=crop"
        ]
      }
    ]
  },
  {
    id: "super-hero",
    title: "Social Impact",
    subtitle: "Creators working on social causes",
    zOffset: -8,
    primaryColor: "#A3B18A",
    creators: [
      {
        name: "Dr. Ananya Iyer",
        role: "Social Entrepreneur & Water Advocate",
        city: "Bangalore",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
        bio: "Pioneering eco-sensitive filtration hubs across 120 Indian villages, Dr. Iyer represents the powerful fusion of rigorous scientific inquiry, clean technology, and passionate grassroots leadership.",
        stats: {
          reach: "850K",
          engagement: "9.4%",
          verified: true,
          "Villages Impacted": "120+ Communities",
          "Patents Awarded": "2 Eco-Filtration"
        },
        quote: "Leadership is the quiet, continuous ripple that turns arid lands into fertile ground.",
        portfolio: [
          "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=500&auto=format&fit=crop"
        ]
      },
      {
        name: "Rhea Kapur",
        role: "Circular Couture Innovator",
        city: "Chennai",
        image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=600&auto=format&fit=crop",
        bio: "A sustainable fashion pioneer, Rhea developed organic textile solutions using indigenous hemp, bamboo fibres, and lotus silk, bringing climate consciousness to the heart of luxury couture runways.",
        stats: {
          reach: "980K",
          engagement: "8.2%",
          verified: true,
          "Circular Runway": "100% Fully Circular"
        },
        quote: "Couture doesn't need to leave a scar on the Earth to take your breath away.",
        portfolio: [
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=500&auto=format&fit=crop"
        ]
      }
    ]
  },
  {
    id: "verified-influencers",
    title: "Lifestyle & Design",
    subtitle: "Lifestyle, design and culture creators",
    zOffset: -16,
    primaryColor: "#C5C3C0",
    creators: [
      {
        name: "Kabir Mehta",
        role: "Luxury Men's Tailoring Influencer",
        city: "Mumbai",
        image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop",
        bio: "Redefining contemporary dandyism in India, Kabir merges custom Indian bandhgalas with minimalist European street silhouettes. He is a primary advisor to luxury heritage houses seeking digital reach.",
        stats: {
          reach: "1.9M",
          engagement: "5.4%",
          verified: true,
          "Brand Collaborations": "32 Global",
          "Editorial Mentions": "GQ, Esquire India"
        },
        quote: "Fashion is language; tailoring is the precise syntax that ensures your story is heard.",
        portfolio: [
          "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=500&auto=crop"
        ]
      },
      {
        name: "Tara Nair",
        role: "Creative Director & Fine Art Creator",
        city: "Kochi",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop",
        bio: "Tara creates deeply evocative visual campaigns for high-end boutique hotels and international luxury labels. Her lens fuses modern structural minimalism with Indian subcontinental color theories.",
        stats: {
          reach: "1.5M",
          engagement: "6.9%",
          verified: true,
          "Featured Columns": "Vogue, Architectural Digest",
          "Exhibitions Held": "Kochi-Muziris Biennale '25"
        },
        quote: "A frame is just a window, but light is the invitation that turns a space into a memory.",
        portfolio: [
          "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=500&auto=format&fit=crop"
        ]
      }
    ]
  }
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "sabya-2026",
    brand: "Sabyasachi Heritage",
    title: "Royal Couture & Bridal Campaign Showcase",
    niche: "Royal Ethnic Couture",
    budget: "₹3,50,000 - ₹8,00,000",
    requirements: "150K+ Reach with verified lifestyle aesthetics",
    duration: "3 Weeks",
    location: "Jaipur Palace / Mumbai Studio",
    perks: [
      "Private runway session with brand curators",
      "Keep 1 custom-tailored bespoke ensemble (valued at ₹4L)",
      "Premium cover photography in Vogue India",
      "Direct verified star bank wire escort"
    ],
    description: "Step into the royal lineage of Indian haute couture. Sabyasachi Heritage is selecting 5 elite creators nationwide for our prestigious Autumn Bridal Collection. Creators will walk the historic courtyards of Jaipur palace and showcase intricate hand-woven zardozi creations."
  },
  {
    id: "taj-2026",
    brand: "Taj Luxury Hotels",
    title: "The Art of Slow Living - Summer Retreat",
    niche: "Premium Hospitality & Travel",
    budget: "₹2,00,000 + Luxe Stay",
    requirements: "80K+ Reach, premium travel videography focus",
    duration: "4 Days (Active)",
    location: "Udaipur & Goa Properties",
    perks: [
      "4-Night presidential suite hospitality",
      "Fully covered premium culinary curation and spa treatments",
      "Travel cost allowances (Business Class flights covered)",
      "Long-term ambassador options"
    ],
    description: "Immerse in unmatched Indian hospitality. Taj Luxury Hotels invites 6 travel and lifestyle connoisseurs to capture the quiet, warm essence of our iconic heritage properties. High-definition cinematic reels and photo essays are expected."
  },
  {
    id: "vogue-2026",
    brand: "Vogue India",
    title: "Avant-Garde digital cover shoot",
    niche: "High Fashion & Editorial",
    budget: "₹5,00,000",
    requirements: "300K+ Reach, professional editorial experience",
    duration: "Single Cover Event",
    location: "Mumbai Studios",
    perks: [
      "Primary model feature on the Digital Cover edition",
      "Full publicity and editorial interview with Chief Curator",
      "High-definition photography asset usage rights",
      "VIP invitations to the Vogue Fashion Gala 2026"
    ],
    description: "Break the barriers of convention. Vogue India is curating a special digital cover celebrating 'Indo-Futurism'. We are seeking a verified creator with deep expressive posture and bold stylistic integrity to lead the campaign."
  },
  {
    id: "oneplus-2026",
    brand: "OnePlus Elite",
    title: "Nord Creator Wave: Fusing Tech & Style",
    niche: "Premium Tech & Lifestyle",
    budget: "₹1,80,000 + Flagship Device",
    requirements: "50K+ Reach, high-quality unboxing and transition reels",
    duration: "2 Months",
    location: "Pan-India Digital Campaign",
    perks: [
      "Keep OnePlus Flagship ecosystem (Phone, Watch, Buds valued at ₹1.2L)",
      "Featured on official OnePlus India social accounts",
      "Direct contract for upcoming device launches",
      "Sponsored tech-setup makeover"
    ],
    description: "OnePlus is looking for 10 creators who represent the perfect convergence of high technology and daily style. Review, unbox, and design interactive transition reels showcasing our upcoming Nord ecosystem with minimal aesthetics."
  }
];

const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: "reg-1",
    bookingId: "FSIA-VIP-482012",
    timestamp: "2026-07-15",
    brandName: "Chopard Luxury India",
    creatorName: "Aishwarya Sen",
    budget: "₹8,00,000",
    clientCity: "Mumbai",
    contactEmail: "marketing@chopard.in",
    contactPhone: "+91 98200 12345",
    scope: "Luxury Timepieces Launch Shoot",
    duration: "1 Month",
    verificationHash: "0x89D2B...C20A"
  }
];

// Default operator account. The seeded password is a legacy SHA-256 hash of
// "admin123" so that both the Node and PHP backends can verify it; it is
// transparently upgraded to a salted hash on first successful login, and the
// admin panel nags until it is changed. Override with ADMIN_USERNAME / ADMIN_PASSWORD.
const INITIAL_USERS: AdminUser[] = [
  {
    username: process.env.ADMIN_USERNAME || "admin",
    passwordHash: process.env.ADMIN_PASSWORD
      ? hashPassword(process.env.ADMIN_PASSWORD)
      : crypto.createHash("sha256").update("admin123").digest("hex")
  }
];

const INITIAL_PLANS: MembershipPlan[] = [
  {
    id: "elite-star",
    name: "Elite Star",
    badge: "Standard Entry",
    price: "₹0",
    period: "Always Free",
    accent: "#8E8D8A",
    icon: "Star",
    perks: [
      "Registry inclusion in the standard creator database",
      "Basic creator profile page accessible to search queries",
      "Apply to general public brand campaigns",
      "Standard digital copy of your membership credentials"
    ]
  },
  {
    id: "silver-star",
    name: "Silver Star",
    badge: "Verified Status",
    price: "₹4,999",
    period: "per month (+18% GST)",
    accent: "#C5C3C0",
    icon: "Shield",
    perks: [
      "Verified Silver Star verification badge on your profile",
      "Higher ranking in brand matching search inquiries",
      "Up to 3 automated direct matchmaking recommendations per month",
      "Invitations to state-level regional model meetups",
      "Priority support from our helpdesk"
    ]
  },
  {
    id: "gold-star",
    name: "Gold Star",
    badge: "Professional Spotlight",
    price: "₹9,999",
    period: "per month (+18% GST)",
    accent: "#E1C699",
    icon: "Award",
    popular: true,
    perks: [
      "Verified Gold Star profile badge and priority listing",
      "1 Professional couture portfolio shoot per year at local hub",
      "10 Guaranteed brand match pitches submitted by our team",
      "Spotlight feature in our weekly Brand Newsletter",
      "Dedicated access to our partner digital agency network",
      "15% Discount on runway pageant entry vouchers"
    ]
  },
  {
    id: "royal-star",
    name: "Royal Star Club",
    badge: "The Ultimate Royal Crest",
    price: "₹24,999",
    period: "per month (+18% GST)",
    accent: "#111111",
    icon: "Sparkles",
    perks: [
      "Bespoke Obsidian 'Royal Star Club' crest of excellence",
      "Dedicated personal talent manager & collaboration counsel",
      "1 Professional PR press release across Times of India / HT",
      "VIP front-row seating passes to national pageants & runway shows",
      "Direct legal escrow protection on all brand assignments",
      "Unlimited direct pitch access to global luxury houses"
    ]
  }
];

const INITIAL_LOGS: AdminLog[] = [
  {
    id: "log-1",
    timestamp: new Date().toISOString(),
    action: "System initialized with base VIP runway assets.",
    ip: "127.0.0.1"
  }
];

export const DEFAULT_SETTINGS: SystemSettings = {
  websiteTitle: "Influencer Awards",
  heroTitle: "INFLUENCER AWARDS",
  heroSubtitle: "Reviewed profiles of Indian creators, open to any creator, and brand enquiries.",
  ctaText: "BROWSE PROFILES",
  footerText: "© 2026 Influencer Awards. All rights reserved.",
  logoUrl: "",
  primaryColor: "#E1C699",
  secondaryColor: "#111111",
  geminiApiKey: "",
  aiSystemPrompt: "You are an elite, world-class haute couture brand director and luxury media strategist for Influencer Awards. Your job is to optimize a creator's rough pitch/concept for a luxury brand sponsorship campaign into a majestic, highly professional premium proposal.",
  modelSelection: "gemini-2.5-flash",
  temperature: 0.7,
  topK: 40
};

// Fresh database contents, also exported to php-backend/api/seed.json for the PHP build
export function createDefaultDb(): DatabaseSchema {
  return JSON.parse(JSON.stringify({
    creators: INITIAL_CREATORS,
    campaigns: INITIAL_CAMPAIGNS,
    registrations: INITIAL_REGISTRATIONS,
    admin_users: INITIAL_USERS,
    admin_logs: INITIAL_LOGS,
    system_settings: { ...DEFAULT_SETTINGS, geminiApiKey: process.env.GEMINI_API_KEY || "" },
    prompt_logs: [],
    influencer_applications: [],
    membership_plans: INITIAL_PLANS,
    enquiries: [],
    migrations: { debrand_v1: "seed", debrand_v2: "seed", debrand_v3: "seed", debrand_v4: "seed" }
  }));
}

// ----------------------------------------------------
// PASSWORD HASHING
// ----------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

// Supports salted scrypt hashes and legacy unsalted SHA-256 hex digests
export function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith("scrypt$")) {
    const [, salt, hash] = stored.split("$");
    const candidate = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
  }
  const legacy = crypto.createHash("sha256").update(password).digest();
  const expected = Buffer.from(stored, "hex");
  return expected.length === legacy.length && crypto.timingSafeEqual(legacy, expected);
}

export function needsRehash(stored: string): boolean {
  return !stored.startsWith("scrypt$");
}

// ----------------------------------------------------
// BRAND NAME — the public brand is "Influencer Awards" and the award is the "Influencer Award"
// (PLACEHOLDERS until Boss confirms; keep in sync with src/content/brand.ts).
// The word "Forever" must not appear in anything visitors see (Boss, 2026-10-26), and the award
// is separate from FSIA (Boss, 2026-10-26), so stored text from every earlier naming is rewritten
// in every public API response. Keep in sync with debrand_text() in php-backend/api/lib/helpers.php
// ----------------------------------------------------
const PUBLIC_BRAND = "Influencer Awards";
const PUBLIC_AWARD = "Influencer Award";
// A null replacement keeps the first capture group. An all-caps match gets an all-caps
// replacement unless the rule is marked "asIs" (the acronym FSIA is always upper case).
const DEBRAND_RULES: [RegExp, string | null, "asIs"?][] = [
  // Only one award exists (Boss, 2026-10-27): older section names and titles that read as other
  // awards or as a verification are shown under neutral niche names. The stored data is unchanged.
  [/\b(?:Winner|(?:1st|2nd|3rd) Runner[- ]Up|Runner[- ]Up),?\s+Miss India \d{4}\b/gi, "Fashion creator"],
  [/\bMiss India \d{4}\b/gi, "Fashion & Modelling"],
  [/\bSuper Hero Awards?\b/gi, "Social Impact"],
  [/\bVerified VIP Influencers\b/gi, "Lifestyle & Design"],
  [/FSIA\s*[—-]\s*Forever Star India Awards/gi, PUBLIC_BRAND],
  [/Forever Star India(?: Awards| Association)?(?: \(FSIA\))?/gi, PUBLIC_BRAND],
  [/\b(?:Forever|FSIA) Influencer Awards\b/gi, PUBLIC_BRAND],
  [/\b(?:Forever|FSIA) Influencer Award\b/gi, PUBLIC_AWARD],
  [/\b(?:Forever|FSIA) Influencer\b/gi, PUBLIC_BRAND],
  [/\bForever Free\b/gi, "Always Free"],
  // Lower-case prose ("stay forever young") keeps its meaning with "always"
  [/\bforever\b/g, "always"],
  // Any other spelling is the old brand prefix or suffix: drop it
  [/\bforever\s+/gi, ""],
  [/\s*\bforever\b/gi, ""],
  [/forever/gi, ""],
  // Other mentions of FSIA as a name ("the FSIA team"); IDs such as FSIA-24527 and domains stay
  [/\bFSIA\b(?![-.]\w)/g, PUBLIC_BRAND, "asIs"],
  [/\b(Influencer Awards)(?: Influencer)+(?: Awards?)?\b/gi, null]
];

export function debrandText(text: string): string {
  return DEBRAND_RULES.reduce(
    (out, [pattern, replacement, asIs]) =>
      out.replace(pattern, (m: string, group?: unknown) => {
        const value = replacement ?? String(group);
        return !asIs && m === m.toUpperCase() && /[A-Z]/.test(m) ? value.toUpperCase() : value;
      }),
    text
  );
}

export function debrandValue<T>(value: T): T {
  if (typeof value === "string") {
    return (/^(https?:|data:)/i.test(value) ? value : debrandText(value)) as T;
  }
  if (Array.isArray(value)) return value.map(debrandValue) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, debrandValue(v)])) as T;
  }
  return value;
}

// Initialize and Read Database
export function getDb(): DatabaseSchema {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const defaultData = createDefaultDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), "utf8");
    return defaultData;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.system_settings) {
      parsed.system_settings = { ...DEFAULT_SETTINGS };
    }
    if (!parsed.prompt_logs) {
      parsed.prompt_logs = [];
    }
    if (!parsed.influencer_applications) {
      parsed.influencer_applications = [];
    }
    if (!parsed.membership_plans) {
      parsed.membership_plans = INITIAL_PLANS;
    }
    if (!parsed.admin_users || parsed.admin_users.length === 0) {
      parsed.admin_users = INITIAL_USERS;
    }
    if (!parsed.admin_logs) {
      parsed.admin_logs = [];
    }
    if (!parsed.enquiries) {
      parsed.enquiries = [];
    }
    if (!parsed.migrations?.debrand_v1) {
      // Settings still on the old default copy get the new defaults; customised text is only debranded
      const oldDefaults: Partial<Record<keyof SystemSettings, string>> = {
        websiteTitle: "FSIA — Forever Star India Awards",
        heroTitle: "FOREVER STAR INDIA",
        heroSubtitle: "THE EXQUISITE HALL OF LUXURY INFLUENCING & PRESTIGE COUTURE",
        ctaText: "SECURE VIP RUNWAY ACCESS",
        footerText: "© 2026 FOREVER STAR INDIA AWARDS (FSIA). ALL RIGHTS RESERVED."
      };
      for (const [field, before] of Object.entries(oldDefaults) as [keyof SystemSettings, string][]) {
        if (parsed.system_settings[field] === before) {
          (parsed.system_settings as any)[field] = DEFAULT_SETTINGS[field];
        }
      }
      parsed.creators = debrandValue(parsed.creators);
      parsed.campaigns = debrandValue(parsed.campaigns);
      parsed.membership_plans = debrandValue(parsed.membership_plans);
      parsed.system_settings = debrandValue(parsed.system_settings);
      parsed.migrations = { ...parsed.migrations, debrand_v1: new Date().toISOString() };
      saveDb(parsed);
    }
    if (!parsed.migrations?.debrand_v2) {
      // v2 rules are case-insensitive (v1 only matched capitalised spellings)
      parsed.creators = debrandValue(parsed.creators);
      parsed.campaigns = debrandValue(parsed.campaigns);
      parsed.membership_plans = debrandValue(parsed.membership_plans);
      parsed.system_settings = debrandValue(parsed.system_settings);
      parsed.migrations = { ...parsed.migrations, debrand_v2: new Date().toISOString() };
      saveDb(parsed);
    }
    if (!parsed.migrations?.debrand_v3) {
      // v3: "Forever" is removed again and the site is "FSIA Influencer"
      parsed.creators = debrandValue(parsed.creators);
      parsed.campaigns = debrandValue(parsed.campaigns);
      parsed.membership_plans = debrandValue(parsed.membership_plans);
      parsed.system_settings = debrandValue(parsed.system_settings);
      parsed.migrations = { ...parsed.migrations, debrand_v3: new Date().toISOString() };
      saveDb(parsed);
    }
    if (!parsed.migrations?.debrand_v4) {
      // v4: the award is separate from FSIA, so stored "FSIA" names are rewritten too
      parsed.creators = debrandValue(parsed.creators);
      parsed.campaigns = debrandValue(parsed.campaigns);
      parsed.membership_plans = debrandValue(parsed.membership_plans);
      parsed.system_settings = debrandValue(parsed.system_settings);
      parsed.migrations = { ...parsed.migrations, debrand_v4: new Date().toISOString() };
      saveDb(parsed);
    }
    return parsed;
  } catch (error) {
    // Never silently wipe a corrupt database: keep a copy for manual recovery
    console.error("Error reading JSON Database. Backing up and re-seeding defaults.", error);
    try {
      fs.copyFileSync(DB_PATH, DB_PATH + ".corrupt-" + Date.now());
    } catch {}
    const defaultData = createDefaultDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), "utf8");
    return defaultData;
  }
}

// Write Database (atomic: write temp file then rename)
export function saveDb(data: DatabaseSchema) {
  try {
    const tmp = DB_PATH + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tmp, DB_PATH);
  } catch (error) {
    console.error("Error writing to JSON Database", error);
  }
}

// Log admin action
export function logAction(action: string, ip?: string) {
  const db = getDb();
  db.admin_logs.unshift({
    id: "log-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    action,
    ip
  });
  // Keep a bounded audit trail
  if (db.admin_logs.length > 500) {
    db.admin_logs = db.admin_logs.slice(0, 500);
  }
  saveDb(db);
}
