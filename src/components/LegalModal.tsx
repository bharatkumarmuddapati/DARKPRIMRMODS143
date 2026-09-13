import React from 'react';
import { X, ShieldAlert, FileText, AlertCircle, Copyright, UserCheck } from 'lucide-react';

interface LegalModalProps {
  view: 'about-developer' | 'privacy-data' | 'terms-conditions' | 'disclaimer' | 'copyright' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ view, onClose }) => {
  if (!view) return null;

  const getContent = () => {
    switch (view) {
      case 'about-developer':
        return {
          title: 'ABOUT DEVELOPER',
          icon: UserCheck,
          content: (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center font-display font-black text-2xl text-white shadow-lg">
                  BK
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-white">BHARAT KUMAR</h4>
                  <p className="text-sky-400 font-medium text-xs">Architect & Lead Developer</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">DARK PRIME MODS Platform Creator</p>
                </div>
              </div>
              <p>
                DARK PRIME MODS was conceived and engineered by <strong className="text-white">Bharat Kumar</strong> to redefine mobile application distribution through modern serverless infrastructure, uncompromising performance, and authentic cloud architecture.
              </p>
              <p>
                Powered by Cloudflare Pages, Cloudflare Workers, and Supabase PostgreSQL, this platform delivers instant edge performance, zero simulated mockups, and transparent application distribution.
              </p>
              <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400">
                Contact: <span className="text-sky-300">support@darkprimemods.com</span>
              </div>
            </div>
          ),
        };

      case 'privacy-data':
        return {
          title: 'PRIVACY & DATA POLICY',
          icon: ShieldAlert,
          content: (
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                At DARK PRIME MODS, we hold privacy and transparency as paramount principles. We do not engage in silent telemetry harvesting or tracking across third-party networks.
              </p>
              <h5 className="font-bold text-white text-xs pt-1">1. Information We Process</h5>
              <p>
                When you initiate a download session, temporary cryptographically signed tokens are minted in database memory to ensure session validity and prevent automated abuse. IP hashes are processed transiently for rate-limiting.
              </p>
              <h5 className="font-bold text-white text-xs pt-1">2. Storage & Security</h5>
              <p>
                Developer credentials and tokens are hashed using SHA-256 before verification. We never store plaintext passwords or developer PINs.
              </p>
              <h5 className="font-bold text-white text-xs pt-1">3. Cookies & Local State</h5>
              <p>
                We only store essential session identifiers for authentication and dark theme visual preferences.
              </p>
            </div>
          ),
        };

      case 'terms-conditions':
        return {
          title: 'TERMS & CONDITIONS',
          icon: FileText,
          content: (
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Welcome to DARK PRIME MODS. By browsing this repository, accessing application files, or utilizing our distribution network, you agree to these Terms and Conditions.
              </p>
              <h5 className="font-bold text-white text-xs pt-1">1. Permitted Use</h5>
              <p>
                Users are permitted to download application archives for personal, non-commercial evaluation and testing purposes.
              </p>
              <h5 className="font-bold text-white text-xs pt-1">2. Integrity of Distribution</h5>
              <p>
                Automated scraping, denial-of-service attempts, or circumventing download session verification stages is strictly prohibited and subject to automated IP lockout.
              </p>
              <h5 className="font-bold text-white text-xs pt-1">3. Modifications</h5>
              <p>
                DARK PRIME MODS reserves the right to revise or update available releases at any time without prior notice.
              </p>
            </div>
          ),
        };

      case 'disclaimer':
        return {
          title: 'DISCLAIMER',
          icon: AlertCircle,
          content: (
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                All trademarks, logos, brand names, and application assets referenced on DARK PRIME MODS are the property of their respective owners.
              </p>
              <p>
                Application packages distributed here are submitted by developers for archival and testing purposes. DARK PRIME MODS does not claim ownership of proprietary trademarks belonging to third-party entities.
              </p>
              <p>
                Users are advised to exercise discretion and scan all downloaded binaries prior to installation on primary devices.
              </p>
            </div>
          ),
        };

      case 'copyright':
      default:
        return {
          title: 'COPYRIGHT NOTICE',
          icon: Copyright,
          content: (
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 font-mono text-center text-xs">
                <p className="font-bold text-white">CREATED BY BHARAT KUMAR</p>
                <p className="text-slate-400 mt-1">© 2026 ALL RIGHTS RESERVED</p>
              </div>
              <p>
                The visual layout, user interface components, software architecture, and styling systems of DARK PRIME MODS are proprietary intellectual property designed and implemented by Bharat Kumar.
              </p>
              <p>
                Unauthorized duplication, reproduction, or redistribution of this platform codebase or visual brand identity is prohibited.
              </p>
            </div>
          ),
        };
    }
  };

  const { title, icon: Icon, content } = getContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        id="legal-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Box */}
      <div 
        id="legal-modal-box"
        className="relative z-10 w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl overflow-hidden animate-fade-in"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Icon className="w-5 h-5 text-sky-400" />
            <h3 className="font-display font-extrabold text-sm sm:text-base text-white tracking-wide">
              {title}
            </h3>
          </div>
          <button
            id="btn-close-legal-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 max-h-[60vh] overflow-y-auto pr-1">
          {content}
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
          <span>DARK PRIME MODS • Cloudflare Edition</span>
          <span>Version 1.0</span>
        </div>
      </div>
    </div>
  );
};
