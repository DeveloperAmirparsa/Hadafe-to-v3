import React, { useState } from 'react';
import { Lock, User, Sparkles, Sun, Moon, ArrowLeft } from 'lucide-react';
import { FooterBar } from './FooterBar.js';

interface Props {
  onLogin: (username: string, pass: string) => Promise<boolean>;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const LoginScreen: React.FC<Props> = ({
  onLogin,
  theme,
  onToggleTheme,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('لطفاً نام کاربری و رمز عبور را به صورت کامل وارد فرمایید.');
      return;
    }

    setError(null);
    setIsLoading(true);
    const success = await onLogin(username.trim(), password);
    setIsLoading(false);

    if (!success) {
      setError('نام کاربری یا رمز عبور اشتباه است. لطفاً مجدداً بررسی فرمایید.');
    }
  };

  return (
    <div
      data-theme={theme}
      className={`app-shell min-h-screen w-full flex flex-col items-center justify-center relative p-4 transition-colors duration-300 selection:bg-purple-500/30 selection:text-purple-200 ${
        theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
      }`}
    >
      {/* Background Decorative Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[550px] h-96 sm:h-[550px] bg-gradient-to-tr from-purple-600/20 via-indigo-600/15 to-blue-500/20 rounded-full blur-3xl opacity-70 animate-pulse duration-7000" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar Actions */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-600/30 border border-white/20 shrink-0">
            <span className="text-sm font-black text-white">هدف</span>
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight block">سامانه «هدف تو»</span>
            <span className="text-[11px] text-purple-400 font-medium">پلتفرم مدیریت و هدایت کنکور</span>
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          className={`p-2.5 rounded-2xl transition-all border shrink-0 ${
            theme === 'dark'
              ? 'bg-slate-900/80 hover:bg-slate-800 border-white/10 text-slate-300'
              : 'bg-white/80 hover:bg-slate-100 border-slate-200 text-slate-700'
          }`}
          title={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}
          aria-label="تغییر تم"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Glass Card Form Container */}
      <div className="flex-1 w-full flex items-center justify-center my-6 z-10 px-2">
        <div
          className={`w-full max-w-md p-6 sm:p-9 rounded-3xl border transition-all duration-300 ${
            theme === 'dark'
              ? 'glass-panel-dark border-purple-500/20 shadow-[0_20px_60px_-15px_rgba(147,51,234,0.25)]'
              : 'glass-panel-light border-purple-300/40 shadow-[0_20px_60px_-15px_rgba(147,51,234,0.15)]'
          }`}
        >
          {/* Brand Lockup */}
          <div className="text-center mb-7">
            <h1 className="text-2xl font-black tracking-tight mb-1">ورود به حساب کاربری</h1>
            <p className="text-xs text-slate-400">
              «هر روز، یک قدم نزدیک‌تر.»
            </p>
          </div>

          {/* Error notification banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs text-center font-medium animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                نام کاربری:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="نام کاربری خود را وارد نمایید"
                  dir="ltr"
                  className={`w-full py-3 px-3.5 pl-10 rounded-2xl border text-sm font-mono tracking-wide text-right placeholder:text-right placeholder:font-sans placeholder:tracking-normal transition-all focus:outline-none ${
                    theme === 'dark'
                      ? 'bg-slate-900/90 border-white/10 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-500'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-400'
                  }`}
                  required
                  autoFocus
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رمز عبور:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور خود را وارد نمایید"
                  dir="ltr"
                  className={`w-full py-3 px-3.5 pl-10 rounded-2xl border text-sm font-mono tracking-widest text-right placeholder:text-right placeholder:font-sans placeholder:tracking-normal transition-all focus:outline-none ${
                    theme === 'dark'
                      ? 'bg-slate-900/90 border-white/10 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-500'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-400'
                  }`}
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isLoading ? (
                <span>در حال اعتبارسنجی اطلاعات...</span>
              ) : (
                <>
                  <span>ورود به سامانه</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Luxury Glass Footer with animated RGB gradient text stuck to bottom */}
      <div className="w-full max-w-5xl mx-auto px-4 pb-4 mt-auto z-10">
        <FooterBar theme={theme} className="mt-0" />
      </div>
    </div>
  );
};
