import React, { useState } from 'react';
import { 
  Search, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Filter, 
  PlusCircle, 
  Eye, 
  CheckCircle2, 
  FileText, 
  Download,
  Printer,
  X
} from 'lucide-react';
import ReceiptModal from './ReceiptModal.jsx';

export default function Transactions({ transactions, settings, onNewTransaction, onRefresh }) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [receiptTx, setReceiptTx] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for manual transaction
  const [manualType, setManualType] = useState('INCOMING');
  const [manualAmount, setManualAmount] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualRef, setManualRef] = useState('');

  const fmt = (num) => {
    return Number(num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const filtered = transactions.filter((tx) => {
    if (filterType !== 'ALL' && tx.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPhone = tx.senderOrRecipient?.toLowerCase().includes(q);
      const matchRef = tx.referenceNumber?.toLowerCase().includes(q);
      const matchAmount = String(tx.amountEGP).includes(q);
      return matchPhone || matchRef || matchAmount;
    }
    return true;
  });

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualAmount || parseFloat(manualAmount) <= 0) return;

    try {
      const simulatedText = manualType === 'INCOMING'
        ? `تم استلام مبلغ ${manualAmount} جنيه من رقم ${manualPhone || '01000000000'} رصيدك الحالي هو 20,000.00 جنيه رقم العملية ${manualRef || Date.now().toString().slice(-8)}`
        : `تم سحب مبلغ ${manualAmount} جنيه من محفظتك فودافون كاش رقم العملية ${manualRef || Date.now().toString().slice(-8)}`;

      await fetch('/api/sms/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smsText: simulatedText,
          deviceId: 'manual_desktop_entry'
        })
      });

      setIsAddModalOpen(false);
      setManualAmount('');
      setManualPhone('');
      setManualRef('');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('خطأ في إضافة المعاملة: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الهاتف، رقم العملية، أو المبلغ..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#ca1535] focus:bg-white transition-all text-right"
          />
        </div>

        {/* Filters and Add Button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'ALL' ? 'bg-[#ca1535] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterType('INCOMING')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'INCOMING' ? 'bg-[#ca1535] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              وارد فقط
            </button>
            <button
              onClick={() => setFilterType('WITHDRAWAL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'WITHDRAWAL' ? 'bg-[#ca1535] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سحب فقط
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#ca1535] hover:bg-[#a70d29] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-red-900/20 transition-transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تسجيل معاملة يدوياً</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-4 px-5">رقم العملية</th>
                <th className="py-4 px-5">الوقت والتاريخ</th>
                <th className="py-4 px-5">العميل / الطرف الآخر</th>
                <th className="py-4 px-5">النوع</th>
                <th className="py-4 px-5">المبلغ</th>
                <th className="py-4 px-5">رسوم الخدمة</th>
                <th className="py-4 px-5">مصاريف السحب</th>
                <th className="py-4 px-5">الربح الصافي</th>
                <th className="py-4 px-5 text-center">الحالة</th>
                <th className="py-4 px-5 text-center">تفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    لا توجد معاملات مطابقة لمعايير البحث
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isIncoming = tx.type === 'INCOMING';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-slate-700 font-bold text-[11px]">
                        {tx.referenceNumber || `TRX-${tx.id}`}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {tx.timestamp}
                      </td>
                      <td className="py-3.5 px-5 text-slate-900 font-bold font-mono">
                        {tx.senderOrRecipient}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
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
                      <td className="py-3.5 px-5 font-black text-slate-900 whitespace-nowrap">
                        {fmt(tx.amountEGP)} ج
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-700 whitespace-nowrap">
                        {tx.feeEGP > 0 ? `${fmt(tx.feeEGP)} ج` : '−'}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-amber-700 whitespace-nowrap">
                        {tx.costEGP > 0 ? `${fmt(tx.costEGP)} ج` : '−'}
                      </td>
                      <td className="py-3.5 px-5 font-black text-emerald-700 whitespace-nowrap">
                        {tx.profitEGP > 0 ? `${fmt(tx.profitEGP)} ج` : '−'}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          مكتملة
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setReceiptTx(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="طباعة إيصال للعملية"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#ca1535] hover:bg-red-50 transition-colors"
                            title="عرض تفاصيل الرسالة"
                          >
                            <Eye className="w-4 h-4" />
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

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">تفاصيل المعاملة</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium block mb-1">المبلغ الإجمالي</span>
                  <strong className="text-xl font-black text-slate-900">{fmt(selectedTx.amountEGP)} ج</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-1">الربح الصافي</span>
                  <strong className="text-xl font-black text-emerald-600">{fmt(selectedTx.profitEGP)} ج</strong>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">الطرف الآخر:</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedTx.senderOrRecipient}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">رقم العملية المرجعي:</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedTx.referenceNumber}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">وقت الاستلام:</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedTx.timestamp}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">رسوم الخدمة:</span>
                  <span className="font-bold text-slate-800">{fmt(selectedTx.feeEGP)} ج</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">مصاريف السحب من الماكينة:</span>
                  <span className="font-bold text-slate-800">{fmt(selectedTx.costEGP)} ج</span>
                </div>
              </div>

              {selectedTx.rawSms && (
                <div className="mt-3">
                  <span className="text-slate-500 font-bold block mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    نص رسالة الـ SMS الأصلية:
                  </span>
                  <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs font-mono leading-relaxed select-text">
                    {selectedTx.rawSms}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setReceiptTx(selectedTx);
                  setSelectedTx(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة إيصال معتمد</span>
              </button>
              <button
                onClick={() => setSelectedTx(null)}
                className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal 
        transaction={receiptTx}
        settings={settings}
        isOpen={!!receiptTx}
        onClose={() => setReceiptTx(null)}
      />

      {/* Manual Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">تسجيل معاملة يدوياً</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="py-4 space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1.5 font-bold">نوع المعاملة</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualType('INCOMING')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      manualType === 'INCOMING'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    وارد (استلام كاش)
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType('WITHDRAWAL')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      manualType === 'WITHDRAWAL'
                        ? 'bg-red-500 text-white border-red-500 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    سحب كاش
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1.5 font-bold">المبلغ بالجنيه</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="مثال: 1000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#ca1535] text-right font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1.5 font-bold">رقم الهاتف (العميل)</label>
                <input
                  type="text"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#ca1535] text-right"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1.5 font-bold">رقم المرجع / العملية (اختياري)</label>
                <input
                  type="text"
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  placeholder="مثال: 948301"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#ca1535] text-right"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#ca1535] hover:bg-[#a70d29] text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  حفظ المعاملة
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
