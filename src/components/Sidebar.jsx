import React from 'react';
import { 
  Home, 
  ArrowLeftRight, 
  BarChart3, 
  Coins, 
  Smartphone, 
  Settings, 
  Clock, 
  Radio, 
  SendHorizontal 
} from 'lucide-react';
import appLogo from '../assets/app-logo.png';

export default function Sidebar({ currentTab, setCurrentTab, onOpenSimulator, isOnline, lastSync }) {
  const menuItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: Home },
    { id: 'transactions', label: 'المعاملات', icon: ArrowLeftRight },
    { id: 'reports', label: 'التقارير', icon: BarChart3 },
    { id: 'fees', label: 'المصاريف والربح', icon: Coins },
    { id: 'devices', label: 'الأجهزة والاتصال', icon: Smartphone },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <aside className="w-56 bg-gradient-to-b from-[#ca1535] via-[#a70d29] to-[#751224] text-white flex flex-col justify-between shrink-0 shadow-2xl z-20 select-none relative overflow-hidden">
      
      {/* Subtle Background Pattern Wave */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

      <div>
        {/* Brand Header Matching Official Central Security Wallet Branding */}
        <div className="pt-6 pb-5 px-5 flex flex-col items-center text-center border-b border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg mb-2 p-1 border border-white/20">
            <img 
              src={appLogo} 
              alt="AMN Cash" 
              className="w-full h-full object-contain rounded-xl drop-shadow"
            />
          </div>
          <strong className="font-extrabold text-base tracking-wide text-white block">AMN Cash</strong>
          <span className="text-[10px] text-red-200 block font-medium">إدارة المحفظة والمعاملات</span>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                  active
                    ? 'bg-white text-[#ca1535] shadow-md shadow-black/10 font-extrabold translate-x-[-1px]'
                    : 'text-red-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#ca1535]' : 'text-red-200'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Live Status Matching Image 1 Exactly */}
      <div className="p-3.5 m-3 rounded-2xl bg-black/20 border border-white/10 text-xs text-red-100 space-y-2.5 backdrop-blur-sm">
        
        {/* Green Running Dot */}
        <div className="flex items-center gap-2 font-bold text-white text-[11px]">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 pulse-green' : 'bg-red-400'}`}></span>
          <span>{isOnline ? 'النظام يعمل' : 'جاري الاتصال...'}</span>
        </div>

        {/* Connected to Mobile */}
        <div className="flex items-center gap-2 text-[11px] text-red-200">
          <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>متصل بالتطبيق المحمول</span>
        </div>

        {/* Last Sync Time */}
        <div className="flex items-center gap-2 text-[10px] text-red-300 font-mono pt-1 border-t border-white/10">
          <Clock className="w-3 h-3 text-red-300 shrink-0" />
          <span>آخر مزامنة: {lastSync || 'منذ 10 ثواني'}</span>
        </div>

      </div>

    </aside>
  );
}
