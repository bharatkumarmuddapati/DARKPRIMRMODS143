import React, { useState } from 'react';
import { X, Lock, ShieldAlert, KeyRound, Loader2, AlertTriangle } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [pin, setPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setIsLoading(true);
    setErrorMsg('');

    const res = await ApiService.verifyDeveloperPin(pin.trim());
    setIsLoading(false);

    if (res.success) {
      setPin('');
      onSuccess();
    } else {
      setErrorMsg(res.error || 'Access Denied: Invalid Developer PIN');
      if (res.attemptsRemaining !== undefined) {
        setAttemptsRemaining(res.attemptsRemaining);
      }
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 12) {
      setPin((prev) => prev + digit);
    }
  };

  const handleKeypadClear = () => {
    setPin('');
  };

  const handleKeypadBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        id="pin-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
      />

      {/* Modal Box */}
      <div 
        id="pin-modal-box"
        className="relative z-10 w-full max-w-sm glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl overflow-hidden animate-fade-in text-center"
      >
        <button
          id="btn-close-pin-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10">
          <Lock className="w-8 h-8" />
        </div>

        {/* PRD #10 Exact Display Titles */}
        <div className="mt-4">
          <h2 className="font-display font-extrabold text-lg text-white tracking-wide">
            DEVELOPER ACCESS REQUIRED
          </h2>
          <p className="text-xs text-amber-400/90 font-medium mt-1 tracking-wider uppercase">
            PLEASE ENTER DEVELOPER PIN
          </p>
        </div>

        {/* Error / Lockout Warning */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2 text-left">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p>{errorMsg}</p>
              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <p className="mt-1 font-semibold text-[11px] text-rose-400">
                  {attemptsRemaining} attempt(s) remaining before security cooldown.
                </p>
              )}
            </div>
          </div>
        )}

        {/* PIN Input Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="relative">
            <input
              id="developer-pin-input"
              type="password"
              inputMode="numeric"
              maxLength={12}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="w-full glass-input text-center rounded-xl py-3 text-xl tracking-[0.4em] font-mono font-bold text-white placeholder-slate-600 focus:border-amber-400"
            />
          </div>

          {/* Quick Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit.toString())}
                className="py-2.5 rounded-xl glass-card text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleKeypadClear}
              className="py-2.5 rounded-xl glass-card text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-white/10 active:scale-95 transition-all"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-2.5 rounded-xl glass-card text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleKeypadBackspace}
              className="py-2.5 rounded-xl glass-card text-xs font-semibold text-slate-400 hover:text-amber-400 hover:bg-white/10 active:scale-95 transition-all"
            >
              ⌫
            </button>
          </div>

          <button
            id="btn-verify-developer-pin"
            type="submit"
            disabled={isLoading || !pin.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>AUTHENTICATE DEVELOPER</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-[11px] text-slate-500">
          Server-side SHA-256 protected with rate limiting and automated lockout.
        </p>
      </div>
    </div>
  );
};
