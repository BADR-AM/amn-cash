import React, { useState } from 'react';
import { 
  User, 
  Store, 
  Phone, 
  Coins, 
  CloudDownload, 
  RotateCcw, 
  FileSpreadsheet, 
  FileUp, 
  Sun, 
  Moon, 
  Monitor, 
  Save, 
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Volume2,
  BellRing,
  Play
} from 'lucide-react';
import { 
  playCashInSound, 
  playCashOutSound, 
  playDeviceDisconnectedSound, 
  playDeviceConnectedSound 
} from '../utils/audioAlerts.js';

export default function SettingsView({ settings = {}, onSaveSettings }) {
  const [userName, setUserName] = useState(settings?.user_name || 'أحمد علي');
  const [walletPhone, setWalletPhone] = useState(settings?.wallet_phone || '01012345678');
  const [storeName, setStoreName] = useState(settings?.wallet_name || 'محل فودافون كاش');
  
  const [feePer1000, setFeePer1000] = useState(settings?.fee_per_1000 || '50');
  const [costPer1000, setCostPer1000] = useState(settings?.cost_per_1000 || '10');
  const [theme, setTheme] = useState(settings?.theme || 'light');
  const [alertVolume, setAlertVolume] = useState(parseFloat(settings?.alert_volume) || 0.9);
  
  const [isSaved, setIsSaved] = useState(false);

  const profitPer1000 = (parseFloat(feePer1000) || 0) - (parseFloat(costPer1000) || 0);

  const handleSave = async (e) => {
    e.preventDefault();
    if (onSaveSettings) {
      await onSaveSettings({
        user_name: userName,
        wallet_phone: walletPhone,
        wallet_name: storeName,
        fee_per_1000: feePer1000,
        cost_per_1000: costPer1000,
        profit_per_1000: profitPer1000.toString(),
        theme,
        alert_volume: alertVolume.toString()
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleResetDefaults = () => {
    setFeePer1000('50');
    setCostPer1000('10');
    setStoreName('محل فودافون كاش');
    setUserName('أحمد علي');
    setTheme('light');
  };

  const handleBackupDownload = () => {
    window.location.href = '/api/backup/download';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-right select-none pb-8">
      
      {/* Header Matching Image 3 */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">الإعدادات</h2>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">تخصيص البرنامج ليناسب احتياجاتك</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. إعدادات الحساب Matching Image 3 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-[#ca1535]" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">إعدادات الحساب</h3>
              <p className="text-[11px] text-slate-400">معلومات الحساب الافتراضية</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs font-medium">
            <div>
              <label className="block text-slate-700 font-bold mb-1">اسم المستخدم</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="أحمد علي"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#ca1535] text-right"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم الهاتف</label>
              <input
                type="text"
                value={walletPhone}
                onChange={(e) => setWalletPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:border-[#ca1535] text-right"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">اسم المحل / الشركة</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="محل فودافون كاش"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#ca1535] text-right"
              />
            </div>
          </div>
        </div>

        {/* 2. إعدادات المصاريف Matching Image 3 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Coins className="w-4 h-4 text-[#ca1535]" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">إعدادات المصاريف</h3>
              <p className="text-[11px] text-slate-400">القيم الافتراضية لحساب العمولة والمصاريف</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs font-medium">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">مصاريف السحب لكل 1000 جنيه</label>
                <input
                  type="number"
                  value={feePer1000}
                  onChange={(e) => setFeePer1000(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:border-[#ca1535] text-right"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">مصاريف سحبنا من الماكينة</label>
                <input
                  type="number"
                  value={costPer1000}
                  onChange={(e) => setCostPer1000(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:border-[#ca1535] text-right"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الربح الصافي لكل 1000 جنيه</label>
                <input
                  type="number"
                  readOnly
                  value={profitPer1000}
                  className="w-full px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl font-mono font-black text-emerald-700 text-right cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. نسخ احتياطي Matching Image 3 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800">نسخ احتياطي</h3>
            <p className="text-[11px] text-slate-400">حفظ واستعادة بيانات البرنامج</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackupDownload}
              className="flex-1 py-3 px-4 bg-[#ca1535] hover:bg-[#a70d29] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <CloudDownload className="w-4 h-4" />
              <span>إنشاء نسخة احتياطية</span>
            </button>

            <button
              type="button"
              onClick={() => alert('يمكنك وضع ملف النسخة في مجلد data/ لاستعادتها فوراً')}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>استعادة نسخة</span>
            </button>
          </div>
        </div>

        {/* 4. تصدير واستيراد Matching Image 3 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800">تصدير واستيراد</h3>
            <p className="text-[11px] text-slate-400">تصدير أو استيراد البيانات من وإلى ملفات Excel</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => alert('يمكنك تصدير كافة العمليات عبر شاشة التقارير بصيغة Excel CSV')}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>تصدير البيانات</span>
            </button>

            <button
              type="button"
              onClick={() => alert('خاصية استيراد ملفات Excel متوفرة وقيد التهيئة')}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-colors"
            >
              <FileUp className="w-4 h-4 text-slate-500" />
              <span>استيراد البيانات</span>
            </button>
          </div>
        </div>

        {/* 5. مظهر البرنامج Matching Image 3 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800">مظهر البرنامج</h3>
            <p className="text-[11px] text-slate-400">تخصيص مظهر وألوان البرنامج</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                theme === 'light'
                  ? 'bg-[#ca1535] text-white border-[#ca1535] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>الوضع الفاتح</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                theme === 'dark'
                  ? 'bg-[#ca1535] text-white border-[#ca1535] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>الوضع الداكن</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
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

        {/* 6. التنبيهات والأصوات المالية */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[#ca1535]" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">التنبيهات والأصوات الفورية</h3>
                <p className="text-[11px] text-slate-400">أصوات تنبيه الكاشير عند استقبال تحويل، صرف كاش، أو انقطاع الهاتف</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-500" />
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.05"
                value={alertVolume}
                onChange={(e) => setAlertVolume(parseFloat(e.target.value))}
                className="w-24 accent-[#ca1535] cursor-pointer"
                title={`مستوى الصوت: ${Math.round(alertVolume * 100)}%`}
              />
              <span className="text-[11px] font-mono text-slate-600 font-bold w-8">{Math.round(alertVolume * 100)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => playCashInSound(alertVolume)}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center justify-between transition-all active:scale-98"
            >
              <div className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                <span>صوت استلام كاش (جرس الخزينة)</span>
              </div>
              <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded-md">تجربة 🔔</span>
            </button>

            <button
              type="button"
              onClick={() => playCashOutSound(alertVolume)}
              className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl font-bold flex items-center justify-between transition-all active:scale-98"
            >
              <div className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                <span>صوت سحب نقدي (صرف كاش)</span>
              </div>
              <span className="text-[10px] bg-blue-200/60 px-2 py-0.5 rounded-md">تجربة 💸</span>
            </button>

            <button
              type="button"
              onClick={() => playDeviceDisconnectedSound(alertVolume)}
              className="p-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 rounded-xl font-bold flex items-center justify-between transition-all active:scale-98"
            >
              <div className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-red-600 fill-red-600" />
                <span>صوت انقطاع الموبايل (إنذار غلق)</span>
              </div>
              <span className="text-[10px] bg-red-200/60 px-2 py-0.5 rounded-md">تجربة ⚠️</span>
            </button>

            <button
              type="button"
              onClick={() => playDeviceConnectedSound(alertVolume)}
              className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-xl font-bold flex items-center justify-between transition-all active:scale-98"
            >
              <div className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                <span>صوت اتصال الموبايل بالمحل</span>
              </div>
              <span className="text-[10px] bg-purple-200/60 px-2 py-0.5 rounded-md">تجربة 📱</span>
            </button>
          </div>
        </div>

        {/* 7. إدارة البيانات وبدء الاستخدام الفعلي */}
        <div className="bg-red-50/60 border border-red-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-red-200">
            <AlertTriangle className="w-5 h-5 text-[#ca1535]" />
            <div>
              <h3 className="font-extrabold text-sm text-red-900">إدارة السجل والبدء من الصفر</h3>
              <p className="text-[11px] text-red-700">تفريغ سجل المعاملات بالكامل لبدء دورة محاسبية جديدة أو تصفير الحسابات</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('تحذير: هل أنت متأكد من تصفير كافة المعاملات نهائياً لبدء سجل جديد (0 عملية)؟')) {
                  const res = await fetch('/api/database/wipe-all', { method: 'POST' });
                  const data = await res.json();
                  alert(data.message || 'تم تصفير السجل بنجاح للبدء من الصفر');
                }
              }}
              className="w-full sm:flex-1 py-3 px-4 bg-[#ca1535] hover:bg-[#a70d29] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>تصفير سجل المعاملات بالكامل (0 عملية)</span>
            </button>
          </div>
        </div>

        {/* Bottom Save & Reset Actions Matching Image 3 */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            className="flex-1 py-3.5 bg-[#ca1535] hover:bg-[#a70d29] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>حفظ</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>
        </div>

        {isSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تم حفظ كافة الإعدادات بنجاح!</span>
          </div>
        )}

        <div className="text-center pt-2 text-[11px] text-slate-400 font-mono">
          الإصدار 1.0.0 • AMN Cash Manager
        </div>

      </form>

    </div>
  );
}
