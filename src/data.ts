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
  zOffset: number; // Position along the 3D runway
  primaryColor: string;
}

export const gallerySections: GallerySection[] = [
  {
    id: "miss-india",
    title: "Forever Miss India 2026",
    subtitle: "The Reign of Couture & Prestige",
    zOffset: 0,
    primaryColor: "#E1C699", // Champagne Gold
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
    primaryColor: "#A3B18A", // Soft Sage / Platinum
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
    primaryColor: "#C5C3C0", // Brushed Platinum
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
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=500&auto=format&fit=crop"
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
