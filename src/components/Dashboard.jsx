import React from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  Coins, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  ChevronLeft,
  Info
} from 'lucide-react';

export default function Dashboard({ stats, recentTransactions, onNavigateToTransactions, settings }) {
  const feeRate = settings?.fee_per_1000 || '50';
  const costRate = settings?.cost_per_1000 || '10';

  // Format currency in Egyptian Pounds
  const fmt = (num) => {
    return Number(num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const incomingPct = stats.totalCount > 0 
    ? Math.round((stats.incomingCount / stats.totalCount) * 100) 
    : 0;
  const withdrawalPct = stats.totalCount > 0 
    ? Math.round((stats.withdrawalCount / stats.totalCount) * 100) 
    : 0;
  const otherPct = 100 - (incomingPct + withdrawalPct);

  return (
    <div className="space-y-6">
      {/* 1. Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Incoming */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-red-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">إجمالي الوارد</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {fmt(stats.totalIncomingEGP)} <span className="text-sm font-semibold text-slate-500">ج</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#ca1535] flex items-center justify-center font-bold shadow-inner">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="text-emerald-600 font-bold">{stats.incomingCount}</span> معاملة واردة
          </div>
        </div>

        {/* Total Withdrawals */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">إجمالي المسحوبات</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {fmt(stats.totalWithdrawalsEGP)} <span className="text-sm font-semibold text-slate-500">ج</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-inner">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="text-emerald-600 font-bold">{stats.withdrawalCount}</span> عملية سحب نقدي
          </div>
        </div>

        {/* Total Expenses / Costs */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">إجمالي المصاريف</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {fmt(stats.totalCostEGP)} <span className="text-sm font-semibold text-slate-500">ج</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-inner">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            تكاليف السحب المقدرة
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-gradient-to-br from-[#ca1535] to-[#8c0f25] text-white rounded-2xl p-6 shadow-md shadow-red-900/10 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-red-100 mb-2">إجمالي الربح الصافي</p>
              <h3 className="text-3xl font-black tracking-tight text-white">
                {fmt(stats.totalProfitEGP)} <span className="text-sm font-semibold text-red-200">ج</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold backdrop-blur-sm">
              <Coins className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12% مقارنة بالفترة السابقة</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Profit Breakdown & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Withdrawal Profit Summary Formula */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-100 text-[#ca1535] flex items-center justify-center font-bold">
                <Coins className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">ملخص أرباح الخدمة ورسوم السحب</h4>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
              حساب فوري
            </span>
          </div>

          {/* Formula calculation visualization matching Image 1 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center my-2">
            {/* Service Fees */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">رسوم الخدمة</p>
              <p className="text-xl font-black text-slate-800">{fmt(stats.totalFeesEGP)} ج</p>
            </div>

            <div className="text-2xl font-black text-slate-400 hidden md:block">−</div>

            {/* Expenses */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">مصاريف السحب</p>
              <p className="text-xl font-black text-amber-900">{fmt(stats.totalCostEGP)} ج</p>
            </div>

            <div className="text-2xl font-black text-slate-400 hidden md:block">=</div>

            {/* Net Profit */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-700 mb-1">الربح الصافي</p>
              <p className="text-2xl font-black text-emerald-700">{fmt(stats.totalProfitEGP)} ج</p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>الحساب حسب الإعدادات الحالية: <strong className="text-slate-700">{feeRate} ج</strong> لكل 1,000 ج – مصاريف سحبنا <strong className="text-slate-700">{costRate} ج</strong> لكل 1,000 ج</span>
          </div>
        </div>

        {/* Transaction Distribution Donut / Metric */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-extrabold text-slate-800 text-sm">توزيع المعاملات</h4>
            <span className="text-xs font-semibold text-slate-400">إجمالي {stats.totalCount} عملية</span>
          </div>

          <div className="flex items-center justify-around py-3">
            {/* Visual Ring / Circle Indicator */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-1000"
                  strokeDasharray={`${incomingPct}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-red-500 transition-all duration-1000"
                  strokeDasharray={`${withdrawalPct}, 100`}
                  strokeDashoffset={`-${incomingPct}`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-800">{stats.totalCount}</span>
                <span className="text-[10px] font-bold text-slate-400">معاملة</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">وارد</span>
                <span className="font-bold text-slate-900 mr-auto">({incomingPct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-slate-600">مسحوبات</span>
                <span className="font-bold text-slate-900 mr-auto">({withdrawalPct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                <span className="text-slate-600">أخرى</span>
                <span className="font-bold text-slate-900 mr-auto">({otherPct}%)</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <span className="text-[11px] text-slate-400 font-medium">محدث فورياً مع وصول كل رسالة</span>
          </div>
        </div>

      </div>

      {/* 3. Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-slate-800 text-base">آخر المعاملات المسجلة</h4>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {recentTransactions.length}
            </span>
          </div>
          <button
            onClick={onNavigateToTransactions}
            className="flex items-center gap-1.5 text-xs font-bold text-[#ca1535] hover:text-[#900c28] bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <span>عرض كل المعاملات</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">الوقت والتاريخ</th>
                <th className="py-3.5 px-5">العميل / الرقم</th>
                <th className="py-3.5 px-5">النوع</th>
                <th className="py-3.5 px-5">المبلغ</th>
                <th className="py-3.5 px-5">رسوم الخدمة</th>
                <th className="py-3.5 px-5">مصاريف السحب</th>
                <th className="py-3.5 px-5">الربح الصافي</th>
                <th className="py-3.5 px-5 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    لا توجد معاملات مسجلة حتى الآن
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => {
                  const isIncoming = tx.type === 'INCOMING';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {tx.timestamp}
                      </td>
                      <td className="py-3 px-5 text-slate-900 font-bold font-mono">
                        {tx.senderOrRecipient}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        {isIncoming ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            وارد
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-bold text-[11px]">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            سحب
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 font-black text-slate-900 whitespace-nowrap">
                        {fmt(tx.amountEGP)} ج
                      </td>
                      <td className="py-3 px-5 font-bold text-slate-700 whitespace-nowrap">
                        {tx.feeEGP > 0 ? `${fmt(tx.feeEGP)} ج` : '−'}
                      </td>
                      <td className="py-3 px-5 font-bold text-amber-700 whitespace-nowrap">
                        {tx.costEGP > 0 ? `${fmt(tx.costEGP)} ج` : '−'}
                      </td>
                      <td className="py-3 px-5 font-black text-emerald-700 whitespace-nowrap">
                        {tx.profitEGP > 0 ? `${fmt(tx.profitEGP)} ج` : '−'}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          مكتملة
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
