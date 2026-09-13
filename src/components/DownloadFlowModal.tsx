import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  Instagram, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Loader2,
  ExternalLink
} from 'lucide-react';
import type { Application, SiteSettings } from '../types';
import { ApiService } from '../services/apiService';
import { formatBytes } from '../lib/apkParser';

interface DownloadFlowModalProps {
  application: Application | null;
  settings: SiteSettings;
  onClose: () => void;
}

export const DownloadFlowModal: React.FC<DownloadFlowModalProps> = ({
  application,
  settings,
  onClose,
}) => {
  if (!application) return null;

  const [stage, setStage] = useState<number>(1); // 1 to 6
  const [secondsRemaining, setSecondsRemaining] = useState<number>(settings.stage_1_timer_sec || 20);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [isTaskOpened, setIsTaskOpened] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [downloadTriggered, setDownloadTriggered] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize server session on mount
  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      if (!application) return;
      try {
        const res = await ApiService.createDownloadSession(application.id);
        if (res.success && res.sessionToken && isMounted) {
          setSessionToken(res.sessionToken);
          setSecondsRemaining(res.stageDurationSeconds || 20);
          setStage(1);
        } else if (isMounted) {
          setErrorMsg(res.error || 'Unable to establish secure download session.');
        }
      } catch {
        if (isMounted) setErrorMsg('Network error initializing download session.');
      }
    }

    initSession();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [application]);

  // Handle countdown timer for timed stages (1, 3, 5)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Only stages 1, 3, 5 are countdown timers
    if (stage === 1 || stage === 3 || stage === 5) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, sessionToken]);

  // Called when client countdown hits 0
  const handleTimerComplete = async () => {
    if (!sessionToken) return;

    if (stage === 1) {
      // Transition from Stage 1 (20s) to Stage 2 (Instagram task)
      setIsVerifying(true);
      const res = await ApiService.advanceDownloadStage(sessionToken);
      setIsVerifying(false);
      if (res.success) {
        setStage(2);
      } else {
        setErrorMsg(res.error || 'Failed to verify Stage 1 timer.');
      }
    } else if (stage === 3) {
      // Transition from Stage 3 (10s) to Stage 4 (Continue Button)
      setIsVerifying(true);
      const res = await ApiService.advanceDownloadStage(sessionToken);
      setIsVerifying(false);
      if (res.success) {
        setStage(4);
      } else {
        setErrorMsg(res.error || 'Failed to verify Stage 3 timer.');
      }
    } else if (stage === 5) {
      // Transition from Stage 5 (5s) to Stage 6 (Download APK button)
      setIsVerifying(true);
      const res = await ApiService.advanceDownloadStage(sessionToken);
      setIsVerifying(false);
      if (res.success) {
        setStage(6);
      } else {
        setErrorMsg(res.error || 'Failed to verify Stage 5 timer.');
      }
    }
  };

  // Stage 2: User clicks "OPEN INSTAGRAM"
  const handleOpenInstagram = () => {
    const instagramUrl = settings.instagram_url || 'https://instagram.com/darkprimemods';
    window.open(instagramUrl, '_blank', 'noopener,noreferrer');
    setIsTaskOpened(true);
  };

  // Stage 2: User confirms follow task
  const handleConfirmTask = async () => {
    if (!isTaskOpened) {
      setErrorMsg('Please tap "OPEN INSTAGRAM" to visit and complete the follow task first.');
      return;
    }
    setErrorMsg('');
    setIsVerifying(true);

    const res = await ApiService.completeSocialTask(sessionToken);
    setIsVerifying(false);

    if (res.success) {
      setStage(3);
      setSecondsRemaining(res.stageDurationSeconds || settings.stage_3_timer_sec || 10);
    } else {
      setErrorMsg(res.error || 'Unable to verify task completion. Please retry.');
    }
  };

  // Stage 4: User clicks "CONTINUE"
  const handleContinueClick = async () => {
    setIsVerifying(true);
    setErrorMsg('');
    const res = await ApiService.advanceDownloadStage(sessionToken);
    setIsVerifying(false);

    if (res.success) {
      setStage(5);
      setSecondsRemaining(res.stageDurationSeconds || settings.stage_5_timer_sec || 5);
    } else {
      setErrorMsg(res.error || 'Session verification error.');
    }
  };

  // Stage 6: Final Download button clicked
  const handleFinalDownload = async () => {
    if (!application) return;
    setIsVerifying(true);
    setErrorMsg('');

    const res = await ApiService.getSignedDownloadUrl(sessionToken, application.id);
    setIsVerifying(false);

    if (res.success && res.downloadUrl) {
      setDownloadUrl(res.downloadUrl);
      setDownloadTriggered(true);

      // Trigger actual browser download
      const link = document.createElement('a');
      link.href = res.downloadUrl;
      link.download = `${application.slug || application.name}.apk`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      setErrorMsg(res.error || 'Failed to acquire verified signed download link.');
    }
  };

  const getProgressPercentage = () => {
    switch (stage) {
      case 1:
        const total1 = settings.stage_1_timer_sec || 20;
        return Math.round(((total1 - secondsRemaining) / total1) * 25);
      case 2:
        return 35;
      case 3:
        const total3 = settings.stage_3_timer_sec || 10;
        return 50 + Math.round(((total3 - secondsRemaining) / total3) * 20);
      case 4:
        return 75;
      case 5:
        const total5 = settings.stage_5_timer_sec || 5;
        return 80 + Math.round(((total5 - secondsRemaining) / total5) * 15);
      case 6:
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        id="download-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Box */}
      <div 
        id="download-flow-container"
        className="relative z-10 w-full max-w-md glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl overflow-hidden animate-fade-in"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="font-display font-bold text-sm tracking-wider text-slate-200">
              DOWNLOAD VERIFICATION
            </span>
          </div>
          <button
            id="btn-close-download-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Application Info Mini Bar */}
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
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>v{application.version_name}</span>
              <span>•</span>
              <span>{formatBytes(application.file_size_bytes)}</span>
            </div>
          </div>
        </div>

        {/* Stage Steps Indicator */}
        <div className="mt-5">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-400 font-medium">Stage {stage} of 6</span>
            <span className="text-sky-400 font-mono font-semibold">{getProgressPercentage()}% Complete</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-300 rounded-full"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STAGE CONTENT RENDER */}
        <div className="mt-6 min-h-[200px] flex flex-col items-center justify-center text-center">

          {/* STAGE 1: 20-Second Timer */}
          {stage === 1 && (
            <div className="w-full space-y-4 animate-fade-in">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-white/10 fill-none"
                    strokeWidth="7"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-sky-400 fill-none transition-all duration-1000"
                    strokeWidth="7"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * (20 - secondsRemaining)) / 20}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display font-black text-3xl text-white">
                    {secondsRemaining}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Seconds
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-white">Preparing Download Session</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Generating secure transfer token. Please wait for stage validation to complete.
                </p>
              </div>
            </div>
          )}

          {/* STAGE 2: Social Task (Instagram Follow) */}
          {stage === 2 && (
            <div className="w-full space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/20 mx-auto">
                <Instagram className="w-8 h-8 text-white" />
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-white">Follow on Instagram</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Follow DARK PRIME MODS on Instagram to unlock your download session.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  id="btn-open-instagram"
                  onClick={handleOpenInstagram}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-rose-500 to-amber-500 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>OPEN INSTAGRAM</span>
                </button>

                <button
                  id="btn-confirm-instagram-task"
                  onClick={handleConfirmTask}
                  disabled={isVerifying}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs border transition-all ${
                    isTaskOpened 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' 
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>I Have Followed (Continue)</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: 10-Second Timer */}
          {stage === 3 && (
            <div className="w-full space-y-4 animate-fade-in">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-white/10 fill-none"
                    strokeWidth="7"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-amber-400 fill-none transition-all duration-1000"
                    strokeWidth="7"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * (10 - secondsRemaining)) / 10}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display font-black text-2xl text-white">
                    {secondsRemaining}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                    Seconds
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-white">Verifying Task & Link</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Social follow verification verified. Securing cloud storage channel.
                </p>
              </div>
            </div>
          )}

          {/* STAGE 4: Continue Button */}
          {stage === 4 && (
            <div className="w-full space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-white">Verification Ready</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Click continue to proceed to the final download link generation.
                </p>
              </div>

              <div className="pt-2">
                <button
                  id="btn-stage-4-continue"
                  onClick={handleContinueClick}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>CONTINUE</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STAGE 5: 5-Second Timer */}
          {stage === 5 && (
            <div className="w-full space-y-4 animate-fade-in">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-white/10 fill-none"
                    strokeWidth="7"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-indigo-400 fill-none transition-all duration-1000"
                    strokeWidth="7"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * (5 - secondsRemaining)) / 5}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display font-black text-2xl text-white">
                    {secondsRemaining}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                    Seconds
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-white">Final Security Check</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Preparing your direct APK download link...
                </p>
              </div>
            </div>
          )}

          {/* STAGE 6: Download APK Button */}
          {stage === 6 && (
            <div className="w-full space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-sky-500/30">
                <Download className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-display font-bold text-xl text-white">Your APK is Ready!</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  File verification passed. Click below to start the direct APK download.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  id="btn-stage-6-download-apk"
                  onClick={handleFinalDownload}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-600 hover:from-sky-300 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-sky-500/30 active:scale-[0.98] transition-all"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>DOWNLOAD APK NOW</span>
                    </>
                  )}
                </button>

                {downloadTriggered && (
                  <p className="text-[11px] text-emerald-400 font-medium">
                    Download initiated in your browser! Check your notifications or downloads folder.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Security watermark */}
        <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400/80" />
            Encrypted Session Token
          </span>
          <span className="font-mono text-[10px]">
            {sessionToken ? `${sessionToken.slice(0, 8)}...` : 'Initializing'}
          </span>
        </div>
      </div>
    </div>
  );
};
