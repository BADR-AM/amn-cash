import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Dashboard from './components/Dashboard.jsx';
import Transactions from './components/Transactions.jsx';
import FeeCalculator from './components/FeeCalculator.jsx';
import Reports from './components/Reports.jsx';
import DevicesAndSync from './components/DevicesAndSync.jsx';
import SettingsView from './components/SettingsView.jsx';
import SmsSimulatorModal from './components/SmsSimulatorModal.jsx';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [period, setPeriod] = useState('all');
  const [stats, setStats] = useState({
    totalIncomingEGP: 0,
    totalWithdrawalsEGP: 0,
    totalFeesEGP: 0,
    totalCostEGP: 0,
    totalProfitEGP: 0,
    totalCount: 0,
    incomingCount: 0,
    withdrawalCount: 0,
    otherCount: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({});
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState('منذ 10 ثوانٍ');

  // Load Initial Data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Stats
      const statsRes = await fetch(`/api/stats?period=${period}`);
      const statsJson = await statsRes.json();
      if (statsJson.success) {
        setStats(statsJson.data);
      }

      // Transactions
      const txRes = await fetch('/api/transactions?limit=100');
      const txJson = await txRes.json();
      if (txJson.success) {
        setTransactions(txJson.data);
      }

      // Settings
      const setRes = await fetch('/api/settings');
      const setJson = await setRes.json();
      if (setJson.success) {
        setSettings(setJson.data);
      }

      setIsOnline(true);
      setLastSync(new Date().toLocaleTimeString('ar-EG'));
    } catch (err) {
      console.error('Error fetching data:', err);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  // Real-time SSE Connection
  useEffect(() => {
    let eventSource;
    try {
      eventSource = new EventSource('/api/events');
      
      eventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'NEW_TRANSACTION') {
            // New transaction received in real-time
            fetchData();
          } else if (msg.type === 'SETTINGS_UPDATED') {
            setSettings(prev => ({ ...prev, ...msg.data }));
          }
        } catch (e) {
          console.error('SSE message parse error:', e);
        }
      };

      eventSource.onerror = () => {
        setIsOnline(false);
      };
      
      eventSource.onopen = () => {
        setIsOnline(true);
      };
    } catch (e) {
      console.error('SSE initialization error:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Save Settings handler
  const handleSaveSettings = async (newSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(prev => ({ ...prev, ...newSettings }));
      }
    } catch (err) {
      alert('فشل حفظ الإعدادات: ' + err.message);
    }
  };

  // Section titles mapping
  const titles = {
    dashboard: {
      title: 'لوحة التحكم',
      subtitle: 'متابعة معاملات فودافون كاش والأرباح الحية'
    },
    transactions: {
      title: 'المعاملات والحسابات المالية',
      subtitle: 'عرض وتصفية جميع العمليات وسجل الـ SMS الأصلي'
    },
    reports: {
      title: 'التقارير المالية المجمعة',
      subtitle: 'إجماليات وتفاصيل الفترات وتصدير ملفات Excel'
    },
    fees: {
      title: 'حاسبة الرسوم والمصاريف',
      subtitle: 'حاسبة فورية وتخصيص نسب الخدمة وتكاليف السحب'
    },
    devices: {
      title: 'الأجهزة والاتصال',
      subtitle: 'ربط هاتف استقبال فودافون كاش (Android) ومراقبة الحالة'
    },
    settings: {
      title: 'إعدادات البرنامج',
      subtitle: 'تخصيص بيانات الحساب، النسخ الاحتياطي، والمظهر'
    }
  };

  const currentMeta = titles[currentTab] || titles.dashboard;

  return (
    <div className="flex h-screen bg-[#f3f5f8] text-[#192336] overflow-hidden font-sans">
      {/* 1. Brand Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        isOnline={isOnline}
        lastSync={lastSync}
      />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          period={currentTab === 'dashboard' ? period : null}
          setPeriod={currentTab === 'dashboard' ? setPeriod : null}
          onRefresh={fetchData}
          isLoading={isLoading}
        />

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-8">
          {currentTab === 'dashboard' && (
            <Dashboard 
              stats={stats}
              recentTransactions={transactions.slice(0, 7)}
              onNavigateToTransactions={() => setCurrentTab('transactions')}
              settings={settings}
            />
          )}

          {currentTab === 'transactions' && (
            <Transactions 
              transactions={transactions}
              onRefresh={fetchData}
            />
          )}

          {currentTab === 'fees' && (
            <FeeCalculator 
              settings={settings}
              onSaveSettings={handleSaveSettings}
            />
          )}

          {currentTab === 'reports' && (
            <Reports 
              transactions={transactions}
            />
          )}

          {currentTab === 'devices' && (
            <DevicesAndSync 
              onOpenSimulator={() => setIsSimulatorOpen(true)}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView 
              settings={settings}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>
      </div>

      {/* 3. Global Interactive SMS Simulator Modal */}
      <SmsSimulatorModal 
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onTransactionCreated={fetchData}
      />
    </div>
  );
}
