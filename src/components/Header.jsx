import React from 'react';
import { Calendar, RefreshCw, Smartphone, ShieldCheck } from 'lucide-react';

export default function Header({ title, subtitle, period, setPeriod, onRefresh, isLoading, onOpenDownloadModal }) {
  const todayStr = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Mobile App Download Button */}
        <button
          onClick={onOpenDownloadModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#ca1535] border border-red-200 text-xs font-bold transition-all shadow-sm active:scale-95"
          title="مسح QR Code لتحميل تطبيق الموبايل"
        >
          <Smartphone className="w-4 h-4 text-[#ca1535]" />
          <span className="hidden sm:inline">تحميل تطبيق الهاتف (APK)</span>
        </button>

        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200/80">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>{todayStr}</span>
        </div>

        {/* Period Selector (when on dashboard) */}
        {setPeriod && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'all' ? 'bg-[#ca1535] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'today' ? 'bg-[#ca1535] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'week' ? 'bg-[#ca1535] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'month' ? 'bg-[#ca1535] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هذا الشهر
            </button>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 active:rotate-180 transition-transform"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#ca1535]' : ''}`} />
        </button>

        {/* Protection Badge */}
        <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>حماية وتشفير محلي</span>
        </div>
      </div>
    </header>
  );
}
