import React, { useState } from 'react';
import { Reward, StudentRewardClaim } from '../types/index.js';
import { toPersianDigits, formatPersianDateTime } from '../utils/persianDate.js';
import { Crown, Coffee, Gamepad2, Award, Flame, Gift, Sparkles, Check, AlertCircle, Clock3 } from 'lucide-react';
import { soundManager } from '../utils/audio.js';

interface Props {
  rewards: Reward[];
  claims: StudentRewardClaim[];
  currentFP: number;
  onClaimReward: (rewardId: string) => Promise<boolean>;
  theme?: 'dark' | 'light';
}

export const RewardsStoreView: React.FC<Props> = ({
  rewards,
  claims,
  currentFP,
  onClaimReward,
  theme = 'dark',
}) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getRewardIcon = (iconName: string, isFreeConsulting?: boolean) => {
    if (isFreeConsulting) {
      return <Crown className="w-6 h-6 text-amber-400 drop-shadow" />;
    }
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-6 h-6 text-blue-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-6 h-6 text-purple-400" />;
      case 'Flame':
        return <Flame className="w-6 h-6 text-orange-400" />;
      case 'Award':
      default:
        return <Award className="w-6 h-6 text-emerald-400" />;
    }
  };

  const getLatestClaim = (rewardId: string): StudentRewardClaim | undefined => {
    return claims.filter((c) => c.rewardId === rewardId).slice(-1)[0];
  };

  const handleClaim = async (reward: Reward) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    if (currentFP < reward.cost) {
      setErrorMessage(`امتیاز شما کافی نیست. شما به ${toPersianDigits(reward.cost - currentFP)} FP بیشتر نیاز دارید.`);
      return;
    }

    setClaimingId(reward.id);
    const success = await onClaimReward(reward.id);
    setClaimingId(null);

    if (success) {
      soundManager.playRewardCoin();
      setSuccessMessage(`درخواست پاداش «${reward.title}» با موفقیت ارسال شد و پس از بررسی و تایید مشاور فعال خواهد شد.`);
    } else {
      setErrorMessage('خطا در ارسال درخواست جایزه.');
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div
        className={`p-6 rounded-3xl ${
          theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
        } border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4`}
      >
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold mb-1">
            <Gift className="w-4 h-4" />
            <span>فروشگاه پاداش‌های Focus Point</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            تبدیل تمرکز به دستاورد و افتخار
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            درخواست دریافت هر پاداش به مشاور ارسال می‌شود و پس از تایید مشاور امتیاز کسر و پاداش تقدیم شما می‌گردد.
          </p>
        </div>

        {/* Current Balance */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-purple-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 font-bold font-mono">
            FP
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400">موجودی فعلی شما</div>
            <div className="text-lg font-bold font-mono text-white tabular-nums">
              {toPersianDigits(currentFP)} <span className="text-xs text-purple-400">FP</span>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Rewards Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.filter((r) => r.active).map((reward) => {
          const canAfford = currentFP >= reward.cost;
          const isFreeConsulting = reward.isFreeConsultingMonth;
          const claim = getLatestClaim(reward.id);
          const isPending = claim?.status === 'PENDING';
          const isApproved = claim?.status === 'APPROVED';

          return (
            <div
              key={reward.id}
              className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-300 ${
                isFreeConsulting
                  ? 'bg-gradient-to-b from-purple-950/40 via-slate-900/90 to-slate-950 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20'
                  : 'bg-slate-900/80 border-white/10 hover:border-purple-500/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`p-3 rounded-2xl ${
                      isFreeConsulting
                        ? 'bg-amber-500/20 border border-amber-500/30'
                        : 'bg-slate-800 border border-white/5'
                    }`}
                  >
                    {getRewardIcon(reward.icon, isFreeConsulting)}
                  </div>
                  <div className="text-left">
                    <span
                      className={`text-sm font-bold font-mono tabular-nums px-2.5 py-1 rounded-xl ${
                        canAfford
                          ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {toPersianDigits(reward.cost)} FP
                    </span>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-100 mb-1">
                  {reward.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed min-h-[38px]">
                  {reward.description}
                </p>

                {/* Status indicator */}
                {isPending && (
                  <div className="mt-2.5 p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5">
                    <Clock3 className="w-3.5 h-3.5 shrink-0" />
                    <span>درخواست در {formatPersianDateTime(claim.claimedAt)} ثبت شد (در انتظار تایید مشاور)</span>
                  </div>
                )}
                {isApproved && (
                  <div className="mt-2.5 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>تایید شده توسط مشاور و فعال گردید</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-white/5">
                <button
                  disabled={!canAfford || claimingId === reward.id || isPending}
                  onClick={() => handleClaim(reward)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isPending
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 cursor-default'
                      : canAfford
                      ? isFreeConsulting
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {claimingId === reward.id
                      ? 'در حال ارسال درخواست...'
                      : isPending
                      ? 'در انتظار بررسی مشاور'
                      : canAfford
                      ? 'ارسال درخواست دریافت پاداش'
                      : 'امتیاز ناکافی'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
