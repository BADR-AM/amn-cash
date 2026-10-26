import React, { useState } from 'react';
import { X, Send, ShieldAlert, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SmsSimulatorModal({ isOpen, onClose, onTransactionCreated }) {
  if (!isOpen) return null;

  const [customSms, setCustomSms] = useState('');
  const [responseMsg, setResponseMsg] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const sampleIncoming = "تم استلام مبلغ 1,500.00 جنيه من رقم 01022334455 رصيدك الحالي هو 25,400.00 جنيه رقم العملية 84729103";
  const sampleWithdrawal = "تم سحب مبلغ 4,000.00 جنيه من محفظتك فودافون كاش كود العملية 55443322";
  const sampleOtp = "كود التأكيد الخاص بك هو 948210 لا تشارك هذا الكود السري مع أي شخص";

  const handleSend = async (textToSend) => {
    const text = textToSend || customSms;
    if (!text.trim()) return;

    setIsSending(true);
    setResponseMsg(null);

    try {
      const res = await fetch('/api/sms/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smsText: text,
          deviceId: 'sms_simulator_phone'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResponseMsg({
          type: 'success',
          text: data.duplicate ? 'معاملة مكررة تم تجاهلها بنجاح' : 'تم استلام ومعالجة الرسالة وتسجيل الأرباح بنجاح!'
        });
        if (onTransactionCreated) onTransactionCreated();
      } else {
        setResponseMsg({
          type: 'error',
          text: data.error || 'فشلت معالجة الرسالة'
        });
      }
    } catch (err) {
      setResponseMsg({
        type: 'error',
        text: 'خطأ في الاتصال بالخادم: ' + err.message
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 text-right animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">محاكي رسائل فودافون كاش</h3>
              <p className="text-xs text-slate-400 font-medium">اختبار تدفق الـ SMS وفلترة الخصوصية وحساب الرسوم</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Quick Tests */}
        <div className="py-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-2">نماذج رسائل جاهزة للاختبار الفوري:</label>
            <div className="space-y-2">
              
              {/* Preset 1: Incoming */}
              <button
                type="button"
                onClick={() => {
                  setCustomSms(sampleIncoming);
                  handleSend(sampleIncoming);
                }}
                disabled={isSending}
                className="w-full text-right p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 transition-all flex items-center justify-between group"
              >
                <div>
                  <strong className="text-emerald-900 block font-bold">1. استلام تحويل كاش وارد (1,500 ج)</strong>
                  <span className="text-[11px] text-emerald-700 font-mono block mt-0.5 opacity-80">
                    {sampleIncoming}
                  </span>
                </div>
                <Send className="w-4 h-4 text-emerald-600 shrink-0 group-hover:-translate-x-1 transition-transform" />
              </button>

              {/* Preset 2: Withdrawal */}
              <button
                type="button"
                onClick={() => {
                  setCustomSms(sampleWithdrawal);
                  handleSend(sampleWithdrawal);
                }}
                disabled={isSending}
                className="w-full text-right p-3 rounded-2xl bg-red-50/70 hover:bg-red-100/70 border border-red-200 transition-all flex items-center justify-between group"
              >
                <div>
                  <strong className="text-red-900 block font-bold">2. عملية سحب نقدي (4,000 ج)</strong>
                  <span className="text-[11px] text-red-700 font-mono block mt-0.5 opacity-80">
                    {sampleWithdrawal}
                  </span>
                </div>
                <Send className="w-4 h-4 text-red-600 shrink-0 group-hover:-translate-x-1 transition-transform" />
              </button>

              {/* Preset 3: OTP Deny Test */}
              <button
                type="button"
                onClick={() => {
                  setCustomSms(sampleOtp);
                  handleSend(sampleOtp);
                }}
                disabled={isSending}
                className="w-full text-right p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 transition-all flex items-center justify-between group"
              >
                <div>
                  <strong className="text-amber-900 block font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    3. اختبار رفض وتجاهل رسائل الـ OTP الحساسة
                  </strong>
                  <span className="text-[11px] text-amber-700 font-mono block mt-0.5 opacity-80">
                    {sampleOtp}
                  </span>
                </div>
                <Send className="w-4 h-4 text-amber-600 shrink-0 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Custom SMS Input */}
          <div className="pt-2">
            <label className="block text-slate-700 font-bold mb-1.5">أو اكتب أي نص رسالة ترغب في اختباره:</label>
            <textarea
              rows={3}
              value={customSms}
              onChange={(e) => setCustomSms(e.target.value)}
              placeholder="اكتب رسالة فودافون كاش هنا..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:border-[#ca1535] text-right"
            />
          </div>

          {/* Response Message Banner */}
          {responseMsg && (
            <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 font-bold ${
              responseMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {responseMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{responseMsg.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={() => handleSend()}
            disabled={isSending || !customSms.trim()}
            className="flex-1 py-3 bg-[#ca1535] hover:bg-[#a70d29] disabled:opacity-50 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'جاري الإرسال...' : 'إرسال الرسالة للنظام'}</span>
          </button>
          <button
            onClick={onClose}
            className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
