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
  X,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Save,
  Check
} from 'lucide-react';
import ReceiptModal from './ReceiptModal.jsx';

export default function Transactions({ transactions = [], settings, onRefresh, onNavigateToFees }) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'WITHDRAWAL', 'INCOMING'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [receiptTx, setReceiptTx] = useState(null);
  const [editingTx, setEditingTx] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Embedded Calculator State
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

  // Filtered transactions
  const displayItems = transactions.filter((tx) => {
    if (filterType === 'WITHDRAWAL' && tx.type !== 'WITHDRAWAL') return false;
    if (filterType === 'INCOMING' && tx.type !== 'INCOMING') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
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

  const handleDelete = async (txId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه المعاملة نهائياً من السجل؟')) return;
    try {
      setDeletingId(txId);
      const res = await fetch(`/api/transactions/${txId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success && onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleWipeData = async (mode) => {
    try {
      const endpoint = mode === 'MOCK' ? '/api/database/clear-mock' : '/api/database/wipe-all';
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsWipeModalOpen(false);
        if (onRefresh) onRefresh();
        alert(data.message);
      }
    } catch (err) {
      console.error('Failed to wipe data:', err);
      alert('حدث خطأ أثناء مسح البيانات');
    }
  };

  return (
    <div className="space-y-6 text-right select-none">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">المعاملات والحسابات المالية</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">عرض وتعديل جميع المعاملات وتصفير السجل للاستخدام الفعلي</p>
        </div>

        {/* Action Buttons */}
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>تسجيل معاملة يدوية +</span>
          </button>

          <button
            onClick={() => setIsWipeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#ca1535] border border-red-200 text-xs font-bold transition-all"
            title="تصفير السجل للبدء من الصفر"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تصفير السجل (0 عملية)</span>
          </button>
        </div>
      </div>

      {/* 2. Embedded Fee Calculator Card */}
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

          {/* Result Box */}
          <div className="md:col-span-7 bg-[#fffaf5] border border-amber-200/80 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <span className="text-xs font-extrabold text-slate-700">نتيجة الحساب (لمبلغ {fmt(calcAmount)} ج)</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Cash Handover to Beneficiary */}
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  المبلغ المسلّم للمستفيد نقداً:
                </span>
                <span className="font-black text-emerald-800 text-sm font-mono">
                  {fmt(Math.max(0, (parseFloat(calcAmount) || 0) - calcResult.fee))} ج
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  إجمالي عمولة السحب (5%):
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

        {/* Current Active Rule Footnote */}
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

      {/* 3. Search Bar */}
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

      {/* 4. Transactions List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">إجمالي: {displayItems.length} عملية</span>
          <h3 className="font-extrabold text-sm text-slate-800">قائمة المعاملات</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">العميل / الطرف الآخر</th>
                <th className="py-3 px-5">المبلغ الإجمالي</th>
                <th className="py-3 px-5 text-emerald-800 bg-emerald-50/70 font-black">المسلّم للمستفيد (كاش)</th>
                <th className="py-3 px-5">عمولة الخدمة (5%)</th>
                <th className="py-3 px-5">أرباح المحل</th>
                <th className="py-3 px-5">التاريخ والوقت</th>
                <th className="py-3 px-5 text-center">الحالة</th>
                <th className="py-3 px-5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    لا توجد معاملات مسجلة حتى الآن. يمكنك بدء تسجيل المعاملات الفعلية عبر زر "تسجيل معاملة يدوية +" أو استقبال رسائل المحفظة تلقائياً.
                  </td>
                </tr>
              ) : (
                displayItems.map((tx) => {
                  const payoutEGP = tx.beneficiaryPayoutEGP !== undefined 
                    ? tx.beneficiaryPayoutEGP 
                    : (tx.type === 'INCOMING' 
                        ? Math.max(0, tx.amountEGP - (tx.feeEGP || Math.round((tx.amountEGP * feeRate) / 1000))) 
                        : tx.amountEGP);

                  return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Customer */}
                    <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">
                      <div>{tx.senderOrRecipient || 'عميل نقدي'}</div>
                      {tx.referenceNumber && (
                        <span className="text-[10px] text-slate-400 block font-normal">{tx.referenceNumber}</span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-5 font-black text-slate-900 whitespace-nowrap">
                      {fmt(tx.amountEGP)} ج
                    </td>

                    {/* Beneficiary Payout */}
                    <td className="py-3.5 px-5 whitespace-nowrap bg-emerald-50/30">
                      {tx.type === 'INCOMING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-300 font-mono">
                          <span>{fmt(payoutEGP)}</span>
                          <span className="text-[10px] font-bold">ج</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">−</span>
                      )}
                    </td>

                    {/* Fee */}
                    <td className="py-3.5 px-5 font-bold text-slate-700 whitespace-nowrap">
                      {tx.feeEGP > 0 ? `${fmt(tx.feeEGP)} ج` : `${fmt(Math.round((tx.amountEGP * feeRate) / 1000))} ج`}
                    </td>

                    {/* Net Profit */}
                    <td className="py-3.5 px-5 font-black text-emerald-700 whitespace-nowrap">
                      {tx.profitEGP > 0 ? `${fmt(tx.profitEGP)} ج` : '−'}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {tx.timestamp}
                    </td>

                    {/* Multi-Stage Workflow */}
                    <td className="py-3 px-4 text-center">
                      {tx.status === 'OBSERVED' ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>رسالة غير مؤكدة</span>
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
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>مكتملة (تم التسليم)</span>
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Actions: Edit, Delete, Details, Receipt */}
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
                          onClick={() => setEditingTx(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="تعديل بيانات المعاملة"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="عرض تفاصيل الرسالة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deletingId === tx.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="حذف المعاملة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add Manual Transaction Modal */}
      {isAddModalOpen && (
        <AddTransactionModal
          isOpen={isAddModalOpen}
          feeRate={feeRate}
          costRate={costRate}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* 6. Edit Transaction Modal */}
      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          feeRate={feeRate}
          costRate={costRate}
          onClose={() => setEditingTx(null)}
          onSuccess={() => {
            setEditingTx(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* 7. Wipe / Reset Production Data Modal */}
      {isWipeModalOpen && (
        <WipeDataModal
          isOpen={isWipeModalOpen}
          onClose={() => setIsWipeModalOpen(false)}
          onWipe={handleWipeData}
        />
      )}

      {/* 8. Raw Message Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button onClick={() => setSelectedTx(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-extrabold text-base text-slate-800">تفاصيل المعاملة والرسالة الأصلية</h3>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-500 block mb-1">الطرف الآخر / العميل:</span>
                <span className="font-mono text-sm font-black text-slate-800">{selectedTx.senderOrRecipient || 'غير محدد'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-500 block mb-1">المبلغ الإجمالي:</span>
                  <span className="font-mono text-sm font-black text-slate-800">{fmt(selectedTx.amountEGP)} ج</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-500 block mb-1">المسلّم للمستفيد:</span>
                  <span className="font-mono text-sm font-black text-emerald-700">{fmt(selectedTx.beneficiaryPayoutEGP || selectedTx.amountEGP)} ج</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-500 block mb-1">نص الرسالة الأصلية (SMS):</span>
                <p className="font-mono text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">
                  {selectedTx.rawSms || 'معاملة مسجلة يدوياً'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* 9. Receipt Modal */}
      <ReceiptModal 
        transaction={receiptTx}
        settings={settings}
        isOpen={!!receiptTx}
        onClose={() => setReceiptTx(null)}
      />

    </div>
  );
}

// -----------------------------------------------------------------------------
// Component: Add Manual Transaction Modal
// -----------------------------------------------------------------------------
function AddTransactionModal({ isOpen, feeRate, costRate, onClose, onSuccess }) {
  const [type, setType] = useState('INCOMING');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [fee, setFee] = useState('');
  const [cost, setCost] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [status, setStatus] = useState('COMPLETED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto calculate defaults on amount change
  const handleAmountChange = (val) => {
    setAmount(val);
    const num = parseFloat(val) || 0;
    if (type === 'INCOMING') {
      const calculatedFee = Math.round((num * feeRate) / 1000);
      const calculatedCost = Math.round((num * costRate) / 1000);
      setFee(calculatedFee.toString());
      setCost(calculatedCost.toString());
    } else {
      setFee('0');
      setCost('0');
    }
  };

  const numAmount = parseFloat(amount) || 0;
  const numFee = parseFloat(fee) || 0;
  const payout = type === 'INCOMING' ? Math.max(0, numAmount - numFee) : numAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amountEGP: numAmount,
          feeEGP: numFee,
          costEGP: parseFloat(cost) || 0,
          senderOrRecipient: recipient.trim(),
          referenceNumber: refNumber.trim(),
          status,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || 'فشل تسجيل المعاملة');
      }
    } catch (err) {
      console.error('Failed to submit manual tx:', err);
      alert('حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-right animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-base text-slate-800">تسجيل معاملة يدوية جديدة</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('INCOMING');
                const num = parseFloat(amount) || 0;
                setFee(Math.round((num * feeRate) / 1000).toString());
                setCost(Math.round((num * costRate) / 1000).toString());
              }}
              className={`py-2.5 rounded-xl font-bold border transition-all ${
                type === 'INCOMING'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              استلام تحويل كاش (إيداع)
            </button>

            <button
              type="button"
              onClick={() => {
                setType('WITHDRAWAL');
                setFee('0');
                setCost('0');
              }}
              className={`py-2.5 rounded-xl font-bold border transition-all ${
                type === 'WITHDRAWAL'
                  ? 'bg-[#ca1535] text-white border-[#ca1535] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              سحب نقدي (ATM / تحويل خارج)
            </button>
          </div>

          {/* Amount & Handover Result */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">المبلغ الإجمالي (جنيه) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="مثال: 2000"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#ca1535] text-right font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم هاتف العميل / المستفيد</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="010xxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#ca1535] text-right font-mono"
              />
            </div>
          </div>

          {/* Live Handover Payout Preview */}
          {type === 'INCOMING' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-emerald-900 block text-xs">المبلغ المسلّم للمستفيد نقداً:</span>
                <span className="text-[10px] text-emerald-700">ناتج خصم مصاريف السحب ({numFee} ج) من الإجمالي</span>
              </div>
              <span className="font-mono text-lg font-black text-emerald-800">{payout.toLocaleString()} ج</span>
            </div>
          )}

          {/* Fee & Cost Tuning */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">عمولة السحب (جنيه)</label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-right"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">مصاريف الماكينة (جنيه)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-right"
              />
            </div>
          </div>

          {/* Status & Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">حالة المعاملة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-right"
              >
                <option value="COMPLETED">مكتملة (تم التسليم)</option>
                <option value="VERIFIED">تم التأكيد (بانتظار التسليم)</option>
                <option value="OBSERVED">غير مؤكدة</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم العملية المرجعي (اختياري)</label>
              <input
                type="text"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                placeholder="TRX-123456"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-right"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'جاري الحفظ...' : 'حفظ المعاملة'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component: Edit Transaction Modal
// -----------------------------------------------------------------------------
function EditTransactionModal({ transaction, feeRate, costRate, onClose, onSuccess }) {
  const [type, setType] = useState(transaction.type || 'INCOMING');
  const [amount, setAmount] = useState(transaction.amountEGP?.toString() || '');
  const [recipient, setRecipient] = useState(transaction.senderOrRecipient || '');
  const [fee, setFee] = useState(transaction.feeEGP?.toString() || '');
  const [cost, setCost] = useState(transaction.costEGP?.toString() || '');
  const [refNumber, setRefNumber] = useState(transaction.referenceNumber || '');
  const [status, setStatus] = useState(transaction.status || 'COMPLETED');
  const [submitting, setSubmitting] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const numFee = parseFloat(fee) || 0;
  const payout = type === 'INCOMING' ? Math.max(0, numAmount - numFee) : numAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amountEGP: numAmount,
          feeEGP: numFee,
          costEGP: parseFloat(cost) || 0,
          senderOrRecipient: recipient.trim(),
          referenceNumber: refNumber.trim(),
          status
        })
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || 'فشل تحديث المعاملة');
      }
    } catch (err) {
      console.error('Failed to update tx:', err);
      alert('حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-right animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-base text-slate-800">تعديل بيانات المعاملة #{transaction.id}</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('INCOMING')}
              className={`py-2 rounded-xl font-bold border transition-all ${
                type === 'INCOMING'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              استلام تحويل كاش (إيداع)
            </button>

            <button
              type="button"
              onClick={() => setType('WITHDRAWAL')}
              className={`py-2 rounded-xl font-bold border transition-all ${
                type === 'WITHDRAWAL'
                  ? 'bg-[#ca1535] text-white border-[#ca1535] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              سحب نقدي (ATM)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">المبلغ الإجمالي (جنيه) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#ca1535] text-right font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">العميل / المستفيد</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#ca1535] text-right font-mono"
              />
            </div>
          </div>

          {/* Payout Preview */}
          {type === 'INCOMING' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-emerald-900 block text-xs">المبلغ المسلّم للمستفيد نقداً:</span>
                <span className="text-[10px] text-emerald-700">بعد خصم عمولة السحب ({numFee} ج)</span>
              </div>
              <span className="font-mono text-lg font-black text-emerald-800">{payout.toLocaleString()} ج</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">عمولة السحب (جنيه)</label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-right"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">مصاريف الماكينة (جنيه)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">حالة المعاملة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-right"
              >
                <option value="COMPLETED">مكتملة (تم التسليم)</option>
                <option value="VERIFIED">تم التأكيد (بانتظار التسليم)</option>
                <option value="OBSERVED">غير مؤكدة</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم العملية المرجعي</label>
              <input
                type="text"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-right"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'جاري الحفظ...' : 'تحديث المعاملة'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component: Wipe & Fresh Production Reset Modal
// -----------------------------------------------------------------------------
function WipeDataModal({ isOpen, onClose, onWipe }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-right animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-slate-800">تصفير سجل المعاملات بالكامل</h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          هل أنت متأكد من رغبتك في حذف كافة المعاملات نهائياً وتصفير العدادات للبدء من الصفر (0 عملية)؟ لن تتأثر إعدادات المحل أو نسب العمولات.
        </p>

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={() => onWipe('ALL')}
            className="flex-1 py-3 px-4 bg-[#ca1535] hover:bg-[#a70d29] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 text-center"
          >
            نعم، تصفير السجل الآن (0 عملية)
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}