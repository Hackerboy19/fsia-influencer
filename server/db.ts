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
  social?: Record<string, string>;
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
  /** owner | editor | inbox (missing = owner) */
  role?: string;
}

/** One saved version of the site settings, taken before each change */
export interface SettingsVersion {
  id: string;
  at: string;
  by: string;
  keys: string[];
  settings: Record<string, unknown>;
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
  [key: string]: unknown;
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
  social?: Record<string, string>;
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
  settings_history?: SettingsVersion[];
}

export const DB_PATH = path.join(process.cwd(), "server", "db.json");

// Seed Initial Data
const INITIAL_CREATORS: GallerySection[] = [
  {
    "id": "miss-india",
    "title": "Fashion & Modelling",
    "subtitle": "Fashion, beauty and runway creators",
    "zOffset": 0,
    "primaryColor": "#E1C699",
    "creators": [
      {
        "name": "Ishita Rawat",
        "role": "Fashion and styling creator",
        "city": "Mumbai",
        "image": "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop",
        "bio": "Everyday styling with high-street and local labels: office looks, thrift finds and saree drapes that work on a commute. Runs a monthly series called One Kurta, Five Looks.",
        "stats": {
          "reach": "64K",
          "engagement": "4.6%",
          "verified": false,
          "Platforms": "Instagram, YouTube Shorts",
          "Languages": "Hindi, English"
        },
        "quote": "Good style should survive the local train.",
        "portfolio": [
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=500&auto=format&fit=crop"
        ]
      },
      {
        "name": "Sneha Kulkarni",
        "role": "Model and beauty creator",
        "city": "Pune",
        "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
        "bio": "Freelance model for catalogue and e-commerce shoots. Posts skincare routines for humid weather and honest reviews of products under ₹500.",
        "stats": {
          "reach": "38K",
          "engagement": "5.2%",
          "verified": false,
          "Platforms": "Instagram",
          "Languages": "Marathi, Hindi, English"
        },
        "quote": "If I wouldn't buy it again, I say so.",
        "portfolio": [
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=500&auto=format&fit=crop"
        ]
      },
      {
        "name": "Arjun Malhotra",
        "role": "Menswear creator",
        "city": "New Delhi",
        "image": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop",
        "bio": "Menswear on a budget: wedding-season outfits, kurta and jacket pairings, and simple grooming. Most of his audience is 20 to 30 and based in North India.",
        "stats": {
          "reach": "110K",
          "engagement": "3.4%",
          "verified": false,
          "Platforms": "Instagram, YouTube",
          "Languages": "Hindi, English"
        },
        "quote": "",
        "portfolio": [
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500&auto=format&fit=crop"
        ]
      }
    ]
  },
  {
    "id": "super-hero",
    "title": "Social Impact",
    "subtitle": "Creators working on social causes",
    "zOffset": -8,
    "primaryColor": "#A3B18A",
    "creators": [
      {
        "name": "Kavya Reddy",
        "role": "Civic and climate creator",
        "city": "Hyderabad",
        "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
        "bio": "Short videos on city issues: lake clean-ups, waste segregation and how to file a civic complaint. Volunteers with a lake restoration group on weekends.",
        "stats": {
          "reach": "27K",
          "engagement": "6.8%",
          "verified": false,
          "Platforms": "Instagram, X",
          "Languages": "Telugu, English"
        },
        "quote": "Small fixes, filmed properly, get other people started.",
        "portfolio": []
      },
      {
        "name": "Pooja Thakur",
        "role": "Menstrual health educator",
        "city": "Dehradun",
        "image": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=600&auto=format&fit=crop",
        "bio": "Gives talks on menstrual health in schools across Uttarakhand and answers the questions students ask most, in simple Hindi.",
        "stats": {
          "reach": "19K",
          "engagement": "7.5%",
          "verified": false,
          "Platforms": "Instagram, YouTube",
          "Languages": "Hindi"
        },
        "quote": "",
        "portfolio": []
      }
    ]
  },
  {
    "id": "verified-influencers",
    "title": "Lifestyle & Design",
    "subtitle": "Lifestyle, design and culture creators",
    "zOffset": -16,
    "primaryColor": "#C5C3C0",
    "creators": [
      {
        "name": "Nikhil Joshi",
        "role": "Home and interiors creator",
        "city": "Ahmedabad",
        "image": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=600&auto=format&fit=crop",
        "bio": "Rental-friendly makeovers of small flats: lighting, storage and plants, with a cost breakdown in every video.",
        "stats": {
          "reach": "51K",
          "engagement": "4.9%",
          "verified": false,
          "Platforms": "Instagram, YouTube",
          "Languages": "Gujarati, Hindi, English"
        },
        "quote": "",
        "portfolio": []
      },
      {
        "name": "Tanvi Rao",
        "role": "Illustrator and journaling creator",
        "city": "Bengaluru",
        "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop",
        "bio": "Posts process videos of her journals and hand lettering, and sells prints at weekend craft markets.",
        "stats": {
          "reach": "33K",
          "engagement": "5.8%",
          "verified": false,
          "Platforms": "Instagram",
          "Languages": "Kannada, English"
        },
        "quote": "",
        "portfolio": []
      },
      {
        "name": "Ritika Bose",
        "role": "Books and lifestyle creator",
        "city": "Kolkata",
        "image": "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=600&auto=format&fit=crop",
        "bio": "Book reviews, Kolkata café guides and slow weekend vlogs. Hosts a small monthly online book club.",
        "stats": {
          "reach": "22K",
          "engagement": "6.1%",
          "verified": false,
          "Platforms": "Instagram, YouTube",
          "Languages": "Bengali, English"
        },
        "quote": "",
        "portfolio": []
      }
    ]
  },
  {
    "id": "food-travel",
    "title": "Food & Travel",
    "subtitle": "Food, travel and regional culture creators",
    "zOffset": -24,
    "primaryColor": "#C9A27E",
    "creators": [
      {
        "name": "Zoya Khan",
        "role": "Food creator",
        "city": "Lucknow",
        "image": "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=600&auto=format&fit=crop",
        "bio": "Home-style Awadhi recipes and food walks through old Lucknow. Every recipe video lists quantities for a family of four.",
        "stats": {
          "reach": "140K",
          "engagement": "3.9%",
          "verified": false,
          "Platforms": "Instagram, YouTube",
          "Languages": "Hindi, Urdu"
        },
        "quote": "",
        "portfolio": []
      },
      {
        "name": "Aditi Menon",
        "role": "Travel creator",
        "city": "Kochi",
        "image": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop",
        "bio": "Budget travel across South India by train and bus, with day-by-day itineraries and costs. Focuses on solo travel for women.",
        "stats": {
          "reach": "58K",
          "engagement": "4.4%",
          "verified": false,
          "Platforms": "Instagram, YouTube",
          "Languages": "Malayalam, English"
        },
        "quote": "Sleeper class, window seat, full itinerary in the caption.",
        "portfolio": []
      }
    ]
  },
  {
    "id": "tech-learning",
    "title": "Tech & Learning",
    "subtitle": "Tech, personal finance and education creators",
    "zOffset": -32,
    "primaryColor": "#9DB4C0",
    "creators": [
      {
        "name": "Rohan Verma",
        "role": "Tech reviewer",
        "city": "Indore",
        "image": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop",
        "bio": "Reviews phones and gadgets under ₹30,000 and explains settings in Hindi. Uses each phone for at least two weeks before posting a review.",
        "stats": {
          "reach": "210K",
          "engagement": "2.8%",
          "verified": false,
          "Platforms": "YouTube, Instagram",
          "Languages": "Hindi"
        },
        "quote": "",
        "portfolio": []
      },
      {
        "name": "Neha Agarwal",
        "role": "Personal finance educator",
        "city": "Jaipur",
        "image": "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=600&auto=format&fit=crop",
        "bio": "Explains budgeting, SIPs and tax filing for first-time earners. Her videos are general education, not investment advice.",
        "stats": {
          "reach": "74K",
          "engagement": "5.1%",
          "verified": false,
          "Platforms": "Instagram, YouTube",
          "Languages": "Hindi, English"
        },
        "quote": "",
        "portfolio": []
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
    creatorName: "Ishita Rawat",
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
  heroSubtitle: "Reviewed profiles of Indian creators, Influencer Award applications and brand enquiries.",
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
