import React, { useState } from 'react';
import { 
  Smartphone, 
  Settings, 
  ChevronLeft, 
  CheckCircle2, 
  RotateCw, 
  Send, 
  Monitor, 
  Clock, 
  StopCircle, 
  PlayCircle,
  Wifi,
  BatteryMedium
} from 'lucide-react';
import appLogoRound from '../assets/app-logo-round.png';

export default function PhoneCompanionSidecar({ isConnected = true, onSendTestSms, totalSent = 24 }) {
  const [isServiceActive, setIsServiceActive] = useState(true);
  const [filterEnabled, setFilterEnabled] = useState(true);
  const [messagesCount, setMessagesCount] = useState(totalSent);
  const [sendingTest, setSendingTest] = useState(false);

  const handleTestSms = async () => {
    setSendingTest(true);
    if (onSendTestSms) {
      await onSendTestSms();
      setMessagesCount(prev => prev + 1);
    }
    setSendingTest(false);
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-200/80 shadow-xl flex flex-col shrink-0 animate-in slide-in-from-left-4 duration-200 overflow-hidden select-none">
      
      {/* Phone Header / Status Bar */}
      <div className="bg-[#b90e2e] text-white px-4 pt-3 pb-2 flex items-center justify-between text-xs">
        <span className="font-mono font-bold">14:36</span>
        <div className="flex items-center gap-1.5 opacity-90">
          <Wifi className="w-3.5 h-3.5" />
          <BatteryMedium className="w-4 h-4" />
        </div>
      </div>

      {/* Phone Top App Bar */}
      <div className="bg-[#b90e2e] text-white px-4 pb-4 flex items-center justify-between">
        <button className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {/* Central Security Android Wallet Logo */}
          <img 
            src={appLogoRound} 
            alt="AMN Collector" 
            className="w-8 h-8 rounded-full object-cover shadow-sm border border-white/20"
          />
          <div className="text-right">
            <h3 className="font-bold text-xs text-white leading-tight">AMN Cash Collector</h3>
            <p className="text-[10px] text-red-100">التقاط وإرسال رسائل فودافون كاش</p>
          </div>
        </div>

        <button className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Phone Screen Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 text-xs text-right">
        
        {/* Main Status Pill */}
        <div className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all ${
          isServiceActive 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div>
            <strong className="block font-bold text-sm">
              {isServiceActive ? 'متصل بالنظام' : 'الخدمة متوقفة'}
            </strong>
            <span className="text-[11px] opacity-80 block mt-0.5">
              {isServiceActive ? 'يتم إرسال المعاملات تلقائياً' : 'اضغط تشغيل للبدء'}
            </span>
          </div>
          <CheckCircle2 className={`w-6 h-6 ${isServiceActive ? 'text-emerald-600' : 'text-red-400'}`} />
        </div>

        {/* 3 Counters Row (Matching Image 1) */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] block">قيد الإرسال</span>
            <span className="text-lg font-black text-slate-800 font-mono">0</span>
          </div>

          <div className="space-y-1 border-x border-slate-100">
            <span className="text-slate-400 text-[10px] block">تم الإرسال</span>
            <span className="text-lg font-black text-emerald-600 font-mono">{messagesCount}</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] block">الرسائل اليوم</span>
            <span className="text-lg font-black text-slate-800 font-mono">{messagesCount}</span>
          </div>
        </div>

        {/* SMS Filter Switch Card (Matching Image 1) */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <strong className="text-slate-800 font-bold block text-xs">التقاط رسائل فودافون كاش فقط</strong>
            <span className="text-[10px] text-slate-400 block mt-0.5">تصفية تلقائية لرسائل المعاملات المالية</span>
          </div>
          <button
            onClick={() => setFilterEnabled(!filterEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              filterEnabled ? 'bg-[#ca1535]' : 'bg-slate-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              filterEnabled ? 'translate-x-0' : '-translate-x-5'
            }`} />
          </button>
        </div>

        {/* Connection Details Card (Matching Image 1) */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-green"></span>
              <div>
                <strong className="text-slate-800 block font-bold text-xs">حالة الاتصال</strong>
                <span className="text-[10px] text-slate-400 block">متصل ببرنامج الويندوز</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
              192.168.1.20:5500
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-1.5 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>آخر عملية مرسلة</span>
            </div>
            <span className="font-mono text-[11px] text-slate-700 font-bold">منذ 8 ثوان</span>
          </div>
        </div>

        {/* Send Test SMS Button */}
        <button
          onClick={handleTestSms}
          disabled={sendingTest}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
        >
          <Send className="w-3.5 h-3.5 text-emerald-400" />
          <span>{sendingTest ? 'جاري الإرسال...' : 'فحص استقبال رسالة كاش'}</span>
        </button>

        {/* Toggle Service Button (Matching Image 1: إيقاف الخدمة) */}
        <button
          onClick={() => setIsServiceActive(!isServiceActive)}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
            isServiceActive
              ? 'bg-red-50 text-[#ca1535] border-red-200 hover:bg-red-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          {isServiceActive ? (
            <>
              <StopCircle className="w-4 h-4 text-[#ca1535]" />
              <span>إيقاف الخدمة</span>
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 text-emerald-600" />
              <span>تشغيل الخدمة</span>
            </>
          )}
        </button>

      </div>

      {/* Tiny phone footer */}
      <div className="p-2.5 bg-white border-t border-slate-200/80 text-center text-[10px] text-slate-400">
        هاتف الـ Android المتصل بنظام AMN Cash
      </div>

    </aside>
  );
}
