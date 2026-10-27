import React from 'react';
import { 
  ArrowDown, 
  ArrowUp, 
  Wallet, 
  Coins, 
  Plus, 
  Check, 
  ChevronDown, 
  Calendar, 
  Info,
  Clock,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export default function Dashboard({ 
  stats, 
  recentTransactions = [], 
  onNavigateToTransactions, 
  period = 'week', 
  setPeriod, 
  settings,
  onRefresh
}) {
  const feeRate = settings?.fee_per_1000 || '50';
  const costRate = settings?.cost_per_1000 || '10';

  const fmt = (num) => {
    return Number(num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const handleVerify = async (txId) => {
    try {
      const res = await fetch(`/api/transactions/${txId}/verify`, { method: 'POST' });
      const data = await res.json();
      if (data.success && onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to verify transaction:', err);
    }
  };

  const handleDeliver = async (txId) => {
    try {
      const res = await fetch(`/api/transactions/${txId}/deliver`, { method: 'POST' });
      const data = await res.json();
      if (data.success && onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to mark delivered:', err);
    }
  };

  // Percentages for donut
  const totalCount = stats.totalCount || 0;
  const incomingCount = stats.incomingCount || 0;
  const withdrawalCount = stats.withdrawalCount || 0;
  const otherCount = stats.otherCount || 0;

  const incomingPct = totalCount > 0 ? Math.round((incomingCount / totalCount) * 100) : 0;
  const withdrawalPct = totalCount > 0 ? Math.round((withdrawalCount / totalCount) * 100) : 0;
  const otherPct = totalCount > 0 ? Math.max(0, 100 - (incomingPct + withdrawalPct)) : 0;

  return (
    <div className="space-y-6 text-right select-none">
      
      {/* Top Header Row Matching Image 1 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">لوحة التحكم</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">متابعة معاملات فودافون كاش والأرباح</p>
        </div>

        {/* Date Filter Dropdown Matching Image 1 */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-sm text-xs font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 font-normal">الفترة:</span>
          <select 
            value={period} 
            onChange={(e) => setPeriod && setPeriod(e.target.value)}
            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
          >
            <option value="today">اليوم</option>
            <option value="week">آخر 7 أيام</option>
            <option value="month">هذا الشهر</option>
            <option value="all">كل الفترات</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* 4 KPI Cards Matching Image 1 Color Palette & Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: إجمالي الوارد (Red soft tint) */}
        <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-5 shadow-sm relative flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-700">إجمالي الوارد</span>
            <div className="w-9 h-9 rounded-xl bg-red-100 text-[#ca1535] flex items-center justify-center font-bold">
              <ArrowDown className="w-4 h-4 text-[#ca1535]" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {fmt(stats.totalIncomingEGP || 0)}
            </span>
            <span className="text-sm font-bold text-slate-700 mr-1.5">ج</span>
          </div>
        </div>

        {/* Card 2: إجمالي المسحوبات (Mint Green soft tint) */}
        <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-5 shadow-sm relative flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-700">إجمالي المسحوبات</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <ArrowUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {fmt(stats.totalWithdrawalsEGP || 0)}
            </span>
            <span className="text-sm font-bold text-slate-700 mr-1.5">ج</span>
          </div>
        </div>

        {/* Card 3: إجمالي المصاريف (Warm Yellow/Amber soft tint) */}
        <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-2xl p-5 shadow-sm relative flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-700">إجمالي المصاريف</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {fmt(stats.totalCostEGP || 0)}
            </span>
            <span className="text-sm font-bold text-slate-700 mr-1.5">ج</span>
          </div>
        </div>

        {/* Card 4: إجمالي الربح الصافي (Soft Blue/Lavender tint) */}
        <div className="bg-[#f5f3ff] border border-[#ddd6fe] rounded-2xl p-5 shadow-sm relative flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-700">إجمالي الربح الصافي</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {fmt(stats.totalProfitEGP || 0)}
              </span>
              <span className="text-sm font-bold text-slate-700 mr-1.5">ج</span>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Row: Profit Breakdown Formula + Donut Chart Matching Image 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left/Center (7 cols): ملخص الربح من السحب */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-[#ca1535] flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-800">ملخص الربح من السحب</h3>
            </div>

            {/* Formula Block Matching Image 1 */}
            <div className="grid grid-cols-5 gap-2 items-center text-center">
              
              {/* رسوم الخدمة */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">رسوم الخدمة</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {fmt(stats.totalFeesEGP || 0)} ج
                </span>
              </div>

              <span className="text-2xl font-black text-slate-400">−</span>

              {/* مصاريف السحب */}
              <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-red-700 block mb-1">مصاريف السحب</span>
                <span className="text-xl font-black text-red-900 font-mono">
                  {fmt(stats.totalCostEGP || 0)} ج
                </span>
              </div>

              <span className="text-2xl font-black text-slate-400">=</span>

              {/* الربح الصافي */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-emerald-800 block mb-1">الربح الصافي</span>
                <span className="text-xl font-black text-emerald-700 font-mono">
                  {fmt(stats.totalProfitEGP || 0)} ج
                </span>
              </div>

            </div>
          </div>

          {/* Footnote Matching Image 1 */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              الحساب حسب الإعدادات الحالية: <strong className="text-slate-800">{feeRate} ج</strong> لكل 1,000 ج – مصاريف سحبنا <strong className="text-slate-800">{costRate} ج</strong>
            </span>
          </div>
        </div>

        {/* Right (5 cols): توزيع المعاملات Donut Chart Matching Image 1 */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-sm text-slate-800">توزيع المعاملات</h3>
          </div>

          <div className="flex items-center justify-around py-2">
            {/* Donut graphic */}
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
                  className="text-emerald-500"
                  strokeDasharray={`${incomingPct}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-red-500"
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
                <span className="text-2xl font-black text-slate-900 font-mono">{totalCount}</span>
                <span className="text-[10px] font-bold text-slate-400">معاملة</span>
              </div>
            </div>

            {/* Legend Matching Image 1 */}
            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span className="text-slate-600">وارد</span>
                <span className="font-bold text-slate-900 font-mono">{incomingCount} ({incomingPct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-red-500"></span>
                <span className="text-slate-600">مسحوبات</span>
                <span className="font-bold text-slate-900 font-mono">{withdrawalCount} ({withdrawalPct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-400"></span>
                <span className="text-slate-600">أخرى</span>
                <span className="font-bold text-slate-900 font-mono">{otherCount} ({otherPct}%)</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            محدث آلياً مع كل إشعار SMS
          </div>
        </div>

      </div>

      {/* Bottom Table: آخر المعاملات Matching Image 1 Exactly */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        {/* Table Header Row */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={onNavigateToTransactions}
            className="flex items-center gap-1 text-xs font-bold text-[#ca1535] bg-red-50 hover:bg-red-100 px-3.5 py-1.5 rounded-xl transition-colors border border-red-200"
          >
            <span>عرض الكل</span>
            <Plus className="w-3.5 h-3.5" />
          </button>

          <h3 className="font-extrabold text-base text-slate-800">آخر المعاملات</h3>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">الوقت</th>
                <th className="py-3 px-5">العميل / الرقم</th>
                <th className="py-3 px-5">النوع</th>
                <th className="py-3 px-5">المبلغ الإجمالي</th>
                <th className="py-3 px-5 text-emerald-800 bg-emerald-50/60 font-black">المسلّم للمستفيد (كاش)</th>
                <th className="py-3 px-5">رسوم الخدمة (5%)</th>
                <th className="py-3 px-5">مصاريف السحب</th>
                <th className="py-3 px-5">الربح</th>
                <th className="py-3 px-5 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentTransactions.map((tx) => {
                const isIncoming = tx.type === 'INCOMING';
                const payoutEGP = tx.beneficiaryPayoutEGP !== undefined
                  ? tx.beneficiaryPayoutEGP
                  : (isIncoming ? Math.max(0, tx.amountEGP - (tx.feeEGP || Math.round((tx.amountEGP * 50) / 1000))) : tx.amountEGP);

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Time */}
                    <td className="py-3 px-5 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                      {tx.timestamp}
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-5 font-mono font-bold text-slate-900">
                      {tx.senderOrRecipient}
                    </td>

                    {/* Type Badge Matching Image 1 */}
                    <td className="py-3 px-5 whitespace-nowrap">
                      {isIncoming ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                          <span>↓ وارد</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-bold text-[11px] border border-red-200">
                          <span>↑ سحب</span>
                        </span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-5 font-black text-slate-900 whitespace-nowrap">
                      {fmt(tx.amountEGP)} ج
                    </td>

                    {/* Beneficiary Payout */}
                    <td className="py-3 px-5 whitespace-nowrap bg-emerald-50/30">
                      {isIncoming ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-300 font-mono">
                          <span>{fmt(payoutEGP)}</span>
                          <span className="text-[10px] font-bold">ج</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">−</span>
                      )}
                    </td>

                    {/* Service Fee */}
                    <td className="py-3 px-5 font-bold text-slate-700 whitespace-nowrap">
                      {tx.feeEGP > 0 ? `${fmt(tx.feeEGP)} ج` : `${fmt(Math.round((tx.amountEGP * 50) / 1000))} ج`}
                    </td>

                    {/* Withdrawal Expense */}
                    <td className="py-3 px-5 font-bold text-amber-700 whitespace-nowrap">
                      {tx.costEGP > 0 ? `${fmt(tx.costEGP)} ج` : '−'}
                    </td>

                    {/* Profit */}
                    <td className="py-3 px-5 font-black text-emerald-700 whitespace-nowrap">
                      {tx.profitEGP > 0 ? `${fmt(tx.profitEGP)} ج` : '−'}
                    </td>

                    {/* Multi-Stage Status: رسالة فقط غير مؤكدة -> تأكيد التحويل -> تم تسليم المبلغ -> مكتملة */}
                    <td className="py-3 px-5 text-center">
                      {tx.status === 'OBSERVED' ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>رسالة فقط غير مؤكدة</span>
                          </span>
                          <button
                            onClick={() => handleVerify(tx.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-all shadow-sm active:scale-95 whitespace-nowrap"
                            title="تأكيد وصول المبلغ في المحفظة واحتساب العمولة"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>تأكيد التحويل</span>
                          </button>
                        </div>
                      ) : tx.status === 'VERIFIED' ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            <span>تم التأكيد (بانتظار التسليم)</span>
                          </span>
                          <button
                            onClick={() => handleDeliver(tx.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#ca1535] hover:bg-[#b0102c] text-white font-bold text-[10px] transition-all shadow-sm active:scale-95 whitespace-nowrap"
                            title="تسليم المبلغ نقداً للمستفيد وإتمام المعاملة نهائياً"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>تم تسليم المبلغ</span>
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>مكتملة ومُسلّمة</span>
                        </span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
