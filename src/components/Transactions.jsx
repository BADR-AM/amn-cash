import React, { useState } from 'react';
import { 
  Search, 
  Calculator, 
  Filter, 
  PlusCircle, 
  Eye, 
  Printer, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Sparkles,
  X
} from 'lucide-react';
import ReceiptModal from './ReceiptModal.jsx';

export default function Transactions({ transactions = [], settings, onRefresh, onNavigateToFees }) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'WITHDRAWAL', 'INCOMING'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [receiptTx, setReceiptTx] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Embedded Calculator State matching Image 3
  const [calcAmount, setCalcAmount] = useState('5000');
  const [calcResult, setCalcResult] = useState({ fee: 250, cost: 50, profit: 200 });

  const feeRate = parseFloat(settings?.fee_per_1000) || 50;
  const costRate = parseFloat(settings?.cost_per_1000) || 10;
  const profitRate = feeRate - costRate;

  const handleCalculate = () => {
    const val = parseFloat(calcAmount) || 0;
    const fee = Math.round((val * feeRate) / 1000);
    const cost = Math.round((val * costRate) / 1000);
    setCalcResult({ fee, cost, profit: fee - cost });
  };

  const fmt = (num) => {
    return Number(num || 0).toLocaleString('en-US');
  };

  // Sample or real transactions matching Image 3
  const displayItems = transactions.filter((tx) => {
    if (filterType === 'WITHDRAWAL' && tx.type !== 'WITHDRAWAL') return false;
    if (filterType === 'INCOMING' && tx.type !== 'INCOMING') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const handleVerify = async (txId) => {
    try {
      const res = await fetch(`/api/transactions/${txId}/verify`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to verify transaction:', err);
    }
  };

  return (
        tx.senderOrRecipient?.toLowerCase().includes(q) ||
        tx.referenceNumber?.toLowerCase().includes(q) ||
        String(tx.amountEGP).includes(q)
      );
    }
    return true;
  });

  const handleVerify = async (txId) => {
    try {
      const res = await fetch(`/api/transactions/${txId}/verify`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to verify transaction:', err);
    }
  };

  return (
    <div className="space-y-6 text-right select-none">
      
      {/* 1. Header & Filter Pills Matching Image 3 */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">المعاملات والحسابات المالية</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">عرض جميع المعاملات وحساب الأرباح والمصاريف</p>
        </div>

        {/* Filter Pills Matching Image 3 */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              filterType === 'ALL'
                ? 'bg-[#ca1535] text-white shadow-md shadow-red-900/10'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            جميع المعاملات
          </button>

          <button
            onClick={() => setFilterType('WITHDRAWAL')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              filterType === 'WITHDRAWAL'
                ? 'bg-[#ca1535] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            السحب فقط
          </button>

          <button
            onClick={() => setFilterType('INCOMING')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              filterType === 'INCOMING'
                ? 'bg-[#ca1535] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            الإيداع فقط
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>تسجيل معاملة +</span>
          </button>
        </div>
      </div>

      {/* 2. Embedded Fee Calculator Card Matching Image 3 Middle Screen */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
        
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-red-100 text-[#ca1535] flex items-center justify-center font-bold">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-800">حاسبة عمولة السحب والربح الصافي</h3>
            <p className="text-[11px] text-slate-400 font-medium">احسب تكاليف وأرباح أي معاملة قبل تنفيذها</p>
          </div>
        </div>

        {/* Input & Calculate Action */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          <div className="md:col-span-5 space-y-3">
            <div className="relative">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">المبلغ (جنيه)</span>
              <div className="relative">
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:border-[#ca1535] text-right font-mono"
                />
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-3 bg-[#ca1535] hover:bg-[#a70d29] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              <span>احسب الآن</span>
            </button>
          </div>

          {/* Result Box (Matching Image 3: نتيجة الحساب (مثال)) */}
          <div className="md:col-span-7 bg-[#fffaf5] border border-amber-200/80 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <span className="text-xs font-extrabold text-slate-700">نتيجة الحساب (لمبلغ {fmt(calcAmount)} ج)</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  إجمالي عمولة السحب:
                </span>
                <span className="font-extrabold text-slate-900 font-mono">{fmt(calcResult.fee)} ج</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  إجمالي مصاريف الماكينة:
                </span>
                <span className="font-extrabold text-amber-800 font-mono">{fmt(calcResult.cost)} ج</span>
              </div>

              <div className="pt-2 border-t border-amber-200/70 flex justify-between items-center">
                <span className="font-black text-emerald-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  الربح الصافي:
                </span>
                <span className="text-xl font-black text-emerald-700 font-mono">
                  {fmt(calcResult.profit)} ج
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Current Active Rule Footnote Matching Image 3 */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600 font-medium flex-wrap">
            <span className="font-bold text-slate-700">الإعدادات المستخدمة في الحساب:</span>
            <span>مصاريف السحب لكل 1000 جنيه: <strong className="text-slate-900 font-bold">{feeRate} ج</strong></span>
            <span>• مصاريف سحبنا من الماكينة: <strong className="text-slate-900 font-bold">{costRate} ج</strong></span>
            <span>• الربح الصافي لكل 1000 جنيه: <strong className="text-emerald-700 font-bold">{profitRate} ج</strong></span>
          </div>

          <button
            onClick={onNavigateToFees}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#ca1535] hover:bg-red-50 font-bold text-xs border border-red-200 transition-colors shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل القيم</span>
          </button>
        </div>

      </div>

      {/* 3. Search Bar Matching Image 3 */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث عن عميل أو رقم معاملة أو مبلغ..."
          className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#ca1535] text-right shadow-sm"
        />
      </div>

      {/* 4. Transactions List Table Matching Image 3 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">إجمالي: {displayItems.length} عملية</span>
          <h3 className="font-extrabold text-sm text-slate-800">قائمة المعاملات</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">العميل</th>
                <th className="py-3 px-5">المبلغ</th>
                <th className="py-3 px-5">العمولة</th>
                <th className="py-3 px-5">الصافي</th>
                <th className="py-3 px-5">التاريخ والوقت</th>
                <th className="py-3 px-5 text-center">الحالة</th>
                <th className="py-3 px-5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لا توجد معاملات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                displayItems.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Customer */}
                    <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">
                      {tx.senderOrRecipient}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-5 font-black text-slate-900 whitespace-nowrap">
                      {fmt(tx.amountEGP)} ج
                    </td>

                    {/* Fee */}
                    <td className="py-3.5 px-5 font-bold text-slate-700 whitespace-nowrap">
                      {tx.feeEGP > 0 ? `${fmt(tx.feeEGP)} ج` : '−'}
                    </td>

                    {/* Net Profit */}
                    <td className="py-3.5 px-5 font-black text-emerald-700 whitespace-nowrap">
                      {tx.profitEGP > 0 ? `${fmt(tx.profitEGP)} ج` : '−'}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {tx.timestamp}
                    </td>

                    {/* Status Pill Matching Handoff V2 Specification */}
                    <td className="py-3.5 px-5 text-center">
                      {tx.status === 'OBSERVED' ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>ملاحظة (بانتظار التأكيد)</span>
                          </span>
                          <button
                            onClick={() => handleVerify(tx.id)}
                            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors shadow-sm"
                            title="تأكيد العملية واحتساب العمولة"
                          >
                            تأكيد العمولة
                          </button>
                        </div>
                      ) : tx.status === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          <span>مؤكدة ومحتسبة</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>مكتملة</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setReceiptTx(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="طباعة إيصال"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#ca1535] hover:bg-red-50 transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & Receipt Modals */}
      <ReceiptModal 
        transaction={receiptTx}
        settings={settings}
        isOpen={!!receiptTx}
        onClose={() => setReceiptTx(null)}
      />

    </div>
  );
}
