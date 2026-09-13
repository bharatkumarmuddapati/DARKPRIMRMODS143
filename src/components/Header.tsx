import React from 'react';
import { Search, Menu, ShieldCheck, User as UserIcon, X, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMenu: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  user: any;
  isAdminLoggedIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenMenu,
  onOpenAdmin,
  onOpenAuth,
  user,
  isAdminLoggedIn,
}) => {
  const isCloudConnected = isSupabaseConfigured();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div 
            id="brand-logo"
            className="flex items-center gap-2 cursor-pointer select-none group"
            onClick={() => onSearchChange('')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <span className="font-display font-black text-white text-lg tracking-wider">DP</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-base sm:text-lg tracking-wider text-white">
                  DARK PRIME <span className="text-sky-400">MODS</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight hidden sm:block">
                Cloudflare & Supabase APK Distribution
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-lg relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search apps, package names, categories..."
              className="w-full glass-input rounded-xl pl-10 pr-9 py-2 text-sm text-slate-100 placeholder-slate-400 focus:border-sky-400"
            />
            {searchQuery && (
              <button
                id="btn-clear-search"
                onClick={() => onSearchChange('')}
                className="absolute right-3 text-slate-400 hover:text-white p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Admin / Developer Access Key */}
          <button
            id="btn-header-admin"
            onClick={onOpenAdmin}
            title={isAdminLoggedIn ? "Developer Panel (Unlocked)" : "Developer Access Required"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isAdminLoggedIn 
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25' 
                : 'glass-card text-slate-300 hover:text-sky-400 hover:border-sky-500/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden md:inline">{isAdminLoggedIn ? "Dev Mode" : "Admin"}</span>
          </button>

          {/* User Account / Auth */}
          <button
            id="btn-header-auth"
            onClick={onOpenAuth}
            className="glass-card flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:border-white/20 transition-all"
            title={user ? `Signed in as ${user.email}` : "Sign In / Register"}
          >
            <UserIcon className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">
              {user ? (user.email?.split('@')[0] || 'Account') : 'Sign In'}
            </span>
          </button>

          {/* Hamburger Menu Button */}
          <button
            id="btn-header-hamburger"
            onClick={onOpenMenu}
            className="p-2 rounded-xl glass-card text-slate-200 hover:text-white hover:border-sky-400/40 transition-colors"
            aria-label="Open Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

        </div>

      </div>
    </header>
  );
};
