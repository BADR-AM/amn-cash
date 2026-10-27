import React, { useState } from 'react';
import { 
  Settings, 
  Store, 
  Phone, 
  Database, 
  Download, 
  Upload, 
  Moon, 
  Sun, 
  Monitor, 
  CheckCircle2, 
  Save 
} from 'lucide-react';

export default function SettingsView({ settings, onSaveSettings }) {
  const [walletName, setWalletName] = useState(settings?.wallet_name || 'محل فودافون كاش - AMN');
  const [walletPhone, setWalletPhone] = useState(settings?.wallet_phone || '01012345678');
  const [theme, setTheme] = useState(settings?.theme || 'light');
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (onSaveSettings) {
      await onSaveSettings({
        wallet_name: walletName,
        wallet_phone: walletPhone,
        theme
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleBackup = () => {
    window.location.href = '/api/backup/download';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Account / Store Info (Matching Mockup 3) */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#ca1535] flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">إعدادات الحساب والمحل</h3>
            <p className="text-xs text-slate-400 font-medium">معلومات الحساب الافتراضية لعرضها في التقارير والفواتير</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">اسم المحل / الشركة:</label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#ca1535] text-right"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">رقم هاتف المحفظة الأساسية:</label>
              <input
                type="text"
                value={walletPhone}
                onChange={(e) => setWalletPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-[#ca1535] text-right"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-[#ca1535] hover:bg-[#a70d29] text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ بيانات الحساب</span>
            </button>
          </div>

          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم حفظ الإعدادات بنجاح!</span>
            </div>
          )}
        </form>
      </div>

      {/* 2. Backup & Restore (Matching Mockup 3) */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">النسخ الاحتياطي واستعادة البيانات</h3>
            <p className="text-xs text-slate-400 font-medium">حفظ قاعدة بيانات المعاملات محلياً واستعادتها في أي وقت</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <button
            onClick={handleBackup}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-[#ca1535] border border-red-200 font-bold text-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>إنشاء نسخة احتياطية الآن (Backup)</span>
          </button>

          <button
            onClick={() => alert('يمكنك وضع ملف amn_cash.sqlite في مجلد data لاستعادة كامل بياناتك فوراً')}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>استعادة نسخة احتياطية</span>
          </button>
        </div>
      </div>

      {/* 3. Appearance (Matching Mockup 3) */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-slate-800">مظهر البرنامج</h3>
        <p className="text-xs text-slate-400 font-medium">تخصيص ثيم الألوان والوضع الليلي</p>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${
              theme === 'light'
                ? 'bg-[#ca1535] text-white border-[#ca1535] shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>الوضع الفاتح</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'bg-[#ca1535] text-white border-[#ca1535] shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>الوضع الداكن</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${
              theme === 'system'
                ? 'bg-[#ca1535] text-white border-[#ca1535] shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>حسب النظام</span>
          </button>
        </div>
      </div>
    </div>
  );
}
