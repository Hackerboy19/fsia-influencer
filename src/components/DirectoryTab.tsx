import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Sparkles, SlidersHorizontal, CheckCircle2, Star, Eye, Send, Share2 } from "lucide-react";
import { Creator, gallerySections } from "../data";

interface DirectoryTabProps {
  onOpenCollaboration: (creatorName: string) => void;
  onSelectCreator: (creator: Creator) => void;
}

export default function DirectoryTab({ onOpenCollaboration, onSelectCreator }: DirectoryTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");

  // Flat list of core creators from our high-fashion gallery
  const coreCreators = gallerySections.flatMap((s) => s.creators);

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

  const allDirectoryCreators = [...coreCreators, ...extraCreators];

  const categories = ["All", "Pageantry", "Couture", "Travel", "Ayurvedic Beauty", "Fitness", "Culinary", "Tech"];
  const cities = ["All", "Mumbai", "New Delhi", "Bangalore", "Kochi", "Jaipur", "Chennai"];

  // Helper to categorize
  const getCategoryTag = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("winner") || r.includes("runner")) return "Pageantry";
    if (r.includes("couture") || r.includes("tailoring") || r.includes("fashion")) return "Couture";
    if (r.includes("travel") || r.includes("vlogger")) return "Travel";
    if (r.includes("beauty") || r.includes("ayurvedic")) return "Ayurvedic Beauty";
    if (r.includes("fitness") || r.includes("athlete")) return "Fitness";
    if (r.includes("chef") || r.includes("culinary")) return "Culinary";
    if (r.includes("tech") || r.includes("lifestyle architect")) return "Tech";
    return "Couture";
  };

  const filteredCreators = allDirectoryCreators.filter((creator) => {
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          creator.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          creator.bio.toLowerCase().includes(searchTerm.toLowerCase());
    const creatorCat = getCategoryTag(creator.role);
    const matchesCategory = selectedCategory === "All" || creatorCat === selectedCategory;
    const matchesCity = selectedCity === "All" || creator.city === selectedCity;
    return matchesSearch && matchesCategory && matchesCity;
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-12 space-y-8" id="influencer-directory-tab">
      {/* Title Block */}
      <div className="text-center md:text-left space-y-2">
        <span className="font-sans text-xs tracking-[0.3em] text-[#8E8D8A] uppercase font-bold block">
          FSIA Directory Desk
        </span>
        <h2 className="font-serif-display text-3xl md:text-5xl font-bold tracking-tight text-[#111]">
          Verified VIP Influencer Roster
        </h2>
        <p className="font-serif-text italic text-[#666] text-sm md:text-base max-w-2xl">
          Conduct verified queries through Forever Star India's roster of pageantry winners, lifestyle champions, and digital authorities.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/55 backdrop-blur-md border border-black/5 p-4 rounded-2xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by name, role, city or bio keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/70 border border-black/10 rounded-xl text-sm placeholder:text-[#BBB] focus:outline-none focus:border-champagne transition-all"
            />
            <Search className="w-4 h-4 text-[#8E8D8A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* City Selection */}
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-3 bg-white/70 border border-black/10 rounded-xl text-sm text-[#222] focus:outline-none focus:border-champagne appearance-none transition-all"
            >
              <option value="All">All Cities (India)</option>
              {cities.filter(c => c !== "All").map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#8E8D8A]">
              <MapPin className="w-4 h-4" />
            </div>
          </div>

          {/* Preset Metric Info */}
          <div className="bg-[#FAF9F6] border border-black/5 rounded-xl px-4 py-2 flex items-center justify-between text-[11px] font-sans text-[#666]">
            <div>
              <span className="block font-bold text-champagne">TOTAL ROSTER</span>
              <span className="text-[13px] font-serif-display font-bold text-[#111]">
                {allDirectoryCreators.length} VIPs
              </span>
            </div>
            <div className="text-right">
              <span className="block font-bold text-[#8E8D8A]">FILTERED MATCH</span>
              <span className="text-[13px] font-serif-display font-bold text-[#111]">
                {filteredCreators.length} Matches
              </span>
            </div>
          </div>
        </div>

        {/* Category Pill Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[10px] font-sans font-bold tracking-widest text-[#8E8D8A] uppercase pr-2 whitespace-nowrap flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> NICHE:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-sans tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-champagne text-white font-semibold"
                    : "bg-[#FAF9F6] hover:bg-[#F3F3F1] border border-black/5 text-[#555]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Creators */}
      {filteredCreators.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => {
            const catTag = getCategoryTag(creator.role);
            return (
              <motion.div
                key={creator.name}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="bg-white/70 border border-black/5 rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col group relative"
              >
                {/* Image Section */}
                <div className="relative aspect-square overflow-hidden bg-alabaster">
                  <img
                    src={creator.image}
                    alt={creator.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-black/5 flex items-center gap-1.5 text-[9px] font-sans font-bold tracking-wider text-champagne uppercase">
                    <Sparkles className="w-3 h-3 text-champagne" />
                    {catTag}
                  </div>
                  {creator.stats.verified && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-black/5 flex items-center gap-1 text-[9px] font-sans font-bold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100 text-emerald-600" />
                      VERIFIED STAR
                    </div>
                  )}

                  {/* Aesthetic quote swell */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 text-white text-center">
                    <p className="font-serif-text italic text-xs leading-relaxed mb-4">
                      "{creator.quote}"
                    </p>
                    <button
                      onClick={() => onSelectCreator(creator)}
                      className="mx-auto bg-[#FAF9F6] text-[#111] hover:bg-champagne hover:text-white font-sans text-[10px] tracking-widest font-bold px-4 py-2 rounded-lg uppercase transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> VIEW PROFILE
                    </button>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-sans text-[#888] font-semibold">
                      <span className="flex items-center gap-1 uppercase tracking-widest">
                        <MapPin className="w-3 h-3 text-champagne" /> {creator.city}, IN
                      </span>
                      <span>REACH: {creator.stats.reach}</span>
                    </div>
                    <h3 className="font-serif-display text-xl font-bold text-[#111]">
                      {creator.name}
                    </h3>
                    <p className="font-serif-text italic text-xs text-champagne">
                      {creator.role}
                    </p>
                    <p className="text-xs text-[#555] font-serif-text leading-relaxed line-clamp-2 mt-2">
                      {creator.bio}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] font-sans text-[#999] uppercase font-bold">ENGAGEMENT</span>
                      <span className="font-serif-display font-bold text-[#111] text-xs">
                        {creator.stats.engagement}
                      </span>
                    </div>
                    <button
                      onClick={() => onOpenCollaboration(creator.name)}
                      className="bg-[#111] hover:bg-[#222] text-[#FAF9F6] text-[9px] font-sans font-bold tracking-widest px-4 py-2 rounded-lg uppercase transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Send className="w-3 h-3 text-champagne" /> CHARTER DEAL
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/40 border border-black/5 rounded-3xl space-y-3">
          <p className="font-serif-text italic text-lg text-[#666]">
            No verified VIP matches found.
          </p>
          <p className="font-sans text-xs text-[#888]">
            Try adjusting your search filters or clearing the search box.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("All");
              setSelectedCity("All");
            }}
            className="mt-4 px-6 py-2.5 border border-black/15 bg-white text-[#222] text-xs font-sans tracking-wider rounded-lg uppercase hover:bg-[#F3F3F1] cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
