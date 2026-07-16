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
}

export interface AdminUser {
  username: string;
  passwordHash: string; // "admin123" simple hash for demonstration / ease of access
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

export interface DatabaseSchema {
  creators: GallerySection[];
  campaigns: Campaign[];
  registrations: Registration[];
  admin_users: AdminUser[];
  admin_logs: AdminLog[];
  system_settings: SystemSettings;
  prompt_logs: PromptLog[];
}

const DB_PATH = path.join(process.cwd(), "server", "db.json");

// Seed Initial Data
const INITIAL_CREATORS: GallerySection[] = [
  {
    id: "miss-india",
    title: "Forever Miss India 2026",
    subtitle: "The Reign of Couture & Prestige",
    zOffset: 0,
    primaryColor: "#E1C699",
    creators: [
      {
        name: "Aishwarya Sen",
        role: "Winner, Forever Miss India 2026",
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
        role: "1st Runner Up, Forever Miss India 2026",
        city: "New Delhi",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
        bio: "A classical Odissi dancer and high-fashion enthusiast, Meera blends deep-rooted cultural heritage with sharp, high-fashion styling. She represents the seamless dialogue between classical antiquity and modern avant-garde design.",
        stats: {
          reach: "1.2M",
          engagement: "7.1%",
          verified: true,
          "Campaigns": "12 Global Brands",
          "Dance Laurels": "National Sangeet Natak Awardee"
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
    title: "Super Hero Awards",
    subtitle: "Visionary Social Impact & Leadership",
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
          "Circular Runway": "100% Fully Circular",
          "Design Laurels": "Green Fashion Award 2025"
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
    title: "Verified VIP Influencers",
    subtitle: "The Standard of Modern Digital Authority",
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

const INITIAL_USERS: AdminUser[] = [
  {
    username: "admin",
    // Simple verification check helper: in actual production, bcrypt or pbkdf2 is used.
    // For local ease of demonstration and robustness of zero-dependency code, we'll store simple salt/string or check directly.
    passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" // sha256 for "admin123"
  },
  {
    username: "pm37855@gmail.com",
    passwordHash: crypto.createHash("sha256").update("Xbox@1122").digest("hex")
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

// Initialize and Read Database
export function getDb(): DatabaseSchema {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const defaultSettings: SystemSettings = {
    websiteTitle: "FSIA — Forever Star India Awards",
    heroTitle: "FOREVER STAR INDIA",
    heroSubtitle: "THE EXQUISITE HALL OF LUXURY INFLUENCING & PRESTIGE COUTURE",
    ctaText: "SECURE VIP RUNWAY ACCESS",
    footerText: "© 2026 FOREVER STAR INDIA AWARDS (FSIA). ALL RIGHTS RESERVED.",
    logoUrl: "",
    primaryColor: "#E1C699",
    secondaryColor: "#111111",
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    aiSystemPrompt: "You are an elite, world-class haute couture brand director and luxury media strategist for FSIA. Your job is to optimize a creator's rough pitch/concept for a luxury brand sponsorship campaign into a majestic, highly professional premium proposal.",
    modelSelection: "gemini-3.5-flash",
    temperature: 0.7,
    topK: 40
  };

  if (!fs.existsSync(DB_PATH)) {
    const defaultData: DatabaseSchema = {
      creators: INITIAL_CREATORS,
      campaigns: INITIAL_CAMPAIGNS,
      registrations: INITIAL_REGISTRATIONS,
      admin_users: INITIAL_USERS,
      admin_logs: INITIAL_LOGS,
      system_settings: defaultSettings,
      prompt_logs: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), "utf8");
    return defaultData;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.system_settings) {
      parsed.system_settings = defaultSettings;
    }
    if (!parsed.prompt_logs) {
      parsed.prompt_logs = [];
    }
    if (!parsed.admin_users) {
      parsed.admin_users = INITIAL_USERS;
    }
    const hasTargetUser = parsed.admin_users.some((u) => u.username === "pm37855@gmail.com");
    if (!hasTargetUser) {
      parsed.admin_users.push({
        username: "pm37855@gmail.com",
        passwordHash: crypto.createHash("sha256").update("Xbox@1122").digest("hex")
      });
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), "utf8");
    }
    return parsed;
  } catch (error) {
    console.error("Error reading JSON Database. Re-seeding defaults.", error);
    const defaultData: DatabaseSchema = {
      creators: INITIAL_CREATORS,
      campaigns: INITIAL_CAMPAIGNS,
      registrations: INITIAL_REGISTRATIONS,
      admin_users: INITIAL_USERS,
      admin_logs: INITIAL_LOGS,
      system_settings: defaultSettings,
      prompt_logs: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), "utf8");
    return defaultData;
  }
}

// Write Database
export function saveDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
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
  // Keep logs to a clean max limit of 100 entries
  if (db.admin_logs.length > 100) {
    db.admin_logs = db.admin_logs.slice(0, 100);
  }
  saveDb(db);
}
