import React, { useState, useEffect } from 'react';
import { Calculator, Save, CheckCircle2, Info, ArrowRightLeft, Sparkles } from 'lucide-react';

export default function FeeCalculator({ settings, onSaveSettings }) {
  const [amount, setAmount] = useState('5000');
  const [calcResult, setCalcResult] = useState(null);

  // Settings state
  const [feePer1000, setFeePer1000] = useState(settings?.fee_per_1000 || '50');
  const [costPer1000, setCostPer1000] = useState(settings?.cost_per_1000 || '10');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const profitPer1000 = (parseFloat(feePer1000) || 0) - (parseFloat(costPer1000) || 0);

  const calculate = (amt) => {
    const val = parseFloat(amt);
    if (!val || val <= 0) {
      setCalcResult(null);
      return;
    }

    const feeRate = parseFloat(feePer1000) || 0;
    const costRate = parseFloat(costPer1000) || 0;

    const fee = Math.round((val * feeRate) / 1000);
    const cost = Math.round((val * costRate) / 1000);
    const profit = fee - cost;

    setCalcResult({
      amount: val,
      fee,
      cost,
      profit
    });
  };

  useEffect(() => {
    calculate(amount);
  }, [feePer1000, costPer1000]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (onSaveSettings) {
      await onSaveSettings({
        fee_per_1000: feePer1000,
        cost_per_1000: costPer1000,
        profit_per_1000: profitPer1000.toString()
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const fmt = (num) => {
    return Number(num || 0).toLocaleString('en-US');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Interactive Calculator Card */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#ca1535] flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">حاسبة عمولة السحب والربح الصافي</h3>
            <p className="text-xs text-slate-400 font-medium">احسب تكاليف وأرباح أي معاملة قبل تنفيذها</p>
          </div>
        </div>

        {/* Input Field */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">المبلغ المطلوب حسابه (جنيه)</label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                calculate(e.target.value);
              }}
              placeholder="مثال: 5000"
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-slate-900 focus:outline-none focus:border-[#ca1535] focus:bg-white text-right font-mono transition-all"
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
              ج.م
            </span>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {['500', '1000', '2000', '3000', '5000', '10000'].map((amt) => (
            <button
              key={amt}
              onClick={() => {
                setAmount(amt);
                calculate(amt);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              {fmt(amt)} ج
            </button>
          ))}
        </div>

        {/* Result Breakdown Card */}
        {calcResult && (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <span className="text-xs font-bold text-slate-500">نتيجة الحساب لمبلغ ({fmt(calcResult.amount)} ج)</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                حساب فوري
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                  إجمالي عمولة السحب (رسوم الخدمة):
                </span>
                <span className="font-extrabold text-slate-900 text-sm">{fmt(calcResult.fee)} ج</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-amber-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  مصاريف سحبنا من الماكينة:
                </span>
                <span className="font-extrabold text-amber-800 text-sm">{fmt(calcResult.cost)} ج</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-black text-emerald-800 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  الربح الصافي المستحق:
                </span>
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  {fmt(calcResult.profit)} <span className="text-xs font-bold">ج.م</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Fee Rules Configuration Card */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Save className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">إعدادات المصاريف والربح الافتراضية</h3>
            <p className="text-xs text-slate-400 font-medium">تخصيص نسب الحساب لتناسب سياسة المحل</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5 text-xs font-medium">
          {/* Fee per 1000 */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              رسوم الخدمة (عمولة السحب) لكل 1,000 جنيه:
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={feePer1000}
                onChange={(e) => setFeePer1000(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#ca1535] text-right font-mono"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">جنيه</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">الافتراضي: 50 جنيه لكل 1,000 ج</p>
          </div>

          {/* Cost per 1000 */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              مصاريف السحب الخاصة بنا من الماكينة لكل 1,000 جنيه:
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={costPer1000}
                onChange={(e) => setCostPer1000(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#ca1535] text-right font-mono"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">جنيه</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">الافتراضي: 10 جنيه لكل 1,000 ج</p>
          </div>

          {/* Net Profit Summary preview */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <span className="text-emerald-700 font-bold block mb-1">الربح الصافي التلقائي لكل 1,000 جنيه:</span>
            <span className="text-2xl font-black text-emerald-800 font-mono">
              {profitPer1000} جنيه
            </span>
            <span className="text-[11px] text-emerald-600 block mt-1">
              ({feePer1000} − {costPer1000} = {profitPer1000} ج)
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#ca1535] hover:bg-[#a70d29] text-white font-extrabold rounded-2xl shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الإعدادات الحالية</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم حفظ وتحديث نسب الحساب بنجاح!</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
