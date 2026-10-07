import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Package,
  Award,
  Tag,
  Coffee,
  Sparkles,
  Flame,
  Check,
  AlertCircle,
  Crown,
  Gamepad2,
  Sunrise,
  Target,
  Zap,
  Activity,
  Trophy,
  HeartPulse,
  Compass,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { StoreProduct, InventoryItem, Student, RarityType } from '../types/index.js';
import { toPersianDigits, formatPersianDateTime } from '../utils/persianDate.js';
import { soundManager } from '../utils/audio.js';

interface Props {
  student: Student;
  currentFP: number;
  onUpdateStudent: (freshStudent: Student) => void;
  theme?: 'dark' | 'light';
}

const RARITY_CONFIG: Record<
  RarityType,
  { label: string; border: string; bg: string; text: string; glow: string }
> = {
  معمولی: {
    label: 'معمولی',
    border: 'border-slate-500/40',
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    glow: '',
  },
  کمیاب: {
    label: 'کمیاب',
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
  },
  حماسی: {
    label: 'حماسی',
    border: 'border-purple-500/50',
    bg: 'bg-purple-500/20',
    text: 'text-purple-300',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
  },
  'افسانه‌ای': {
    label: 'افسانه‌ای',
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
  },
  'اسطوره‌ای': {
    label: 'اسطوره‌ای',
    border: 'border-rose-500/60 ring-1 ring-rose-500/30',
    bg: 'bg-gradient-to-r from-rose-500/20 via-purple-500/20 to-amber-500/20',
    text: 'text-rose-300',
    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]',
  },
};

export const StoreInventoryView: React.FC<Props> = ({
  student,
  currentFP,
  onUpdateStudent,
  theme = 'dark',
}) => {
  const [activeTab, setActiveTabState] = useState<'store' | 'inventory'>(() => {
    if (typeof window === 'undefined') return 'store';
    const saved = window.sessionStorage.getItem('hadafeto:store-active-tab');
    return saved === 'inventory' ? 'inventory' : 'store';
  });

  const setActiveTab = (tab: 'store' | 'inventory') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('hadafeto:store-active-tab', tab);
    }
  };

  const [storeCategoryFilter, setStoreCategoryFilterState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'ALL';
    return window.sessionStorage.getItem('hadafeto:store-category-filter') || 'ALL';
  });

  const setStoreCategoryFilter = (cat: string) => {
    setStoreCategoryFilterState(cat);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('hadafeto:store-category-filter', cat);
    }
  };

  const [inventoryCategoryFilter, setInventoryCategoryFilterState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'ALL';
    return window.sessionStorage.getItem('hadafeto:inventory-category-filter') || 'ALL';
  });

  const setInventoryCategoryFilter = (cat: string) => {
    setInventoryCategoryFilterState(cat);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('hadafeto:inventory-category-filter', cat);
    }
  };

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [operatingItemId, setOperatingItemId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch store products and inventory
  const loadData = async () => {
    try {
      const [prodRes, invRes] = await Promise.all([
        fetch('/api/store/products'),
        fetch(`/api/inventory?studentId=${student.id}`),
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (invRes.ok) setInventory(await invRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [student.id]);

  const getProductIcon = (icon: string) => {
    switch (icon) {
      case 'Target':
        return <Target className="w-5 h-5 text-purple-400" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-blue-400" />;
      case 'Sunrise':
        return <Sunrise className="w-5 h-5 text-amber-400" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'Tag':
        return <Tag className="w-5 h-5 text-indigo-400" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-emerald-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-rose-400" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-cyan-400" />;
      case 'Award':
      default:
        return <Award className="w-5 h-5 text-purple-400" />;
    }
  };

  // Check if permanent item is already owned
  const isAlreadyOwned = (product: StoreProduct) => {
    if (product.isConsumable) return false;
    return inventory.some(
      (i) =>
        i.productId === product.id ||
        (product.badgeId && i.badgeId === product.badgeId) ||
        (product.titleId && i.titleId === product.titleId)
    );
  };

  // Handle Purchase
  const handlePurchase = async (product: StoreProduct) => {
    if (purchasingId) return;
    setSuccessMessage(null);
    setErrorMessage(null);

    if (currentFP < product.cost) {
      setErrorMessage(`امتیاز تمرکز کافی نیست. کسری: ${toPersianDigits(product.cost - currentFP)} FP`);
      return;
    }

    setPurchasingId(product.id);
    try {
      const res = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundManager.playRewardCoin();
        setSuccessMessage(`خرید با موفقیت انجام شد: «${product.title}» به موجودی شما افزوده گردید.`);
        if (data.student) onUpdateStudent(data.student);
        await loadData();
      } else {
        setErrorMessage(data.error || 'خطا در انجام خرید محصول.');
      }
    } catch {
      setErrorMessage('خطای ارتباط با سرور.');
    } finally {
      setPurchasingId(null);
    }
  };

  // Handle Equip
  const handleEquip = async (item: InventoryItem) => {
    if (operatingItemId) return;
    setOperatingItemId(item.id);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/inventory/${item.id}/equip`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        soundManager.playBadgeUnlock();
        setSuccessMessage(`آیتم «${item.title}» با موفقیت مجهز گردید.`);
        if (data.student) onUpdateStudent(data.student);
        await loadData();
      } else {
        setErrorMessage(data.error || 'خطا در تجهیز آیتم.');
      }
    } catch {
      setErrorMessage('خطای ارتباط با سرور.');
    } finally {
      setOperatingItemId(null);
    }
  };

  // Handle Unequip
  const handleUnequip = async (item: InventoryItem) => {
    if (operatingItemId) return;
    setOperatingItemId(item.id);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/inventory/${item.id}/unequip`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`تجهیز «${item.title}» لغو شد.`);
        if (data.student) onUpdateStudent(data.student);
        await loadData();
      } else {
        setErrorMessage(data.error || 'خطا در لغو تجهیز آیتم.');
      }
    } catch {
      setErrorMessage('خطای ارتباط با سرور.');
    } finally {
      setOperatingItemId(null);
    }
  };

  // Handle Consume
  const handleConsume = async (item: InventoryItem) => {
    if (operatingItemId) return;
    if (!window.confirm(`آیا از مصرف «${item.title}» اطمینان دارید؟ این عمل یک‌باره است.`)) return;

    setOperatingItemId(item.id);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/inventory/${item.id}/consume`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        soundManager.playRewardCoin();
        setSuccessMessage(`آیتم «${item.title}» با موفقیت مصرف گردید.`);
        await loadData();
      } else {
        setErrorMessage(data.error || 'خطا در مصرف آیتم.');
      }
    } catch {
      setErrorMessage('خطای ارتباط با سرور.');
    } finally {
      setOperatingItemId(null);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (storeCategoryFilter === 'ALL') return true;
    if (storeCategoryFilter === 'BADGE') return p.category === 'BADGE';
    if (storeCategoryFilter === 'TITLE') return p.category === 'TITLE';
    if (storeCategoryFilter === 'CONSUMABLE') return p.category === 'CONSUMABLE';
    if (storeCategoryFilter === 'SPECIAL') return p.category === 'SPECIAL';
    return true;
  });

  // Filtered Inventory
  const filteredInventory = inventory.filter((i) => {
    if (inventoryCategoryFilter === 'ALL') return true;
    if (inventoryCategoryFilter === 'BADGE') return i.itemType === 'BADGE';
    if (inventoryCategoryFilter === 'TITLE') return i.itemType === 'TITLE';
    if (inventoryCategoryFilter === 'CONSUMABLE') return i.itemType === 'CONSUMABLE';
    return true;
  });

  return (
    <div className="w-full space-y-6">
      {/* Top Banner & FP Balance Display */}
      <div
        className={`p-6 sm:p-7 rounded-3xl glass-primary border ${
          theme === 'dark' ? 'border-purple-500/25 bg-slate-900/80' : 'border-indigo-200/50 bg-white/80'
        } flex flex-col md:flex-row md:items-center justify-between gap-5`}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-purple-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>بوتیک و گنجینه تمرکز هدف تو</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            فروشگاه پاداش‌ها و موجودی دیجیتال
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            امتیازهای کسب‌شده از پارت‌ها، استمرار و تست‌ها را به نشان‌های پرستیژ، عنوان‌های هویتی و مجوزهای ویژه تبدیل کنید.
          </p>
        </div>

        {/* Focus Point Widget */}
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple-950/60 to-slate-900/90 border border-purple-500/30 flex items-center gap-4 shrink-0 shadow-lg shadow-purple-600/10">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-200 font-black font-mono text-lg shadow-inner">
            FP
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">موجودی در دسترس</span>
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {toPersianDigits(currentFP)} <span className="text-xs text-purple-400 font-sans">امتیاز</span>
            </span>
          </div>
        </div>
      </div>

      {/* Primary Tab Switcher: Store vs Inventory */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-slate-900/70 p-1.5 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'store'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>فروشگاه محصولات</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono">
              {toPersianDigits(products.length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>موجودی من</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono">
              {toPersianDigits(inventory.length)}
            </span>
          </button>
        </div>

        {/* Secondary Category Filters */}
        {activeTab === 'store' ? (
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'ALL', label: 'همه' },
              { id: 'BADGE', label: 'نشان‌ها' },
              { id: 'TITLE', label: 'عنوان‌ها' },
              { id: 'CONSUMABLE', label: 'استراحت' },
              { id: 'SPECIAL', label: 'ویژه' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setStoreCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl transition-all font-medium cursor-pointer ${
                  storeCategoryFilter === cat.id
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'ALL', label: 'همه' },
              { id: 'BADGE', label: 'نشان‌ها' },
              { id: 'TITLE', label: 'عنوان‌ها' },
              { id: 'CONSUMABLE', label: 'مصرفی' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setInventoryCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl transition-all font-medium cursor-pointer ${
                  inventoryCategoryFilter === cat.id
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notification Banners */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================
          TAB 1: STORE CATALOG
      ======================================================== */}
      {activeTab === 'store' && (
        <>
          {filteredProducts.length === 0 ? (
            <div className="p-16 text-center rounded-3xl glass-secondary text-slate-400 space-y-2 border border-white/5">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <h3 className="text-base font-bold text-slate-300">
                هنوز محصولی در فروشگاه وجود ندارد
              </h3>
              <p className="text-xs text-slate-500">
                محصولات و جوایز جدید به زودی توسط استاد مشاور افزوده خواهند شد.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => {
                const rarityStyle = RARITY_CONFIG[p.rarity] || RARITY_CONFIG['معمولی'];
                const owned = isAlreadyOwned(p);
                const canAfford = currentFP >= p.cost;
                const isBuying = purchasingId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                      p.featured
                        ? 'bg-gradient-to-b from-purple-950/40 via-slate-900/90 to-slate-950 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20'
                        : 'glass-secondary border-white/10 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges: Category + Rarity */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rarityStyle.border} ${rarityStyle.bg} ${rarityStyle.text} ${rarityStyle.glow}`}
                        >
                          {rarityStyle.label}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {p.isConsumable ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-medium">
                              مصرفی
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-medium">
                              دائمی
                            </span>
                          )}

                          {p.featured && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[10px] font-bold">
                              ویژه
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Icon + Title */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-3 rounded-2xl bg-white/5 border border-white/10 shrink-0 ${
                            p.featured ? 'border-purple-400/30' : ''
                          }`}
                        >
                          {getProductIcon(p.icon)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-slate-100 leading-snug">
                            {p.title}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Price + Purchase Action */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">قیمت محصول</span>
                        <div className="flex items-center gap-1 font-mono font-black text-sm text-white">
                          <span>{toPersianDigits(p.cost)}</span>
                          <span className="text-[10px] text-purple-400 font-sans">FP</span>
                        </div>
                      </div>

                      {owned ? (
                        <button
                          type="button"
                          disabled
                          className="py-2.5 px-4 rounded-xl bg-slate-800/80 text-slate-400 text-xs font-bold border border-white/5 cursor-not-allowed flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>مالک آیتم هستید</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford || isBuying}
                          onClick={() => handlePurchase(p)}
                          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            canAfford
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 active:scale-98'
                              : 'bg-slate-800 text-slate-400 border border-white/10'
                          }`}
                        >
                          {isBuying ? (
                            <span>در حال پردازش...</span>
                          ) : canAfford ? (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>خرید و دریافت</span>
                            </>
                          ) : (
                            <span>کسری موجودی FP</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================
          TAB 2: INVENTORY & EQUIP SYSTEM
      ======================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Active Equipment Summary Header */}
          <div
            className={`p-5 rounded-3xl glass-secondary border ${
              theme === 'dark' ? 'border-purple-500/20 bg-purple-950/10' : 'border-indigo-200/50'
            } flex flex-col md:flex-row md:items-center justify-between gap-4`}
          >
            <div>
              <span className="text-[11px] text-purple-400 font-bold block mb-1">
                تجهیزات و هویت فعال شما در سالن مطالعه و تورنمنت
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">عنوان فعال:</span>
                  {student.equippedTitle ? (
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-600/30 text-purple-200 border border-purple-500/40 text-xs font-bold">
                      «{student.equippedTitle}»
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">انتخاب نشده</span>
                  )}
                </div>

                <span className="text-slate-600">·</span>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">نشان‌های مجهز (حداکثر ۳ نشان):</span>
                  {student.equippedBadges && student.equippedBadges.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {student.equippedBadges.map((b) => (
                        <span
                          key={b}
                          className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-500/30 text-xs font-medium flex items-center gap-1"
                        >
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>{b}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">نشانی تجهیز نشده</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {filteredInventory.length === 0 ? (
            <div className="p-16 text-center rounded-3xl glass-secondary text-slate-400 space-y-2 border border-white/5">
              <Package className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <h3 className="text-base font-bold text-slate-300">
                هنوز آیتمی در موجودی شما نیست
              </h3>
              <p className="text-xs text-slate-500">
                از بخش فروشگاه خرید کنید یا با تکمیل دستاوردها نشان‌های ویژه به دست آورید.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item) => {
                const rarityStyle = RARITY_CONFIG[item.rarity] || RARITY_CONFIG['معمولی'];
                const isOperating = operatingItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                      item.isEquipped
                        ? 'border-purple-500/50 bg-purple-950/25 shadow-[0_0_25px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30'
                        : item.isConsumed
                        ? 'opacity-60 bg-slate-900/40 border-white/5'
                        : 'glass-secondary border-white/10 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rarityStyle.border} ${rarityStyle.bg} ${rarityStyle.text}`}
                        >
                          {rarityStyle.label}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {item.itemType === 'TITLE' && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-[10px] font-medium">
                              عنوان هویتی
                            </span>
                          )}
                          {item.itemType === 'BADGE' && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 text-[10px] font-medium">
                              نشان افتخار
                            </span>
                          )}
                          {item.itemType === 'CONSUMABLE' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] font-medium">
                              مصرفی
                            </span>
                          )}

                          {item.isEquipped && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold shadow-sm">
                              مجهز
                            </span>
                          )}

                          {item.isConsumed && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/10 text-[10px]">
                              مصرف شده
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Icon + Title */}
                      <div className="flex items-start gap-3">
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shrink-0">
                          {getProductIcon(item.icon)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-slate-100 leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Actions */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatPersianDateTime(item.acquiredAt)}
                      </span>

                      {/* Action buttons based on type */}
                      {item.itemType === 'TITLE' && (
                        <>
                          {item.isEquipped ? (
                            <button
                              type="button"
                              disabled={isOperating}
                              onClick={() => handleUnequip(item)}
                              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/10 transition-all cursor-pointer"
                            >
                              لغو تجهیز عنوان
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isOperating}
                              onClick={() => handleEquip(item)}
                              className="py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                            >
                              تجهیز این عنوان
                            </button>
                          )}
                        </>
                      )}

                      {item.itemType === 'BADGE' && (
                        <>
                          {item.isEquipped ? (
                            <button
                              type="button"
                              disabled={isOperating}
                              onClick={() => handleUnequip(item)}
                              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/10 transition-all cursor-pointer"
                            >
                              لغو تجهیز نشان
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isOperating}
                              onClick={() => handleEquip(item)}
                              className="py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                            >
                              تجهیز این نشان
                            </button>
                          )}
                        </>
                      )}

                      {item.itemType === 'CONSUMABLE' && (
                        <>
                          {item.isConsumed ? (
                            <span className="text-xs text-slate-500 font-medium">استفاده شده</span>
                          ) : (
                            <button
                              type="button"
                              disabled={isOperating}
                              onClick={() => handleConsume(item)}
                              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                            >
                              استفاده از پاداش
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
