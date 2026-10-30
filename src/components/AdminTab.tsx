import { safeLocal } from "../lib/safeStorage";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, User, LogIn, LayoutDashboard, Sparkles, Users, Briefcase, FileText, 
  Trash2, Plus, Edit2, Check, RefreshCw, X, AlertTriangle, Shield, CheckCircle2,
  TrendingUp, Phone, Mail, MapPin, Eye, FileSpreadsheet, Activity, UserPlus, Layout,
  KeyRound, Search, Download, Inbox, Globe, PenLine, Settings, History, Megaphone
} from "lucide-react";
import AdminContentManager from "./AdminContentManager";
import AdminSecurityPanel from "./AdminSecurityPanel";
import AdminEnquiriesPanel from "./AdminEnquiriesPanel";
import AdminPagesSeo from "./AdminPagesSeo";
import AdminContentEditor from "./AdminContentEditor";
import AdminBrandSettings from "./AdminBrandSettings";
import AdminHistoryPanel from "./AdminHistoryPanel";
import AdminPromoPanel from "./AdminPromoPanel";
import AdminDashboard from "./AdminDashboard";
import ContactButtons from "./ContactButtons";
import { ADMIN_ROLES, normaliseRole, type AdminRole } from "../lib/adminRoles";
import AdminPhotoGallery from "./AdminPhotoGallery";
import { ADMIN_TOKEN_KEY, ADMIN_UNAUTHORIZED_EVENT, downloadCsv } from "../lib/adminSession";
import { toast } from "react-hot-toast";
import { SOCIAL_PLATFORMS, cleanSocial, socialList, socialUrl, type SocialLinks } from "../lib/social";

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
  social?: Partial<Record<string, string>>;
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
  status?: LeadStatus;
  notes?: string;
}

type LeadStatus = "new" | "contacted" | "confirmed" | "closed";

const LEAD_STATUSES: { id: LeadStatus; label: string; className: string }[] = [
  { id: "new", label: "New", className: "bg-blue-50 text-blue-700 border-blue-100" },
  { id: "contacted", label: "Contacted", className: "bg-amber-50 text-amber-700 border-amber-100" },
  { id: "confirmed", label: "Confirmed", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { id: "closed", label: "Closed", className: "bg-stone-100 text-stone-600 border-stone-200" }
];

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
  social?: Partial<Record<string, string>>;
  email: string;
  phone: string;
  status: "pending" | "approved" | "declined";
  timestamp: string;
  notes?: string;
}

interface AdminStats {
  creatorsCount: number;
  categoriesCount: number;
  campaignsCount: number;
  applicationsCount: number;
  estimatedRosterReach: string;
  logs: { id: string; timestamp: string; action: string; ip?: string }[];
}

// The admin menu in three groups. Tab ids are unchanged, so links and tests keep working.
const ADMIN_MENU: { label: string; tabs: { id: string; label: string; icon: typeof KeyRound }[] }[] = [
  {
    label: "Website",
    tabs: [
      { id: "dashboard", label: "Overview", icon: LayoutDashboard },
      { id: "page_content", label: "Page content", icon: PenLine },
      { id: "pages_seo", label: "Pages & SEO", icon: Globe },
      { id: "creators", label: "Creators", icon: Users },
      { id: "content_manager", label: "Categories, campaigns & plans", icon: Layout },
      { id: "promo", label: "Popup & ads", icon: Megaphone },
      { id: "content", label: "Site settings", icon: Settings }
    ]
  },
  {
    label: "Inbox",
    tabs: [
      { id: "influencer_applications", label: "Award applications", icon: UserPlus },
      { id: "registrations", label: "Brand enquiries", icon: FileText },
      { id: "enquiries", label: "Messages", icon: Inbox }
    ]
  },
  {
    label: "Settings",
    tabs: [
      { id: "history", label: "Change history", icon: History },
      { id: "security", label: "Password & team", icon: KeyRound }
    ]
  }
];

const WEBSITE_TABS = ["promo", "page_content", "pages_seo", "creators", "content_manager", "content", "history"];
const INBOX_TABS = ["influencer_applications", "registrations", "enquiries"];
const tabAllowed = (id: string, role: AdminRole) =>
  role === "owner" || (WEBSITE_TABS.includes(id) ? role === "editor" : INBOX_TABS.includes(id) ? role === "inbox" : true);

export default function AdminTab() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [currentRole, setCurrentRole] = useState<AdminRole>("owner");
  const roleRef = useRef<AdminRole>("owner");
  const applyRole = (raw: unknown) => {
    const r = normaliseRole(raw);
    roleRef.current = r;
    setCurrentRole(r);
    return r;
  };

  // Inbox filters
  const [regQuery, setRegQuery] = useState("");
  const [regStatusFilter, setRegStatusFilter] = useState<"all" | LeadStatus>("all");
  const [appQuery, setAppQuery] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<"all" | InfluencerApplication["status"]>("all");

  // Active sub-section within Admin Workspace (extended with dynamic settings modules)
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<string>("dashboard");

  // Admin Workspace Data
  const [stats, setStats] = useState<any | null>(null);
  const [sections, setSections] = useState<GallerySection[]>([]);
  // Runway section chosen for each pending applicant (the form collects a content category)
  const [approveSection, setApproveSection] = useState<Record<string, string>>({});
  const defaultSectionFor = (app: { id: string; category: string }) =>
    approveSection[app.id] ?? (sections.some((s) => s.id === app.category) ? app.category : sections[0]?.id || "");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [influencerApplications, setInfluencerApplications] = useState<InfluencerApplication[]>([]);

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
    reach: "",
    engagement: "",
    verified: true,
    portfolioUrls: "",
    social: {} as SocialLinks
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
      // A preview host (Vercel) or a missing .htaccess returns a web page here, not the API's JSON
      const data = await res.json().catch(() => null);
      if (!data) {
        setLoginError(
          /\.vercel\.app$/i.test(window.location.hostname)
            ? "Admin login does not work on the preview link: it has no server or database. Sign in on the live site at influencer.fsia.in/admin/."
            : `The admin server did not answer (status ${res.status}). Check that api/ and .htaccess were uploaded next to index.html and that PHP 8 is selected.`
        );
        return;
      }
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

  const handleDeleteCategory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;
    setSections(prev => prev.filter(s => s.id !== id));
    try {
      const res = await fetch(`/api/sections/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Item successfully deleted.");
        window.dispatchEvent(new Event("sections-updated"));
      } else {
        toast.error(data.error || "Failed to delete item. Please try again.");
        fetchAdminData(token);
      }
    } catch (err) {
      toast.error("Failed to delete item. Please try again.");
      fetchAdminData(token);
    }
  };

  // Restore and validate a saved session on load
  useEffect(() => {
    const savedToken = safeLocal.getItem(ADMIN_TOKEN_KEY);
    if (!savedToken) return;
    fetch("/api/auth/me", { headers: { "Authorization": `Bearer ${savedToken}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setToken(savedToken);
        setCurrentUser(data.username);
        applyRole(data.role);
        setMustChangePassword(!!data.mustChangePassword);
        setIsLoggedIn(true);
        // The server allows nothing else until the default password is changed
        if (data.mustChangePassword) setAdminActiveSubTab("security");
        else fetchAdminData(savedToken);
      })
      .catch(() => safeLocal.removeItem(ADMIN_TOKEN_KEY));
  }, []);

  // Any 401 from an admin call means the session expired or was revoked
  useEffect(() => {
    const onUnauthorized = () => {
      if (!safeLocal.getItem(ADMIN_TOKEN_KEY)) return;
      safeLocal.removeItem(ADMIN_TOKEN_KEY);
      setToken("");
      setIsLoggedIn(false);
      setStats(null);
      toast.error("Your admin session has expired. Please sign in again.");
    };
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
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
        safeLocal.setItem(ADMIN_TOKEN_KEY, data.token);
        setCurrentUser(data.username);
        applyRole(data.role);
        setMustChangePassword(!!data.mustChangePassword);
        setPassword("");
        setIsLoggedIn(true);
        // The server allows nothing else until the default password is changed
        if (data.mustChangePassword) setAdminActiveSubTab("security");
        else fetchAdminData(data.token);
      } else {
        setLoginError(data.error || "Invalid administrative credentials.");
      }
    } catch (err) {
      setLoginError("Could not reach the server (the connection was dropped). Please wait a few seconds and try again. If this keeps happening, ask your hosting provider to check its firewall for dropped connections.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST", headers: { "Authorization": `Bearer ${token}` } }).catch(() => {});
    safeLocal.removeItem(ADMIN_TOKEN_KEY);
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

      // Applications and enquiries are only for the Owner and Inbox roles
      if (roleRef.current === "editor") return;

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
    } catch (err) {
      console.error("Error loading administration data:", err);
    }
  };

  const approveInfluencerApplication = async (id: string, sectionId: string) => {
    try {
      const res = await fetch(`/api/influencer-applications/${id}/approve`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sectionId })
      });
      if (res.ok) {
        const sectionTitle = sections.find((s) => s.id === sectionId)?.title || "the runway";
        toast.success(`Applicant approved and added to ${sectionTitle}.`);
        window.dispatchEvent(new Event("sections-updated"));
        fetchAdminData(token);
      } else {
        const err = await res.json();
        toast.error(err.error || "Approval failed.");
      }
    } catch (e) {
      toast.error("Failed to communicate with administration service.");
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
        toast.error(err.error || "Decline failed.");
      }
    } catch (e) {
      toast.error("Failed to communicate with administration service.");
    }
  };

  // ----------------------------------------------------
  // LEADS & APPLICANTS INBOX METHODS
  // ----------------------------------------------------
  const updateRegistration = async (id: string, patch: { status?: LeadStatus; notes?: string }) => {
    setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    try {
      const res = await fetch(`/api/registrations/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(patch)
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update lead.");
        fetchAdminData(token);
      }
    } catch {
      toast.error("Failed to update lead.");
      fetchAdminData(token);
    }
  };

  const deleteRegistration = async (id: string) => {
    if (!window.confirm("Delete this brand lead permanently?")) return;
    const res = await fetch(`/api/registrations/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      toast.success("Lead deleted.");
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } else {
      toast.error("Failed to delete lead.");
    }
  };

  const updateApplicationNotes = async (id: string, notes: string) => {
    setInfluencerApplications((prev) => prev.map((a) => (a.id === id ? { ...a, notes } : a)));
    try {
      const res = await fetch(`/api/influencer-applications/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ notes })
      });
      if (res.ok) toast.success("Note saved.");
      else toast.error((await res.json().catch(() => ({})))?.error || "Could not save the note.");
    } catch {
      toast.error("Could not save the note.");
    }
  };

  const deleteInfluencerApplication = async (id: string) => {
    if (!window.confirm("Delete this application permanently? Approved creators stay on the roster.")) return;
    const res = await fetch(`/api/influencer-applications/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      toast.success("Application deleted.");
      setInfluencerApplications((prev) => prev.filter((a) => a.id !== id));
    } else {
      toast.error("Failed to delete application.");
    }
  };

  const matches = (query: string, ...fields: (string | undefined)[]) =>
    !query.trim() || fields.some((f) => (f || "").toLowerCase().includes(query.trim().toLowerCase()));

  const filteredRegistrations = registrations.filter(
    (r) =>
      (regStatusFilter === "all" || (r.status || "new") === regStatusFilter) &&
      matches(regQuery, r.brandName, r.creatorName, r.contactEmail, r.contactPhone, r.bookingId, r.clientCity)
  );

  const filteredApplications = influencerApplications.filter(
    (a) =>
      (appStatusFilter === "all" || a.status === appStatusFilter) &&
      matches(appQuery, a.name, a.email, a.phone, a.city, a.category, a.role)
  );

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
      reach: "",
      engagement: "",
      verified: true,
      portfolioUrls: "",
      social: {}
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
      reach: String(creator.stats.reach || ""),
      engagement: String(creator.stats.engagement || ""),
      verified: creator.stats.verified !== false,
      portfolioUrls: creator.portfolio && creator.portfolio.length > 0 ? creator.portfolio.join(", ") : creator.image,
      social: cleanSocial(creator.social)
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
        quote: creatorForm.quote,
        // Keep extra facts (Platforms, Languages…) that this form does not show
        stats: {
          ...(editingCreator?.creator.stats || {}),
          reach: creatorForm.reach,
          engagement: creatorForm.engagement,
          verified: creatorForm.verified
        },
        portfolio: urlsArray,
        social: cleanSocial(creatorForm.social)
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

  const deleteCreator = async (e: React.MouseEvent, sectionId: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;
    setSections(prev => 
      prev.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            creators: section.creators ? section.creators.filter(c => c.name !== name) : []
          };
        }
        return section;
      })
    );
    try {
      const res = await fetch(`/api/creators/${sectionId}/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Item successfully deleted.");
        window.dispatchEvent(new Event("sections-updated"));
      } else {
        toast.error(data.error || "Failed to delete item. Please try again.");
        fetchAdminData(token);
      }
    } catch (err) {
      toast.error("Failed to delete item. Please try again.");
      fetchAdminData(token);
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

  const deleteCampaign = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;
    setCampaigns(prev => prev.filter(c => c.id !== id));
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Item successfully deleted.");
      } else {
        toast.error(data.error || "Failed to delete item. Please try again.");
        fetchAdminData(token);
      }
    } catch (err) {
      toast.error("Failed to delete item. Please try again.");
      fetchAdminData(token);
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
                <span className="font-sans text-[11px] tracking-[0.3em] text-[#8E8D8A] uppercase font-bold">
                  Admin portal
                </span>
                <h2 className="font-serif-display text-2xl font-bold text-[#111]">
                  VIP Administration
                </h2>
                <p className="font-serif-text italic text-xs text-[#666]">
                  Enter credential keys to manage elite models and brand sponsorships.
                </p>
              </div>
            </div>

            {typeof window !== "undefined" && /\.vercel\.app$/i.test(window.location.hostname) && (
              <p role="note" className="mb-5 text-left text-[0.875rem] text-ink border border-line-strong bg-bronze-soft px-3 py-2">
                This is the preview link. Admin login works only on the live site: influencer.fsia.in/admin/
              </p>
            )}
            <form onSubmit={handleLogin} className="space-y-5 text-left">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
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
                <label className="block text-[11px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
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

          </motion.div>
        </div>
      ) : (
        
        /* 2. AUTHENTICATED WORKSPACE */
        <div className="space-y-6 md:space-y-8" id="admin-workspace">
          
          {/* Header row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-[4px] border border-black/10">
            <div className="space-y-0.5">
              <h2 className="font-serif-display text-2xl font-bold text-[#111] tracking-tight">Admin</h2>
              <p className="text-[0.8125rem] text-[#666]">
                Signed in as <strong className="text-[#111]">{currentUser}</strong> · {ADMIN_ROLES.find((r) => r.id === currentRole)?.label}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-black/10 bg-white text-[#111] text-xs font-semibold px-4 py-2 rounded-[4px] hover:bg-black/[0.04] transition-colors flex items-center justify-center gap-2"
              >
                View website
              </a>
              <button 
                onClick={() => fetchAdminData(token)}
                className="p-2.5 rounded-[4px] border border-black/10 bg-white hover:bg-black/[0.04] text-[#444] transition-colors cursor-pointer"
                title="Refresh"
                aria-label="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="bg-white hover:bg-red-50 text-red-700 text-xs font-semibold px-4 py-2 rounded-[4px] transition-colors cursor-pointer border border-red-200"
              >
                Sign out
              </button>
            </div>
          </div>

          {mustChangePassword && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex items-start gap-2.5 text-amber-800">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-sans leading-relaxed">
                  <strong>You are using the default password.</strong> Anyone who knows it can control this website,
                  so the admin panel stays locked until you change it below.
                </p>
              </div>
              <button
                onClick={() => setAdminActiveSubTab("security")}
                className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg cursor-pointer"
              >
                Change password
              </button>
            </div>
          )}

          {/* Menu, grouped; each person sees only what their role allows */}
          <nav aria-label="Admin sections" className="space-y-3 border-b border-black/10 pb-4" id="admin-menu">
            {ADMIN_MENU.map((group) => {
              const tabs = group.tabs.filter((t) => tabAllowed(t.id, currentRole));
              if (tabs.length === 0) return null;
              return (
                <div key={group.label} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888] sm:w-20 shrink-0">{group.label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const active = adminActiveSubTab === tab.id;
                      const badge = tab.id === "registrations"
                        ? registrations.filter((r) => (r.status || "new") === "new").length
                        : tab.id === "influencer_applications"
                          ? influencerApplications.filter((a) => a.status === "pending").length
                          : tab.id === "enquiries" ? stats?.newEnquiriesCount : 0;
                      const locked = mustChangePassword && tab.id !== "security";
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setAdminActiveSubTab(tab.id)}
                          disabled={locked}
                          aria-current={active ? "page" : undefined}
                          title={locked ? "Change the default password first" : undefined}
                          data-tab={tab.id}
                          className={`px-3 py-2 rounded-[4px] text-[0.8125rem] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed ${
                            active ? "bg-[#111] text-white border-[#111]" : "bg-white text-[#333] border-black/10 hover:border-black/30"
                          }`}
                        >
                          <Icon className="w-4 h-4" aria-hidden="true" />
                          {tab.label}
                          {!!badge && (
                            <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] leading-[18px] text-center">
                              {badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Sub Tab Content Panels */}
          <div className="space-y-6">
            
            {adminActiveSubTab === "dashboard" && (
              <AdminDashboard
                token={token}
                role={currentRole}
                currentUser={currentUser}
                stats={stats}
                registrations={registrations}
                applications={influencerApplications}
                openTab={setAdminActiveSubTab}
              />
            )}

            {adminActiveSubTab === "promo" && <AdminPromoPanel token={token} />}

            {adminActiveSubTab === "history" && (
              <AdminHistoryPanel token={token} role={currentRole} onRestored={() => fetchAdminData(token)} />
            )}

            {/* Click any text or image on a page to change it */}
            {adminActiveSubTab === "page_content" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AdminContentEditor token={token} />
              </motion.div>
            )}

            {/* Page text, Google title/description and share cards for every public page */}
            {adminActiveSubTab === "pages_seo" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AdminPagesSeo token={token} />
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

            {/* A1. Logo, brand colour and footer text */}
            {adminActiveSubTab === "content" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AdminBrandSettings token={token} />
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
                    Add, edit or remove the creators shown on the website.
                  </div>
                  <button
                    onClick={openAddCreator}
                    className="bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-[11px] tracking-widest font-bold py-2 px-4 rounded-lg uppercase flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-champagne" /> Add creator
                  </button>
                </div>

                {/* Creators Table grouped by runway sections */}
                <div className="space-y-6">
                  {sections.map((section, sIdx) => (
                    <div key={`${section.id}-${sIdx}`} className="bg-white/60 rounded-2xl border border-black/5 overflow-hidden">
                      <div className="px-5 py-3.5 bg-[#F4F3F0] border-b border-black/5 flex justify-between items-center">
                        <div>
                          <h4 className="font-serif-display text-sm font-bold text-[#111]">{section.title}</h4>
                          <span className="text-[11px] text-[#888] tracking-widest uppercase font-mono">{section.subtitle}</span>
                        </div>
                        <span className="text-[11px] font-mono text-[#888] bg-white border border-black/5 px-2.5 py-1 rounded-full">
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
                                    <span className="text-[11px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-sans uppercase font-bold">Verified</span>
                                  )}
                                </div>
                                <p className="text-[11px] font-sans text-[#666]">{c.role} — <span className="italic">{c.city}</span></p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right hidden md:block">
                                <div className="text-xs font-mono font-bold">{c.stats.reach}</div>
                                <div className="text-[11px] text-[#888] tracking-wider uppercase font-semibold">Reach / {c.stats.engagement} ER</div>
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
                                  onClick={(e) => deleteCreator(e, section.id, c.name)}
                                  className="p-2 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                      <h4 className="font-serif-display text-sm font-bold text-[#111]">Brand enquiries</h4>
                      <p className="text-[11px] text-[#888] uppercase tracking-wider font-mono">Brands asking to work with creators</p>
                    </div>
                    <span className="bg-champagne/15 text-champagne border border-champagne text-[11px] font-sans font-bold px-3 py-1 rounded-full">
                      {registrations.length} total
                    </span>
                  </div>

                  <div className="px-5 py-3 border-b border-black/5 bg-white/40 flex flex-col md:flex-row gap-2 md:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#888]" />
                      <input
                        value={regQuery}
                        onChange={(e) => setRegQuery(e.target.value)}
                        placeholder="Search brand, creator, email, phone or booking ID…"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:border-champagne"
                      />
                    </div>
                    <select
                      value={regStatusFilter}
                      onChange={(e) => setRegStatusFilter(e.target.value as "all" | LeadStatus)}
                      className="px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:border-champagne"
                    >
                      <option value="all">All statuses</option>
                      {LEAD_STATUSES.map((st) => (
                        <option key={st.id} value={st.id}>{st.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => downloadCsv(`fsia-brand-leads-${new Date().toISOString().slice(0, 10)}.csv`, filteredRegistrations as unknown as Record<string, unknown>[])}
                      disabled={filteredRegistrations.length === 0}
                      className="px-3 py-2 bg-[#111] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                  </div>

                  <div className="divide-y divide-black/5">
                    {filteredRegistrations.map((reg) => (
                      <div key={reg.id} className="p-5 space-y-4 hover:bg-white/20 transition-all">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#111]">{reg.bookingId}</span>
                              <select
                                value={reg.status || "new"}
                                onChange={(e) => updateRegistration(reg.id, { status: e.target.value as LeadStatus })}
                                className={`text-[11px] font-sans font-bold uppercase px-2 py-0.5 rounded border cursor-pointer focus:outline-none ${
                                  (LEAD_STATUSES.find((st) => st.id === (reg.status || "new")) || LEAD_STATUSES[0]).className
                                }`}
                                title="Lead status"
                              >
                                {LEAD_STATUSES.map((st) => (
                                  <option key={st.id} value={st.id}>{st.label}</option>
                                ))}
                              </select>
                            </div>
                            <h5 className="font-serif-display text-base font-bold text-black">{reg.brandName}</h5>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="text-left md:text-right font-mono text-[11px] text-[#666]">
                              <div>Budget: <strong className="text-black font-semibold">{reg.budget}</strong></div>
                              <div>Applied: {reg.timestamp}</div>
                            </div>
                            <button
                              onClick={() => deleteRegistration(reg.id)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Delete enquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Submission Metadata details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/45 p-3.5 rounded-xl border border-black/[0.03] text-xs font-serif-text">
                          <div className="space-y-1">
                            <span className="text-[11px] font-sans font-bold tracking-wider text-[#888] uppercase block">Creator asked for</span>
                            <div className="flex items-center gap-1.5 font-sans font-semibold text-black">
                              <Users className="w-3.5 h-3.5 text-champagne" />
                              {reg.creatorName}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-sans font-bold tracking-wider text-[#888] uppercase block">Contact</span>
                            <div className="space-y-0.5">
                              <a href={`mailto:${reg.contactEmail}`} className="flex items-center gap-1.5 text-black hover:underline">
                                <Mail className="w-3.5 h-3.5 text-[#888]" /> {reg.contactEmail}
                              </a>
                              <a href={`tel:${reg.contactPhone}`} className="flex items-center gap-1.5 text-black hover:underline">
                                <Phone className="w-3.5 h-3.5 text-[#888]" /> {reg.contactPhone}
                              </a>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-sans font-bold tracking-wider text-[#888] uppercase block">City</span>
                            <div>
                              <div className="flex items-center gap-1.5 text-black">
                                <MapPin className="w-3.5 h-3.5 text-[#888]" /> {reg.clientCity}
                              </div>
                              {reg.gstin && (
                                <div className="text-[11px] text-[#888] font-mono">GSTIN: {reg.gstin}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center font-mono text-[11px] text-[#888]">
                          <ContactButtons phone={reg.contactPhone} email={reg.contactEmail} name={reg.brandName} about="your enquiry" />
                          {reg.scope && (
                            <span className="font-serif-text italic text-[#666]">Scope: {reg.scope} ({reg.duration || "3 Months"})</span>
                          )}
                        </div>

                        <textarea
                          defaultValue={reg.notes || ""}
                          onBlur={(e) => {
                            if (e.target.value !== (reg.notes || "")) updateRegistration(reg.id, { notes: e.target.value });
                          }}
                          placeholder="Private notes for the team (saved when you click away)…"
                          rows={2}
                          className="w-full px-3 py-2 bg-white/70 border border-black/5 rounded-lg text-xs font-serif-text focus:outline-none focus:border-champagne"
                        />
                      </div>
                    ))}

                    {filteredRegistrations.length === 0 && (
                      <div className="p-12 text-center text-xs text-[#888] font-serif-text italic">
                        {registrations.length === 0 ? "No brand enquiries yet." : "No enquiries match your search."}
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
                    <span className="text-[11px] text-[#888] uppercase tracking-wider font-sans font-bold block">All applications</span>
                    <strong className="text-xl font-bold text-[#111]">{influencerApplications.length}</strong>
                  </div>
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 shadow-xs">
                    <span className="text-[11px] text-amber-700 uppercase tracking-wider font-sans font-bold block">To review</span>
                    <strong className="text-xl font-bold text-amber-700">
                      {influencerApplications.filter(a => a.status === "pending").length}
                    </strong>
                  </div>
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 shadow-xs">
                    <span className="text-[11px] text-emerald-700 uppercase tracking-wider font-sans font-bold block">Approved</span>
                    <strong className="text-xl font-bold text-emerald-700">
                      {influencerApplications.filter(a => a.status === "approved").length}
                    </strong>
                  </div>
                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-100/50 shadow-xs">
                    <span className="text-[11px] text-red-700 uppercase tracking-wider font-sans font-bold block">Declined</span>
                    <strong className="text-xl font-bold text-red-700">
                      {influencerApplications.filter(a => a.status === "declined").length}
                    </strong>
                  </div>
                </div>

                <div className="bg-white/60 rounded-2xl border border-black/5 overflow-hidden">
                  <div className="px-5 py-4 bg-[#F4F3F0] border-b border-black/5 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="font-serif-display text-sm font-bold text-[#111]">Award applications</h4>
                      <p className="text-[11px] text-[#888] uppercase tracking-wider font-mono">Approve an application to show the creator on the website</p>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-b border-black/5 bg-white/40 flex flex-col md:flex-row gap-2 md:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#888]" />
                      <input
                        value={appQuery}
                        onChange={(e) => setAppQuery(e.target.value)}
                        placeholder="Search name, email, phone, city or category…"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:border-champagne"
                      />
                    </div>
                    <select
                      value={appStatusFilter}
                      onChange={(e) => setAppStatusFilter(e.target.value as "all" | InfluencerApplication["status"])}
                      className="px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:border-champagne"
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="declined">Declined</option>
                    </select>
                    <button
                      onClick={() => downloadCsv(`fsia-creator-applicants-${new Date().toISOString().slice(0, 10)}.csv`, filteredApplications as unknown as Record<string, unknown>[])}
                      disabled={filteredApplications.length === 0}
                      className="px-3 py-2 bg-[#111] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                  </div>

                  <div className="divide-y divide-black/5">
                    {filteredApplications.map((app) => (
                      <div key={app.id} className="p-5 space-y-4 hover:bg-white/20 transition-all text-left">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-black/5 shrink-0 bg-gray-100">
                              <img src={app.image} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-serif-display text-base font-bold text-black">{app.name}</h5>
                                <span className={`text-[11px] font-sans font-bold px-2 py-0.5 rounded border uppercase ${
                                  app.status === "approved" 
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                    : app.status === "declined"
                                      ? "bg-red-50 text-red-600 border-red-100"
                                      : "bg-amber-50 text-amber-600 border-amber-100"
                                }`}>
                                  {app.status === "approved" ? "Approved" : app.status === "declined" ? "Declined" : "To review"}
                                </span>
                              </div>
                              <p className="text-xs text-[#666] font-sans">
                                {app.role} • <span className="font-semibold text-champagne">{app.category}</span> • <span className="italic">{app.city}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-left md:text-right">
                              <span className="text-[11px] font-sans font-bold text-[#888] uppercase block">Followers / engagement</span>
                              <div className="text-xs font-mono font-bold text-black">
                                {app.reach || "—"} / {app.engagement || "—"}
                              </div>
                            </div>

                            {app.status === "pending" && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <label htmlFor={`approve-section-${app.id}`} className="sr-only">
                                  Runway section for {app.name}
                                </label>
                                <select
                                  id={`approve-section-${app.id}`}
                                  value={defaultSectionFor(app)}
                                  onChange={(e) => setApproveSection((prev) => ({ ...prev, [app.id]: e.target.value }))}
                                  title="Category this creator joins when approved"
                                  className="px-2 py-1.5 bg-white border border-black/15 rounded-lg text-xs font-sans text-[#111] max-w-[180px]"
                                >
                                  {sections.map((sec) => (
                                    <option key={sec.id} value={sec.id}>{sec.title}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => approveInfluencerApplication(app.id, defaultSectionFor(app))}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-sans text-[11px] font-bold uppercase rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Approve and show on the website"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => declineInfluencerApplication(app.id)}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-sans text-[11px] font-bold uppercase rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Decline request"
                                >
                                  <X className="w-3.5 h-3.5" /> Decline
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => deleteInfluencerApplication(app.id)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Delete application"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Additional applicant metadata & pitch */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FAF9F6] p-4 rounded-xl border border-black/[0.02]">
                          <div className="space-y-2">
                            <div>
                              <span className="text-[11px] font-sans font-bold tracking-wider text-[#888] uppercase block">About</span>
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
                                <span className="text-[11px] font-sans font-bold tracking-wider text-[#888] uppercase block">Email</span>
                                <a href={`mailto:${app.email}`} className="text-black hover:underline flex items-center gap-1 font-sans font-semibold mt-0.5">
                                  <Mail className="w-3.5 h-3.5 text-[#888]" /> {app.email}
                                </a>
                              </div>
                              <div>
                                <span className="text-[11px] font-sans font-bold tracking-wider text-[#888] uppercase block">Phone</span>
                                <a href={`tel:${app.phone}`} className="text-black hover:underline flex items-center gap-1 font-sans font-semibold mt-0.5">
                                  <Phone className="w-3.5 h-3.5 text-[#888]" /> {app.phone}
                                </a>
                              </div>
                            </div>

                            {socialList(app.social).length > 0 && (
                              <div>
                                <span className="text-[11px] font-sans font-bold tracking-wider text-[#888] uppercase block mb-1">SOCIAL MEDIA</span>
                                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                  {socialList(app.social).map((sl) => (
                                    <li key={sl.id}>
                                      <a href={sl.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#111]">{sl.label}: {sl.text}</a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {app.portfolio && app.portfolio.length > 0 && (
                              <div>
                                <span className="text-[11px] font-sans font-bold tracking-wider text-[#888] uppercase block mb-1">SUBMITTED PORTFOLIO</span>
                                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                  {app.portfolio.map((img, i) => (
                                    <a key={i} href={/^https?:\/\//i.test(img) ? img : undefined} target="_blank" rel="noopener noreferrer" className="relative w-12 h-16 rounded overflow-hidden border border-black/5 bg-gray-50 flex-shrink-0 group">
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

                        <div className="flex flex-col md:flex-row md:items-start gap-3">
                          <div className="flex-1">
                            <label htmlFor={`app-notes-${app.id}`} className="sr-only">Notes for {app.name}</label>
                            <textarea
                              id={`app-notes-${app.id}`}
                              defaultValue={app.notes || ""}
                              onBlur={(e) => {
                                if (e.target.value !== (app.notes || "")) updateApplicationNotes(app.id, e.target.value);
                              }}
                              placeholder="Private notes for the team, e.g. called on Monday, fee shared (saved when you click away)…"
                              rows={2}
                              className="w-full px-3 py-2 bg-white/70 border border-black/10 rounded-[4px] text-xs focus:outline-none focus:border-champagne"
                            />
                          </div>
                          <div className="flex flex-col items-start md:items-end gap-1.5">
                            <ContactButtons phone={app.phone} email={app.email} name={app.name} about="your Influencer Award application" />
                            <span className="text-[11px] text-[#888]">Received {app.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredApplications.length === 0 && (
                      <div className="p-12 text-center text-xs text-[#888] font-serif-text italic">
                        {influencerApplications.length === 0 ? "No award applications yet." : "No applications match your search."}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {adminActiveSubTab === "enquiries" && (
              <AdminEnquiriesPanel token={token} onChange={() => fetchAdminData(token)} />
            )}

            {adminActiveSubTab === "security" && (
              <AdminSecurityPanel
                token={token}
                currentUser={currentUser}
                role={currentRole}
                onPasswordChanged={() => {
                  setMustChangePassword(false);
                  fetchAdminData(token);
                }}
                onDataRestored={() => fetchAdminData(token)}
              />
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
                  {editingCreator ? "Edit creator profile" : "Add a creator"}
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
                    <label className="text-[11px] font-sans font-semibold text-[#555]">Category</label>
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
                    <label className="text-[11px] font-sans font-semibold text-[#555]">Name</label>
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
                    <label className="text-[11px] font-sans font-semibold text-[#555]">Role, e.g. Fashion creator</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Fashion creator"
                      value={creatorForm.role}
                      onChange={(e) => setCreatorForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:border-champagne"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-sans font-semibold text-[#555]">City</label>
                    <input
                      type="text"
                      placeholder="e.g., Mumbai"
                      value={creatorForm.city}
                      onChange={(e) => setCreatorForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:border-champagne"
                    />
                  </div>
                </div>

                <AdminPhotoGallery
                  token={token}
                  image={creatorForm.image}
                  photos={creatorForm.portfolioUrls.split(",").map((u) => u.trim()).filter(Boolean)}
                  onChange={({ image, photos }) => setCreatorForm((prev) => ({ ...prev, image, portfolioUrls: photos.join(", ") }))}
                />

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-sans font-semibold text-[#555]">Followers</label>
                    <input
                      type="text"
                      placeholder="e.g., 1.5M"
                      value={creatorForm.reach}
                      onChange={(e) => setCreatorForm(prev => ({ ...prev, reach: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-sans font-semibold text-[#555]">Engagement Rate</label>
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
                      <span className="text-[11px] font-sans font-bold text-[#444] uppercase">VERIFIED</span>
                    </label>
                  </div>
                </div>

                <fieldset className="space-y-2" id="creator-social-fields">
                  <legend className="text-[11px] font-sans font-semibold text-[#555]">Social media (optional)</legend>
                  <p className="text-[11px] text-[#777]">Type a handle like @username or paste the full link. Empty boxes are not shown on the profile.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SOCIAL_PLATFORMS.map((sp) => {
                      const value = creatorForm.social[sp.id] || "";
                      const bad = !!value.trim() && !socialUrl(sp.id, value);
                      return (
                        <div key={sp.id} className="space-y-1">
                          <label htmlFor={`creator-social-${sp.id}`} className="text-[11px] font-sans text-[#555]">{sp.label}</label>
                          <input
                            id={`creator-social-${sp.id}`}
                            type="text"
                            placeholder={sp.placeholder}
                            value={value}
                            aria-invalid={bad || undefined}
                            onChange={(e) => setCreatorForm((prev) => ({ ...prev, social: { ...prev.social, [sp.id]: e.target.value } }))}
                            className={`w-full px-3 py-2 bg-white border rounded-lg text-xs ${bad ? "border-red-400" : "border-black/10"}`}
                          />
                          {bad && <p className="text-[11px] text-red-600">{sp.label}: not a valid handle or link, so it will not be shown.</p>}
                        </div>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="space-y-1">
                  <label className="text-[11px] font-sans font-semibold text-[#555]">About</label>
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
                  <label className="text-[11px] font-sans font-semibold text-[#555]">Quote</label>
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
                  {editingCreator ? "Save creator" : "Add creator"}
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
                    <label className="text-[11px] font-sans font-bold text-[#666] uppercase">Brand Partner</label>
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
                    <label className="text-[11px] font-sans font-bold text-[#666] uppercase">Campaign Headline</label>
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
                    <label className="text-[11px] font-sans font-bold text-[#666] uppercase">Budget Bracket</label>
                    <input
                      type="text"
                      placeholder="e.g., ₹4,00,000"
                      value={campaignForm.budget}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-sans font-bold text-[#666] uppercase">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g., 3 Weeks"
                      value={campaignForm.duration}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-sans font-bold text-[#666] uppercase">Location</label>
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
                    <label className="text-[11px] font-sans font-bold text-[#666] uppercase">Niche Focus</label>
                    <input
                      type="text"
                      placeholder="e.g., Royal Couture"
                      value={campaignForm.niche}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, niche: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-sans font-bold text-[#666] uppercase">Minimum Audience Requirement</label>
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
                  <label className="text-[11px] font-sans font-bold text-[#666] uppercase">Campaign Outline Brief</label>
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
                  <label className="text-[11px] font-sans font-bold text-[#666] uppercase block">VIP Compensation Perks (Up to 3)</label>
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
