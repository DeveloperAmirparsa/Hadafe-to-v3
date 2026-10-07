import React, { useState } from 'react';
import { Lock, User, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onLogin: (username: string, pass: string) => Promise<boolean>;
  onClose?: () => void;
}

export const LoginModal: React.FC<Props> = ({
  isOpen,
  onLogin,
  onClose,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('لطفاً نام کاربری و رمز عبور را وارد نمایید.');
      return;
    }
    setError(null);
    setIsLoading(true);
    const success = await onLogin(username.trim(), password);
    setIsLoading(false);
    if (!success) {
      setError('نام کاربری یا رمز عبور اشتباه است.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900 border border-purple-500/30 text-white shadow-[0_0_50px_rgba(168,85,247,0.25)] text-xs">
        {/* Optional close button if user already has an active session */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute left-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Brand Lockup */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-600/40">
            <span className="text-lg font-black text-white">هدف</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">سامانه «هدف تو»</h1>
          <p className="text-xs text-purple-300/80 mt-1">«هر روز، یک قدم نزدیک‌تر.»</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-center font-medium animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {/* Secure Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">نام کاربری اختصاصی:</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری حساب خود را وارد کنید"
                dir="ltr"
                className="w-full py-2.5 px-3 pl-9 rounded-xl bg-slate-800 border border-white/10 text-white font-mono text-sm tracking-wide text-right placeholder:text-right placeholder:font-sans placeholder:tracking-normal focus:border-purple-500 focus:outline-none placeholder:text-slate-500"
                required
                autoFocus
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">رمز عبور:</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="w-full py-2.5 px-3 pl-9 rounded-xl bg-slate-800 border border-white/10 text-white font-mono text-sm tracking-widest text-right placeholder:text-right placeholder:font-sans placeholder:tracking-normal focus:border-purple-500 focus:outline-none placeholder:text-slate-500"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold transition-all shadow-md shadow-purple-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? 'در حال بررسی اطلاعات...' : 'ورود به سامانه'}
          </button>
        </form>
      </div>
    </div>
  );
};
