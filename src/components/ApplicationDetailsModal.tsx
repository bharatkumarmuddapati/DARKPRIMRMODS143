import React from 'react';
import { X, Download, Share2, Package, Calendar, HardDrive, Tag, ShieldCheck, FileCheck } from 'lucide-react';
import type { Application } from '../types';
import { formatBytes } from '../lib/apkParser';

interface ApplicationDetailsModalProps {
  application: Application | null;
  onClose: () => void;
  onDownload: (app: Application) => void;
  onShare: (app: Application) => void;
}

export const ApplicationDetailsModal: React.FC<ApplicationDetailsModalProps> = ({
  application,
  onClose,
  onDownload,
  onShare,
}) => {
  if (!application) return null;

  const publishedDate = application.published_at 
    ? new Date(application.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date(application.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        id="app-details-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
      />

      {/* Modal Card */}
      <div 
        id={`app-details-modal-${application.id}`}
        className="relative z-10 w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl overflow-hidden animate-fade-in"
      >
        {/* Close Button */}
        <button
          id="btn-close-details"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/15 shrink-0 overflow-hidden flex items-center justify-center shadow-xl">
            {application.icon_path ? (
              <img
                src={application.icon_path}
                alt={`${application.name} icon`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="font-display font-black text-3xl text-sky-400">
                {application.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight truncate">
              {application.name}
            </h2>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <Package className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-mono truncate">{application.package_name}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/25">
                Version {application.version_name}
              </span>
              {application.category?.name && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                  {application.category.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* PRD #17 Metadata Fields */}
        <div className="mt-6 rounded-2xl glass-card p-4 border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-400">
              <HardDrive className="w-4 h-4 text-slate-400" />
              File Size
            </span>
            <span className="font-semibold text-slate-200">
              {formatBytes(application.file_size_bytes)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm border-t border-white/5 pt-2.5">
            <span className="flex items-center gap-2 text-slate-400">
              <Tag className="w-4 h-4 text-slate-400" />
              Category
            </span>
            <span className="font-semibold text-slate-200">
              {application.category?.name || 'Android Apps'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm border-t border-white/5 pt-2.5">
            <span className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-4 h-4 text-slate-400" />
              Published Date
            </span>
            <span className="font-semibold text-slate-200">
              {publishedDate}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm border-t border-white/5 pt-2.5">
            <span className="flex items-center gap-2 text-slate-400">
              <FileCheck className="w-4 h-4 text-slate-400" />
              Package Archive
            </span>
            <span className="font-mono text-xs text-sky-300">
              .APK (Android)
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            id="btn-details-download"
            onClick={() => {
              onDownload(application);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/25 active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download APK</span>
          </button>

          <button
            id="btn-details-share"
            onClick={() => {
              onShare(application);
              onClose();
            }}
            className="p-3.5 rounded-xl glass-card text-slate-200 hover:text-white hover:border-white/20 active:scale-95 transition-all"
            title="Share Application"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
