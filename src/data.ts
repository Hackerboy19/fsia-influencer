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

// Sample profiles. They are fictional and shown only when the live directory cannot be
// loaded (for example on a Vercel preview). Real profiles come from the database.
export const gallerySections: GallerySection[] = [
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
