import React, { useRef } from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';

export default function ReceiptModal({ transaction, settings, isOpen, onClose }) {
  if (!isOpen || !transaction) return null;

  const receiptRef = useRef();

  const fmt = (num) => {
    return Number(num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const isIncoming = transaction.type === 'INCOMING';
  const storeName = settings?.wallet_name || 'محل فودافون كاش - AMN';
  const storePhone = settings?.wallet_phone || '01012345678';
  const feeRate = parseFloat(settings?.fee_per_1000) || 50;
  const effectiveFee = transaction.feeEGP > 0 ? transaction.feeEGP : Math.round((transaction.amountEGP * feeRate) / 1000);
  const payoutEGP = transaction.beneficiaryPayoutEGP !== undefined 
    ? transaction.beneficiaryPayoutEGP 
    : (isIncoming ? Math.max(0, transaction.amountEGP - effectiveFee) : transaction.amountEGP);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-right animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500">إيصال عملية معتمد</span>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div 
          ref={receiptRef} 
          className="my-4 bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 shadow-inner font-sans text-xs space-y-4 print:border-none print:shadow-none print:p-0"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b border-slate-200">
            <div className="w-10 h-10 mx-auto rounded-xl bg-[#ca1535] text-white flex items-center justify-center font-black text-lg mb-1.5 shadow-md">
              <span>AMN</span>
            </div>
            <h3 className="font-black text-base text-slate-900">{storeName}</h3>
            <p className="text-[11px] font-mono text-slate-500">هاتف الفرع: {storePhone}</p>
          </div>

          {/* Operation Status Badge */}
          <div className="text-center py-1">
            <span className={`inline-block px-3 py-1 rounded-full font-bold text-xs ${
              isIncoming 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {isIncoming ? 'إشعار استلام كاش (تحويل وارد)' : 'إشعار عملية سحب كاش'}
            </span>
          </div>

          {/* Key Amount Block */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <span className="text-slate-500 text-[11px] font-bold block mb-0.5">مبلغ المعاملة الإجمالي</span>
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {fmt(transaction.amountEGP)} <span className="text-sm font-bold text-slate-600">ج.م</span>
            </span>
          </div>

          {/* Beneficiary Cash Handover Highlight Block */}
          {isIncoming && (
            <div className="bg-emerald-50 p-3.5 rounded-xl border-2 border-emerald-300 text-center space-y-1">
              <span className="text-emerald-800 text-xs font-black block">صافي المبلغ المسلّم للمستفيد نقداً</span>
              <span className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
                {fmt(payoutEGP)} <span className="text-xs font-bold">ج.م</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block">
                (تم خصم 5% مصاريف سحب: {fmt(effectiveFee)} ج)
              </span>
            </div>
          )}

          {/* Detailed Line Items */}
          <div className="space-y-2 text-xs font-medium border-t border-b border-slate-100 py-3">
            <div className="flex justify-between">
              <span className="text-slate-500">رقم المرجع / العملية:</span>
              <span className="font-mono font-bold text-slate-900">{transaction.referenceNumber || 'TRX-' + transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">رقم هاتف العميل:</span>
              <span className="font-mono font-bold text-slate-900">{transaction.senderOrRecipient}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">مصاريف السحب (العمولة 5%):</span>
              <span className="font-bold text-slate-800">{fmt(effectiveFee)} ج</span>
            </div>
            {isIncoming && (
              <div className="flex justify-between text-emerald-800 font-black">
                <span>المبلغ المسلّم نقداً للمستفيد:</span>
                <span className="font-mono text-sm">{fmt(payoutEGP)} ج</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">تاريخ ووقت العملية:</span>
              <span className="font-mono font-bold text-slate-700 text-[11px]">{transaction.timestamp}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">حالة المعاملة:</span>
              <span className={`font-bold flex items-center gap-1 ${
                transaction.status === 'COMPLETED' ? 'text-emerald-600' :
                transaction.status === 'VERIFIED' ? 'text-blue-600' : 'text-amber-600'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {transaction.status === 'COMPLETED' ? 'مكتملة - تم تسليم المبلغ نقداً' :
                 transaction.status === 'VERIFIED' ? 'مؤكدة بالمحفظة - بانتظار التسليم' : 'رسالة فقط (غير مؤكدة)'}
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-1 text-[10px] text-slate-400 space-y-1">
            <p className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              تم التحقق والتسجيل عبر نظام AMN Cash الآلي
            </p>
            <p>شكراً لتعاملكم معنا!</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-[#ca1535] hover:bg-[#a70d29] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإيصال (Print)</span>
          </button>
          <button
            onClick={onClose}
            className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
