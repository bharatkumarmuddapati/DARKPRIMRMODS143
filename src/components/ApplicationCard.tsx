import React from 'react';
import { Download, Share2, Package, Calendar, HardDrive, Tag } from 'lucide-react';
import type { Application } from '../types';
import { formatBytes } from '../lib/apkParser';

interface ApplicationCardProps {
  application: Application;
  onSelect: (app: Application) => void;
  onDownload: (app: Application) => void;
  onShare: (app: Application) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onSelect,
  onDownload,
  onShare,
}) => {
  const publishedDate = application.published_at 
    ? new Date(application.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date(application.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

  return (
    <div 
      id={`app-card-${application.id}`}
      className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between group cursor-pointer"
      onClick={() => onSelect(application)}
    >
      <div>
        {/* Top: Icon + App Name + Version */}
        <div className="flex items-start gap-3.5">
          {/* App Icon */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center shadow-md">
            {application.icon_path ? (
              <img
                src={application.icon_path}
                alt={`${application.name} icon`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display font-bold text-xl text-sky-400">
                {application.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name & Package */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base sm:text-lg text-white truncate group-hover:text-sky-400 transition-colors">
                {application.name}
              </h3>
            </div>

            <div className="flex items-center gap-1 text-[12px] text-slate-400 mt-0.5 truncate">
              <Package className="w-3 h-3 shrink-0 text-slate-500" />
              <span className="font-mono text-[11px] truncate text-slate-400">
                {application.package_name}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/20">
                v{application.version_name}
              </span>

              {application.category?.name && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/5 text-slate-300 border border-white/10">
                  <Tag className="w-2.5 h-2.5 text-slate-400" />
                  <span>{application.category.name}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metadata stats bar (Real numbers only) */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatBytes(application.file_size_bytes)}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{publishedDate}</span>
          </div>
        </div>
      </div>

      {/* Actions: Download APK + Share */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          id={`btn-download-${application.id}`}
          onClick={() => onDownload(application)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download APK</span>
        </button>

        <button
          id={`btn-share-${application.id}`}
          onClick={() => onShare(application)}
          title="Share Application"
          className="p-2.5 rounded-xl glass-card text-slate-300 hover:text-white hover:border-white/20 active:scale-95 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
