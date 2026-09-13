import React from 'react';
import { 
  X, 
  Home, 
  Layers, 
  Grid, 
  UserCheck, 
  Moon, 
  Sun, 
  User, 
  ShieldAlert, 
  FileText, 
  AlertCircle, 
  Copyright, 
  LogOut, 
  LogIn, 
  Code2,
  ExternalLink
} from 'lucide-react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  user: any;
  onSignOut: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  themeMode: 'dark' | 'contrast';
  onToggleTheme: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  user,
  onSignOut,
  onOpenAuth,
  onOpenAdmin,
  themeMode,
  onToggleTheme,
}) => {
  if (!isOpen) return null;

  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        id="drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Drawer Body */}
      <aside 
        id="navigation-drawer"
        className="relative z-10 w-full max-w-xs h-full glass-panel border-l border-white/10 flex flex-col justify-between overflow-y-auto p-5 shadow-2xl animate-slide-left"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 className="font-display font-bold text-lg text-white tracking-wide">
                DARK PRIME <span className="text-sky-400">MODS</span>
              </h2>
              <p className="text-xs text-slate-400">Cloudflare APK Platform</p>
            </div>
            <button
              id="btn-close-drawer"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Status Card */}
          <div className="my-4 p-3 rounded-xl glass-card border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
                {user?.email ? user.email[0].toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-slate-400 font-medium">Session Status</p>
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user ? user.email : 'Guest Visitor'}
                </p>
              </div>
            </div>
          </div>

          {/* PRD #12 Navigation Menu */}
          <nav className="space-y-1">
            {/* 1. Home */}
            <button
              id="nav-item-home"
              onClick={() => handleItemClick(() => onNavigate('home'))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Home className="w-4 h-4 text-sky-400" />
              <span>Home</span>
            </button>

            {/* 2. All Apps */}
            <button
              id="nav-item-all-apps"
              onClick={() => handleItemClick(() => onNavigate('all-apps'))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>All Apps</span>
            </button>

            {/* 3. Categories */}
            <button
              id="nav-item-categories"
              onClick={() => handleItemClick(() => onNavigate('categories'))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Grid className="w-4 h-4 text-sky-400" />
              <span>Categories</span>
            </button>

            {/* 4. About Developer */}
            <button
              id="nav-item-about"
              onClick={() => handleItemClick(() => onNavigate('about-developer'))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
            >
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>About Developer</span>
            </button>

            {/* 5. Theme Mode */}
            <button
              id="nav-item-theme"
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                {themeMode === 'dark' ? (
                  <Moon className="w-4 h-4 text-amber-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
                <span>Theme Mode</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 capitalize">
                {themeMode}
              </span>
            </button>

            {/* 6. My Account */}
            <button
              id="nav-item-account"
              onClick={() => handleItemClick(user ? () => onNavigate('account') : onOpenAuth)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
            >
              <User className="w-4 h-4 text-sky-400" />
              <span>My Account</span>
            </button>

            {/* Divider */}
            <div className="py-2">
              <div className="h-px bg-white/10" />
            </div>

            {/* 7. Privacy & Data */}
            <button
              id="nav-item-privacy"
              onClick={() => handleItemClick(() => onNavigate('privacy-data'))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Privacy & Data</span>
            </button>

            {/* 8. Terms & Conditions */}
            <button
              id="nav-item-terms"
              onClick={() => handleItemClick(() => onNavigate('terms-conditions'))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Terms & Conditions</span>
            </button>

            {/* 9. Disclaimer */}
            <button
              id="nav-item-disclaimer"
              onClick={() => handleItemClick(() => onNavigate('disclaimer'))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Disclaimer</span>
            </button>

            {/* 10. Copyright */}
            <button
              id="nav-item-copyright"
              onClick={() => handleItemClick(() => onNavigate('copyright'))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Copyright className="w-4 h-4 text-slate-400" />
              <span>Copyright</span>
            </button>

            {/* Developer Access Button */}
            <button
              id="nav-item-developer-access"
              onClick={() => handleItemClick(onOpenAdmin)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors"
            >
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>Developer Panel</span>
            </button>
          </nav>
        </div>

        {/* Footer of Drawer: Auth Action */}
        <div className="pt-4 border-t border-white/10">
          {user ? (
            <button
              id="nav-item-signout"
              onClick={() => handleItemClick(onSignOut)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              id="nav-item-signin"
              onClick={() => handleItemClick(onOpenAuth)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 border border-sky-500/30 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}

          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-500">
              CREATED BY BHARAT KUMAR
            </p>
            <p className="text-[10px] text-slate-600">
              © 2026 ALL RIGHTS RESERVED
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
};
