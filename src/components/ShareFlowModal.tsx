import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  Send, 
  Twitter, 
  Facebook, 
  Mail, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import type { Application } from '../types';

interface ShareFlowModalProps {
  application: Application | null;
  onClose: () => void;
}

export const ShareFlowModal: React.FC<ShareFlowModalProps> = ({
  application,
  onClose,
}) => {
  if (!application) return null;

  const [timerSeconds, setTimerSeconds] = useState<number>(5);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Current page share link
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/#app=${application.slug || application.id}` 
    : `https://darkprimemods.pages.dev/#app=${application.slug || application.id}`;

  const shareText = `Check out ${application.name} (v${application.version_name}) on DARK PRIME MODS!`;

  useEffect(() => {
    setTimerSeconds(5);
    setIsUnlocked(false);

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsUnlocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [application]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: application.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  const shareChannels = [
    {
      name: 'WhatsApp',
      icon: MessageSquare,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-sky-500/20 text-sky-400 border-sky-500/30 hover:bg-sky-500/30',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'bg-slate-700/30 text-white border-white/20 hover:bg-white/10',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/30',
      url: `mailto:?subject=${encodeURIComponent(application.name)}&body=${encodeURIComponent(`${shareText}\n\nDownload Link: ${shareUrl}`)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        id="share-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Card */}
      <div 
        id="share-modal-container"
        className="relative z-10 w-full max-w-md glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl overflow-hidden animate-fade-in"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-sky-400" />
            <span className="font-display font-bold text-sm tracking-wider text-slate-200">
              SHARE APPLICATION
            </span>
          </div>
          <button
            id="btn-close-share-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Application details */}
        <div className="mt-4 p-3 rounded-2xl glass-card flex items-center gap-3 border border-white/5">
          <div className="w-11 h-11 rounded-xl bg-slate-800 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
            {application.icon_path ? (
              <img src={application.icon_path} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-sky-400 text-base">{application.name.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-white truncate">{application.name}</h4>
            <p className="text-[11px] text-slate-400">v{application.version_name}</p>
          </div>
        </div>

        {/* PRD #48: 5-Second Timer Gate */}
        {!isUnlocked ? (
          <div className="my-8 text-center space-y-3 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
              <span className="font-display font-extrabold text-2xl">{timerSeconds}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Preparing Share Links...</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Share buttons will unlock in {timerSeconds} second(s).
              </p>
            </div>
          </div>
        ) : (
          <div className="my-6 space-y-4 animate-fade-in">
            {/* Copy link bar */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl glass-input">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent border-none text-xs text-slate-300 px-2 py-1 truncate focus:outline-none"
              />
              <button
                id="btn-copy-share-link"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  copied 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Native Web Share button (if supported) */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                id="btn-native-share"
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/20 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Open System Share Menu</span>
              </button>
            )}

            {/* Social Share Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {shareChannels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <a
                    key={channel.name}
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${channel.color}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{channel.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center pt-2 text-[11px] text-slate-500">
          Direct canonical link to this application's download page.
        </div>
      </div>
    </div>
  );
};
