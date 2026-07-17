import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Sparkles, SlidersHorizontal, CheckCircle2, Eye, Send, Users, ShieldCheck, ArrowRight } from "lucide-react";
import { Creator, gallerySections } from "../data";

interface DirectoryTabProps {
  onOpenCollaboration: (creatorName: string) => void;
  onSelectCreator: (creator: Creator) => void;
}

export default function DirectoryTab({ onOpenCollaboration, onSelectCreator }: DirectoryTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedReachTier, setSelectedReachTier] = useState("All");
  const [dynamicCreators, setDynamicCreators] = useState<Creator[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Flat list of core creators from our high-fashion gallery
  const coreCreators = gallerySections.flatMap((s) => s.creators);

  // Fetch from the server and register live updates on sections-updated
  const fetchCreators = () => {
    fetch("/api/creators")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const flat = data.flatMap((s: any) => s.creators || []);
          if (flat.length > 0) {
            setDynamicCreators(flat);
            return;
          }
        }
        setDynamicCreators(coreCreators);
      })
      .catch(() => {
        setDynamicCreators(coreCreators);
      });
  };

  useEffect(() => {
    fetchCreators();
    window.addEventListener("sections-updated", fetchCreators);
    return () => {
      window.removeEventListener("sections-updated", fetchCreators);
    };
  }, []);

  const activeCreators = dynamicCreators.length > 0 ? dynamicCreators : coreCreators;

  // Additional mock diverse Indian influencers to enrich the search list and give it premium depth
  const extraCreators: Creator[] = [
    {
      name: "Rohan Varma",
      role: "Luxury Travel & Heritage Vlogger",
      city: "Jaipur",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop",
      bio: "Rohan showcases the breathtaking heritage hotels, royal palaces, and hidden cultural hubs of India. His Cinematic vlogs bridge ancient majesty with modern traveler aspirations.",
      stats: {
        reach: "920K",
        engagement: "7.4%",
        verified: true,
        "Heritage Visits": "45+ Palaces",
        "Est. Impressions": "1.8M / Post"
      },
      quote: "Travelling is not just crossing boundaries, it is exploring the soul of the land.",
      portfolio: [
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=500&auto=format&fit=crop"
      ]
    },
    {
      name: "Pooja Hegde",
      role: "Elite Beauty & Ayurvedic Skin Expert",
      city: "Kochi",
      image: "https://images.unsplash.com/photo-1594744803329-e58b31de215f?q=80&w=600&auto=format&fit=crop",
      bio: "Pooja blends modern dermatology with organic, ancient Ayurvedic skincare practices. She inspires millions to embrace traditional organic remedies packaged with editorial design.",
      stats: {
        reach: "3.1M",
        engagement: "8.5%",
        verified: true,
        "Formulations Created": "15+ Organic",
        "Masterclasses Conducted": "50+ Nationwide"
      },
      quote: "Beauty is a harmonious reflection of natural elements nurtured with pure intent.",
      portfolio: [
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=500&auto=format&fit=crop"
      ]
    },
    {
      name: "Arjun Bhasin",
      role: "Fitness Icon & Organic Athlete",
      city: "Mumbai",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop",
      bio: "Arjun leads clean living and high-performance training movements across tier-1 cities. He counsels luxury health resorts on wellness retreats and designs customized athletic fits.",
      stats: {
        reach: "1.7M",
        engagement: "9.2%",
        verified: true,
        "Athletes Trained": "200+ Professionals",
        "Eco Brands Endorsed": "12 Verified"
      },
      quote: "Discipline is the finest tailor; it shapes your posture and your state of mind.",
      portfolio: [
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=500&auto=format&fit=crop"
      ]
    },
    {
      name: "Meera Nair",
      role: "Gourmet Chef & Culinary Anthropologist",
      city: "New Delhi",
      image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=600&auto=format&fit=crop",
      bio: "Meera archives lost recipes of the subcontinental royal kitchens, turning dining experiences into high-fashion multisensory banquets. She partners with global luxury spirit houses.",
      stats: {
        reach: "890K",
        engagement: "6.2%",
        verified: true,
        "Historic Recipes Restored": "80+ Royal Menu",
        "Awards": "Michelin Star Guest Chef"
      },
      quote: "To dine is to read the history of a civilization written in the medium of taste.",
      portfolio: [
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=500&auto=format&fit=crop"
      ]
    },
    {
      name: "Kabir Roy",
      role: "Premium Tech & Lifestyle Architect",
      city: "Bangalore",
      image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=600&auto=format&fit=crop",
      bio: "Kabir reviews next-generation smart homes, luxury EV models, and premium productivity setups. Fusing technology with minimalist architecture, his aesthetics are highly clean.",
      stats: {
        reach: "2.1M",
        engagement: "5.9%",
        verified: true,
        "Hardware Reviews": "150+ Top Tier",
        "Aesthetic Projects": "10+ Smart Penthouses"
      },
      quote: "The finest tech is invisible, integrating seamlessly into the physical rhythms of life.",
      portfolio: [
        "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=500&auto=format&fit=crop"
      ]
    }
  ];

  const allDirectoryCreators = [...activeCreators, ...extraCreators];

  const categories = [
    "All",
    "Fashion & Couture",
    "Beauty & Makeup",
    "Lifestyle",
    "Business & Tech"
  ];
  
  const cities = ["All", "Mumbai", "New Delhi", "Bangalore", "Kochi", "Jaipur", "Chennai"];

  // Helper to categorize role to one of the 5 key overhauled categories
  const getOverhaulCategory = (role: string): string => {
    const r = role.toLowerCase();
    if (
      r.includes("winner") ||
      r.includes("runner") ||
      r.includes("pageant") ||
      r.includes("couture") ||
      r.includes("tailoring") ||
      r.includes("fashion") ||
      r.includes("model") ||
      r.includes("style") ||
      r.includes("pageantry")
    ) {
      return "Fashion & Couture";
    }
    if (
      r.includes("beauty") ||
      r.includes("ayurvedic") ||
      r.includes("skin") ||
      r.includes("makeup")
    ) {
      return "Beauty & Makeup";
    }
    if (
      r.includes("tech") ||
      r.includes("hardware") ||
      r.includes("gadget") ||
      r.includes("architect")
    ) {
      return "Business & Tech";
    }
    return "Lifestyle";
  };

  // Helper to parse reach string (e.g., "1.9M" or "850K") to numerical value
  const getReachNumber = (reachStr: string): number => {
    const clean = reachStr.trim().toUpperCase();
    if (clean.endsWith("M")) {
      return parseFloat(clean.replace("M", "")) * 1000000;
    }
    if (clean.endsWith("K")) {
      return parseFloat(clean.replace("K", "")) * 1000;
    }
    return parseFloat(clean) || 0;
  };

  const filteredCreators = allDirectoryCreators.filter((creator) => {
    // 1. Search text filter
    const matchesSearch =
      creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.bio.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Overhaul Category filter
    const creatorCat = getOverhaulCategory(creator.role);
    const matchesCategory = selectedCategory === "All" || creatorCat === selectedCategory;

    // 3. City filter
    const matchesCity = selectedCity === "All" || creator.city === selectedCity;

    // 4. Follower Tier filter
    const reachNum = getReachNumber(creator.stats.reach);
    let matchesReach = true;
    if (selectedReachTier === "macro") {
      matchesReach = reachNum >= 500000 && reachNum < 1000000;
    } else if (selectedReachTier === "mega") {
      matchesReach = reachNum >= 1000000 && reachNum < 2000000;
    } else if (selectedReachTier === "elite") {
      matchesReach = reachNum >= 2000000;
    }

    return matchesSearch && matchesCategory && matchesCity && matchesReach;
  });

  const handleApplyClick = () => {
    window.dispatchEvent(new CustomEvent("change-tab", { detail: "apply" }));
  };

  return (
    <section 
      className="w-full h-auto min-h-screen bg-[#FCFBFA] py-8 md:py-16 px-4 md:px-8 space-y-12 select-none"
      aria-label="Influencer Directory Portfolio"
      id="influencer-directory-tab"
    >
      {/* 1. MINIMAL HERO SECTION */}
      <header className="max-w-4xl mx-auto text-center space-y-4">
        <span className="font-sans text-xs tracking-[0.35em] text-[#C9A227] uppercase font-bold block">
          FSIA ELITE TALENT AGENCY
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-stone-900 leading-tight">
          Discover India's Top Verified Influencers
        </h2>
        <div className="w-16 h-[1px] bg-[#C9A227] mx-auto my-3" />
        <p className="font-serif italic text-stone-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Bridging luxury couture, organic cosmetics advocates, and digital innovators with India's most prestigious editorial campaigns.
        </p>
      </header>

      {/* 2. THE FILTER TABS (Elegant and Sticky) */}
      <div className="sticky top-0 z-20 bg-[#FCFBFA]/90 backdrop-blur-md py-4 border-y border-stone-100 shadow-xs">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* HORIZONTAL SWIPEABLE MOBILE TABS vs STATIC DESKTOP ROW */}
          <div>
            {/* Mobile Horizontal scrollable container */}
            <div className="flex md:hidden overflow-x-auto whitespace-nowrap scrollbar-none gap-3 px-4 py-1 w-full">
              {categories.map((cat, idx) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={`mobile-cat-${idx}`}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full border text-xs font-medium tracking-wide transition-all min-h-[44px] flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? "bg-stone-900 text-white border-stone-900 shadow-md"
                        : "border-stone-200 text-zinc-600 bg-white hover:text-stone-900 hover:border-[#C9A227]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Desktop grid layout */}
            <div className="hidden md:flex md:items-center md:justify-center md:flex-wrap md:gap-3">
              {categories.map((cat, idx) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={`desktop-cat-${idx}`}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2 rounded-full border text-sm font-medium transition-all cursor-pointer min-h-[44px] flex items-center justify-center ${
                      isSelected
                        ? "bg-stone-900 text-white border-stone-900 shadow-md"
                        : "border-stone-200 text-zinc-600 bg-white hover:text-stone-900 hover:border-[#C9A227]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search bar and collateral filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 md:px-0">
            {/* Search Input Box */}
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search by name, niche, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-full text-xs placeholder:text-zinc-400 focus:outline-none focus:border-[#C9A227] transition-all min-h-[44px]"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Collapsible advanced option & stats info */}
            <div className="w-full sm:w-auto flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 px-4 py-2 border border-stone-200 rounded-full text-xs font-medium text-stone-700 bg-white hover:border-[#C9A227] hover:text-stone-900 transition-all cursor-pointer min-h-[44px]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>{showAdvanced ? "Hide Fine Filters" : "More Filters"}</span>
              </button>

              <div className="text-[10px] md:text-xs font-sans text-stone-500 bg-stone-100/50 px-3 py-2 rounded-full font-medium">
                Showing <strong className="text-stone-900">{filteredCreators.length}</strong> profiles
              </div>
            </div>
          </div>

          {/* Advanced drop-down selection options */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden bg-stone-50/50 rounded-xl border border-stone-100 p-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                  {/* City Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Target City</label>
                    <div className="relative">
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:border-[#C9A227] appearance-none transition-all cursor-pointer min-h-[44px]"
                      >
                        <option value="All">All Cities (India)</option>
                        {cities.filter(c => c !== "All").map((city, idx) => (
                          <option key={`city-${idx}`} value={city}>{city}</option>
                        ))}
                      </select>
                      <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Reach Tier Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Audience Reach</label>
                    <div className="relative">
                      <select
                        value={selectedReachTier}
                        onChange={(e) => setSelectedReachTier(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:border-[#C9A227] appearance-none transition-all cursor-pointer min-h-[44px]"
                      >
                        <option value="All">All Tiers</option>
                        <option value="macro">Premium Macro (500K - 1M)</option>
                        <option value="mega">Mega Creators (1M - 2M)</option>
                        <option value="elite">Elite Superstars (2M+)</option>
                      </select>
                      <Users className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. THE MASSIVE CREATOR GRID (Highly Responsive layout) */}
      <div className="max-w-6xl mx-auto">
        {filteredCreators.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 px-4 md:px-0">
            {filteredCreators.map((creator, idx) => {
              const currentCategory = getOverhaulCategory(creator.role);
              const formattedHandle = `@${creator.name.toLowerCase().replace(/\s+/g, "")}`;
              
              return (
                <motion.div
                  key={`${creator.name}-${idx}`}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => onSelectCreator(creator)}
                  className="relative aspect-[4/5] rounded-xl overflow-hidden group bg-stone-100 border border-stone-200/50 shadow-xs cursor-pointer select-none"
                >
                  {/* Dynamic Creator Portrait Image with forced lazy loading */}
                  <img
                    src={creator.image}
                    alt={`Top ${currentCategory} Influencer in India - ${creator.name} represented by FSIA Talent`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Floating Gold FSIA Verified Shield Badge */}
                  <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10 bg-stone-900/90 text-[#C9A227] border border-[#C9A227]/30 backdrop-blur-xs px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-md">
                    <ShieldCheck className="w-3 h-3 text-[#C9A227] fill-[#C9A227]/10 shrink-0" />
                    <span>FSIA VERIFIED</span>
                  </div>

                  {/* Frosted glass info panel at bottom of card */}
                  {/* On Mobile: permanently visible and compact. On Desktop: transitions smoothly */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 p-1.5 md:p-2">
                    <div className="bg-white/95 backdrop-blur-md rounded-lg border border-stone-100 p-2.5 md:p-4 md:bg-white/90 md:border-white/20 transition-all duration-300 shadow-md">
                      {/* Name, Handle, Niche */}
                      <div className="space-y-0.5">
                        <h3 className="font-serif text-stone-900 font-bold text-xs sm:text-sm md:text-base leading-tight tracking-tight truncate">
                          {creator.name}
                        </h3>
                        <span className="text-[10px] md:text-xs text-[#C9A227] block font-mono">
                          {formattedHandle}
                        </span>
                        <span className="text-[9px] md:text-[10px] text-stone-500 font-semibold block uppercase tracking-wider">
                          {currentCategory}
                        </span>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center justify-between text-[9px] md:text-[10px] text-zinc-500 font-semibold pt-1.5 mt-1.5 border-t border-stone-100">
                        <div>
                          <span className="block text-[8px] text-stone-400 uppercase font-bold tracking-wider">Followers</span>
                          <span className="text-stone-800 font-bold">{creator.stats.reach || "500K"}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] text-stone-400 uppercase font-bold tracking-wider">Engagement</span>
                          <span className="text-stone-800 font-bold">{creator.stats.engagement || "4.8%"}</span>
                        </div>
                      </div>

                      {/* View Media Kit - Hover-to-reveal button on desktop */}
                      <div className="hidden md:block overflow-hidden transition-all duration-300 max-h-0 group-hover:max-h-12 group-hover:mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCreator(creator);
                          }}
                          className="w-full bg-stone-900 hover:bg-stone-800 text-white text-[10px] tracking-widest uppercase font-bold py-2 rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer min-h-[40px]"
                        >
                          <span>View Media Kit</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/40 border border-stone-200/50 rounded-3xl space-y-4 max-w-xl mx-auto">
            <p className="font-serif italic text-lg text-stone-600">
              No verified VIP matches found.
            </p>
            <p className="text-xs text-stone-500 leading-relaxed">
              We couldn't find any premium influencers matching those filter choices. Try clearing search fields or broadening categories.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
                setSelectedCity("All");
                setSelectedReachTier("All");
              }}
              className="px-6 py-2 border border-stone-300 text-stone-800 text-xs font-semibold rounded-full hover:bg-stone-100 cursor-pointer min-h-[44px]"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* 4. THE "APPLY NOW" FOOTER (Elegant, luxury-focused CTA section) */}
      <footer className="max-w-6xl mx-auto pt-8">
        <div className="bg-stone-900 text-white rounded-2xl p-8 md:p-12 text-center relative overflow-hidden shadow-xl border border-stone-800">
          {/* Subtle luxurious background light glow */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#C9A227]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#E1C699]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] tracking-[0.35em] text-[#C9A227] font-bold uppercase block">
              BECOME AN FSIA VERIFIED STAR
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-100 font-medium tracking-tight">
              Ready to Elevate Your Digital Footprint?
            </h3>
            <p className="text-stone-400 text-xs md:text-sm font-light leading-relaxed max-w-lg mx-auto">
              Join India's most prestigious elite creator directory to unlock exclusive brand charters, global fashion weeks, and high-paying premium campaigns.
            </p>
            <div className="pt-4">
              <button
                onClick={handleApplyClick}
                className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-[#C9A227] to-[#E1C699] hover:from-[#b08d1f] hover:to-[#d2b480] text-stone-950 text-xs font-bold tracking-widest rounded-full uppercase transition-all shadow-lg active:scale-95 cursor-pointer min-h-[44px]"
              >
                <span>Apply For Roster Entry</span>
                <ArrowRight className="w-4 h-4 ml-2 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}
