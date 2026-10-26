import React, { useState } from 'react';
import { 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  Coins, 
  Filter
} from 'lucide-react';

export default function Reports({ transactions }) {
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const fmt = (num) => {
    return Number(num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const filtered = transactions.filter((tx) => {
    const txDate = tx.timestamp?.slice(0, 10);
    if (!txDate) return true;
    return txDate >= startDate && txDate <= endDate;
  });

  let totalIn = 0;
  let totalOut = 0;
  let totalCost = 0;
  let totalProfit = 0;

  filtered.forEach((tx) => {
    if (tx.type === 'INCOMING') {
      totalIn += tx.amountEGP || 0;
    } else if (tx.type === 'WITHDRAWAL') {
      totalOut += tx.amountEGP || 0;
    }
    totalCost += tx.costEGP || 0;
    totalProfit += tx.profitEGP || 0;
  });

  const exportCSV = () => {
    const headers = 'رقم العملية,الوقت,الطرف الآخر,النوع,المبلغ,رسوم الخدمة,مصاريف السحب,الربح الصافي\n';
    const rows = filtered.map(t => 
      `"${t.referenceNumber}","${t.timestamp}","${t.senderOrRecipient}","${t.type === 'INCOMING' ? 'وارد' : 'سحب'}","${t.amountEGP}","${t.feeEGP}","${t.costEGP}","${t.profitEGP}"`
    ).join('\n');
    
    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_معاملات_AMN_Cash_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Date Filter & Export Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>من:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#ca1535]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>إلى:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#ca1535]"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel (CSV)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Period Summary Cards (Matching Mockup 1: تقرير لفترة محددة) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 text-center shadow-sm">
          <span className="text-xs font-bold text-slate-500 block mb-1">الوارد</span>
          <span className="text-2xl font-black text-slate-900 font-mono">{fmt(totalIn)} ج</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 text-center shadow-sm">
          <span className="text-xs font-bold text-slate-500 block mb-1">المسحوبات</span>
          <span className="text-2xl font-black text-slate-900 font-mono">{fmt(totalOut)} ج</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 text-center shadow-sm">
          <span className="text-xs font-bold text-amber-700 block mb-1">المصاريف</span>
          <span className="text-2xl font-black text-amber-900 font-mono">{fmt(totalCost)} ج</span>
        </div>

        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 text-center shadow-sm">
          <span className="text-xs font-bold text-emerald-700 block mb-1">الربح الصافي</span>
          <span className="text-2xl font-black text-emerald-700 font-mono">{fmt(totalProfit)} ج</span>
        </div>
      </div>

      {/* Filtered Period Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-extrabold text-slate-800 text-sm">
            معاملات الفترة ({filtered.length} معاملة)
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">رقم العملية</th>
                <th className="py-3 px-4">التاريخ والوقت</th>
                <th className="py-3 px-4">الطرف الآخر</th>
                <th className="py-3 px-4">النوع</th>
                <th className="py-3 px-4">المبلغ</th>
                <th className="py-3 px-4">رسوم الخدمة</th>
                <th className="py-3 px-4">مصاريف السحب</th>
                <th className="py-3 px-4">الربح الصافي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    لا توجد معاملات خلال هذه الفترة
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{tx.referenceNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{tx.timestamp}</td>
                    <td className="py-3 px-4 font-mono text-slate-900 font-bold">{tx.senderOrRecipient}</td>
                    <td className="py-3 px-4">
                      {tx.type === 'INCOMING' ? (
                        <span className="text-emerald-700 font-bold">وارد</span>
                      ) : (
                        <span className="text-red-700 font-bold">سحب</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">{fmt(tx.amountEGP)} ج</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{fmt(tx.feeEGP)} ج</td>
                    <td className="py-3 px-4 font-bold text-amber-700">{fmt(tx.costEGP)} ج</td>
                    <td className="py-3 px-4 font-black text-emerald-700">{fmt(tx.profitEGP)} ج</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
