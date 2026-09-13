import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Layers, 
  Grid, 
  Filter, 
  ArrowUpDown, 
  Search, 
  AlertCircle, 
  Loader2, 
  PlusCircle, 
  ShieldCheck, 
  Flame,
  CheckCircle2
} from 'lucide-react';
import type { Application, Category, SiteSettings } from './types';
import { ApiService } from './services/apiService';
import { Header } from './components/Header';
import { NavigationDrawer } from './components/NavigationDrawer';
import { ApplicationCard } from './components/ApplicationCard';
import { ApplicationDetailsModal } from './components/ApplicationDetailsModal';
import { DownloadFlowModal } from './components/DownloadFlowModal';
import { ShareFlowModal } from './components/ShareFlowModal';
import { AdminPinModal } from './components/AdminPinModal';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { LegalModal } from './components/LegalModal';
import { Footer } from './components/Footer';

export default function App() {
  // Catalog State
  const [applications, setApplications] = useState<Application[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    instagram_url: 'https://instagram.com/darkprimemods',
    site_title: 'DARK PRIME MODS',
    stage_1_timer_sec: 20,
    stage_3_timer_sec: 10,
    stage_5_timer_sec: 5,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'name' | 'size'>('latest');

  // User & Auth State
  const [user, setUser] = useState<any>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'contrast'>('dark');

  // Modal Dialog States
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedAppForDetails, setSelectedAppForDetails] = useState<Application | null>(null);
  const [selectedAppForDownload, setSelectedAppForDownload] = useState<Application | null>(null);
  const [selectedAppForShare, setSelectedAppForShare] = useState<Application | null>(null);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [legalView, setLegalView] = useState<'about-developer' | 'privacy-data' | 'terms-conditions' | 'disclaimer' | 'copyright' | null>(null);

  // Initial Data Fetching
  useEffect(() => {
    loadPlatformData();

    // Check existing local session for auth
    const savedUser = localStorage.getItem('dp_user_session');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('dp_user_session');
      }
    }

    // Check URL hash for shared app link: e.g. #app=spotify-prime
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleHashChange = async () => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#app=')) {
      const slugOrId = hash.replace('#app=', '');
      if (slugOrId) {
        const app = await ApiService.getApplicationBySlug(slugOrId);
        if (app) {
          setSelectedAppForDetails(app);
        }
      }
    }
  };

  const loadPlatformData = async () => {
    setIsLoading(true);
    try {
      const [appsRes, cats, serverSettings] = await Promise.all([
        ApiService.getApplications({ limit: 100 }),
        ApiService.getCategories(),
        ApiService.getSettings(),
      ]);

      setApplications(appsRes.applications);
      setCategories(cats);
      if (serverSettings) {
        setSettings(serverSettings);
      }
    } catch (err) {
      console.error('Failed to load platform data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered and Sorted Applications
  const filteredApps = useMemo(() => {
    let result = [...applications];

    // Search query filter (Name, Package name, Category name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          app.package_name.toLowerCase().includes(q) ||
          app.category?.name.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategoryId !== 'all') {
      result = result.filter((app) => app.category_id === selectedCategoryId);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'size') {
        return (b.file_size_bytes || 0) - (a.file_size_bytes || 0);
      }
      // default: latest
      const dateA = new Date(a.published_at || a.created_at).getTime();
      const dateB = new Date(b.published_at || b.created_at).getTime();
      return dateB - dateA;
    });

    return result;
  }, [applications, searchQuery, selectedCategoryId, sortBy]);

  // Handle Developer Admin Opening
  const handleOpenAdminTrigger = () => {
    if (isAdminLoggedIn) {
      setIsAdminPanelOpen(true);
    } else {
      setIsAdminPinModalOpen(true);
    }
  };

  const handleAdminPinSuccess = () => {
    setIsAdminPinModalOpen(false);
    setIsAdminLoggedIn(true);
    setIsAdminPanelOpen(true);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setIsAdminPanelOpen(false);
  };

  // Drawer View Navigation
  const handleDrawerNavigate = (view: string) => {
    if (view === 'home') {
      setSelectedCategoryId('all');
      setSearchQuery('');
    } else if (view === 'all-apps') {
      setSelectedCategoryId('all');
    } else if (view === 'categories') {
      const elem = document.getElementById('categories-section');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    } else if (
      view === 'about-developer' ||
      view === 'privacy-data' ||
      view === 'terms-conditions' ||
      view === 'disclaimer' ||
      view === 'copyright'
    ) {
      setLegalView(view as any);
    }
  };

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'contrast' : 'dark'));
  };

  const handleSignOut = () => {
    localStorage.removeItem('dp_user_session');
    setUser(null);
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeMode === 'contrast' ? 'contrast-125' : ''}`}>
      
      {/* Top Glassmorphism Navigation Bar */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenMenu={() => setIsDrawerOpen(true)}
        onOpenAdmin={handleOpenAdminTrigger}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        user={user}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
        
        {/* Banner Section */}
        <section className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-10 border border-white/10">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Stack Cloudflare Edition • Supabase Verified</span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
              Premium APK Distribution, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Zero Compromise.</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Authentic application releases directly from verified developers. Real binary packages, live cloud storage, and cryptographic session verification.
            </p>

            {/* Quick stats banner */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{applications.length} Verified Applications</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Cloudflare & Supabase Edge</span>
              </div>
            </div>
          </div>

          {/* Background decorative glow */}
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* Categories Bar (PRD #13) */}
        <section id="categories-section" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-sky-400" />
              <h2 className="font-display font-bold text-sm sm:text-base text-white tracking-wide">
                CATEGORIES
              </h2>
            </div>
            {selectedCategoryId !== 'all' && (
              <button
                onClick={() => setSelectedCategoryId('all')}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {/* "All" button */}
            <button
              id="category-pill-all"
              onClick={() => setSelectedCategoryId('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategoryId === 'all'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'glass-card text-slate-300 hover:text-white hover:border-white/20'
              }`}
            >
              All Applications
            </button>

            {/* Category pills */}
            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`category-pill-${cat.id}`}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategoryId === cat.id
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                    : 'glass-card text-slate-300 hover:text-white hover:border-white/20'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Filter / Sort Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base text-white">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'All Releases'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 font-mono">
              {filteredApps.length}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort by:
            </span>
            <select
              id="select-sort-order"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="glass-input text-xs rounded-xl px-3 py-1.5 text-slate-200 bg-slate-900 border border-white/10"
            >
              <option value="latest" className="bg-slate-900 text-white">Latest Added</option>
              <option value="name" className="bg-slate-900 text-white">App Name (A-Z)</option>
              <option value="size" className="bg-slate-900 text-white">File Size</option>
            </select>
          </div>
        </div>

        {/* Application Catalog Grid */}
        <section id="applications-catalog">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading verified applications from database...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-3xl border border-white/10 space-y-3">
              <Layers className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="font-display font-bold text-lg text-white">No Applications Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No applications matching "${searchQuery}". Try clearing your search filters.`
                  : 'The application catalog is currently empty. Use the Developer Panel to publish real APK releases.'}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategoryId('all');
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-semibold"
                >
                  Clear All Filters
                </button>
              ) : (
                <button
                  onClick={handleOpenAdminTrigger}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold shadow-lg"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish First Application</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredApps.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onSelect={(selected) => setSelectedAppForDetails(selected)}
                  onDownload={(selected) => setSelectedAppForDownload(selected)}
                  onShare={(selected) => setSelectedAppForShare(selected)}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Footer with PRD #53 Links & Creator Notice */}
      <Footer
        onOpenLegal={(view) => setLegalView(view)}
        onOpenAdmin={handleOpenAdminTrigger}
      />

      {/* Navigation Drawer (PRD #12) */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={handleDrawerNavigate}
        user={user}
        onSignOut={handleSignOut}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAdmin={handleOpenAdminTrigger}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Application Details Modal (PRD #17) */}
      <ApplicationDetailsModal
        application={selectedAppForDetails}
        onClose={() => setSelectedAppForDetails(null)}
        onDownload={(app) => setSelectedAppForDownload(app)}
        onShare={(app) => setSelectedAppForShare(app)}
      />

      {/* 6-Stage Download Flow Modal (PRD #41-#45) */}
      <DownloadFlowModal
        application={selectedAppForDownload}
        settings={settings}
        onClose={() => setSelectedAppForDownload(null)}
      />

      {/* 5-Second Share Flow Modal (PRD #47-#48) */}
      <ShareFlowModal
        application={selectedAppForShare}
        onClose={() => setSelectedAppForShare(null)}
      />

      {/* Developer PIN Modal (PRD #10) */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={handleAdminPinSuccess}
      />

      {/* Developer Control Panel */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        categories={categories}
        settings={settings}
        onSettingsUpdate={(newSettings) => setSettings(newSettings)}
        onAppPublished={() => loadPlatformData()}
        onLogout={handleAdminLogout}
      />

      {/* Supabase Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)}
      />

      {/* Legal & Developer Info Modal */}
      <LegalModal
        view={legalView}
        onClose={() => setLegalView(null)}
      />

    </div>
  );
}
