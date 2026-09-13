import React from 'react';

interface FooterProps {
  onOpenLegal: (view: 'about-developer' | 'privacy-data' | 'terms-conditions' | 'disclaimer' | 'copyright') => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, onOpenAdmin }) => {
  return (
    <footer className="w-full glass-panel border-t border-white/10 mt-16 px-4 py-8 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-6">
        
        {/* Brand info */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              DP
            </div>
            <span className="font-display font-extrabold text-base tracking-wider text-white">
              DARK PRIME <span className="text-sky-400">MODS</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Full-Stack Application Distribution Platform on Cloudflare Pages & Supabase Backend
          </p>
        </div>

        {/* PRD #53 Mandatory Links */}
        <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-400">
          <button
            id="footer-link-about"
            onClick={() => onOpenLegal('about-developer')}
            className="hover:text-sky-400 transition-colors"
          >
            ABOUT DEVELOPER
          </button>
          <span className="text-slate-700 hidden sm:inline">•</span>

          <button
            id="footer-link-disclaimer"
            onClick={() => onOpenLegal('disclaimer')}
            className="hover:text-sky-400 transition-colors"
          >
            DISCLAIMER
          </button>
          <span className="text-slate-700 hidden sm:inline">•</span>

          <button
            id="footer-link-copyright"
            onClick={() => onOpenLegal('copyright')}
            className="hover:text-sky-400 transition-colors"
          >
            COPYRIGHT
          </button>
          <span className="text-slate-700 hidden sm:inline">•</span>

          <button
            id="footer-link-terms"
            onClick={() => onOpenLegal('terms-conditions')}
            className="hover:text-sky-400 transition-colors"
          >
            TERMS AND CONDITIONS
          </button>
          <span className="text-slate-700 hidden sm:inline">•</span>

          <button
            id="footer-link-privacy"
            onClick={() => onOpenLegal('privacy-data')}
            className="hover:text-sky-400 transition-colors"
          >
            PRIVACY & DATA
          </button>
          <span className="text-slate-700 hidden sm:inline">•</span>

          <button
            id="footer-link-admin"
            onClick={onOpenAdmin}
            className="text-amber-400/80 hover:text-amber-300 transition-colors"
          >
            DEVELOPER PANEL
          </button>
        </nav>

        {/* PRD #53 Mandatory Copyright & Creator Text */}
        <div className="pt-4 border-t border-white/5 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium">
          <div className="tracking-wider">
            CREATED BY <strong className="text-white font-bold">BHARAT KUMAR</strong>
          </div>
          <div>
            © 2026 ALL RIGHTS RESERVED
          </div>
        </div>

      </div>
    </footer>
  );
};
