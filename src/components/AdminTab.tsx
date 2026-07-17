import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, User, LogIn, LayoutDashboard, Sparkles, Users, Briefcase, FileText, 
  Trash2, Plus, Edit2, Check, RefreshCw, X, AlertTriangle, Shield, CheckCircle2,
  TrendingUp, Phone, Mail, MapPin, Eye, FileSpreadsheet, Activity, UserPlus, Layout
} from "lucide-react";
import AdminContentManager from "./AdminContentManager";

interface Creator {
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

interface GallerySection {
  id: string;
  title: string;
  subtitle: string;
  creators: Creator[];
  zOffset: number;
  primaryColor: string;
}

interface Campaign {
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

interface Registration {
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

interface InfluencerApplication {
  id: string;
  name: string;
  category: string;
  role: string;
  city: string;
  image: string;
  bio: string;
  reach: string;
  engagement: string;
  portfolio: string[];
  quote: string;
  email: string;
  phone: string;
  status: "pending" | "approved" | "declined";
  timestamp: string;
}

interface AdminStats {
  creatorsCount: number;
  categoriesCount: number;
  campaignsCount: number;
  applicationsCount: number;
  estimatedRosterReach: string;
  logs: { id: string; timestamp: string; action: string; ip?: string }[];
}

export default function AdminTab() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Active sub-section within Admin Workspace (extended with dynamic settings modules)
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<string>("dashboard");

  // Admin Workspace Data
  const [stats, setStats] = useState<any | null>(null);
  const [sections, setSections] = useState<GallerySection[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [influencerApplications, setInfluencerApplications] = useState<InfluencerApplication[]>([]);

  // Enterprise Dynamic Settings Configuration State
  const [settings, setSettings] = useState({
    websiteTitle: "FSIA — Forever Star India Awards",
    heroTitle: "FOREVER STAR INDIA",
    heroSubtitle: "THE EXQUISITE HALL OF LUXURY INFLUENCING & PRESTIGE COUTURE",
    ctaText: "SECURE VIP RUNWAY ACCESS",
    footerText: "© 2026 FOREVER STAR INDIA AWARDS (FSIA). ALL RIGHTS RESERVED.",
    logoUrl: "",
    primaryColor: "#E1C699",
    secondaryColor: "#111111",
    geminiApiKey: "",
    aiSystemPrompt: "",
    modelSelection: "gemini-3.5-flash",
    temperature: 0.7,
    topK: 40
  });
  const [promptLogs, setPromptLogs] = useState<any[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsError, setSettingsError] = useState("");

  // CRUD Forms State
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState<{ sectionId: string; originalName: string; creator: Creator } | null>(null);
  const [creatorForm, setCreatorForm] = useState({
    sectionId: "miss-india",
    name: "",
    role: "",
    city: "Mumbai",
    image: "",
    bio: "",
    quote: "",
    reach: "1.2M",
    engagement: "6.5%",
    verified: true,
    portfolioUrls: ""
  });

  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    brand: "",
    title: "",
    niche: "High Fashion",
    budget: "₹3,00,000",
    requirements: "100K+ Reach",
    duration: "2 Weeks",
    location: "Mumbai",
    description: "",
    perk1: "",
    perk2: "",
    perk3: ""
  });

  const [crudError, setCrudError] = useState("");
  const [crudSuccess, setCrudSuccess] = useState("");

  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newCategorySubtitle, setNewCategorySubtitle] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#E1C699");
  const [categorySuccess, setCategorySuccess] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryTitle.trim()) return;
    setIsCreatingCategory(true);
    setCategorySuccess("");
    setCategoryError("");

    try {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newCategoryTitle,
          subtitle: newCategorySubtitle,
          primaryColor: newCategoryColor
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategorySuccess("Custom catwalk category successfully established!");
        setNewCategoryTitle("");
        setNewCategorySubtitle("");
        setNewCategoryColor("#E1C699");
        fetchAdminData(token);
        window.dispatchEvent(new Event("sections-updated"));
      } else {
        setCategoryError(data.error || "Failed to create category.");
      }
    } catch (err) {
      setCategoryError("Failed to reach administrative gateway.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Are you absolutely sure you want to delete this category? Deleting it will also archive all its associated 3D models.")) {
      return;
    }
    setCategorySuccess("");
    setCategoryError("");

    try {
      const res = await fetch(`/api/sections/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategorySuccess("Category successfully deleted from 3D catwalk.");
        fetchAdminData(token);
        window.dispatchEvent(new Event("sections-updated"));
      } else {
        setCategoryError(data.error || "Failed to delete category.");
      }
    } catch (err) {
      setCategoryError("Failed to reach administrative gateway.");
    }
  };

  // Check login on load
  useEffect(() => {
    const savedToken = localStorage.getItem("fsia_admin_token");
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
      fetchAdminData(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToken(data.token);
        localStorage.setItem("fsia_admin_token", data.token);
        setIsLoggedIn(true);
        fetchAdminData(data.token);
      } else {
        setLoginError(data.error || "Invalid administrative credentials.");
      }
    } catch (err) {
      setLoginError("Failed to communicate with FSIA Auth Service.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fsia_admin_token");
    setToken("");
    setIsLoggedIn(false);
    setStats(null);
  };

  const fetchAdminData = async (authToken: string) => {
    const headers = { "Authorization": `Bearer ${authToken}` };
    try {
      // 1. Fetch stats
      const statsRes = await fetch("/api/admin/stats", { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch creators (public route works fine)
      const creatorsRes = await fetch("/api/creators");
      if (creatorsRes.ok) {
        const creatorsData = await creatorsRes.json();
        setSections(creatorsData);
      }

      // 3. Fetch campaigns (public route works fine)
      const campaignsRes = await fetch("/api/campaigns");
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData);
      }

      // 4. Fetch registrations
      const registrationsRes = await fetch("/api/registrations", { headers });
      if (registrationsRes.ok) {
        const regsData = await registrationsRes.json();
        setRegistrations(regsData);
      }

      // 4A. Fetch influencer applications
      const infAppsRes = await fetch("/api/influencer-applications", { headers });
      if (infAppsRes.ok) {
        const infAppsData = await infAppsRes.json();
        setInfluencerApplications(infAppsData);
      }

      // 5. Fetch system settings
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }

      // 6. Fetch prompt logs
      const logsRes = await fetch("/api/prompt-logs", { headers });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setPromptLogs(logsData);
      }
    } catch (err) {
      console.error("Error loading administration data:", err);
    }
  };

  const approveInfluencerApplication = async (id: string) => {
    try {
      const res = await fetch(`/api/influencer-applications/${id}/approve`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchAdminData(token);
      } else {
        const err = await res.json();
        alert(err.error || "Approval failed.");
      }
    } catch (e) {
      alert("Failed to communicate with administration service.");
    }
  };

  const declineInfluencerApplication = async (id: string) => {
    try {
      const res = await fetch(`/api/influencer-applications/${id}/decline`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchAdminData(token);
      } else {
        const err = await res.json();
        alert(err.error || "Decline failed.");
      }
    } catch (e) {
      alert("Failed to communicate with administration service.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccess("");
    setSettingsError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsSuccess("Enterprise dynamic settings saved successfully!");
        setSettings(data.settings);
        fetchAdminData(token);
      } else {
        setSettingsError(data.error || "Failed to update dynamic configuration.");
      }
    } catch (err) {
      setSettingsError("Connection to dynamic administrative gateway failed.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ----------------------------------------------------
  // CREATORS CRUD METHODS
  // ----------------------------------------------------
  const openAddCreator = () => {
    setEditingCreator(null);
    setCreatorForm({
      sectionId: sections[0]?.id || "miss-india",
      name: "",
      role: "",
      city: "Mumbai",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format",
      bio: "",
      quote: "",
      reach: "1.2M",
      engagement: "6.5%",
      verified: true,
      portfolioUrls: ""
    });
    setCrudError("");
    setCrudSuccess("");
    setIsCreatorModalOpen(true);
  };

  const openEditCreator = (sectionId: string, creator: Creator) => {
    setEditingCreator({ sectionId, originalName: creator.name, creator });
    setCreatorForm({
      sectionId,
      name: creator.name,
      role: creator.role,
      city: creator.city,
      image: creator.image,
      bio: creator.bio,
      quote: creator.quote,
      reach: creator.stats.reach || "1.0M",
      engagement: creator.stats.engagement || "5.0%",
      verified: creator.stats.verified !== false,
      portfolioUrls: creator.portfolio && creator.portfolio.length > 0 ? creator.portfolio.join(", ") : creator.image
    });
    setCrudError("");
    setCrudSuccess("");
    setIsCreatorModalOpen(true);
  };

  const saveCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudError("");
    setCrudSuccess("");

    if (!creatorForm.name || !creatorForm.role || !creatorForm.bio) {
      setCrudError("Please fill out all mandatory fields.");
      return;
    }

    // Split portfolioUrls by comma and trim whitespace
    const urlsArray = creatorForm.portfolioUrls
      ? creatorForm.portfolioUrls.split(",").map(u => u.trim()).filter(Boolean)
      : [creatorForm.image];

    if (urlsArray.length === 0) {
      urlsArray.push(creatorForm.image);
    }

    const payload = {
      sectionId: creatorForm.sectionId,
      creator: {
        name: creatorForm.name,
        role: creatorForm.role,
        city: creatorForm.city,
        image: creatorForm.image,
        bio: creatorForm.bio,
        quote: creatorForm.quote || "Elegance is standard.",
        stats: {
          reach: creatorForm.reach,
          engagement: creatorForm.engagement,
          verified: creatorForm.verified
        },
        portfolio: urlsArray
      }
    };

    try {
      const isEdit = !!editingCreator;
      const url = "/api/creators";
      const method = isEdit ? "PUT" : "POST";

      const body = isEdit 
        ? JSON.stringify({
            sectionId: editingCreator.sectionId,
            originalName: editingCreator.originalName,
            updatedCreator: payload.creator
          })
        : JSON.stringify(payload);

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCrudSuccess(isEdit ? "Creator profile successfully updated!" : "New runway star successfully cataloged!");
        window.dispatchEvent(new Event("sections-updated"));
        setTimeout(() => {
          setIsCreatorModalOpen(false);
          fetchAdminData(token);
        }, 1200);
      } else {
        setCrudError(data.error || "Failed to commit creator to database.");
      }
    } catch (err) {
      setCrudError("Server interface failure. Unable to save creator.");
    }
  };

  const deleteCreator = async (sectionId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to completely expunge "${name}" from the FSIA runway database?`)) return;

    try {
      const res = await fetch(`/api/creators/${sectionId}/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchAdminData(token);
        window.dispatchEvent(new Event("sections-updated"));
      } else {
        alert(data.error || "Expulsion failure.");
      }
    } catch (err) {
      alert("Database link failure.");
    }
  };

  // ----------------------------------------------------
  // CAMPAIGNS CRUD METHODS
  // ----------------------------------------------------
  const openAddCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm({
      brand: "",
      title: "",
      niche: "High Fashion",
      budget: "₹4,00,000",
      requirements: "100K+ Reach",
      duration: "4 Weeks",
      location: "Mumbai",
      description: "",
      perk1: "Exclusive custom Sabyasachi outfit retention",
      perk2: "Digital cover photoshoot in Vogue India",
      perk3: "Direct VIP Escrow Payment"
    });
    setCrudError("");
    setCrudSuccess("");
    setIsCampaignModalOpen(true);
  };

  const openEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      brand: campaign.brand,
      title: campaign.title,
      niche: campaign.niche,
      budget: campaign.budget,
      requirements: campaign.requirements,
      duration: campaign.duration,
      location: campaign.location,
      description: campaign.description,
      perk1: campaign.perks[0] || "",
      perk2: campaign.perks[1] || "",
      perk3: campaign.perks[2] || ""
    });
    setCrudError("");
    setCrudSuccess("");
    setIsCampaignModalOpen(true);
  };

  const saveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudError("");
    setCrudSuccess("");

    if (!campaignForm.brand || !campaignForm.title || !campaignForm.description) {
      setCrudError("Please enter Brand, Title, and Description.");
      return;
    }

    const perks = [campaignForm.perk1, campaignForm.perk2, campaignForm.perk3].filter(p => !!p);

    const payload = {
      brand: campaignForm.brand,
      title: campaignForm.title,
      niche: campaignForm.niche,
      budget: campaignForm.budget,
      requirements: campaignForm.requirements,
      duration: campaignForm.duration,
      location: campaignForm.location,
      description: campaignForm.description,
      perks
    };

    try {
      const isEdit = !!editingCampaign;
      const url = isEdit ? `/api/campaigns/${editingCampaign.id}` : "/api/campaigns";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCrudSuccess(isEdit ? "Campaign requirements updated!" : "New Brand Campaign successfully launched!");
        setTimeout(() => {
          setIsCampaignModalOpen(false);
          fetchAdminData(token);
        }, 1200);
      } else {
        setCrudError(data.error || "Failed to commit campaign.");
      }
    } catch (err) {
      setCrudError("Failed to transmit campaign contract detail.");
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!window.confirm("Are you sure you want to completely archive this active brand contract campaign?")) return;

    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchAdminData(token);
      } else {
        alert(data.error || "Failed to delete.");
      }
    } catch (err) {
      alert("Network failure.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8" id="admin-panel-root">
      
      {/* 1. LOGIN GATE */}
      {!isLoggedIn ? (
        <div className="max-w-md mx-auto my-8 md:my-16" id="admin-login-card">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-md border border-black/5 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 text-center"
          >
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#111] text-champagne mx-auto flex items-center justify-center border border-champagne/20">
                <Shield className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="font-sans text-[10px] tracking-[0.3em] text-[#8E8D8A] uppercase font-bold">
                  FSIA Secure Portal
                </span>
                <h2 className="font-serif-display text-2xl font-bold text-[#111]">
                  VIP Administration
                </h2>
                <p className="font-serif-text italic text-xs text-[#666]">
                  Enter credential keys to manage elite models and brand sponsorships.
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 text-left">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[9px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                  Operator Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#888]" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g., admin"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-champagne"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
                  Administrative Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#888]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-champagne"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-xs tracking-[0.25em] font-bold py-4 rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-[#FAF9F6] rounded-full animate-spin" />
                ) : (
                  <>
                    SECURE INGRESS
                    <LogIn className="w-4 h-4 text-champagne" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-[10px] font-mono text-[#888]">
              Credentials Helper: Use <strong className="text-black">admin</strong> & <strong className="text-black">admin123</strong>
            </div>
          </motion.div>
        </div>
      ) : (
        
        /* 2. AUTHENTICATED WORKSPACE */
        <div className="space-y-6 md:space-y-8" id="admin-workspace">
          
          {/* Header row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-black/5 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-sans font-bold px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACTIVE CONTEXT
                </span>
                <span className="font-mono text-[10px] text-[#888]">TOKEN VERIFIED</span>
              </div>
              <h2 className="font-serif-display text-2xl font-bold text-[#111] tracking-tight">
                VIP Editorial Workspace
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => fetchAdminData(token)}
                className="p-2.5 rounded-lg border border-black/5 bg-white hover:bg-black/5 text-[#444] transition-colors cursor-pointer"
                title="Sync database tables"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-50 hover:bg-red-100 text-red-700 font-sans text-[10px] tracking-[0.1em] font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer border border-red-100"
              >
                SECURE SIGN OUT
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap md:flex-nowrap items-center gap-1.5 md:gap-2 border-b border-[#E1C699]/30 pb-1 w-full max-w-full overflow-x-auto scrollbar-thin">
            {[
              { id: "dashboard", label: "Overview", icon: LayoutDashboard },
              { id: "content_manager", label: "Content Studio", icon: Layout },
              { id: "content", label: "App Content & Style", icon: FileSpreadsheet },
              { id: "ai_config", label: "AI Config", icon: Sparkles },
              { id: "prompt_logs", label: "Prompt Logs", icon: Activity },
              { id: "creators", label: "Runway Models", icon: Users },
              { id: "campaigns", label: "Brand Contracts", icon: Briefcase },
              { id: "registrations", label: "VIP Applications", icon: FileText },
              { id: "influencer_applications", label: "Model Applicants", icon: UserPlus }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = adminActiveSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminActiveSubTab(tab.id)}
                  className={`px-2.5 md:px-4 py-2 md:py-2.5 rounded-t-xl text-[9px] md:text-xs font-sans font-bold tracking-widest uppercase transition-all flex items-center gap-1.5 md:gap-2 whitespace-nowrap cursor-pointer ${
                    active 
                      ? "bg-white border-t-2 border-champagne text-[#111] shadow-xs" 
                      : "text-[#666] hover:text-black hover:bg-black/[0.02]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${active ? "text-champagne" : "text-[#888]"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sub Tab Content Panels */}
          <div className="space-y-6">
            
            {/* A. DASHBOARD PANEL */}
            {adminActiveSubTab === "dashboard" && stats && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Statistics Cards */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white/60 p-5 rounded-2xl border border-black/5 shadow-xs space-y-1">
                      <Users className="w-5 h-5 text-champagne" />
                      <div className="text-2xl font-serif-display font-bold text-[#111]">{stats.creatorsCount}</div>
                      <div className="text-[10px] font-sans tracking-wider text-[#666] uppercase font-semibold">Runway Models</div>
                    </div>
                    <div className="bg-white/60 p-5 rounded-2xl border border-black/5 shadow-xs space-y-1">
                      <Briefcase className="w-5 h-5 text-champagne" />
                      <div className="text-2xl font-serif-display font-bold text-[#111]">{stats.campaignsCount}</div>
                      <div className="text-[10px] font-sans tracking-wider text-[#666] uppercase font-semibold">Brand Campaigns</div>
                    </div>
                    <div className="bg-white/60 p-5 rounded-2xl border border-black/5 shadow-xs space-y-1">
                      <FileText className="w-5 h-5 text-champagne" />
                      <div className="text-2xl font-serif-display font-bold text-[#111]">{stats.applicationsCount}</div>
                      <div className="text-[10px] font-sans tracking-wider text-[#666] uppercase font-semibold">Escrow Applications</div>
                    </div>
                    <div className="bg-white/60 p-5 rounded-2xl border border-black/5 shadow-xs space-y-1">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <div className="text-2xl font-serif-display font-bold text-[#111]">{stats.estimatedRosterReach}</div>
                      <div className="text-[10px] font-sans tracking-wider text-[#666] uppercase font-semibold">Total Audited Reach</div>
                    </div>
                    {/* Prompt logs count card */}
                    <div className="bg-white/60 p-5 rounded-2xl border border-black/5 shadow-xs space-y-1">
                      <Activity className="w-5 h-5 text-blue-500" />
                      <div className="text-2xl font-serif-display font-bold text-[#111]">{stats.totalPromptsCount !== undefined ? stats.totalPromptsCount : 0}</div>
                      <div className="text-[10px] font-sans tracking-wider text-[#666] uppercase font-semibold">Total Prompt Runs</div>
                    </div>
                    {/* API Success rate card */}
                    <div className="bg-white/60 p-5 rounded-2xl border border-black/5 shadow-xs space-y-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <div className="text-2xl font-serif-display font-bold text-[#111]">{stats.apiSuccessRate !== undefined ? stats.apiSuccessRate : 100}%</div>
                      <div className="text-[10px] font-sans tracking-wider text-[#666] uppercase font-semibold">API Success Rate</div>
                    </div>
                  </div>

                  {/* PHP MVC Architecture Announcement Callout */}
                  <div className="p-6 bg-champagne/10 border border-champagne/20 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-champagne font-bold font-sans text-xs uppercase tracking-widest">
                      <Shield className="w-4 h-4 text-champagne" />
                      PHP BACKEND CONVERSION FULLY ARCHITECTED
                    </div>
                    <p className="text-xs text-[#444] font-serif-text leading-relaxed">
                      This active full-stack panel communicates with local JSON storage in memory. The enterprise **PHP MVC blueprints (with raw PDO connections, prepared statements, MySQL relational schemas, and cURL-authenticated Gemini API request routing)** are completely compiled and exportable inside the <code>/php-mvc-blueprint/</code> directory of your codebase.
                    </p>
                  </div>
                </div>

                {/* Real-time System Audit Logs */}
                <div className="bg-white/70 p-5 rounded-2xl border border-black/5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-black/5 pb-2.5">
                    <Activity className="w-4 h-4 text-[#888]" />
                    <h3 className="font-serif-display text-sm font-bold text-[#111]">
                      System Audit Trail
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {stats.logs.map((log) => (
                      <div key={log.id} className="text-[11px] border-b border-black/[0.02] pb-2 space-y-1">
                        <div className="flex justify-between font-mono text-[9px] text-[#888]">
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span>IP: {log.ip || "127.0.0.1"}</span>
                        </div>
                        <p className="text-[#333] font-serif-text leading-tight">{log.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* NEW ENTERPRISE CONTENT STUDIO PANEL */}
            {adminActiveSubTab === "content_manager" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AdminContentManager token={token} onRefresh={() => fetchAdminData(token)} />
              </motion.div>
            )}

            {/* A1. PUBLIC CONTENT & APPEARANCE PANEL */}
            {adminActiveSubTab === "content" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-black/5 space-y-6"
              >
                <div className="border-b border-black/5 pb-3">
                  <h3 className="font-serif-display text-lg font-bold text-[#111]">Public Content & Appearance Settings</h3>
                  <p className="text-xs text-[#666] font-serif-text">Control every public text element and color palette dynamically in real-time without editing any code.</p>
                </div>

                {settingsSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg font-semibold">{settingsSuccess}</div>}
                {settingsError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-semibold">{settingsError}</div>}

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase block">Website Brand Title</label>
                      <input 
                        type="text" 
                        required
                        value={settings.websiteTitle} 
                        onChange={(e) => setSettings(prev => ({ ...prev, websiteTitle: e.target.value }))} 
                        className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-xs" 
                        placeholder="FSIA — Forever Star India Awards" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase block">Logo URL (Optional)</label>
                      <input 
                        type="text" 
                        value={settings.logoUrl} 
                        onChange={(e) => setSettings(prev => ({ ...prev, logoUrl: e.target.value }))} 
                        className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-xs" 
                        placeholder="e.g. https://domain.com/logo.png" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase block">Hero Display Title</label>
                      <input 
                        type="text" 
                        required
                        value={settings.heroTitle} 
                        onChange={(e) => setSettings(prev => ({ ...prev, heroTitle: e.target.value }))} 
                        className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-xs" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase block">CTA Call-To-Action Button Text</label>
                      <input 
                        type="text" 
                        required
                        value={settings.ctaText} 
                        onChange={(e) => setSettings(prev => ({ ...prev, ctaText: e.target.value }))} 
                        className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-xs" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase block">Hero Subtitle Text</label>
                    <textarea 
                      rows={2} 
                      required
                      value={settings.heroSubtitle} 
                      onChange={(e) => setSettings(prev => ({ ...prev, heroSubtitle: e.target.value }))} 
                      className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-xs resize-none" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase block">Footer Copyright Notice</label>
                    <input 
                      type="text" 
                      required
                      value={settings.footerText} 
                      onChange={(e) => setSettings(prev => ({ ...prev, footerText: e.target.value }))} 
                      className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-xs" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-black/5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase block">Primary Accent Theme Color</label>
                      <div className="flex gap-3 items-center">
                        <input 
                          type="color" 
                          value={settings.primaryColor || "#E1C699"} 
                          onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))} 
                          className="w-12 h-10 p-0 border border-black/10 rounded-lg cursor-pointer bg-transparent" 
                        />
                        <input 
                          type="text" 
                          value={settings.primaryColor} 
                          onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))} 
                          className="w-full px-4 py-2 bg-white border border-black/10 rounded-lg text-xs font-mono" 
                          placeholder="#E1C699" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase block">Secondary Theme Color (Backgrounds/Accents)</label>
                      <div className="flex gap-3 items-center">
                        <input 
                          type="color" 
                          value={settings.secondaryColor || "#111111"} 
                          onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))} 
                          className="w-12 h-10 p-0 border border-black/10 rounded-lg cursor-pointer bg-transparent" 
                        />
                        <input 
                          type="text" 
                          value={settings.secondaryColor} 
                          onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))} 
                          className="w-full px-4 py-2 bg-white border border-black/10 rounded-lg text-xs font-mono" 
                          placeholder="#111111" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/5 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={isSavingSettings} 
                      className="bg-[#111] hover:bg-[#222] text-white font-sans text-xs tracking-widest font-bold px-6 py-3 rounded-xl uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingSettings ? (
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      ) : (
                        <>
                          SAVE CONTENT CONFIGURATION
                          <Check className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* DYNAMIC CATWALK CATEGORY MANAGER CARD */}
                <div className="border-t border-black/5 pt-6 mt-6 space-y-6">
                  <div className="border-b border-black/5 pb-3">
                    <h3 className="font-serif-display text-lg font-bold text-[#111]">Manage 3D Catwalk Categories</h3>
                    <p className="text-xs text-[#666] font-serif-text">Create, customize, and remove high-fashion catwalk categories. These sections will automatically render dynamically in real-time on the 3D Catwalk tab.</p>
                  </div>

                  {categorySuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg font-semibold">{categorySuccess}</div>}
                  {categoryError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-semibold">{categoryError}</div>}

                  {/* Add Category Form */}
                  <form onSubmit={handleAddCategory} className="bg-white/50 p-5 rounded-xl border border-black/5 space-y-4">
                    <h4 className="text-xs font-sans font-bold text-[#111] uppercase tracking-wider">Create Custom Category</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-sans font-bold text-[#666] uppercase">Category Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Forever Teen India 2026"
                          value={newCategoryTitle}
                          onChange={(e) => setNewCategoryTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-sans font-bold text-[#666] uppercase">Category Subtitle</label>
                        <input
                          type="text"
                          placeholder="e.g. Celebrating Youthful Glamour and Poise"
                          value={newCategorySubtitle}
                          onChange={(e) => setNewCategorySubtitle(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 pt-2">
                      <div className="space-y-1 w-full sm:w-auto">
                        <label className="text-[9px] font-sans font-bold text-[#666] uppercase block">Primary Accent Theme Color</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={newCategoryColor}
                            onChange={(e) => setNewCategoryColor(e.target.value)}
                            className="w-10 h-8 p-0 border border-black/10 rounded-md cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={newCategoryColor}
                            onChange={(e) => setNewCategoryColor(e.target.value)}
                            className="w-24 px-2 py-1 bg-white border border-black/10 rounded-md text-xs font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isCreatingCategory || !newCategoryTitle}
                        className="bg-[#111] hover:bg-[#222] text-white font-sans text-xs tracking-widest font-bold px-5 py-2 rounded-lg uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4 text-champagne" />
                        ESTABLISH CATEGORY
                      </button>
                    </div>
                  </form>

                  {/* Categories List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-sans font-bold text-[#111] uppercase tracking-wider">Active Runway Categories ({sections.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sections.map((sec) => (
                        <div key={sec.id} className="bg-white border border-black/5 p-4 rounded-xl flex items-center justify-between gap-4 shadow-2xs hover:border-[#111]/15 transition-all">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-serif-display text-sm font-bold text-[#111] truncate">{sec.title}</span>
                              <span 
                                className="w-2.5 h-2.5 rounded-full border border-black/5 shadow-2xs"
                                style={{ backgroundColor: sec.primaryColor }}
                                title={`Theme Color: ${sec.primaryColor}`}
                              />
                            </div>
                            <p className="text-[10px] text-[#888] truncate">{sec.subtitle || "No Subtitle"}</p>
                            <div className="flex items-center gap-2 pt-1 font-mono text-[9px] text-[#666]">
                              <span className="bg-[#FAF9F6] px-1.5 py-0.5 rounded border border-black/5 uppercase">ID: {sec.id}</span>
                              <span className="bg-[#FAF9F6] px-1.5 py-0.5 rounded border border-black/5">{sec.creators?.length || 0} Models</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteCategory(sec.id)}
                            className="p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100 flex-shrink-0"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* A2. AI CONFIGURATION PANEL */}
            {adminActiveSubTab === "ai_config" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-black/5 space-y-6"
              >
                <div className="border-b border-black/5 pb-3">
                  <h3 className="font-serif-display text-lg font-bold text-[#111]">Gemini AI Gateway Settings</h3>
                  <p className="text-xs text-[#666] font-serif-text">Configure server-side secure credentials, master system prompts, temperature sliders, and parameters for the AI pitch optimization engine.</p>
                </div>

                {settingsSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg font-semibold">{settingsSuccess}</div>}
                {settingsError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-semibold">{settingsError}</div>}

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase block">Secure Gemini API Key</label>
                    <input 
                      type="password" 
                      value={settings.geminiApiKey} 
                      onChange={(e) => setSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))} 
                      className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-xs font-mono" 
                      placeholder="Paste your Gemini API key (routed securely server-side)" 
                    />
                    <p className="text-[10px] text-[#888] italic">Note: Your API key is safely routed via server endpoints and is never exposed to public browser client sessions.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase block">Model Selection Selection</label>
                      <select 
                        value={settings.modelSelection || "gemini-3.5-flash"} 
                        onChange={(e) => setSettings(prev => ({ ...prev, modelSelection: e.target.value }))} 
                        className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-xs"
                      >
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Ultra-fast & Efficient)</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro (Elite Complex Reasoning)</option>
                        <option value="gemini-3.5-flash">gemini-3.5-flash (Latest General Public Beta)</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro (Legacy Stable Core)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase block">Model Temperature ({settings.temperature !== undefined ? settings.temperature : 0.7})</label>
                      <div className="flex gap-4 items-center pt-2">
                        <span className="text-[10px] font-sans text-[#888]">Precise (0.0)</span>
                        <input 
                          type="range" 
                          min="0.0" 
                          max="1.0" 
                          step="0.1" 
                          value={settings.temperature !== undefined ? settings.temperature : 0.7} 
                          onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))} 
                          className="w-full accent-[#E1C699]" 
                        />
                        <span className="text-[10px] font-sans text-[#888]">Creative (1.0)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-bold tracking-wider text-[#666] uppercase block">System Instructions / Master Prompt Guidelines</label>
                    <textarea 
                      rows={6} 
                      required
                      value={settings.aiSystemPrompt} 
                      onChange={(e) => setSettings(prev => ({ ...prev, aiSystemPrompt: e.target.value }))} 
                      className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-xs leading-relaxed font-sans" 
                      placeholder="Describe how the AI should rewrite and optimize user brand pitches..." 
                    />
                  </div>

                  <div className="pt-3 border-t border-black/5 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={isSavingSettings} 
                      className="bg-[#111] hover:bg-[#222] text-white font-sans text-xs tracking-widest font-bold px-6 py-3 rounded-xl uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingSettings ? (
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      ) : (
                        <>
                          SAVE AI CONFIGURATION
                          <Check className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* A3. PROMPT history LOGS PANEL */}
            {adminActiveSubTab === "prompt_logs" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-black/5">
                  <div className="border-b border-black/5 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-serif-display text-lg font-bold text-[#111]">AI Prompt Gateway History Logs</h3>
                      <p className="text-xs text-[#666] font-serif-text">Audit every prompt query submitted by designers and optimized results processed server-side by the Gemini engine.</p>
                    </div>
                    <span className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-mono border border-blue-100">{promptLogs.length} LOGS RECORDED</span>
                  </div>
                  
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-black/5 text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase">
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">AI Model</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Prompt Context / AI Curation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.03]">
                        {promptLogs.map((log: any) => (
                          <tr key={log.id} className="text-xs hover:bg-black/[0.01]">
                            <td className="py-4 px-4 font-mono text-[10px] text-[#888] whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString("en-IN", { hour12: true })}
                            </td>
                            <td className="py-4 px-4">
                              <span className="bg-black/5 border border-black/5 px-2 py-0.5 rounded text-[10px] font-mono text-black">{log.modelUsed}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-sans uppercase font-bold ${log.status === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 max-w-md">
                              <div className="space-y-2">
                                <div className="p-2.5 bg-black/[0.02] rounded-lg border border-black/[0.03] text-[11px] font-serif-text text-[#555]">
                                  <strong className="text-[9px] font-sans text-black uppercase font-bold tracking-wider block mb-1">USER PROMPT CONTENT:</strong>
                                  {log.userPrompt}
                                </div>
                                <div className="p-2.5 bg-champagne/[0.03] rounded-lg border border-champagne/10 text-[11px] font-serif-text text-black">
                                  <strong className="text-[9px] font-sans text-champagne uppercase font-bold tracking-wider block mb-1">GENERATED HARMONIC CURATION:</strong>
                                  <div className="whitespace-pre-wrap leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">{log.aiResponse}</div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {promptLogs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-xs text-[#888] italic font-serif-text">
                              No AI prompts have been processed through the gateway yet. Enter campaigns to log dynamic API activity.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* B. CREATORS CRUD MANAGER */}
            {adminActiveSubTab === "creators" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-white/40 p-4 rounded-xl border border-black/5">
                  <div className="text-xs text-[#666] font-serif-text">
                    Add, modify, or expunge model rosters walking the 3D couture catwalk.
                  </div>
                  <button
                    onClick={openAddCreator}
                    className="bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-[10px] tracking-widest font-bold py-2 px-4 rounded-lg uppercase flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-champagne" /> Catalog Model
                  </button>
                </div>

                {/* Creators Table grouped by runway sections */}
                <div className="space-y-6">
                  {sections.map((section, sIdx) => (
                    <div key={`${section.id}-${sIdx}`} className="bg-white/60 rounded-2xl border border-black/5 overflow-hidden">
                      <div className="px-5 py-3.5 bg-[#F4F3F0] border-b border-black/5 flex justify-between items-center">
                        <div>
                          <h4 className="font-serif-display text-sm font-bold text-[#111]">{section.title}</h4>
                          <span className="text-[9px] text-[#888] tracking-widest uppercase font-mono">{section.subtitle}</span>
                        </div>
                        <span className="text-[9px] font-mono text-[#888] bg-white border border-black/5 px-2.5 py-1 rounded-full">
                          Z_OFFSET: {section.zOffset}m
                        </span>
                      </div>

                      <div className="divide-y divide-black/5">
                        {section.creators.map((c, cIdx) => (
                          <div key={`${c.name}-${cIdx}`} className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                              <img src={c.image} alt={c.name} className="w-12 h-12 rounded-xl object-cover border border-black/5" />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-serif-display text-sm font-bold text-[#111]">{c.name}</h5>
                                  {c.stats.verified && (
                                    <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-sans uppercase font-bold">Verified</span>
                                  )}
                                </div>
                                <p className="text-[11px] font-sans text-[#666]">{c.role} — <span className="italic">{c.city}</span></p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right hidden md:block">
                                <div className="text-xs font-mono font-bold">{c.stats.reach}</div>
                                <div className="text-[9px] text-[#888] tracking-wider uppercase font-semibold">Reach / {c.stats.engagement} ER</div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => openEditCreator(section.id, c)}
                                  className="p-2 rounded-lg border border-black/5 bg-white hover:bg-black/5 text-[#444] cursor-pointer"
                                  title="Edit profile"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteCreator(section.id, c.name)}
                                  className="p-2 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                                  title="Expunge Model"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {section.creators.length === 0 && (
                          <div className="p-8 text-center text-xs text-[#888] font-serif-text italic">
                            No model portfolios registered under this section.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* C. CAMPAIGNS MANAGER */}
            {adminActiveSubTab === "campaigns" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-white/40 p-4 rounded-xl border border-black/5">
                  <div className="text-xs text-[#666] font-serif-text">
                    Define active brand contract thresholds and digital parameters.
                  </div>
                  <button
                    onClick={openAddCampaign}
                    className="bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-[10px] tracking-widest font-bold py-2 px-4 rounded-lg uppercase flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-champagne" /> Draft Campaign
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campaigns.map((camp) => (
                    <div key={camp.id} className="bg-white/60 p-5 rounded-2xl border border-black/5 flex flex-col justify-between space-y-4 shadow-xs">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-sans text-champagne font-bold tracking-widest uppercase block">{camp.brand}</span>
                            <h4 className="font-serif-display text-sm font-bold text-[#111] mt-0.5">{camp.title}</h4>
                          </div>
                          <span className="bg-white border border-black/5 text-[#111] text-[9px] font-sans font-bold px-2.5 py-1 rounded">
                            {camp.budget}
                          </span>
                        </div>
                        <p className="text-xs text-[#555] font-serif-text line-clamp-2 leading-relaxed">{camp.description}</p>
                      </div>

                      <div className="pt-3 border-t border-black/5 flex justify-between items-center">
                        <span className="text-[9px] font-mono text-[#888] uppercase">DURATION: {camp.duration}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditCampaign(camp)}
                            className="p-2 rounded-lg border border-black/5 bg-white hover:bg-black/5 text-[#444] cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteCampaign(camp.id)}
                            className="p-2 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* D. VIP APPLICATIONS / MEMBERSHIP PANEL */}
            {adminActiveSubTab === "registrations" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="bg-white/60 rounded-2xl border border-black/5 overflow-hidden">
                  <div className="px-5 py-4 bg-[#F4F3F0] border-b border-black/5 flex items-center justify-between">
                    <div>
                      <h4 className="font-serif-display text-sm font-bold text-[#111]">VIP Escrow Curation Applications</h4>
                      <p className="text-[9px] text-[#888] uppercase tracking-wider font-mono">Secured applications arriving via Client Charter gateways</p>
                    </div>
                    <span className="bg-champagne/15 text-champagne border border-champagne text-[10px] font-sans font-bold px-3 py-1 rounded-full">
                      {registrations.length} APPLICATIONS
                    </span>
                  </div>

                  <div className="divide-y divide-black/5">
                    {registrations.map((reg) => (
                      <div key={reg.id} className="p-5 space-y-4 hover:bg-white/20 transition-all">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#111]">{reg.bookingId}</span>
                              <span className="text-[10px] bg-champagne/10 text-champagne border border-champagne/20 px-2 py-0.5 rounded font-sans font-semibold">
                                ESCROW ACTIVE
                              </span>
                            </div>
                            <h5 className="font-serif-display text-base font-bold text-black">{reg.brandName}</h5>
                          </div>
                          
                          <div className="text-left md:text-right font-mono text-[10px] text-[#666]">
                            <div>Budget: <strong className="text-black font-semibold">{reg.budget}</strong></div>
                            <div>Applied: {reg.timestamp}</div>
                          </div>
                        </div>

                        {/* Submission Metadata details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/45 p-3.5 rounded-xl border border-black/[0.03] text-xs font-serif-text">
                          <div className="space-y-1">
                            <span className="text-[8px] font-sans font-bold tracking-wider text-[#888] uppercase block">TARGET CREATOR</span>
                            <div className="flex items-center gap-1.5 font-sans font-semibold text-black">
                              <Users className="w-3.5 h-3.5 text-champagne" />
                              {reg.creatorName}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-sans font-bold tracking-wider text-[#888] uppercase block">CONTACT CHANNELS</span>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-black">
                                <Mail className="w-3.5 h-3.5 text-[#888]" /> {reg.contactEmail}
                              </div>
                              <div className="flex items-center gap-1.5 text-black">
                                <Phone className="w-3.5 h-3.5 text-[#888]" /> {reg.contactPhone}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-sans font-bold tracking-wider text-[#888] uppercase block">CURRENCY & LOCATION</span>
                            <div>
                              <div className="flex items-center gap-1.5 text-black">
                                <MapPin className="w-3.5 h-3.5 text-[#888]" /> {reg.clientCity}
                              </div>
                              {reg.gstin && (
                                <div className="text-[10px] text-[#888] font-mono">GSTIN: {reg.gstin}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center font-mono text-[9px] text-[#888]">
                          <span>VERIFICATION HASH: <code className="text-[#444] bg-white px-1.5 py-0.5 rounded border border-black/5">{reg.verificationHash}</code></span>
                          {reg.scope && (
                            <span className="font-serif-text italic text-[#666]">Scope: {reg.scope} ({reg.duration || "3 Months"})</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {registrations.length === 0 && (
                      <div className="p-12 text-center text-xs text-[#888] font-serif-text italic">
                        No client escrow collaboration proposals received yet.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* E. INFLUENCER / MODEL APPLICATIONS PANEL */}
            {adminActiveSubTab === "influencer_applications" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Metrics bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/60 p-4 rounded-xl border border-black/5 shadow-xs">
                    <span className="text-[9px] text-[#888] uppercase tracking-wider font-sans font-bold block">Total Applications</span>
                    <strong className="text-xl font-bold text-[#111]">{influencerApplications.length}</strong>
                  </div>
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 shadow-xs">
                    <span className="text-[9px] text-amber-700 uppercase tracking-wider font-sans font-bold block">Pending Audit</span>
                    <strong className="text-xl font-bold text-amber-700">
                      {influencerApplications.filter(a => a.status === "pending").length}
                    </strong>
                  </div>
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 shadow-xs">
                    <span className="text-[9px] text-emerald-700 uppercase tracking-wider font-sans font-bold block">Approved & Rostered</span>
                    <strong className="text-xl font-bold text-emerald-700">
                      {influencerApplications.filter(a => a.status === "approved").length}
                    </strong>
                  </div>
                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-100/50 shadow-xs">
                    <span className="text-[9px] text-red-700 uppercase tracking-wider font-sans font-bold block">Declined</span>
                    <strong className="text-xl font-bold text-red-700">
                      {influencerApplications.filter(a => a.status === "declined").length}
                    </strong>
                  </div>
                </div>

                <div className="bg-white/60 rounded-2xl border border-black/5 overflow-hidden">
                  <div className="px-5 py-4 bg-[#F4F3F0] border-b border-black/5 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="font-serif-display text-sm font-bold text-[#111]">Runway Model Applicants</h4>
                      <p className="text-[9px] text-[#888] uppercase tracking-wider font-mono">Approve submitted registrations to directly deploy them into the 3D catwalk and directory roster</p>
                    </div>
                  </div>

                  <div className="divide-y divide-black/5">
                    {influencerApplications.map((app) => (
                      <div key={app.id} className="p-5 space-y-4 hover:bg-white/20 transition-all text-left">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-black/5 shrink-0 bg-gray-100">
                              <img src={app.image} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-serif-display text-base font-bold text-black">{app.name}</h5>
                                <span className={`text-[8px] font-sans font-bold px-2 py-0.5 rounded border uppercase ${
                                  app.status === "approved" 
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                    : app.status === "declined"
                                      ? "bg-red-50 text-red-600 border-red-100"
                                      : "bg-amber-50 text-amber-600 border-amber-100"
                                }`}>
                                  {app.status === "approved" ? "APPROVED & ROSTERED" : app.status === "declined" ? "DECLINED" : "PENDING AUDIT"}
                                </span>
                              </div>
                              <p className="text-xs text-[#666] font-sans">
                                {app.role} • <span className="font-semibold text-champagne">{app.category}</span> • <span className="italic">{app.city}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-left md:text-right">
                              <span className="text-[8px] font-sans font-bold text-[#888] uppercase block">AUDITED METRICS</span>
                              <div className="text-xs font-mono font-bold text-black">
                                {app.reach} Followers / {app.engagement} ER
                              </div>
                            </div>

                            {app.status === "pending" && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => approveInfluencerApplication(app.id)}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-sans text-[10px] font-bold uppercase rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Approve and publish to 3D Runway"
                                >
                                  <Check className="w-3.5 h-3.5" /> APPROVE
                                </button>
                                <button
                                  onClick={() => declineInfluencerApplication(app.id)}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-sans text-[10px] font-bold uppercase rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Decline request"
                                >
                                  <X className="w-3.5 h-3.5" /> DECLINE
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Additional applicant metadata & pitch */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FAF9F6] p-4 rounded-xl border border-black/[0.02]">
                          <div className="space-y-2">
                            <div>
                              <span className="text-[8px] font-sans font-bold tracking-wider text-[#888] uppercase block">BIOGRAPHY & PITCH</span>
                              <p className="text-xs text-[#555] font-serif-text leading-relaxed mt-0.5">{app.bio}</p>
                            </div>
                            {app.quote && (
                              <div className="border-l-2 border-champagne pl-2.5 py-0.5 italic text-xs text-[#666] font-serif-text">
                                "{app.quote}"
                              </div>
                            )}
                          </div>

                          <div className="space-y-3 font-serif-text text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[8px] font-sans font-bold tracking-wider text-[#888] uppercase block">EMAIL CONTACT</span>
                                <a href={`mailto:${app.email}`} className="text-black hover:underline flex items-center gap-1 font-sans font-semibold mt-0.5">
                                  <Mail className="w-3.5 h-3.5 text-[#888]" /> {app.email}
                                </a>
                              </div>
                              <div>
                                <span className="text-[8px] font-sans font-bold tracking-wider text-[#888] uppercase block">PHONE CONTACT</span>
                                <a href={`tel:${app.phone}`} className="text-black hover:underline flex items-center gap-1 font-sans font-semibold mt-0.5">
                                  <Phone className="w-3.5 h-3.5 text-[#888]" /> {app.phone}
                                </a>
                              </div>
                            </div>

                            {app.portfolio && app.portfolio.length > 0 && (
                              <div>
                                <span className="text-[8px] font-sans font-bold tracking-wider text-[#888] uppercase block mb-1">SUBMITTED PORTFOLIO</span>
                                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                  {app.portfolio.map((img, i) => (
                                    <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="relative w-12 h-16 rounded overflow-hidden border border-black/5 bg-gray-50 flex-shrink-0 group">
                                      <img src={img} alt={`Portfolio ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye className="w-3.5 h-3.5 text-white" />
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-[9px] font-mono text-[#888] text-right">
                          RECEIVED VIA PUBLIC PORTAL: {app.timestamp}
                        </div>
                      </div>
                    ))}

                    {influencerApplications.length === 0 && (
                      <div className="p-12 text-center text-xs text-[#888] font-serif-text italic">
                        No public model registration requests submitted yet.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* 3. CREATOR MODAL WINDOW */}
      {/* ==================================================== */}
      <AnimatePresence>
        {isCreatorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FAF9F6] border border-black/10 rounded-2xl p-6 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <h3 className="font-serif-display text-lg font-bold text-black">
                  {editingCreator ? "Modify Roster Portfolio" : "Register New Model to Catwalk"}
                </h3>
                <button onClick={() => setIsCreatorModalOpen(false)} className="p-1.5 rounded-full hover:bg-black/5 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {crudError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-semibold">
                  {crudError}
                </div>
              )}

              {crudSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">
                  {crudSuccess}
                </div>
              )}

              <form onSubmit={saveCreator} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Target Category</label>
                    <select
                      value={creatorForm.sectionId}
                      disabled={!!editingCreator}
                      onChange={(e) => setCreatorForm(prev => ({ ...prev, sectionId: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                    >
                      {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Kareena Kapoor"
                      value={creatorForm.name}
                      onChange={(e) => setCreatorForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:border-champagne"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Official Runway Role</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Winner, Forever Miss India 2026"
                      value={creatorForm.role}
                      onChange={(e) => setCreatorForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:border-champagne"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Couture Base City</label>
                    <input
                      type="text"
                      placeholder="e.g., Mumbai"
                      value={creatorForm.city}
                      onChange={(e) => setCreatorForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:border-champagne"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-[#666] uppercase">High Resolution Image URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    value={creatorForm.image}
                    onChange={(e) => setCreatorForm(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:border-champagne font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Couture Lookbook Portfolio Image URLs (Comma Separated)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. https://images.unsplash.com/photo-1, https://images.unsplash.com/photo-2"
                    value={creatorForm.portfolioUrls}
                    onChange={(e) => setCreatorForm(prev => ({ ...prev, portfolioUrls: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:border-champagne font-mono"
                  />
                  <p className="text-[9px] text-[#8e8d8a] leading-none mt-0.5">
                    Paste multiple high-res image URLs separated by commas to populate the lookbook sliding reels on the Catwalk 3D tab detail panel.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Audited Reach</label>
                    <input
                      type="text"
                      placeholder="e.g., 1.5M"
                      value={creatorForm.reach}
                      onChange={(e) => setCreatorForm(prev => ({ ...prev, reach: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Engagement Rate</label>
                    <input
                      type="text"
                      placeholder="e.g., 6.8%"
                      value={creatorForm.engagement}
                      onChange={(e) => setCreatorForm(prev => ({ ...prev, engagement: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1 pt-6 text-left">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={creatorForm.verified}
                        onChange={(e) => setCreatorForm(prev => ({ ...prev, verified: e.target.checked }))}
                        className="rounded accent-[#E1C699]"
                      />
                      <span className="text-[10px] font-sans font-bold text-[#444] uppercase">VERIFIED</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Biography Curation Narrative</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe their runway presence, past campaigns, and social advocacy."
                    value={creatorForm.bio}
                    onChange={(e) => setCreatorForm(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:border-champagne font-serif-text"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Signature Editorial Quote</label>
                  <input
                    type="text"
                    placeholder="Signature design quote or professional ethos..."
                    value={creatorForm.quote}
                    onChange={(e) => setCreatorForm(prev => ({ ...prev, quote: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:border-champagne font-serif-text"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-xs tracking-widest font-bold py-3.5 rounded-lg uppercase cursor-pointer"
                >
                  {editingCreator ? "Update Catalog Entry" : "Launch Creator to Runway"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* 4. CAMPAIGN MODAL WINDOW */}
      {/* ==================================================== */}
      <AnimatePresence>
        {isCampaignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FAF9F6] border border-black/10 rounded-2xl p-6 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <h3 className="font-serif-display text-lg font-bold text-black">
                  {editingCampaign ? "Modify Sponsorship Contract" : "Register Brand Campaign Partnership"}
                </h3>
                <button onClick={() => setIsCampaignModalOpen(false)} className="p-1.5 rounded-full hover:bg-black/5 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {crudError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-semibold">
                  {crudError}
                </div>
              )}

              {crudSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">
                  {crudSuccess}
                </div>
              )}

              <form onSubmit={saveCampaign} className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Brand Partner</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Sabyasachi Heritage"
                      value={campaignForm.brand}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Campaign Headline</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Autumn Bridal Collection"
                      value={campaignForm.title}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Budget Bracket</label>
                    <input
                      type="text"
                      placeholder="e.g., ₹4,00,000"
                      value={campaignForm.budget}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g., 3 Weeks"
                      value={campaignForm.duration}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Location</label>
                    <input
                      type="text"
                      placeholder="e.g., Mumbai"
                      value={campaignForm.location}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Niche Focus</label>
                    <input
                      type="text"
                      placeholder="e.g., Royal Couture"
                      value={campaignForm.niche}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, niche: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Minimum Audience Requirement</label>
                    <input
                      type="text"
                      placeholder="e.g., 100K+ Reach"
                      value={campaignForm.requirements}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, requirements: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold text-[#666] uppercase">Campaign Outline Brief</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the campaign terms, requirements, aesthetics and creative scope."
                    value={campaignForm.description}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs font-serif-text focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-sans font-bold text-[#666] uppercase block">VIP Compensation Perks (Up to 3)</label>
                  <input
                    type="text"
                    placeholder="Perk 1: e.g. Keep custom bespoke couture"
                    value={campaignForm.perk1}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, perk1: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Perk 2: e.g. Vogue editorial cover page"
                    value={campaignForm.perk2}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, perk2: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Perk 3: e.g. Long term ambassador retainer contract"
                    value={campaignForm.perk3}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, perk3: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-xs tracking-widest font-bold py-3.5 rounded-lg uppercase cursor-pointer"
                >
                  {editingCampaign ? "Update Sponsorship Contract" : "Activate Campaign Contract"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
