import React from 'react';
import { Minus, Square, X, Smartphone } from 'lucide-react';

export default function TitleBar({ showPhone, setShowPhone }) {
  return (
    <div className="h-10 bg-[#ca1535] text-white flex items-center justify-between px-4 select-none shrink-0 border-b border-red-700/50 shadow-sm z-30">
      
      {/* Brand & App Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#ca1535] font-black text-[11px] shadow-sm">
          VF
        </div>
        <span className="font-bold text-xs tracking-wide">إدارة معاملات فودافون كاش — AMN Cash</span>
      </div>

      {/* Center Action: Toggle Live Phone Panel */}
      <div className="hidden sm:flex items-center">
        <button
          onClick={() => setShowPhone(!showPhone)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            showPhone 
              ? 'bg-white text-[#ca1535] shadow-sm' 
              : 'bg-black/20 text-white hover:bg-black/30'
          }`}
          title="معاينة شاشة هاتف الأندرويد ومحاكاة الرسائل الحية"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{showPhone ? 'إخفاء شاشة الموبايل' : 'عرض شاشة الموبايل المباشرة'}</span>
        </button>
      </div>

      {/* Windows Controls (Minimize, Maximize, Close) */}
      <div className="flex items-center gap-1 -mr-2">
        <button 
          onClick={() => {}} 
          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-colors text-white"
          title="تصغير"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => {}} 
          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-colors text-white"
          title="تكبير"
        >
          <Square className="w-3 h-3" />
        </button>
        <button 
          onClick={() => {}} 
          className="w-8 h-8 flex items-center justify-center hover:bg-red-700 rounded transition-colors text-white"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
