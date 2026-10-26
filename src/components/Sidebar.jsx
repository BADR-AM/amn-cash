import React from 'react';
import { 
  Home, 
  ArrowLeftRight, 
  BarChart3, 
  Calculator, 
  Smartphone, 
  Settings, 
  Radio, 
  SendHorizontal
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, onOpenSimulator, isOnline, lastSync }) {
  const menuItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: Home },
    { id: 'transactions', label: 'المعاملات', icon: ArrowLeftRight },
    { id: 'reports', label: 'التقارير', icon: BarChart3 },
    { id: 'fees', label: 'المصاريف والربح', icon: Calculator },
    { id: 'devices', label: 'الأجهزة والاتصال', icon: Smartphone },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-[#ca1535] via-[#a70d29] to-[#751224] text-white flex flex-col justify-between shrink-0 shadow-2xl z-20">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white text-[#ca1535] flex items-center justify-center font-black text-2xl shadow-lg shadow-black/20">
            <span className="tracking-tighter">AMN</span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-wide text-white">AMN Cash</h1>
            <p className="text-xs text-red-100 font-medium opacity-90">إدارة معاملات فودافون كاش</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 text-right ${
                  active
                    ? 'bg-white text-[#ca1535] shadow-lg shadow-black/10 font-bold translate-x-[-2px]'
                    : 'text-red-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#ca1535]' : 'text-red-200'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Simulator Quick Action & Live Status Footer */}
      <div className="p-4 space-y-3 border-t border-white/10 bg-black/10">
        <button
          onClick={onOpenSimulator}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition-transform active:scale-95"
        >
          <SendHorizontal className="w-4 h-4" />
          <span>محاكي الرسائل (SMS Test)</span>
        </button>

        <div className="bg-black/25 rounded-xl p-3 border border-white/10 text-xs text-red-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 pulse-green' : 'bg-red-400'}`}></span>
              {isOnline ? 'النظام يعمل بنجاح' : 'جاري الاتصال...'}
            </span>
            <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-mono">v1.0</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-red-200">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>متصل بالتطبيق المحمول</span>
          </div>

          <div className="text-[10px] text-red-300 font-mono">
            آخر مزامنة: {lastSync || 'منذ ثوانٍ'}
          </div>
        </div>
      </div>
    </aside>
  );
}
