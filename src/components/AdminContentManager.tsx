import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Edit2, Trash2, Check, X, Layout, Briefcase, Award, Star, Shield, Sparkles, AlertTriangle
} from "lucide-react";
import { toast } from "react-hot-toast";

interface AdminContentManagerProps {
  token: string;
  onRefresh?: () => void;
}

interface GallerySection {
  id: string;
  title: string;
  subtitle: string;
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

interface MembershipPlan {
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

const ICON_OPTIONS = ["Star", "Shield", "Award", "Sparkles"];

export default function AdminContentManager({ token, onRefresh }: AdminContentManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"sections" | "campaigns" | "plans">("sections");
  
  // Data lists
  const [sections, setSections] = useState<GallerySection[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  
  // Loading & Message state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Section Form state
  const [sectionForm, setSectionForm] = useState({
    title: "",
    subtitle: "",
    primaryColor: "#E1C699"
  });

  // Campaign Form state
  const [campaignForm, setCampaignForm] = useState({
    brand: "",
    title: "",
    niche: "",
    budget: "",
    requirements: "",
    duration: "",
    location: "",
    perksString: "",
    description: ""
  });

  // Membership Plan Form state
  const [planForm, setPlanForm] = useState({
    name: "",
    badge: "",
    price: "",
    period: "",
    accent: "#E1C699",
    icon: "Star",
    perksString: "",
    popular: false
  });

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  // Fetch all content lists
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Sections
      const secRes = await fetch("/api/sections");
      if (secRes.ok) {
        const secData = await secRes.json();
        setSections(secData);
      }

      // 2. Campaigns
      const campRes = await fetch("/api/campaigns");
      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaigns(campData);
      }

      // 3. Membership plans
      const planRes = await fetch("/api/membership-plans");
      if (planRes.ok) {
        const planData = await planRes.json();
        setPlans(planData);
      }
    } catch (err: any) {
      setError("Failed to synchronize manager with enterprise database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const triggerNotification = (type: "success" | "error", message: string) => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const handleResetForms = () => {
    setIsEditing(false);
    setEditingId(null);
    setSectionForm({
      title: "",
      subtitle: "",
      primaryColor: "#E1C699"
    });
    setCampaignForm({
      brand: "",
      title: "",
      niche: "",
      budget: "",
      requirements: "",
      duration: "",
      location: "",
      perksString: "",
      description: ""
    });
    setPlanForm({
      name: "",
      badge: "",
      price: "",
      period: "",
      accent: "#E1C699",
      icon: "Star",
      perksString: "",
      popular: false
    });
  };

  // ---------------------------------------------------------------------------
  // CATWALK SECTIONS CRUD ACTIONS
  // ---------------------------------------------------------------------------
  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url = isEditing ? `/api/sections/${editingId}` : "/api/sections";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(sectionForm)
      });

      const data = await res.json();
      if (res.ok) {
        triggerNotification("success", `Catwalk Section successfully ${isEditing ? "modified" : "published"}.`);
        handleResetForms();
        fetchAllData();
        if (onRefresh) onRefresh();
        window.dispatchEvent(new Event("sections-updated"));
      } else {
        triggerNotification("error", data.error || "Execution error encountered.");
      }
    } catch (err: any) {
      triggerNotification("error", "Failed to communicate with catwalk services.");
    } finally {
      setLoading(false);
    }
  };

  const startEditSection = (section: GallerySection) => {
    setIsEditing(true);
    setEditingId(section.id);
    setSectionForm({
      title: section.title,
      subtitle: section.subtitle || "",
      primaryColor: section.primaryColor || "#E1C699"
    });
  };

  const handleDeleteSection = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;
    setSections(prev => prev.filter(s => s.id !== id));
    setLoading(true);
    try {
      const res = await fetch(`/api/sections/${id}`, {
        method: "DELETE",
        headers
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotification("success", "Item successfully deleted.");
        if (onRefresh) onRefresh();
        window.dispatchEvent(new Event("sections-updated"));
      } else {
        triggerNotification("error", data.error || "Failed to delete item. Please try again.");
        fetchAllData();
      }
    } catch (err) {
      triggerNotification("error", "Failed to delete item. Please try again.");
      fetchAllData();
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // BRAND CAMPAIGNS CRUD ACTIONS
  // ---------------------------------------------------------------------------
  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const perks = campaignForm.perksString
      .split(",")
      .map(p => p.trim())
      .filter(p => p.length > 0);

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
      const url = isEditing ? `/api/campaigns/${editingId}` : "/api/campaigns";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        triggerNotification("success", `Brand Campaign contract successfully ${isEditing ? "updated" : "created"}.`);
        handleResetForms();
        fetchAllData();
        if (onRefresh) onRefresh();
      } else {
        triggerNotification("error", data.error || "Campaign operations failed.");
      }
    } catch (err) {
      triggerNotification("error", "Communications with campaign services failed.");
    } finally {
      setLoading(false);
    }
  };

  const startEditCampaign = (camp: Campaign) => {
    setIsEditing(true);
    setEditingId(camp.id);
    setCampaignForm({
      brand: camp.brand,
      title: camp.title,
      niche: camp.niche || "",
      budget: camp.budget || "",
      requirements: camp.requirements || "",
      duration: camp.duration || "",
      location: camp.location || "",
      perksString: camp.perks ? camp.perks.join(", ") : "",
      description: camp.description || ""
    });
  };

  const handleDeleteCampaign = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;
    setCampaigns(prev => prev.filter(c => c.id !== id));
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
        headers
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotification("success", "Item successfully deleted.");
        if (onRefresh) onRefresh();
      } else {
        triggerNotification("error", data.error || "Failed to delete item. Please try again.");
        fetchAllData();
      }
    } catch (err) {
      triggerNotification("error", "Failed to delete item. Please try again.");
      fetchAllData();
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // MEMBERSHIP PLANS CRUD ACTIONS
  // ---------------------------------------------------------------------------
  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const perks = planForm.perksString
      .split(",")
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const payload = {
      name: planForm.name,
      badge: planForm.badge,
      price: planForm.price,
      period: planForm.period,
      accent: planForm.accent,
      icon: planForm.icon,
      perks,
      popular: planForm.popular
    };

    try {
      const url = isEditing ? `/api/membership-plans/${editingId}` : "/api/membership-plans";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        triggerNotification("success", `Prestige Membership Tier successfully ${isEditing ? "modified" : "onboarded"}.`);
        handleResetForms();
        fetchAllData();
        if (onRefresh) onRefresh();
      } else {
        triggerNotification("error", data.error || "Prestige service error.");
      }
    } catch (err) {
      triggerNotification("error", "Communications with membership services failed.");
    } finally {
      setLoading(false);
    }
  };

  const startEditPlan = (plan: MembershipPlan) => {
    setIsEditing(true);
    setEditingId(plan.id);
    setPlanForm({
      name: plan.name,
      badge: plan.badge || "",
      price: plan.price || "",
      period: plan.period || "",
      accent: plan.accent || "#E1C699",
      icon: plan.icon || "Star",
      perksString: plan.perks ? plan.perks.join(", ") : "",
      popular: !!plan.popular
    });
  };

  const handleDeletePlan = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;
    setPlans(prev => prev.filter(p => p.id !== id));
    setLoading(true);
    try {
      const res = await fetch(`/api/membership-plans/${id}`, {
        method: "DELETE",
        headers
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotification("success", "Item successfully deleted.");
        if (onRefresh) onRefresh();
      } else {
        triggerNotification("error", data.error || "Failed to delete item. Please try again.");
        fetchAllData();
      }
    } catch (err) {
      triggerNotification("error", "Failed to delete item. Please try again.");
      fetchAllData();
    } finally {
      setLoading(false);
    }
  };

  const renderIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Shield": return <Shield className="w-4 h-4 text-champagne" />;
      case "Award": return <Award className="w-4 h-4 text-champagne" />;
      case "Sparkles": return <Sparkles className="w-4 h-4 text-champagne" />;
      default: return <Star className="w-4 h-4 text-champagne" />;
    }
  };

  return (
    <div className="space-y-6" id="admin-content-manager-component">
      
      {/* Sub Header / Tab Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 p-4 rounded-2xl border border-black/5">
        <div className="flex items-center gap-2">
          <Layout className="w-5 h-5 text-champagne" />
          <div>
            <h4 className="font-serif-display text-sm font-bold text-black">Enterprise Content Studio</h4>
            <p className="text-[10px] text-[#666] font-mono">DYNAMIC PROPAGATION AND CRUD PANEL FOR SECTIONS, BRANDS AND VIP TIERS</p>
          </div>
        </div>

        <div className="flex bg-[#F4F3F0] p-1 rounded-xl border border-black/5 gap-1 self-stretch md:self-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setActiveSubTab("sections"); handleResetForms(); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === "sections" ? "bg-white text-black shadow-xs" : "text-[#777] hover:text-black"
            }`}
          >
            Catwalk Sections
          </button>
          <button
            onClick={() => { setActiveSubTab("campaigns"); handleResetForms(); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === "campaigns" ? "bg-white text-black shadow-xs" : "text-[#777] hover:text-black"
            }`}
          >
            Brand Contracts
          </button>
          <button
            onClick={() => { setActiveSubTab("plans"); handleResetForms(); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === "plans" ? "bg-white text-black shadow-xs" : "text-[#777] hover:text-black"
            }`}
          >
            Membership Perks
          </button>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence mode="wait">
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl font-sans font-semibold flex items-center gap-2"
          >
            <Check className="w-4 h-4 shrink-0" /> {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-sans font-semibold flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE CRUD EDITOR FORM */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-black/5 shadow-xs space-y-4 text-left">
            <div className="border-b border-black/5 pb-2.5">
              <h5 className="font-serif-display text-sm font-bold text-black flex items-center gap-1.5">
                {isEditing ? <Edit2 className="w-4 h-4 text-champagne" /> : <Plus className="w-4 h-4 text-champagne" />}
                {isEditing ? "Modify Record" : "Add New Record"}
              </h5>
              <p className="text-[9px] text-[#777] font-sans uppercase">
                {activeSubTab === "sections" ? "Catwalk Category Configuration" : activeSubTab === "campaigns" ? "Brand Campaign Retainer Draft" : "Prestige Membership Tier & Perks"}
              </p>
            </div>

            {/* SECTIONS / CATEGORIES FORM */}
            {activeSubTab === "sections" && (
              <form onSubmit={handleSectionSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Section Runway Title</label>
                  <input
                    type="text"
                    required
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs"
                    placeholder="e.g. Forever Elite Gents 2026"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Runway Subtitle / Theme</label>
                  <input
                    type="text"
                    required
                    value={sectionForm.subtitle}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs"
                    placeholder="e.g. Sharp silhouettes & fine modern tailoring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Brand/Section Accent Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={sectionForm.primaryColor}
                      onChange={(e) => setSectionForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-10 h-8 rounded border border-black/10 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      required
                      value={sectionForm.primaryColor}
                      onChange={(e) => setSectionForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-black/10 rounded-xl text-xs font-mono"
                      placeholder="#E1C699"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-black hover:bg-neutral-800 text-white font-sans text-[10px] font-bold uppercase rounded-xl tracking-wider cursor-pointer transition-colors"
                  >
                    {isEditing ? "Save Section" : "Create Section"}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleResetForms}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-sans text-[10px] font-bold uppercase rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* CAMPAIGNS FORM */}
            {activeSubTab === "campaigns" && (
              <form onSubmit={handleCampaignSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Brand Name</label>
                    <input
                      type="text"
                      required
                      value={campaignForm.brand}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs"
                      placeholder="e.g. Sabyasachi"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Campaign Title</label>
                    <input
                      type="text"
                      required
                      value={campaignForm.title}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs"
                      placeholder="e.g. Autumn Royal 2026"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Roster Niche</label>
                    <input
                      type="text"
                      required
                      value={campaignForm.niche}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, niche: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs"
                      placeholder="e.g. Couture Bridal / Haute"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Retainer Budget</label>
                    <input
                      type="text"
                      required
                      value={campaignForm.budget}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs"
                      placeholder="e.g. ₹15,00,000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Contract Duration</label>
                    <input
                      type="text"
                      required
                      value={campaignForm.duration}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs"
                      placeholder="e.g. 6 Months Retainer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Location Location</label>
                    <input
                      type="text"
                      required
                      value={campaignForm.location}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs"
                      placeholder="e.g. Mumbai / Delhi"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Campaign Description</label>
                  <textarea
                    required
                    rows={2}
                    value={campaignForm.description}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs resize-none"
                    placeholder="High level description of brand objective..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Model Requirements Summary</label>
                  <input
                    type="text"
                    required
                    value={campaignForm.requirements}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, requirements: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs"
                    placeholder="e.g. Minimum 250K audited reach, verified badges only."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Premium Perks (Comma Separated)</label>
                  <input
                    type="text"
                    value={campaignForm.perksString}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, perksString: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs font-serif-text"
                    placeholder="Sabyasachi cover photo shoot, retainer fees"
                  />
                  <p className="text-[8px] text-[#888] italic">Separate contract deliverables using commas.</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-black hover:bg-neutral-800 text-white font-sans text-[10px] font-bold uppercase rounded-xl tracking-wider cursor-pointer transition-colors"
                  >
                    {isEditing ? "Save Campaign" : "Draft Campaign"}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleResetForms}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-sans text-[10px] font-bold uppercase rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* MEMBERSHIP PLANS FORM */}
            {activeSubTab === "plans" && (
              <form onSubmit={handlePlanSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Tier Name</label>
                    <input
                      type="text"
                      required
                      value={planForm.name}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs"
                      placeholder="e.g. Diamond Star Club"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Sub Badge Title</label>
                    <input
                      type="text"
                      required
                      value={planForm.badge}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, badge: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs"
                      placeholder="e.g. Ultimate Prestige"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Price String</label>
                    <input
                      type="text"
                      required
                      value={planForm.price}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs font-mono font-semibold"
                      placeholder="₹49,999"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Billing Period</label>
                    <input
                      type="text"
                      required
                      value={planForm.period}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, period: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs"
                      placeholder="per month (+18% GST)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Display Icon</label>
                    <select
                      value={planForm.icon}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs cursor-pointer"
                    >
                      {ICON_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Border Color Hex</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={planForm.accent}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, accent: e.target.value }))}
                        className="w-8 h-8 rounded border border-black/10 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        required
                        value={planForm.accent}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, accent: e.target.value }))}
                        className="w-full px-2 py-1 bg-white border border-black/10 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-sans font-bold tracking-wider text-[#666] uppercase block">Dynamic Perks (Comma Separated)</label>
                  <textarea
                    required
                    rows={3}
                    value={planForm.perksString}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, perksString: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-xs resize-none"
                    placeholder="Bespoke obsidian badges, Dedicated personal talent manager, Front-row national Brand Campaign passes"
                  />
                  <p className="text-[8px] text-[#888] italic">Separate premium inclusions using commas.</p>
                </div>

                <div className="flex items-center gap-2 py-1 bg-[#FAF9F6] p-2.5 rounded-xl border border-black/[0.02]">
                  <input
                    type="checkbox"
                    id="popular-checkbox"
                    checked={planForm.popular}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, popular: e.target.checked }))}
                    className="w-4 h-4 text-champagne rounded border-black/10 accent-champagne cursor-pointer"
                  />
                  <label htmlFor="popular-checkbox" className="text-[10px] font-sans font-bold text-neutral-700 uppercase cursor-pointer select-none">
                    Highlight Tier as "Popular / Best Value"
                  </label>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-black hover:bg-neutral-800 text-white font-sans text-[10px] font-bold uppercase rounded-xl tracking-wider cursor-pointer transition-colors"
                  >
                    {isEditing ? "Save Plan" : "Publish Plan"}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleResetForms}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-sans text-[10px] font-bold uppercase rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: LIST AND DETAILS VIEWER */}
        <div className="lg:col-span-7 space-y-4 text-left">
          
          <div className="bg-white/60 rounded-2xl border border-black/5 overflow-hidden">
            <div className="px-4 py-3 bg-[#FAF9F6] border-b border-black/5 flex items-center justify-between">
              <span className="text-[10px] font-sans font-bold text-neutral-800 uppercase tracking-widest">
                Active {activeSubTab === "sections" ? "Catwalk Sections" : activeSubTab === "campaigns" ? "Brand Campaign Retainers" : "Prestige Roster Club Tiers"} ({
                  activeSubTab === "sections" ? sections.length : activeSubTab === "campaigns" ? campaigns.length : plans.length
                })
              </span>
              {loading && <span className="text-[9px] font-mono font-semibold text-champagne animate-pulse uppercase">Syncing...</span>}
            </div>

            <div className="divide-y divide-black/5 max-h-[580px] overflow-y-auto">
              
              {/* SECTION TIERS LIST */}
              {activeSubTab === "sections" && sections.map((sec) => (
                <div key={sec.id} className="p-4 flex justify-between items-center gap-4 hover:bg-white/30 transition-all">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full block border border-black/5 shrink-0" style={{ backgroundColor: sec.primaryColor || "#E1C699" }} />
                      <h6 className="font-serif-display text-sm font-bold text-black">{sec.title}</h6>
                    </div>
                    <p className="text-[11px] text-[#666] font-serif-text italic">{sec.subtitle}</p>
                    <span className="text-[8px] font-mono text-[#888] bg-black/[0.03] px-1.5 py-0.5 rounded uppercase">ROUTE KEY: {sec.id}</span>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditSection(sec)}
                      className="p-1.5 hover:bg-neutral-100 rounded-lg border border-black/5 text-[#555] transition-colors cursor-pointer"
                      title="Edit section metadata"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSection(e, sec.id)}
                      className="p-1.5 hover:bg-red-50 text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-red-100 transition-colors cursor-pointer"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* CAMPAIGN LIST */}
              {activeSubTab === "campaigns" && campaigns.map((camp) => (
                <div key={camp.id} className="p-4 space-y-2 hover:bg-white/30 transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[8px] font-sans font-bold text-[#888] uppercase bg-black/[0.03] px-1.5 py-0.5 rounded">
                        {camp.niche} • {camp.location}
                      </span>
                      <h6 className="font-serif-display text-sm font-bold text-black mt-1">{camp.brand} — <span className="font-sans font-normal text-[#555]">{camp.title}</span></h6>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startEditCampaign(camp)}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg border border-black/5 text-[#555] transition-colors cursor-pointer"
                        title="Edit campaign specs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCampaign(e, camp.id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-red-100 transition-colors cursor-pointer"
                        title="Purge campaign contract"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#666] font-serif-text leading-relaxed">{camp.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px] bg-black/[0.01] p-2 rounded-xl border border-black/[0.02]">
                    <div>
                      <span className="text-[8px] font-sans font-bold text-[#999] uppercase block">Budget Retainer</span>
                      <strong className="text-black">{camp.budget}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] font-sans font-bold text-[#999] uppercase block">Contract Duration</span>
                      <strong className="text-black">{camp.duration}</strong>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <span className="text-[8px] font-sans font-bold text-[#999] uppercase block">Requirement Index</span>
                      <p className="text-[9px] text-[#555] truncate font-serif-text" title={camp.requirements}>{camp.requirements}</p>
                    </div>
                  </div>

                  {camp.perks && camp.perks.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-[8px] font-sans font-bold text-[#888] uppercase tracking-wider">Perks:</span>
                      {camp.perks.map((p, i) => (
                        <span key={i} className="text-[8px] font-sans font-semibold bg-champagne/10 border border-champagne/20 text-champagne px-1.5 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* MEMBERSHIP PLAN TIERS LIST */}
              {activeSubTab === "plans" && plans.map((plan) => (
                <div key={plan.id} className="p-4 space-y-3 hover:bg-white/30 transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="p-1 rounded-lg bg-[#FAF9F6] border border-black/5 block">
                          {renderIconComponent(plan.icon)}
                        </span>
                        <h6 className="font-serif-display text-sm font-bold text-black">{plan.name}</h6>
                        <span className="text-[8px] font-sans font-bold px-1.5 py-0.5 bg-[#FAF9F6] border border-black/5 rounded text-neutral-600 uppercase">
                          {plan.badge}
                        </span>
                        {plan.popular && (
                          <span className="text-[7px] font-sans font-bold px-1.5 py-0.5 bg-champagne text-black rounded uppercase tracking-wider">
                            BEST VALUE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-800">
                        {plan.price} / <span className="text-[#666] text-[10px]">{plan.period}</span>
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startEditPlan(plan)}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg border border-black/5 text-[#555] transition-colors cursor-pointer"
                        title="Modify plan specs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeletePlan(e, plan.id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-red-100 transition-colors cursor-pointer"
                        title="Delete dynamic plan tier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {plan.perks && plan.perks.length > 0 && (
                    <div className="space-y-1 bg-black/[0.01] p-3 rounded-xl border border-black/[0.02]">
                      <span className="text-[8px] font-sans font-bold text-[#888] uppercase block tracking-wider">PREMIUM DELIVERABLES & INCLUSIONS</span>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {plan.perks.map((perk, idx) => (
                          <li key={idx} className="text-[10px] font-serif-text text-neutral-600 flex items-start gap-1">
                            <span className="text-champagne shrink-0 mt-0.5 font-bold">✓</span>
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              {((activeSubTab === "sections" && sections.length === 0) || 
                (activeSubTab === "campaigns" && campaigns.length === 0) || 
                (activeSubTab === "plans" && plans.length === 0)) && (
                <div className="p-12 text-center text-xs text-[#888] italic font-serif-text">
                  No records stored in this database collection. Use the left pane to create the first entry.
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
